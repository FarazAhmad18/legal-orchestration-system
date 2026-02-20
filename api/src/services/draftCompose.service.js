import * as projectRepo from '../repositories/project.repository.js'
import * as chunkRepo from '../repositories/chunk.repository.js'
import * as artifactRepo from '../repositories/artifact.repository.js'
import { embedText } from '../utils/embedder.js'
import { chatCompletion } from '../utils/llm.js'
import { SYSTEM_PROMPT, buildUserPrompt } from '../prompts/draftComposer.js'
import { parseBriefV1 } from '../validators/brief.schema.js'

const RETRIEVAL_TOP_K = 12

/**
 * Run the A4 DraftComposer pipeline step.
 * @param {object} job - The job record (with projectId, id, payloadJson)
 * @returns {object} The created artifact
 */
export async function composeBrief(job) {
  const { projectId } = job

  // 1. Load project objective
  const project = await projectRepo.findById(projectId)
  if (!project) throw new Error(`Project ${projectId} not found`)

  const objective = project.objective
  if (!objective) throw new Error('Project has no objective set')

  // 2. Load upstream artifacts
  const factsArtifact = await artifactRepo.findLatest(projectId, 'facts_v1')
  if (!factsArtifact) throw new Error('No facts_v1 artifact found. Run fact extraction first.')

  const facts = factsArtifact.contentJson?.facts
  if (!facts || facts.length === 0) {
    throw new Error('facts_v1 artifact has no facts')
  }

  const timelineArtifact = await artifactRepo.findLatest(projectId, 'timeline_v1')
  if (!timelineArtifact) throw new Error('No timeline_v1 artifact found. Run timeline builder first.')

  const timeline = timelineArtifact.contentJson?.timeline
  if (!timeline || timeline.length === 0) {
    throw new Error('timeline_v1 artifact has no events')
  }

  const issuesArtifact = await artifactRepo.findLatest(projectId, 'issues_v1')
  if (!issuesArtifact) throw new Error('No issues_v1 artifact found. Run issue spotter first.')

  const issues = issuesArtifact.contentJson?.issues
  if (!issues || issues.length === 0) {
    throw new Error('issues_v1 artifact has no issues')
  }

  console.log(`[draftComposer] Loaded ${facts.length} facts + ${timeline.length} events + ${issues.length} issues`)

  // 3. Retrieve chunks via semantic search
  console.log(`[draftComposer] Embedding objective for project ${projectId}`)
  const queryEmbedding = await embedText(objective)

  const chunks = await chunkRepo.searchSimilar(projectId, queryEmbedding, RETRIEVAL_TOP_K)
  if (!chunks || chunks.length === 0) {
    throw new Error('No embedded chunks found for retrieval.')
  }

  console.log(`[draftComposer] Retrieved ${chunks.length} chunks for context`)

  // 4. Build prompt
  const userPrompt = buildUserPrompt(objective, facts, timeline, issues, chunks)

  // 5. Call LLM
  console.log(`[draftComposer] Calling LLM for brief composition`)
  const rawResponse = await chatCompletion({
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ],
    jsonMode: true,
    temperature: 0.1,
    maxTokens: 8192,
  })

  // 6. Parse JSON response
  let parsed
  try {
    parsed = JSON.parse(rawResponse)
  } catch (err) {
    throw new Error(`LLM returned invalid JSON: ${err.message}`)
  }

  // 7. Validate with Zod schema
  const validation = parseBriefV1(parsed)
  if (!validation.success) {
    console.error(`[draftComposer] Validation failed: ${validation.error}`)
    throw new Error(`Brief composition output failed validation: ${validation.error}`)
  }

  const sectionCount = validation.data.brief_packet.sections.length
  console.log(`[draftComposer] Composed brief with ${sectionCount} sections`)

  // 8. Enrich citations with filename and chunk text for frontend display
  const chunkMap = new Map(chunks.map((c) => [c.id, c]))
  for (const section of validation.data.brief_packet.sections) {
    for (const item of section.content) {
      for (const cit of item.citations) {
        const chunk = chunkMap.get(cit.chunk_id)
        if (chunk) {
          cit.filename = chunk.filename
          cit.chunk_text = chunk.text
        }
      }
    }
  }

  // 9. Persist artifact
  const artifact = await artifactRepo.create({
    projectId,
    type: 'brief_v1',
    contentJson: validation.data,
    createdByJobId: job.id,
  })

  console.log(`[draftComposer] Created artifact ${artifact.id} (v${artifact.version})`)
  return artifact
}

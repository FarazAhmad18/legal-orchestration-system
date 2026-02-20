import * as projectRepo from '../repositories/project.repository.js'
import * as chunkRepo from '../repositories/chunk.repository.js'
import * as artifactRepo from '../repositories/artifact.repository.js'
import { embedText } from '../utils/embedder.js'
import { chatCompletion } from '../utils/llm.js'
import { SYSTEM_PROMPT, buildUserPrompt } from '../prompts/issueSpotter.js'
import { parseIssuesV1 } from '../validators/issues.schema.js'

const RETRIEVAL_TOP_K = 12

/**
 * Run the A3 IssueSpotter pipeline step.
 * @param {object} job - The job record (with projectId, id, payloadJson)
 * @returns {object} The created artifact
 */
export async function spotIssues(job) {
  const { projectId } = job

  // 1. Load project objective
  const project = await projectRepo.findById(projectId)
  if (!project) throw new Error(`Project ${projectId} not found`)

  const objective = project.objective
  if (!objective) throw new Error('Project has no objective set')

  // 2. Load latest facts_v1 artifact
  const factsArtifact = await artifactRepo.findLatest(projectId, 'facts_v1')
  if (!factsArtifact) throw new Error('No facts_v1 artifact found. Run fact extraction first.')

  const facts = factsArtifact.contentJson?.facts
  if (!facts || facts.length === 0) {
    throw new Error('facts_v1 artifact has no facts')
  }

  // 3. Load latest timeline_v1 artifact
  const timelineArtifact = await artifactRepo.findLatest(projectId, 'timeline_v1')
  if (!timelineArtifact) throw new Error('No timeline_v1 artifact found. Run timeline builder first.')

  const timeline = timelineArtifact.contentJson?.timeline
  if (!timeline || timeline.length === 0) {
    throw new Error('timeline_v1 artifact has no events')
  }

  console.log(`[issueSpotter] Loaded ${facts.length} facts + ${timeline.length} timeline events`)

  // 4. Retrieve chunks via semantic search for issue evidence
  console.log(`[issueSpotter] Embedding objective for project ${projectId}`)
  const queryEmbedding = await embedText(objective)

  const chunks = await chunkRepo.searchSimilar(projectId, queryEmbedding, RETRIEVAL_TOP_K)
  if (!chunks || chunks.length === 0) {
    throw new Error('No embedded chunks found for retrieval.')
  }

  console.log(`[issueSpotter] Retrieved ${chunks.length} chunks for context`)

  // 5. Build prompt
  const userPrompt = buildUserPrompt(objective, facts, timeline, chunks)

  // 6. Call LLM
  console.log(`[issueSpotter] Calling LLM for issue spotting`)
  const rawResponse = await chatCompletion({
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ],
    jsonMode: true,
    temperature: 0.1,
    maxTokens: 8192,
  })

  // 7. Parse JSON response
  let parsed
  try {
    parsed = JSON.parse(rawResponse)
  } catch (err) {
    throw new Error(`LLM returned invalid JSON: ${err.message}`)
  }

  // 8. Validate with Zod schema
  const validation = parseIssuesV1(parsed)
  if (!validation.success) {
    console.error(`[issueSpotter] Validation failed: ${validation.error}`)
    throw new Error(`Issue spotting output failed validation: ${validation.error}`)
  }

  console.log(`[issueSpotter] Identified ${validation.data.issues.length} issues`)

  // 9. Enrich citations with filename and chunk text for frontend display
  const chunkMap = new Map(chunks.map((c) => [c.id, c]))
  for (const issue of validation.data.issues) {
    for (const cit of issue.citations) {
      const chunk = chunkMap.get(cit.chunk_id)
      if (chunk) {
        cit.filename = chunk.filename
        cit.chunk_text = chunk.text
      }
    }
  }

  // 10. Persist artifact
  const artifact = await artifactRepo.create({
    projectId,
    type: 'issues_v1',
    contentJson: validation.data,
    createdByJobId: job.id,
  })

  console.log(`[issueSpotter] Created artifact ${artifact.id} (v${artifact.version})`)
  return artifact
}

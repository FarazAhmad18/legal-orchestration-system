import * as projectRepo from '../repositories/project.repository.js'
import * as chunkRepo from '../repositories/chunk.repository.js'
import * as artifactRepo from '../repositories/artifact.repository.js'
import { embedText } from '../utils/embedder.js'
import { chatCompletion } from '../utils/llm.js'
import { SYSTEM_PROMPT, buildUserPrompt } from '../prompts/timelineBuilder.js'
import { parseTimelineV1 } from '../validators/timeline.schema.js'

const RETRIEVAL_TOP_K = 12

/**
 * Run the A2 TimelineBuilder pipeline step.
 * @param {object} job - The job record (with projectId, id, payloadJson)
 * @returns {object} The created artifact
 */
export async function buildTimeline(job) {
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

  console.log(`[timelineBuilder] Loaded ${facts.length} facts from artifact v${factsArtifact.version}`)

  // 3. Retrieve chunks via semantic search for date context
  console.log(`[timelineBuilder] Embedding objective for project ${projectId}`)
  const queryEmbedding = await embedText(objective)

  const chunks = await chunkRepo.searchSimilar(projectId, queryEmbedding, RETRIEVAL_TOP_K)
  if (!chunks || chunks.length === 0) {
    throw new Error('No embedded chunks found for retrieval.')
  }

  console.log(`[timelineBuilder] Retrieved ${chunks.length} chunks for context`)

  // 4. Build prompt
  const userPrompt = buildUserPrompt(objective, facts, chunks)

  // 5. Call LLM
  console.log(`[timelineBuilder] Calling LLM for timeline construction`)
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
  const validation = parseTimelineV1(parsed)
  if (!validation.success) {
    console.error(`[timelineBuilder] Validation failed: ${validation.error}`)
    throw new Error(`Timeline output failed validation: ${validation.error}`)
  }

  console.log(`[timelineBuilder] Built ${validation.data.timeline.length} events, ${validation.data.gaps.length} gaps`)

  // 8. Enrich citations with filename and chunk text for frontend display
  const chunkMap = new Map(chunks.map((c) => [c.id, c]))
  for (const event of validation.data.timeline) {
    for (const cit of event.citations) {
      const chunk = chunkMap.get(cit.chunk_id)
      if (chunk) {
        cit.filename = chunk.filename
        cit.chunk_text = chunk.text
      }
    }
  }

  // 9. Persist artifact
  const artifact = await artifactRepo.create({
    projectId,
    type: 'timeline_v1',
    contentJson: validation.data,
    createdByJobId: job.id,
  })

  console.log(`[timelineBuilder] Created artifact ${artifact.id} (v${artifact.version})`)
  return artifact
}

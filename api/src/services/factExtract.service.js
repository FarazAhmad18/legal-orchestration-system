import * as projectRepo from '../repositories/project.repository.js'
import * as chunkRepo from '../repositories/chunk.repository.js'
import * as artifactRepo from '../repositories/artifact.repository.js'
import { embedText } from '../utils/embedder.js'
import { chatCompletion } from '../utils/llm.js'
import { SYSTEM_PROMPT, buildUserPrompt } from '../prompts/factExtractor.js'
import { parseFactsV1 } from '../validators/facts.schema.js'

const RETRIEVAL_TOP_K = 12

/**
 * Run the A1 FactExtractor pipeline step.
 * @param {object} job - The job record (with projectId, id, payloadJson)
 * @returns {object} The created artifact
 */
export async function extractFacts(job) {
  const { projectId } = job

  // 1. Load project objective
  const project = await projectRepo.findById(projectId)
  if (!project) throw new Error(`Project ${projectId} not found`)

  const objective = project.objective
  if (!objective) throw new Error('Project has no objective set')

  // 2. Retrieve relevant chunks via semantic search
  console.log(`[factExtract] Embedding objective for project ${projectId}`)
  const queryEmbedding = await embedText(objective)

  const chunks = await chunkRepo.searchSimilar(projectId, queryEmbedding, RETRIEVAL_TOP_K)
  if (!chunks || chunks.length === 0) {
    throw new Error('No embedded chunks found for retrieval. Ensure documents are chunked and embedded.')
  }

  console.log(`[factExtract] Retrieved ${chunks.length} chunks for project ${projectId}`)

  // 3. Build prompt
  const userPrompt = buildUserPrompt(objective, chunks)

  // 4. Call LLM
  console.log(`[factExtract] Calling LLM for fact extraction`)
  const rawResponse = await chatCompletion({
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ],
    jsonMode: true,
    temperature: 0.1,
    maxTokens: 8192,
  })

  // 5. Parse JSON response
  let parsed
  try {
    parsed = JSON.parse(rawResponse)
  } catch (err) {
    throw new Error(`LLM returned invalid JSON: ${err.message}`)
  }

  // 6. Validate with Zod schema
  const validation = parseFactsV1(parsed)
  if (!validation.success) {
    console.error(`[factExtract] Validation failed: ${validation.error}`)
    throw new Error(`Fact extraction output failed validation: ${validation.error}`)
  }

  console.log(`[factExtract] Extracted ${validation.data.facts.length} facts`)

  // 7. Enrich citations with filename and chunk text for frontend display
  const chunkMap = new Map(chunks.map((c) => [c.id, c]))
  for (const fact of validation.data.facts) {
    for (const cit of fact.citations) {
      const chunk = chunkMap.get(cit.chunk_id)
      if (chunk) {
        cit.filename = chunk.filename
        cit.chunk_text = chunk.text
      }
    }
  }

  // 8. Persist artifact
  const artifact = await artifactRepo.create({
    projectId,
    type: 'facts_v1',
    contentJson: validation.data,
    createdByJobId: job.id,
  })

  console.log(`[factExtract] Created artifact ${artifact.id} (v${artifact.version})`)
  return artifact
}

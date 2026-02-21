import * as chatRepo from '../repositories/chat.repository.js'
import * as projectRepo from '../repositories/project.repository.js'
import * as chunkRepo from '../repositories/chunk.repository.js'
import { embedText } from '../utils/embedder.js'
import { chatCompletion } from '../utils/llm.js'
import { SYSTEM_PROMPT, buildUserPrompt } from '../prompts/chatAgent.js'
import { parseChatResponse } from '../validators/chatResponse.schema.js'
import ApiError from '../utils/ApiError.js'

const RETRIEVAL_TOP_K = 10
const HISTORY_COUNT = 10

async function verifyAccess(projectId, userId, role) {
  const project = await projectRepo.findById(projectId)
  if (!project) throw ApiError.notFound('Project not found')
  if (role !== 'admin' && project.createdBy !== userId) {
    throw ApiError.forbidden('Access denied')
  }
  return project
}

export async function sendMessage({ projectId, userId, role, message }) {
  const project = await verifyAccess(projectId, userId, role)

  // 1. Persist user message
  const userMessage = await chatRepo.create({
    projectId,
    userId,
    role: 'user',
    content: message,
  })

  // 2. Load recent history for multi-turn context
  const recentMessages = await chatRepo.findRecent(projectId, HISTORY_COUNT)

  // 3. Embed user question and retrieve relevant chunks
  const queryEmbedding = await embedText(message)
  const chunks = await chunkRepo.searchSimilar(projectId, queryEmbedding, RETRIEVAL_TOP_K)

  // 4. If no chunks, return canned response
  if (!chunks || chunks.length === 0) {
    const assistantMessage = await chatRepo.create({
      projectId,
      userId,
      role: 'assistant',
      content: 'No indexed documents found for this project. Please upload and chunk documents before using chat.',
      citations: [],
    })
    return { userMessage, assistantMessage }
  }

  // 5. Build LLM messages array
  const llmMessages = [{ role: 'system', content: SYSTEM_PROMPT }]

  // Add history (excluding the message we just created, which is already the last one)
  for (const msg of recentMessages) {
    if (msg.id === userMessage.id) continue
    llmMessages.push({
      role: msg.role,
      content: msg.role === 'assistant' ? msg.content : msg.content,
    })
  }

  // Add current user message with context
  llmMessages.push({
    role: 'user',
    content: buildUserPrompt(project.objective, chunks, message),
  })

  // 6. Call LLM
  console.log(`[chat] Calling LLM for project ${projectId}`)
  const rawResponse = await chatCompletion({
    messages: llmMessages,
    jsonMode: true,
    temperature: 0.2,
    maxTokens: 4096,
  })

  // 7. Parse + validate
  let parsed
  try {
    parsed = JSON.parse(rawResponse)
  } catch {
    // If JSON parse fails, return raw text as answer with no citations
    const assistantMessage = await chatRepo.create({
      projectId,
      userId,
      role: 'assistant',
      content: rawResponse,
      citations: [],
    })
    return { userMessage, assistantMessage }
  }

  const validation = parseChatResponse(parsed)
  if (!validation.success) {
    console.warn(`[chat] Validation failed: ${validation.error}, using raw answer`)
    const assistantMessage = await chatRepo.create({
      projectId,
      userId,
      role: 'assistant',
      content: parsed.answer || rawResponse,
      citations: [],
    })
    return { userMessage, assistantMessage }
  }

  // 8. Enrich citations with filename + chunk_text
  const chunkMap = new Map(chunks.map((c) => [c.id, c]))
  const enrichedCitations = validation.data.citations.map((cit) => {
    const chunk = chunkMap.get(cit.chunk_id)
    return {
      ...cit,
      filename: chunk?.filename || null,
      chunk_text: chunk?.text || null,
    }
  })

  // 9. Persist assistant message
  const assistantMessage = await chatRepo.create({
    projectId,
    userId,
    role: 'assistant',
    content: validation.data.answer,
    citations: enrichedCitations,
  })

  console.log(`[chat] Response saved with ${enrichedCitations.length} citations`)
  return { userMessage, assistantMessage }
}

export async function getHistory({ projectId, userId, role, limit, before }) {
  await verifyAccess(projectId, userId, role)
  return chatRepo.findByProjectId(projectId, { limit, before })
}

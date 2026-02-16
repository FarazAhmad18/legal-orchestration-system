import * as chunkRepo from '../repositories/chunk.repository.js'
import * as documentRepo from '../repositories/document.repository.js'
import * as projectRepo from '../repositories/project.repository.js'
import { chunkDocumentPages } from '../utils/chunker.js'
import { embedText, embedTexts } from '../utils/embedder.js'
import ApiError from '../utils/ApiError.js'

/**
 * Verify project access (owner or admin).
 */
async function verifyAccess(projectId, userId, role) {
  const project = await projectRepo.findById(projectId)
  if (!project) throw ApiError.notFound('Project not found')
  if (role !== 'admin' && project.createdBy !== userId) {
    throw ApiError.forbidden('Access denied')
  }
  return project
}

/**
 * Chunk and embed a single document.
 * Deletes existing chunks first (for re-chunking).
 */
export async function chunkAndEmbedDocument({ documentId, projectId, userId, role }) {
  await verifyAccess(projectId, userId, role)

  const doc = await documentRepo.findById(documentId)
  if (!doc || doc.projectId !== projectId) {
    throw ApiError.notFound('Document not found in this project')
  }
  if (doc.status !== 'parsed') {
    throw ApiError.badRequest('Document must be in "parsed" status to chunk')
  }

  // Load pages
  const pages = await documentRepo.findPagesByDocumentId(documentId)
  if (pages.length === 0) {
    throw ApiError.badRequest('Document has no pages to chunk')
  }

  // Delete existing chunks for this document (re-chunk support)
  await chunkRepo.deleteByDocumentId(documentId)

  // Generate chunks
  const rawChunks = chunkDocumentPages(pages)
  if (rawChunks.length === 0) {
    throw ApiError.badRequest('Chunking produced no chunks')
  }

  // Persist chunks (without embeddings yet)
  const chunksToCreate = rawChunks.map((c) => ({
    documentId,
    pageNum: c.pageNum,
    chunkIndex: c.chunkIndex,
    text: c.text,
    charStart: c.charStart,
    charEnd: c.charEnd,
    metaJson: c.metaJson,
  }))
  await chunkRepo.createMany(chunksToCreate)

  // Retrieve created chunks to get IDs
  const savedChunks = await chunkRepo.findByDocumentId(documentId)

  // Generate embeddings in batch
  const texts = savedChunks.map((c) => c.text)
  const embeddings = await embedTexts(texts)

  // Update embeddings in DB
  const items = savedChunks.map((c, i) => ({ id: c.id, embedding: embeddings[i] }))
  await chunkRepo.updateEmbeddingsBulk(items)

  return { documentId, chunksCreated: savedChunks.length }
}

/**
 * Chunk and embed all parsed documents in a project.
 */
export async function chunkAndEmbedProject({ projectId, userId, role }) {
  await verifyAccess(projectId, userId, role)

  const documents = await documentRepo.findByProjectId(projectId)
  const parsedDocs = documents.filter((d) => d.status === 'parsed')

  if (parsedDocs.length === 0) {
    throw ApiError.badRequest('No parsed documents to chunk')
  }

  const results = []
  for (const doc of parsedDocs) {
    const result = await chunkAndEmbedDocument({
      documentId: doc.id,
      projectId,
      userId,
      role,
    })
    results.push(result)
  }

  const totalChunks = results.reduce((sum, r) => sum + r.chunksCreated, 0)
  return {
    documentsProcessed: results.length,
    totalChunks,
    details: results,
  }
}

/**
 * Semantic search within a project's chunks.
 */
export async function searchProject({ projectId, query, userId, role, topK = 10 }) {
  await verifyAccess(projectId, userId, role)

  if (!query || query.trim().length === 0) {
    throw ApiError.badRequest('Search query is required')
  }

  // Embed the query
  const queryEmbedding = await embedText(query.trim())

  // Search pgvector
  const results = await chunkRepo.searchSimilar(projectId, queryEmbedding, topK)

  return results.map((r) => ({
    id: r.id,
    documentId: r.documentId,
    filename: r.filename,
    pageNum: r.pageNum,
    chunkIndex: r.chunkIndex,
    text: r.text,
    charStart: r.charStart,
    charEnd: r.charEnd,
    metaJson: r.metaJson,
    distance: Number(r.distance),
    similarity: Number((1 - Number(r.distance)).toFixed(4)),
  }))
}

/**
 * Get chunk stats for a project (counts per document).
 */
export async function getProjectChunkStats({ projectId, userId, role }) {
  await verifyAccess(projectId, userId, role)

  const stats = await chunkRepo.getStatsByProjectId(projectId)
  const totalChunks = stats.reduce((sum, s) => sum + s.chunkCount, 0)
  const totalEmbedded = stats.reduce((sum, s) => sum + s.embeddedCount, 0)

  return {
    totalChunks,
    totalEmbedded,
    documentsCount: stats.length,
    documents: stats,
  }
}

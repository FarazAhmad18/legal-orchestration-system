import prisma from '../config/database.js'

export async function createMany(chunks) {
  return prisma.chunk.createMany({
    data: chunks.map((c) => ({
      documentId: c.documentId,
      pageNum: c.pageNum,
      chunkIndex: c.chunkIndex,
      text: c.text,
      charStart: c.charStart,
      charEnd: c.charEnd,
      metaJson: c.metaJson ?? null,
    })),
  })
}

export async function findByDocumentId(documentId) {
  return prisma.chunk.findMany({
    where: { documentId },
    orderBy: { chunkIndex: 'asc' },
  })
}

export async function findByProjectId(projectId) {
  return prisma.chunk.findMany({
    where: { document: { projectId } },
    include: { document: { select: { filename: true } } },
    orderBy: [{ documentId: 'asc' }, { chunkIndex: 'asc' }],
  })
}

export async function countByDocumentId(documentId) {
  return prisma.chunk.count({ where: { documentId } })
}

export async function countByProjectId(projectId) {
  return prisma.chunk.count({
    where: { document: { projectId } },
  })
}

export async function deleteByDocumentId(documentId) {
  return prisma.chunk.deleteMany({ where: { documentId } })
}

export async function deleteByProjectId(projectId) {
  return prisma.chunk.deleteMany({
    where: { document: { projectId } },
  })
}

/**
 * Update a single chunk's embedding vector via raw SQL
 * (Prisma can't handle Unsupported types natively).
 */
export async function updateEmbedding(chunkId, embedding) {
  const vectorStr = `[${embedding.join(',')}]`
  await prisma.$queryRawUnsafe(
    `UPDATE chunks SET embedding_vector = $1::vector WHERE id = $2`,
    vectorStr,
    chunkId
  )
}

/**
 * Bulk update embeddings for multiple chunks.
 * @param {Array<{id: string, embedding: number[]}>} items
 */
export async function updateEmbeddingsBulk(items) {
  for (const item of items) {
    await updateEmbedding(item.id, item.embedding)
  }
}

/**
 * Semantic search using pgvector cosine distance.
 * Returns chunks ranked by similarity, joined with document info.
 */
export async function searchSimilar(projectId, queryEmbedding, topK = 10) {
  const vectorStr = `[${queryEmbedding.join(',')}]`
  const results = await prisma.$queryRawUnsafe(
    `SELECT
       c.id,
       c.document_id AS "documentId",
       c.page_num AS "pageNum",
       c.chunk_index AS "chunkIndex",
       c.text,
       c.char_start AS "charStart",
       c.char_end AS "charEnd",
       c.meta_json AS "metaJson",
       d.filename,
       (c.embedding_vector <=> $1::vector) AS distance
     FROM chunks c
     JOIN documents d ON d.id = c.document_id
     WHERE d.project_id = $2
       AND c.embedding_vector IS NOT NULL
     ORDER BY c.embedding_vector <=> $1::vector
     LIMIT $3`,
    vectorStr,
    projectId,
    topK
  )
  return results
}

/**
 * Get chunk stats per document for a project.
 */
export async function getStatsByProjectId(projectId) {
  const results = await prisma.$queryRawUnsafe(
    `SELECT
       d.id AS "documentId",
       d.filename,
       COUNT(c.id)::int AS "chunkCount",
       COUNT(CASE WHEN c.embedding_vector IS NOT NULL THEN 1 END)::int AS "embeddedCount"
     FROM documents d
     LEFT JOIN chunks c ON c.document_id = d.id
     WHERE d.project_id = $1
     GROUP BY d.id, d.filename
     ORDER BY d.filename`,
    projectId
  )
  return results
}

import client from './client'

export async function generateChunks(projectId) {
  const { data } = await client.post(
    `/projects/${projectId}/chunks/generate`,
    {},
    { timeout: 300000 } // 5 min for large projects
  )
  return data
}

export async function generateDocumentChunks(projectId, documentId) {
  const { data } = await client.post(
    `/projects/${projectId}/chunks/generate/${documentId}`,
    {},
    { timeout: 300000 }
  )
  return data
}

export async function searchChunks(projectId, query, topK = 10) {
  const { data } = await client.post(`/projects/${projectId}/chunks/search`, {
    query,
    topK,
  })
  return data
}

export async function getChunkStats(projectId) {
  const { data } = await client.get(`/projects/${projectId}/chunks/stats`)
  return data
}

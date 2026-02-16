import client from './client'

export async function uploadDocument(projectId, file) {
  const formData = new FormData()
  formData.append('file', file)
  const { data } = await client.post(
    `/projects/${projectId}/documents`,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  )
  return data
}

export async function listDocuments(projectId) {
  const { data } = await client.get(`/projects/${projectId}/documents`)
  return data
}

export async function getDocument(projectId, documentId) {
  const { data } = await client.get(`/projects/${projectId}/documents/${documentId}`)
  return data
}

export async function deleteDocument(projectId, documentId) {
  const { data } = await client.delete(`/projects/${projectId}/documents/${documentId}`)
  return data
}

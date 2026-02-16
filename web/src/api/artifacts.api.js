import client from './client'

export async function listArtifacts(projectId, type) {
  const params = type ? { type } : {}
  const { data } = await client.get(`/projects/${projectId}/artifacts`, { params })
  return data
}

export async function getArtifactSummary(projectId) {
  const { data } = await client.get(`/projects/${projectId}/artifacts/summary`)
  return data
}

export async function getLatestArtifact(projectId, type) {
  const { data } = await client.get(`/projects/${projectId}/artifacts/latest/${type}`)
  return data
}

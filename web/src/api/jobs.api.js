import client from './client'

export async function runAnalysis(projectId) {
  const { data } = await client.post(`/projects/${projectId}/jobs/run-analysis`)
  return data
}

export async function getPipelineStatus(projectId) {
  const { data } = await client.get(`/projects/${projectId}/jobs/pipeline-status`)
  return data
}

export async function listJobs(projectId) {
  const { data } = await client.get(`/projects/${projectId}/jobs`)
  return data
}

import client from './client'

export async function createProject({ name, objective }) {
  const { data } = await client.post('/projects', { name, objective })
  return data
}

export async function listProjects() {
  const { data } = await client.get('/projects')
  return data
}

export async function getProject(id) {
  const { data } = await client.get(`/projects/${id}`)
  return data
}

import client from './client'

export async function sendChatMessage(projectId, message) {
  const { data } = await client.post(`/projects/${projectId}/chat/send`, { message })
  return data
}

export async function getChatHistory(projectId, limit = 50) {
  const { data } = await client.get(`/projects/${projectId}/chat/history`, {
    params: { limit },
  })
  return data
}

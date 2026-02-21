import prisma from '../config/database.js'

export async function create({ projectId, userId, role, content, citations }) {
  return prisma.chatMessage.create({
    data: {
      projectId,
      userId,
      role,
      content,
      citations: citations ?? undefined,
    },
  })
}

export async function findByProjectId(projectId, { limit = 50, before } = {}) {
  const where = { projectId }
  if (before) {
    where.createdAt = { lt: new Date(before) }
  }

  const take = limit + 1
  const messages = await prisma.chatMessage.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take,
  })

  const hasMore = messages.length > limit
  if (hasMore) messages.pop()

  // Return in chronological order
  messages.reverse()
  return { messages, hasMore }
}

export async function findRecent(projectId, count = 10) {
  const messages = await prisma.chatMessage.findMany({
    where: { projectId },
    orderBy: { createdAt: 'desc' },
    take: count,
  })
  // Return in chronological order
  messages.reverse()
  return messages
}

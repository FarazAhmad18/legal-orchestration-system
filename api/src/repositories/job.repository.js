import prisma from '../config/database.js'

export async function create({ projectId, type, payloadJson }) {
  return prisma.job.create({
    data: { projectId, type, payloadJson: payloadJson ?? null },
  })
}

export async function findById(id) {
  return prisma.job.findUnique({ where: { id } })
}

export async function findByProjectId(projectId) {
  return prisma.job.findMany({
    where: { projectId },
    orderBy: { createdAt: 'desc' },
  })
}

/**
 * Atomically claim the next pending job using FOR UPDATE SKIP LOCKED.
 * Two-step: raw SQL to UPDATE RETURNING id, then findById for Prisma object.
 */
export async function claimNextPending() {
  const rows = await prisma.$queryRawUnsafe(
    `UPDATE jobs
     SET status = 'running', attempts = attempts + 1, updated_at = NOW()
     WHERE id = (
       SELECT id FROM jobs
       WHERE status = 'pending'
       ORDER BY created_at ASC
       LIMIT 1
       FOR UPDATE SKIP LOCKED
     )
     RETURNING id`
  )
  if (!rows || rows.length === 0) return null
  return findById(rows[0].id)
}

export async function markCompleted(id) {
  return prisma.job.update({
    where: { id },
    data: { status: 'completed', error: null, updatedAt: new Date() },
  })
}

export async function markFailed(id, errorMessage) {
  return prisma.job.update({
    where: { id },
    data: { status: 'failed', error: errorMessage, updatedAt: new Date() },
  })
}

export async function resetToPending(id) {
  return prisma.job.update({
    where: { id },
    data: { status: 'pending', updatedAt: new Date() },
  })
}

export async function hasActiveJobs(projectId) {
  const count = await prisma.job.count({
    where: {
      projectId,
      status: { in: ['pending', 'running'] },
    },
  })
  return count > 0
}

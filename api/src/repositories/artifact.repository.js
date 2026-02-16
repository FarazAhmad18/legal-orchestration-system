import prisma from '../config/database.js'

/**
 * Create an artifact with auto-incremented version (max existing + 1).
 */
export async function create({ projectId, type, contentJson, createdByJobId }) {
  const latest = await prisma.artifact.findFirst({
    where: { projectId, type },
    orderBy: { version: 'desc' },
    select: { version: true },
  })
  const version = (latest?.version ?? 0) + 1

  return prisma.artifact.create({
    data: { projectId, type, version, contentJson, createdByJobId: createdByJobId ?? null },
  })
}

export async function findByProjectId(projectId, type) {
  const where = { projectId }
  if (type) where.type = type
  return prisma.artifact.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  })
}

export async function findLatest(projectId, type) {
  return prisma.artifact.findFirst({
    where: { projectId, type },
    orderBy: { version: 'desc' },
  })
}

export async function findById(id) {
  return prisma.artifact.findUnique({ where: { id } })
}

/**
 * Get the latest version of each artifact type for a project.
 */
export async function getSummaryByProjectId(projectId) {
  const results = await prisma.$queryRawUnsafe(
    `SELECT DISTINCT ON (type)
       id, project_id AS "projectId", type, version,
       content_json AS "contentJson",
       created_at AS "createdAt",
       created_by_job_id AS "createdByJobId"
     FROM artifacts
     WHERE project_id = $1
     ORDER BY type, version DESC`,
    projectId
  )
  return results
}

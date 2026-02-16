import * as artifactRepo from '../repositories/artifact.repository.js'
import * as projectRepo from '../repositories/project.repository.js'
import ApiError from '../utils/ApiError.js'

function verifyAccess(project, userId, role) {
  if (!project) throw ApiError.notFound('Project not found')
  if (role !== 'admin' && project.createdBy !== userId) {
    throw ApiError.forbidden('Access denied')
  }
}

export async function listByProject({ projectId, userId, role, type }) {
  const project = await projectRepo.findById(projectId)
  verifyAccess(project, userId, role)
  return artifactRepo.findByProjectId(projectId, type || undefined)
}

export async function getLatest({ projectId, userId, role, type }) {
  const project = await projectRepo.findById(projectId)
  verifyAccess(project, userId, role)

  const artifact = await artifactRepo.findLatest(projectId, type)
  if (!artifact) throw ApiError.notFound('Artifact not found')
  return artifact
}

export async function getById({ artifactId, projectId, userId, role }) {
  const project = await projectRepo.findById(projectId)
  verifyAccess(project, userId, role)

  const artifact = await artifactRepo.findById(artifactId)
  if (!artifact || artifact.projectId !== projectId) {
    throw ApiError.notFound('Artifact not found')
  }
  return artifact
}

export async function getSummary({ projectId, userId, role }) {
  const project = await projectRepo.findById(projectId)
  verifyAccess(project, userId, role)
  return artifactRepo.getSummaryByProjectId(projectId)
}

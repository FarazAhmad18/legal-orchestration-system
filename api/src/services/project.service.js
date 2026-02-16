import * as projectRepo from '../repositories/project.repository.js'
import ApiError from '../utils/ApiError.js'

export async function create({ name, objective, userId }) {
  return projectRepo.create({ name, objective, createdBy: userId })
}

export async function list({ userId, role }) {
  if (role === 'admin') {
    return projectRepo.findAll()
  }
  return projectRepo.findByUserId(userId)
}

export async function getById({ id, userId, role }) {
  const project = await projectRepo.findById(id)
  if (!project) {
    throw ApiError.notFound('Project not found')
  }
  if (role !== 'admin' && project.createdBy !== userId) {
    throw ApiError.forbidden('Access denied')
  }
  return project
}

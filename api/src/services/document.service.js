import fs from 'fs/promises'
import * as documentRepo from '../repositories/document.repository.js'
import * as projectRepo from '../repositories/project.repository.js'
import * as chunkRepo from '../repositories/chunk.repository.js'
import { parseDocument } from '../utils/parsers.js'
import ApiError from '../utils/ApiError.js'

export async function uploadAndParse({ projectId, userId, role, file }) {
  // Verify project exists and user has access
  const project = await projectRepo.findById(projectId)
  if (!project) throw ApiError.notFound('Project not found')
  if (role !== 'admin' && project.createdBy !== userId) {
    throw ApiError.forbidden('Access denied')
  }

  // Create document record
  const doc = await documentRepo.create({
    projectId,
    filename: file.originalname,
    storagePath: file.path,
    mime: file.mimetype,
  })

  // Set status to parsing
  await documentRepo.updateStatus(doc.id, 'parsing')

  try {
    // Parse the document into pages
    const pages = await parseDocument(file.path, file.mimetype)

    if (pages.length === 0) {
      await documentRepo.updateStatus(doc.id, 'error')
      throw ApiError.badRequest('Document contained no extractable text')
    }

    // Persist pages
    await documentRepo.createPages(doc.id, pages)

    // Set status to parsed
    await documentRepo.updateStatus(doc.id, 'parsed')

    // Return the doc with page count
    return documentRepo.findById(doc.id)
  } catch (err) {
    // If parsing fails, mark as error but don't lose the record
    if (err instanceof ApiError) throw err
    await documentRepo.updateStatus(doc.id, 'error')
    throw ApiError.badRequest(`Failed to parse document: ${err.message}`)
  }
}

export async function listByProject({ projectId, userId, role }) {
  const project = await projectRepo.findById(projectId)
  if (!project) throw ApiError.notFound('Project not found')
  if (role !== 'admin' && project.createdBy !== userId) {
    throw ApiError.forbidden('Access denied')
  }

  return documentRepo.findByProjectId(projectId)
}

export async function getById({ documentId, projectId, userId, role }) {
  const project = await projectRepo.findById(projectId)
  if (!project) throw ApiError.notFound('Project not found')
  if (role !== 'admin' && project.createdBy !== userId) {
    throw ApiError.forbidden('Access denied')
  }

  const doc = await documentRepo.findById(documentId)
  if (!doc || doc.projectId !== projectId) {
    throw ApiError.notFound('Document not found')
  }
  return doc
}

export async function remove({ documentId, projectId, userId, role }) {
  const project = await projectRepo.findById(projectId)
  if (!project) throw ApiError.notFound('Project not found')
  if (role !== 'admin' && project.createdBy !== userId) {
    throw ApiError.forbidden('Access denied')
  }

  const doc = await documentRepo.findById(documentId)
  if (!doc || doc.projectId !== projectId) {
    throw ApiError.notFound('Document not found')
  }

  // Delete chunks first (FK constraint: chunks → document)
  await chunkRepo.deleteByDocumentId(documentId)

  // Delete file from disk
  if (doc.storagePath) {
    try {
      await fs.unlink(doc.storagePath)
    } catch {
      // File may already be gone; continue with DB cleanup
    }
  }

  await documentRepo.deleteById(documentId)
  return { message: 'Document deleted' }
}

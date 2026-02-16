import * as documentService from '../services/document.service.js'
import asyncHandler from '../utils/asyncHandler.js'
import ApiError from '../utils/ApiError.js'

export const upload = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw ApiError.badRequest('No file uploaded')
  }

  const doc = await documentService.uploadAndParse({
    projectId: req.params.projectId,
    userId: req.user.userId,
    role: req.user.role,
    file: req.file,
  })

  res.status(201).json(doc)
})

export const list = asyncHandler(async (req, res) => {
  const docs = await documentService.listByProject({
    projectId: req.params.projectId,
    userId: req.user.userId,
    role: req.user.role,
  })
  res.json(docs)
})

export const getById = asyncHandler(async (req, res) => {
  const doc = await documentService.getById({
    documentId: req.params.documentId,
    projectId: req.params.projectId,
    userId: req.user.userId,
    role: req.user.role,
  })
  res.json(doc)
})

export const remove = asyncHandler(async (req, res) => {
  const result = await documentService.remove({
    documentId: req.params.documentId,
    projectId: req.params.projectId,
    userId: req.user.userId,
    role: req.user.role,
  })
  res.json(result)
})

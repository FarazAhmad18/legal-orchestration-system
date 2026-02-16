import * as chunkService from '../services/chunk.service.js'
import asyncHandler from '../utils/asyncHandler.js'

export const generateForProject = asyncHandler(async (req, res) => {
  const result = await chunkService.chunkAndEmbedProject({
    projectId: req.params.projectId,
    userId: req.user.userId,
    role: req.user.role,
  })
  res.json(result)
})

export const generateForDocument = asyncHandler(async (req, res) => {
  const result = await chunkService.chunkAndEmbedDocument({
    documentId: req.params.documentId,
    projectId: req.params.projectId,
    userId: req.user.userId,
    role: req.user.role,
  })
  res.json(result)
})

export const search = asyncHandler(async (req, res) => {
  const { query, topK } = req.validated
  const results = await chunkService.searchProject({
    projectId: req.params.projectId,
    query,
    topK,
    userId: req.user.userId,
    role: req.user.role,
  })
  res.json(results)
})

export const stats = asyncHandler(async (req, res) => {
  const result = await chunkService.getProjectChunkStats({
    projectId: req.params.projectId,
    userId: req.user.userId,
    role: req.user.role,
  })
  res.json(result)
})

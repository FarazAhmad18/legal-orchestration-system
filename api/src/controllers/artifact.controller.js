import * as artifactService from '../services/artifact.service.js'
import asyncHandler from '../utils/asyncHandler.js'

export const list = asyncHandler(async (req, res) => {
  const artifacts = await artifactService.listByProject({
    projectId: req.params.projectId,
    userId: req.user.userId,
    role: req.user.role,
    type: req.query.type || undefined,
  })
  res.json(artifacts)
})

export const getLatest = asyncHandler(async (req, res) => {
  const artifact = await artifactService.getLatest({
    projectId: req.params.projectId,
    userId: req.user.userId,
    role: req.user.role,
    type: req.params.type,
  })
  res.json(artifact)
})

export const getById = asyncHandler(async (req, res) => {
  const artifact = await artifactService.getById({
    artifactId: req.params.artifactId,
    projectId: req.params.projectId,
    userId: req.user.userId,
    role: req.user.role,
  })
  res.json(artifact)
})

export const summary = asyncHandler(async (req, res) => {
  const summaries = await artifactService.getSummary({
    projectId: req.params.projectId,
    userId: req.user.userId,
    role: req.user.role,
  })
  res.json(summaries)
})

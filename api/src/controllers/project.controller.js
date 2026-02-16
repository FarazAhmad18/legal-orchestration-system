import * as projectService from '../services/project.service.js'
import asyncHandler from '../utils/asyncHandler.js'

export const create = asyncHandler(async (req, res) => {
  const project = await projectService.create({
    ...req.validated,
    userId: req.user.userId,
  })
  res.status(201).json(project)
})

export const list = asyncHandler(async (req, res) => {
  const projects = await projectService.list({
    userId: req.user.userId,
    role: req.user.role,
  })
  res.json(projects)
})

export const getById = asyncHandler(async (req, res) => {
  const project = await projectService.getById({
    id: req.params.id,
    userId: req.user.userId,
    role: req.user.role,
  })
  res.json(project)
})

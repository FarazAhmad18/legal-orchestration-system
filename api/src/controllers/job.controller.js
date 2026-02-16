import * as jobService from '../services/job.service.js'
import asyncHandler from '../utils/asyncHandler.js'

export const runAnalysis = asyncHandler(async (req, res) => {
  const job = await jobService.runAnalysis({
    projectId: req.params.projectId,
    userId: req.user.userId,
    role: req.user.role,
  })
  res.status(201).json(job)
})

export const list = asyncHandler(async (req, res) => {
  const jobs = await jobService.listByProject({
    projectId: req.params.projectId,
    userId: req.user.userId,
    role: req.user.role,
  })
  res.json(jobs)
})

export const pipelineStatus = asyncHandler(async (req, res) => {
  const status = await jobService.getPipelineStatus({
    projectId: req.params.projectId,
    userId: req.user.userId,
    role: req.user.role,
  })
  res.json(status)
})

export const getById = asyncHandler(async (req, res) => {
  const job = await jobService.getById({
    jobId: req.params.jobId,
    projectId: req.params.projectId,
    userId: req.user.userId,
    role: req.user.role,
  })
  res.json(job)
})

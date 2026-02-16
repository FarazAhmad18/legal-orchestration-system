import * as jobRepo from '../repositories/job.repository.js'
import * as projectRepo from '../repositories/project.repository.js'
import * as chunkRepo from '../repositories/chunk.repository.js'
import { ANALYSIS_STEPS } from '../workers/pipeline.js'
import ApiError from '../utils/ApiError.js'

function verifyAccess(project, userId, role) {
  if (!project) throw ApiError.notFound('Project not found')
  if (role !== 'admin' && project.createdBy !== userId) {
    throw ApiError.forbidden('Access denied')
  }
}

/**
 * Start the analysis pipeline (fact_extract → ... → validate).
 */
export async function runAnalysis({ projectId, userId, role }) {
  const project = await projectRepo.findById(projectId)
  verifyAccess(project, userId, role)

  // Reject if active jobs exist
  const active = await jobRepo.hasActiveJobs(projectId)
  if (active) {
    throw ApiError.conflict('Analysis is already running for this project')
  }

  // Reject if no embedded chunks
  const chunkCount = await chunkRepo.countByProjectId(projectId)
  if (chunkCount === 0) {
    throw ApiError.badRequest('No chunks found. Upload and chunk documents first.')
  }

  // Queue the first analysis step
  const job = await jobRepo.create({
    projectId,
    type: 'fact_extract',
    payloadJson: { startedBy: userId },
  })

  return job
}

export async function listByProject({ projectId, userId, role }) {
  const project = await projectRepo.findById(projectId)
  verifyAccess(project, userId, role)
  return jobRepo.findByProjectId(projectId)
}

/**
 * Get pipeline status: overall + per-step status.
 */
export async function getPipelineStatus({ projectId, userId, role }) {
  const project = await projectRepo.findById(projectId)
  verifyAccess(project, userId, role)

  const jobs = await jobRepo.findByProjectId(projectId)

  // Build per-step status from the most recent run
  // Jobs are ordered desc, so group by type keeping the most recent
  const latestByType = {}
  for (const job of jobs) {
    if (!latestByType[job.type]) {
      latestByType[job.type] = job
    }
  }

  const steps = ANALYSIS_STEPS.map((stepType) => {
    const job = latestByType[stepType]
    return {
      type: stepType,
      status: job ? job.status : 'not_started',
      jobId: job?.id ?? null,
      error: job?.error ?? null,
      attempts: job?.attempts ?? 0,
    }
  })

  // Determine overall status
  let overallStatus = 'not_started'
  const statuses = steps.map((s) => s.status)

  if (statuses.includes('running')) {
    overallStatus = 'running'
  } else if (statuses.includes('pending')) {
    overallStatus = 'running' // pending means pipeline is in progress
  } else if (statuses.includes('failed')) {
    overallStatus = 'failed'
  } else if (statuses.every((s) => s === 'completed')) {
    overallStatus = 'completed'
  } else if (statuses.some((s) => s === 'completed')) {
    overallStatus = 'partial'
  }

  return { overallStatus, steps }
}

export async function getById({ jobId, projectId, userId, role }) {
  const project = await projectRepo.findById(projectId)
  verifyAccess(project, userId, role)

  const job = await jobRepo.findById(jobId)
  if (!job || job.projectId !== projectId) {
    throw ApiError.notFound('Job not found')
  }
  return job
}

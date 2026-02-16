import * as jobRepo from '../repositories/job.repository.js'

/**
 * Ordered analysis steps (the 5 pipeline stages).
 */
export const ANALYSIS_STEPS = [
  'fact_extract',
  'timeline_build',
  'issue_spot',
  'draft_compose',
  'validate',
]

/**
 * Map from completed step → next step (null = terminal).
 */
const NEXT_STEP = {
  fact_extract: 'timeline_build',
  timeline_build: 'issue_spot',
  issue_spot: 'draft_compose',
  draft_compose: 'validate',
  validate: null,
}

/**
 * After a job completes, queue the next pipeline step.
 * Returns the new job, or null if the pipeline is done.
 */
export async function queueNextStep(completedJob) {
  const nextType = NEXT_STEP[completedJob.type]
  if (!nextType) return null

  const nextJob = await jobRepo.create({
    projectId: completedJob.projectId,
    type: nextType,
    payloadJson: completedJob.payloadJson,
  })

  console.log(`[pipeline] Queued ${nextType} after ${completedJob.type} for project ${completedJob.projectId}`)
  return nextJob
}

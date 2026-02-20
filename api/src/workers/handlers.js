import * as artifactRepo from '../repositories/artifact.repository.js'
import { extractFacts } from '../services/factExtract.service.js'
import { buildTimeline } from '../services/timelineBuilder.service.js'
import { spotIssues } from '../services/issueSpotter.service.js'

/**
 * Job type → artifact type mapping for analysis steps.
 */
const JOB_TO_ARTIFACT = {
  fact_extract: 'facts_v1',
  timeline_build: 'timeline_v1',
  issue_spot: 'issues_v1',
  draft_compose: 'brief_v1',
  validate: 'validation_v1',
}

/**
 * Stub handler — creates a placeholder artifact.
 * Real implementations will replace these in Chunks 5-7.
 */
async function stubHandler(job, artifactType) {
  const artifact = await artifactRepo.create({
    projectId: job.projectId,
    type: artifactType,
    contentJson: { _stub: true, message: `Placeholder for ${artifactType}`, generatedAt: new Date().toISOString() },
    createdByJobId: job.id,
  })
  return artifact
}

async function handleFactExtract(job) {
  return extractFacts(job)
}

async function handleTimelineBuild(job) {
  return buildTimeline(job)
}

async function handleIssueSpot(job) {
  return spotIssues(job)
}

async function handleDraftCompose(job) {
  return stubHandler(job, 'brief_v1')
}

async function handleValidate(job) {
  return stubHandler(job, 'validation_v1')
}

async function handleParseDocument(job) {
  console.log(`[worker] parse_document handled synchronously (Chunk 2), job ${job.id}`)
}

async function handleChunkEmbed(job) {
  console.log(`[worker] chunk_embed handled synchronously (Chunk 3), job ${job.id}`)
}

/**
 * Handler map: job type → async handler function.
 */
const handlers = {
  fact_extract: handleFactExtract,
  timeline_build: handleTimelineBuild,
  issue_spot: handleIssueSpot,
  draft_compose: handleDraftCompose,
  validate: handleValidate,
  parse_document: handleParseDocument,
  chunk_embed: handleChunkEmbed,
}

export default handlers
export { JOB_TO_ARTIFACT }

import * as jobRepo from '../repositories/job.repository.js'
import handlers from './handlers.js'
import { queueNextStep } from './pipeline.js'

const MAX_ATTEMPTS = 3
const IDLE_INTERVAL = 3000 // 3s when no jobs found
const BUSY_DELAY = 0       // immediate retry when busy

let running = false
let timer = null

async function processNextJob() {
  const job = await jobRepo.claimNextPending()
  if (!job) return false // no work

  console.log(`[worker] Processing job ${job.id} (${job.type}) attempt ${job.attempts}`)

  const handler = handlers[job.type]
  if (!handler) {
    await jobRepo.markFailed(job.id, `No handler for job type: ${job.type}`)
    console.error(`[worker] No handler for job type: ${job.type}`)
    return true
  }

  try {
    await handler(job)
    await jobRepo.markCompleted(job.id)
    console.log(`[worker] Job ${job.id} (${job.type}) completed`)

    // Chain next pipeline step
    await queueNextStep(job)
  } catch (err) {
    console.error(`[worker] Job ${job.id} (${job.type}) failed:`, err.message)

    if (job.attempts >= MAX_ATTEMPTS) {
      await jobRepo.markFailed(job.id, err.message)
      console.error(`[worker] Job ${job.id} permanently failed after ${MAX_ATTEMPTS} attempts`)
    } else {
      // Mark failed then reset to pending for retry
      await jobRepo.markFailed(job.id, err.message)
      await jobRepo.resetToPending(job.id)
      console.log(`[worker] Job ${job.id} reset for retry (attempt ${job.attempts}/${MAX_ATTEMPTS})`)
    }
  }

  return true
}

function scheduleNext(delay) {
  if (!running) return
  timer = setTimeout(async () => {
    try {
      const hadWork = await processNextJob()
      scheduleNext(hadWork ? BUSY_DELAY : IDLE_INTERVAL)
    } catch (err) {
      console.error('[worker] Unexpected error in poll loop:', err.message)
      scheduleNext(IDLE_INTERVAL)
    }
  }, delay)
}

export function startWorker() {
  if (running) return
  running = true
  console.log('[worker] Worker started, polling every 3s')
  scheduleNext(0)
}

export function stopWorker() {
  running = false
  if (timer) {
    clearTimeout(timer)
    timer = null
  }
  console.log('[worker] Worker stopped')
}

import { motion } from 'motion/react'
import { usePipelineStatus, useRunAnalysis } from '../../hooks/useJobs'
import { useChunkStats } from '../../hooks/useChunks'
import Button from '../ui/Button'
import DraftBanner from '../ui/DraftBanner'
import toast from 'react-hot-toast'

const STEPS = [
  { type: 'fact_extract', label: 'Facts', num: 1 },
  { type: 'timeline_build', label: 'Timeline', num: 2 },
  { type: 'issue_spot', label: 'Issues', num: 3 },
  { type: 'draft_compose', label: 'Brief', num: 4 },
  { type: 'validate', label: 'Validate', num: 5 },
]

function getStepStatus(pipeline, type) {
  if (!pipeline) return 'not_started'
  const step = pipeline.steps?.find((s) => s.type === type)
  return step?.status || 'not_started'
}

function getStepError(pipeline, type) {
  if (!pipeline) return null
  const step = pipeline.steps?.find((s) => s.type === type)
  return step?.error || null
}

export default function PipelineStatus({ projectId }) {
  const { data: pipeline, isLoading } = usePipelineStatus(projectId)
  const { data: chunkStats } = useChunkStats(projectId)
  const runMutation = useRunAnalysis(projectId)

  const hasChunks = chunkStats?.totalChunks > 0
  if (!hasChunks) return null

  const hasRun = pipeline && pipeline.overallStatus !== 'not_started'
  const isRunning = pipeline?.overallStatus === 'running'
  const isCompleted = pipeline?.overallStatus === 'completed'

  async function handleRun() {
    try {
      await runMutation.mutateAsync()
      toast.success('Analysis pipeline started')
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to start analysis')
    }
  }

  // Calculate progress
  const completedCount = pipeline?.steps?.filter((s) => s.status === 'completed').length || 0
  const progress = hasRun ? (completedCount / 5) * 100 : 0

  return (
    <div className="mb-6 rounded-xl border border-surface-200 bg-surface-0 shadow-xs overflow-hidden">
      {/* Progress bar */}
      <div className="h-1 bg-surface-100">
        <motion.div
          className="h-full bg-brand-500 rounded-r-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>

      <div className="p-5">
        <div className="flex items-center justify-between">
          {/* Stepper */}
          <div className="flex items-center gap-0 overflow-x-auto scrollbar-none">
            {isLoading ? (
              <span className="text-sm text-gray-400">Loading...</span>
            ) : (
              STEPS.map((step, i) => {
                const status = getStepStatus(pipeline, step.type)
                const error = getStepError(pipeline, step.type)
                return (
                  <div key={step.type} className="flex items-center">
                    {i > 0 && (
                      <div className={`h-0.5 w-8 shrink-0 transition-colors duration-500 ${
                        status === 'completed' || getStepStatus(pipeline, STEPS[i - 1].type) === 'completed'
                          ? 'bg-brand-400'
                          : 'bg-surface-200'
                      }`} />
                    )}
                    <div className="flex flex-col items-center gap-1.5">
                      <div className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold transition-all duration-300 ${
                        status === 'completed'
                          ? 'bg-success text-white'
                          : status === 'running' || status === 'pending'
                            ? 'bg-brand-100 text-brand-700 ring-2 ring-brand-400 animate-pulse-soft'
                            : status === 'failed'
                              ? 'bg-danger text-white'
                              : 'bg-surface-100 text-gray-400 ring-1 ring-surface-200'
                      }`}>
                        {status === 'completed' ? (
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        ) : status === 'failed' ? (
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        ) : (
                          step.num
                        )}
                      </div>
                      <span className={`text-[10px] font-medium ${
                        status === 'completed' ? 'text-success' :
                        status === 'running' || status === 'pending' ? 'text-brand-600' :
                        status === 'failed' ? 'text-danger' : 'text-gray-400'
                      }`}>
                        {step.label}
                      </span>
                      {error && (
                        <span className="max-w-[80px] truncate text-[9px] text-danger" title={error}>
                          {error}
                        </span>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Action */}
          <Button
            onClick={handleRun}
            loading={runMutation.isPending || isRunning}
            disabled={isRunning}
          >
            {isRunning ? 'Running...' : hasRun ? 'Re-run Analysis' : 'Run Analysis'}
          </Button>
        </div>

        {isCompleted && <DraftBanner className="mt-4" />}
      </div>
    </div>
  )
}

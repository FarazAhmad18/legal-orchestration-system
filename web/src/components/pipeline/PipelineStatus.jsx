import { usePipelineStatus, useRunAnalysis } from '../../hooks/useJobs'
import { useChunkStats } from '../../hooks/useChunks'
import Button from '../ui/Button'
import toast from 'react-hot-toast'

const STEP_LABELS = {
  fact_extract: 'Facts',
  timeline_build: 'Timeline',
  issue_spot: 'Issues',
  draft_compose: 'Brief',
  validate: 'Validate',
}

const STATUS_COLORS = {
  not_started: 'bg-gray-100 text-gray-500',
  pending: 'bg-blue-100 text-blue-700',
  running: 'bg-yellow-100 text-yellow-700',
  completed: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
}

function StepBadge({ step }) {
  const label = STEP_LABELS[step.type] || step.type
  const color = STATUS_COLORS[step.status] || STATUS_COLORS.not_started

  return (
    <div className="flex flex-col items-center gap-1">
      <div className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${color}`}>
        {step.status === 'running' && (
          <svg className="h-3 w-3 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
        {step.status === 'completed' && (
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
        {step.status === 'failed' && (
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        )}
        {label}
      </div>
      {step.error && (
        <span className="max-w-[120px] truncate text-[10px] text-red-500" title={step.error}>
          {step.error}
        </span>
      )}
    </div>
  )
}

function StepConnector() {
  return (
    <div className="flex items-center px-1">
      <svg className="h-4 w-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
      </svg>
    </div>
  )
}

export default function PipelineStatus({ projectId }) {
  const { data: pipeline, isLoading } = usePipelineStatus(projectId)
  const { data: chunkStats } = useChunkStats(projectId)
  const runMutation = useRunAnalysis(projectId)

  const hasChunks = chunkStats?.totalChunks > 0

  async function handleRun() {
    try {
      await runMutation.mutateAsync()
      toast.success('Analysis pipeline started')
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to start analysis')
    }
  }

  // Don't show pipeline bar if there are no chunks to analyze
  if (!hasChunks) return null

  const hasRun = pipeline && pipeline.overallStatus !== 'not_started'
  const isRunning = pipeline?.overallStatus === 'running'
  const isCompleted = pipeline?.overallStatus === 'completed'

  return (
    <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex items-center justify-between">
        {/* Step badges */}
        <div className="flex items-center">
          <span className="mr-4 text-sm font-medium text-gray-700">Pipeline</span>
          {isLoading ? (
            <span className="text-sm text-gray-400">Loading...</span>
          ) : pipeline ? (
            <div className="flex items-center">
              {pipeline.steps.map((step, i) => (
                <div key={step.type} className="flex items-center">
                  {i > 0 && <StepConnector />}
                  <StepBadge step={step} />
                </div>
              ))}
            </div>
          ) : null}
        </div>

        {/* Action button */}
        <Button
          onClick={handleRun}
          loading={runMutation.isPending || isRunning}
          disabled={isRunning}
        >
          {isRunning ? 'Running...' : hasRun ? 'Re-run Analysis' : 'Run Analysis'}
        </Button>
      </div>

      {/* Disclaimer when completed */}
      {isCompleted && (
        <div className="mt-3 rounded bg-amber-50 px-3 py-2 text-xs text-amber-700">
          DRAFT - Human Review Required. All outputs are drafting assistance only, not legal advice.
        </div>
      )}
    </div>
  )
}

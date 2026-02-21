import { useState } from 'react'
import { motion } from 'motion/react'
import { useLatestArtifact, useArtifactHistory } from '../../hooks/useArtifacts'
import { usePipelineStatus } from '../../hooks/useJobs'
import Card from '../ui/Card'
import Badge from '../ui/Badge'
import Skeleton from '../ui/Skeleton'
import EmptyState from '../ui/EmptyState'
import LoadingSpinner from '../ui/LoadingSpinner'
import DraftBanner from '../ui/DraftBanner'

const ISSUE_TYPE_CONFIG = {
  missing_citation: { label: 'Missing Citation', color: 'yellow', icon: 'M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z' },
  invalid_reference: { label: 'Invalid Reference', color: 'red', icon: 'M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z' },
  potential_contradiction: { label: 'Potential Contradiction', color: 'orange', icon: 'M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5' },
}

function scoreColor(score) {
  if (score >= 0.8) return { bg: 'bg-green-50', text: 'text-green-700', ring: 'ring-green-500', bar: 'bg-green-500' }
  if (score >= 0.5) return { bg: 'bg-yellow-50', text: 'text-yellow-700', ring: 'ring-yellow-500', bar: 'bg-yellow-500' }
  return { bg: 'bg-red-50', text: 'text-red-700', ring: 'ring-red-500', bar: 'bg-red-500' }
}

export default function ValidationTab({ projectId }) {
  const [showHistory, setShowHistory] = useState(false)

  const { data: pipeline } = usePipelineStatus(projectId)
  const validateStep = pipeline?.steps?.find((s) => s.type === 'validate')
  const isRunning = validateStep?.status === 'running' || validateStep?.status === 'pending'

  const { data: artifact, isLoading, error } = useLatestArtifact(projectId, 'validation_v1')
  const { data: history } = useArtifactHistory(projectId, 'validation_v1')
  const validationData = artifact?.contentJson

  if (isRunning) {
    return (
      <Card className="py-12 text-center">
        <LoadingSpinner className="mx-auto mb-3" />
        <p className="text-gray-500">Running consistency validation...</p>
      </Card>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full rounded-lg" />
        {[1, 2, 3].map((i) => (
          <Card key={i} padding="md">
            <Skeleton lines={2} />
          </Card>
        ))}
      </div>
    )
  }

  if (error) {
    if (error.response?.status === 404) {
      return (
        <EmptyState
          icon={<svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>}
          title="No validation results yet"
          description="Run the analysis pipeline to validate citations and references."
        />
      )
    }
    return <p className="text-danger">Failed to load validation results</p>
  }

  if (!validationData) {
    return (
      <EmptyState
        icon={<svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>}
        title="No validation results yet"
        description="Run the analysis pipeline to validate citations and references."
      />
    )
  }

  const issuesFound = validationData.issues_found || []
  const score = validationData.confidence_score ?? 0
  const colors = scoreColor(score)

  // Group issues by type
  const grouped = {}
  for (const type of Object.keys(ISSUE_TYPE_CONFIG)) {
    const items = issuesFound.filter((i) => i.type === type)
    if (items.length > 0) grouped[type] = items
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800">
          Validation Results
        </h2>
        <div className="flex items-center gap-3">
          {artifact?.version && (
            <div className="relative">
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 transition-colors"
              >
                <Badge color="gray">v{artifact.version}</Badge>
                {history?.length > 1 && (
                  <svg className={`h-3 w-3 transition-transform ${showHistory ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                  </svg>
                )}
              </button>
              {showHistory && history?.length > 1 && (
                <div className="absolute right-0 top-full mt-1 z-20 w-48 rounded-lg border border-surface-200 bg-surface-0 py-1 shadow-lg">
                  {history.map((h) => (
                    <div
                      key={h.id}
                      className={`px-3 py-1.5 text-xs ${h.id === artifact.id ? 'bg-brand-50 text-brand-700 font-medium' : 'text-gray-600'}`}
                    >
                      v{h.version} — {new Date(h.createdAt).toLocaleString()}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <DraftBanner className="mb-4" />

      {/* Confidence Score */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
        <Card padding="md" className="mb-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Confidence Score</p>
              <p className={`text-3xl font-bold ${colors.text}`}>
                {(score * 100).toFixed(0)}%
              </p>
              <p className="mt-1 text-xs text-gray-400">
                {issuesFound.length === 0
                  ? 'No issues found'
                  : `${issuesFound.length} issue${issuesFound.length === 1 ? '' : 's'} found`}
              </p>
            </div>
            <div className="h-20 w-20 relative">
              <svg className="h-20 w-20 -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="15.5" fill="none" stroke="#e5e7eb" strokeWidth="3" />
                <circle
                  cx="18" cy="18" r="15.5" fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeDasharray={`${score * 97.4} 97.4`}
                  strokeLinecap="round"
                  className={colors.text}
                />
              </svg>
            </div>
          </div>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-surface-200">
            <motion.div
              className={`h-full rounded-full ${colors.bar}`}
              initial={{ width: 0 }}
              animate={{ width: `${score * 100}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            />
          </div>
        </Card>
      </motion.div>

      {/* Success state */}
      {issuesFound.length === 0 && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.25 }}>
          <Card padding="md" className="border-l-4 border-l-green-400">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-50">
                <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">All citations verified</p>
                <p className="text-sm text-gray-500">No missing citations, invalid references, or contradictions detected.</p>
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Issues grouped by type */}
      {Object.entries(grouped).map(([type, items], gi) => {
        const config = ISSUE_TYPE_CONFIG[type]
        return (
          <motion.div
            key={type}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + gi * 0.06, duration: 0.25 }}
            className="mb-4"
          >
            <div className="mb-2 flex items-center gap-2">
              <Badge color={config.color}>{items.length}</Badge>
              <h3 className="text-sm font-semibold text-gray-700">{config.label}</h3>
            </div>
            <div className="space-y-2">
              {items.map((issue, i) => (
                <Card key={i} padding="sm" className={`border-l-4 ${borderColor(type)}`}>
                  <div className="flex items-start gap-3">
                    <svg className={`h-4 w-4 mt-0.5 shrink-0 ${iconColor(type)}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d={config.icon} />
                    </svg>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-700">{issue.message}</p>
                      <p className="mt-1 text-xs font-mono text-gray-400 truncate">{issue.path}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}

function borderColor(type) {
  const map = { missing_citation: 'border-l-yellow-400', invalid_reference: 'border-l-red-400', potential_contradiction: 'border-l-orange-400' }
  return map[type] || 'border-l-gray-300'
}

function iconColor(type) {
  const map = { missing_citation: 'text-yellow-500', invalid_reference: 'text-red-500', potential_contradiction: 'text-orange-500' }
  return map[type] || 'text-gray-400'
}

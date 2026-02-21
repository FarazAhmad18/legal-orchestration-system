import { useState } from 'react'
import { motion } from 'motion/react'
import { useLatestArtifact } from '../../hooks/useArtifacts'
import { usePipelineStatus } from '../../hooks/useJobs'
import CitationPanel from '../facts/CitationPanel'
import Card from '../ui/Card'
import Badge from '../ui/Badge'
import Skeleton from '../ui/Skeleton'
import EmptyState from '../ui/EmptyState'
import LoadingSpinner from '../ui/LoadingSpinner'
import DraftBanner from '../ui/DraftBanner'

export default function IssuesTab({ projectId }) {
  const [selectedCitation, setSelectedCitation] = useState(null)

  const { data: pipeline } = usePipelineStatus(projectId)
  const issueStep = pipeline?.steps?.find((s) => s.type === 'issue_spot')
  const isRunning = issueStep?.status === 'running' || issueStep?.status === 'pending'

  const { data: artifact, isLoading, error } = useLatestArtifact(projectId, 'issues_v1')
  const issues = artifact?.contentJson?.issues

  if (isRunning) {
    return (
      <Card className="py-12 text-center">
        <LoadingSpinner className="mx-auto mb-3" />
        <p className="text-gray-500">Identifying issues from facts and timeline...</p>
      </Card>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} padding="md">
            <div className="flex items-start gap-3">
              <Skeleton circle className="h-8 w-8" />
              <Skeleton lines={3} className="flex-1" />
            </div>
          </Card>
        ))}
      </div>
    )
  }

  if (error) {
    if (error.response?.status === 404) {
      return (
        <EmptyState
          icon={<svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>}
          title="No issues identified yet"
          description="Run the analysis pipeline to get started."
        />
      )
    }
    return <p className="text-danger">Failed to load issues</p>
  }

  if (!issues || issues.length === 0) {
    return (
      <EmptyState
        icon={<svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>}
        title="No issues identified yet"
        description="Run the analysis pipeline to get started."
      />
    )
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800">
          Identified Issues ({issues.length})
        </h2>
        {artifact?.version && <Badge color="gray">v{artifact.version}</Badge>}
      </div>

      <DraftBanner className="mb-4" />

      <div className="space-y-3">
        {issues.map((issue, i) => (
          <motion.div
            key={issue.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04, duration: 0.25 }}
          >
            <Card padding="sm" className="border-l-4 border-l-purple-400 p-4">
              <div className="mb-2 flex items-start gap-3">
                <Badge color="purple" className="shrink-0 mt-0.5">{issue.id}</Badge>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-gray-900">{issue.issue_title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-gray-600">{issue.description}</p>
                </div>
              </div>

              {issue.related_fact_ids?.length > 0 && (
                <div className="mt-3 ml-10 flex flex-wrap items-center gap-1.5">
                  <span className="text-xs text-gray-400">Related facts:</span>
                  {issue.related_fact_ids.map((fid) => (
                    <Badge key={fid} color="brand">{fid}</Badge>
                  ))}
                </div>
              )}

              {issue.uncertainty_flags?.length > 0 && (
                <div className="mt-2 ml-10 flex flex-wrap gap-1">
                  {issue.uncertainty_flags.map((flag) => (
                    <Badge key={flag} color="orange">{flag}</Badge>
                  ))}
                </div>
              )}

              <div className="mt-3 ml-10 flex flex-wrap gap-1.5">
                {issue.citations?.map((cit, ci) => (
                  <button
                    key={ci}
                    onClick={() => setSelectedCitation(cit)}
                    className="inline-flex items-center rounded-md bg-surface-100 px-2 py-1 text-xs font-medium text-brand-700 transition-colors hover:bg-brand-50"
                    title={cit.quote?.slice(0, 100)}
                  >
                    [{cit.filename || 'Doc'} p.{cit.page_number}]
                  </button>
                ))}
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {selectedCitation && (
        <CitationPanel
          citation={selectedCitation}
          onClose={() => setSelectedCitation(null)}
        />
      )}
    </div>
  )
}

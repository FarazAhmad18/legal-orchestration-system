import { useState } from 'react'
import { useLatestArtifact } from '../../hooks/useArtifacts'
import { usePipelineStatus } from '../../hooks/useJobs'
import CitationPanel from '../facts/CitationPanel'
import Card from '../ui/Card'
import LoadingSpinner from '../ui/LoadingSpinner'

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

  if (isLoading) return <LoadingSpinner className="mt-8" />

  if (error) {
    if (error.response?.status === 404) {
      return (
        <Card className="py-12 text-center">
          <p className="text-gray-500">No issues identified yet. Run the analysis pipeline to get started.</p>
        </Card>
      )
    }
    return <p className="text-red-600">Failed to load issues</p>
  }

  if (!issues || issues.length === 0) {
    return (
      <Card className="py-12 text-center">
        <p className="text-gray-500">No issues identified yet. Run the analysis pipeline to get started.</p>
      </Card>
    )
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800">
          Identified Issues ({issues.length})
        </h2>
        {artifact?.version && (
          <span className="text-xs text-gray-400">Version {artifact.version}</span>
        )}
      </div>

      <p className="mb-4 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-700">
        DRAFT &mdash; Human Review Required. These issues were automatically identified and must be verified.
      </p>

      <div className="space-y-4">
        {issues.map((issue) => (
          <Card key={issue.id} className="p-4">
            <div className="mb-2 flex items-start gap-3">
              <span className="inline-flex h-7 min-w-[1.75rem] items-center justify-center rounded-full bg-purple-100 px-2 text-xs font-bold text-purple-700">
                {issue.id}
              </span>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-gray-900">{issue.issue_title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-gray-600">{issue.description}</p>
              </div>
            </div>

            {/* Related fact IDs */}
            {issue.related_fact_ids?.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1">
                <span className="text-xs text-gray-500 mr-1">Related facts:</span>
                {issue.related_fact_ids.map((fid) => (
                  <span key={fid} className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                    {fid}
                  </span>
                ))}
              </div>
            )}

            {/* Uncertainty flags */}
            {issue.uncertainty_flags?.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {issue.uncertainty_flags.map((flag) => (
                  <span key={flag} className="rounded bg-orange-100 px-1.5 py-0.5 text-xs text-orange-700">
                    {flag}
                  </span>
                ))}
              </div>
            )}

            {/* Citations */}
            <div className="mt-3 flex flex-wrap gap-2">
              {issue.citations?.map((cit, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedCitation(cit)}
                  className="inline-flex items-center rounded bg-gray-100 px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100 transition-colors"
                  title={cit.quote?.slice(0, 100)}
                >
                  [{cit.filename || 'Doc'} p.{cit.page_number}]
                </button>
              ))}
            </div>
          </Card>
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

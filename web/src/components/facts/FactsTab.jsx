import { useState } from 'react'
import { useLatestArtifact } from '../../hooks/useArtifacts'
import { usePipelineStatus } from '../../hooks/useJobs'
import CitationPanel from './CitationPanel'
import Card from '../ui/Card'
import LoadingSpinner from '../ui/LoadingSpinner'

const CONFIDENCE_STYLES = {
  high: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  low: 'bg-red-100 text-red-800',
}

function confidenceLevel(score) {
  if (score >= 0.8) return 'high'
  if (score >= 0.5) return 'medium'
  return 'low'
}

export default function FactsTab({ projectId }) {
  const [selectedCitation, setSelectedCitation] = useState(null)

  const { data: pipeline } = usePipelineStatus(projectId)
  const factStep = pipeline?.steps?.find((s) => s.type === 'fact_extract')
  const isRunning = factStep?.status === 'running' || factStep?.status === 'pending'

  const { data: artifact, isLoading, error } = useLatestArtifact(projectId, 'facts_v1')

  const facts = artifact?.contentJson?.facts

  if (isRunning) {
    return (
      <Card className="py-12 text-center">
        <LoadingSpinner className="mx-auto mb-3" />
        <p className="text-gray-500">Extracting facts from documents...</p>
      </Card>
    )
  }

  if (isLoading) return <LoadingSpinner className="mt-8" />

  if (error) {
    // 404 means no artifact yet
    if (error.response?.status === 404) {
      return (
        <Card className="py-12 text-center">
          <p className="text-gray-500">No facts extracted yet. Run the analysis pipeline to get started.</p>
        </Card>
      )
    }
    return <p className="text-red-600">Failed to load facts</p>
  }

  if (!facts || facts.length === 0) {
    return (
      <Card className="py-12 text-center">
        <p className="text-gray-500">No facts extracted yet. Run the analysis pipeline to get started.</p>
      </Card>
    )
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800">
          Extracted Facts ({facts.length})
        </h2>
        {artifact?.version && (
          <span className="text-xs text-gray-400">Version {artifact.version}</span>
        )}
      </div>

      <p className="mb-4 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-700">
        DRAFT &mdash; Human Review Required. These facts were automatically extracted and must be verified.
      </p>

      <div className="space-y-4">
        {facts.map((fact) => {
          const level = confidenceLevel(fact.confidence)
          return (
            <Card key={fact.id} className="p-4">
              <div className="mb-2 flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                    {fact.id}
                  </span>
                  <p className="text-sm leading-relaxed text-gray-800">{fact.fact}</p>
                </div>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${CONFIDENCE_STYLES[level]}`}>
                  {(fact.confidence * 100).toFixed(0)}%
                </span>
              </div>

              {/* Uncertainty flags */}
              {fact.uncertainty_flags?.length > 0 && (
                <div className="mb-2 flex flex-wrap gap-1">
                  {fact.uncertainty_flags.map((flag) => (
                    <span key={flag} className="rounded bg-orange-100 px-1.5 py-0.5 text-xs text-orange-700">
                      {flag}
                    </span>
                  ))}
                </div>
              )}

              {/* Citations */}
              <div className="flex flex-wrap gap-2">
                {fact.citations.map((cit, i) => (
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
          )
        })}
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

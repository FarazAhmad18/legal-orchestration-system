import { useState, useMemo } from 'react'
import { motion } from 'motion/react'
import { useLatestArtifact } from '../../hooks/useArtifacts'
import { usePipelineStatus } from '../../hooks/useJobs'
import CitationPanel from './CitationPanel'
import Card from '../ui/Card'
import Badge from '../ui/Badge'
import Skeleton from '../ui/Skeleton'
import EmptyState from '../ui/EmptyState'
import LoadingSpinner from '../ui/LoadingSpinner'
import DraftBanner from '../ui/DraftBanner'

function confidenceLevel(score) {
  if (score >= 0.8) return 'high'
  if (score >= 0.5) return 'medium'
  return 'low'
}

const CONFIDENCE_BADGE = {
  high: 'green',
  medium: 'yellow',
  low: 'red',
}

export default function FactsTab({ projectId }) {
  const [selectedCitation, setSelectedCitation] = useState(null)
  const [sortBy, setSortBy] = useState('default')
  const [flagFilter, setFlagFilter] = useState('')

  const { data: pipeline } = usePipelineStatus(projectId)
  const factStep = pipeline?.steps?.find((s) => s.type === 'fact_extract')
  const isRunning = factStep?.status === 'running' || factStep?.status === 'pending'

  const { data: artifact, isLoading, error } = useLatestArtifact(projectId, 'facts_v1')
  const facts = artifact?.contentJson?.facts

  const allFlags = useMemo(() => {
    if (!facts) return []
    const s = new Set()
    facts.forEach((f) => f.uncertainty_flags?.forEach((fl) => s.add(fl)))
    return [...s]
  }, [facts])

  const displayFacts = useMemo(() => {
    if (!facts) return []
    let result = [...facts]
    if (flagFilter) result = result.filter((f) => f.uncertainty_flags?.includes(flagFilter))
    if (sortBy === 'confidence_asc') result.sort((a, b) => a.confidence - b.confidence)
    if (sortBy === 'confidence_desc') result.sort((a, b) => b.confidence - a.confidence)
    return result
  }, [facts, sortBy, flagFilter])

  if (isRunning) {
    return (
      <Card className="py-12 text-center">
        <LoadingSpinner className="mx-auto mb-3" />
        <p className="text-gray-500">Extracting facts from documents...</p>
      </Card>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} padding="md">
            <div className="flex items-start gap-3">
              <Skeleton circle className="h-8 w-8" />
              <Skeleton lines={2} className="flex-1" />
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
          icon={<svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" /><path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" /></svg>}
          title="No facts extracted yet"
          description="Run the analysis pipeline to get started."
        />
      )
    }
    return <p className="text-danger">Failed to load facts</p>
  }

  if (!facts || facts.length === 0) {
    return (
      <EmptyState
        icon={<svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" /><path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" /></svg>}
        title="No facts extracted yet"
        description="Run the analysis pipeline to get started."
      />
    )
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800">
          Extracted Facts ({displayFacts.length}{displayFacts.length !== facts.length ? ` of ${facts.length}` : ''})
        </h2>
        <div className="flex items-center gap-3">
          {/* Flag filter */}
          {allFlags.length > 0 && (
            <select
              value={flagFilter}
              onChange={(e) => setFlagFilter(e.target.value)}
              className="rounded-lg border border-surface-200 bg-surface-50 px-3 py-1.5 text-xs text-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-500/40"
            >
              <option value="">All flags</option>
              {allFlags.map((f) => <option key={f} value={f}>{f}</option>)}
            </select>
          )}
          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="rounded-lg border border-surface-200 bg-surface-50 px-3 py-1.5 text-xs text-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-500/40"
          >
            <option value="default">Default order</option>
            <option value="confidence_desc">Confidence: High → Low</option>
            <option value="confidence_asc">Confidence: Low → High</option>
          </select>
          {artifact?.version && (
            <Badge color="gray">v{artifact.version}</Badge>
          )}
        </div>
      </div>

      <DraftBanner className="mb-4" />

      <div className="space-y-3">
        {displayFacts.map((fact, i) => {
          const level = confidenceLevel(fact.confidence)
          return (
            <motion.div
              key={fact.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03, duration: 0.25 }}
            >
              <Card padding="sm" className="p-4">
                <div className="mb-2 flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <Badge color="brand" className="shrink-0 mt-0.5">{fact.id}</Badge>
                    <p className="text-sm leading-relaxed text-gray-800">{fact.fact}</p>
                  </div>
                  <Badge color={CONFIDENCE_BADGE[level]} className="shrink-0">
                    {(fact.confidence * 100).toFixed(0)}%
                  </Badge>
                </div>

                {fact.uncertainty_flags?.length > 0 && (
                  <div className="mb-2 ml-10 flex flex-wrap gap-1">
                    {fact.uncertainty_flags.map((flag) => (
                      <Badge key={flag} color="orange">{flag}</Badge>
                    ))}
                  </div>
                )}

                <div className="ml-10 flex flex-wrap gap-1.5">
                  {fact.citations.map((cit, ci) => (
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

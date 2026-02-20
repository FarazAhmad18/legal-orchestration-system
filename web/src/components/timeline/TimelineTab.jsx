import { useState, useMemo } from 'react'
import { motion } from 'motion/react'
import { useLatestArtifact } from '../../hooks/useArtifacts'
import { usePipelineStatus } from '../../hooks/useJobs'
import CitationPanel from '../facts/CitationPanel'
import Card from '../ui/Card'
import Badge from '../ui/Badge'
import Skeleton from '../ui/Skeleton'
import EmptyState from '../ui/EmptyState'
import LoadingSpinner from '../ui/LoadingSpinner'

function sortEvents(events) {
  return [...events].sort((a, b) => {
    if (a.date && b.date) return a.date.localeCompare(b.date)
    if (a.date && !b.date) return -1
    if (!a.date && b.date) return 1
    return 0
  })
}

function formatDate(dateStr) {
  if (!dateStr) return null
  try {
    const d = new Date(dateStr + 'T00:00:00')
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  } catch {
    return dateStr
  }
}

export default function TimelineTab({ projectId }) {
  const [selectedCitation, setSelectedCitation] = useState(null)
  const [hideUnknown, setHideUnknown] = useState(false)

  const { data: pipeline } = usePipelineStatus(projectId)
  const timelineStep = pipeline?.steps?.find((s) => s.type === 'timeline_build')
  const isRunning = timelineStep?.status === 'running' || timelineStep?.status === 'pending'

  const { data: artifact, isLoading, error } = useLatestArtifact(projectId, 'timeline_v1')
  const timeline = artifact?.contentJson?.timeline
  const gaps = artifact?.contentJson?.gaps

  const sorted = useMemo(() => {
    if (!timeline) return []
    let events = sortEvents(timeline)
    if (hideUnknown) events = events.filter((e) => e.date)
    return events
  }, [timeline, hideUnknown])

  if (isRunning) {
    return (
      <Card className="py-12 text-center">
        <LoadingSpinner className="mx-auto mb-3" />
        <p className="text-gray-500">Building timeline from extracted facts...</p>
      </Card>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-4">
            <Skeleton className="h-6 w-24 rounded-lg" />
            <Skeleton circle className="h-4 w-4 mt-1" />
            <Card padding="md" className="flex-1"><Skeleton lines={2} /></Card>
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    if (error.response?.status === 404) {
      return (
        <EmptyState
          icon={<svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          title="No timeline built yet"
          description="Run the analysis pipeline to get started."
        />
      )
    }
    return <p className="text-danger">Failed to load timeline</p>
  }

  if (!timeline || timeline.length === 0) {
    return (
      <EmptyState
        icon={<svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        title="No timeline built yet"
        description="Run the analysis pipeline to get started."
      />
    )
  }

  const unknownCount = timeline.filter((e) => !e.date).length

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800">
          Timeline ({sorted.length} events)
        </h2>
        <div className="flex items-center gap-3">
          {unknownCount > 0 && (
            <label className="flex items-center gap-2 text-xs text-gray-500 cursor-pointer">
              <input
                type="checkbox"
                checked={hideUnknown}
                onChange={(e) => setHideUnknown(e.target.checked)}
                className="rounded border-surface-300 text-brand-600 focus:ring-brand-500/40"
              />
              Hide unknown dates ({unknownCount})
            </label>
          )}
          {artifact?.version && <Badge color="gray">v{artifact.version}</Badge>}
        </div>
      </div>

      <div className="mb-4 flex items-center gap-2 rounded-lg bg-amber-50 px-4 py-2.5 text-xs text-amber-700">
        <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
        </svg>
        DRAFT — Human Review Required. This timeline was automatically generated and must be verified.
      </div>

      {/* Timeline events */}
      <div className="relative space-y-0">
        {/* Vertical line */}
        <div className="absolute left-[72px] top-0 bottom-0 w-0.5 bg-brand-200 rounded-full" />

        {sorted.map((event, idx) => (
          <motion.div
            key={idx}
            className="relative flex gap-4 py-4"
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.04, duration: 0.25 }}
          >
            {/* Date */}
            <div className="w-[60px] shrink-0 text-right">
              {event.date ? (
                <Badge color="brand">{formatDate(event.date)}</Badge>
              ) : (
                <Badge color="gray">Unknown</Badge>
              )}
            </div>

            {/* Dot */}
            <div className="relative z-10 mt-2 h-3.5 w-3.5 shrink-0 rounded-full border-[3px] border-brand-500 bg-surface-0" />

            {/* Card */}
            <Card padding="sm" className="flex-1 p-4">
              <p className="text-sm leading-relaxed text-gray-800">{event.event}</p>

              {event.fact_ids?.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {event.fact_ids.map((fid) => (
                    <Badge key={fid} color="brand">{fid}</Badge>
                  ))}
                </div>
              )}

              {event.uncertainty_flags?.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {event.uncertainty_flags.map((flag) => (
                    <Badge key={flag} color="orange">{flag}</Badge>
                  ))}
                </div>
              )}

              <div className="mt-2 flex flex-wrap gap-1.5">
                {event.citations?.map((cit, i) => (
                  <button
                    key={i}
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

      {/* Gaps */}
      {gaps?.length > 0 && (
        <div className="mt-8">
          <h3 className="mb-3 text-sm font-semibold text-gray-700">Identified Temporal Gaps</h3>
          <Card padding="sm" className="border-l-4 border-l-warning p-4">
            <div className="flex items-start gap-3">
              <svg className="h-5 w-5 shrink-0 text-warning mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
              <ul className="space-y-2">
                {gaps.map((gap, i) => (
                  <li key={i} className="text-sm text-gray-600">{gap}</li>
                ))}
              </ul>
            </div>
          </Card>
        </div>
      )}

      {selectedCitation && (
        <CitationPanel
          citation={selectedCitation}
          onClose={() => setSelectedCitation(null)}
        />
      )}
    </div>
  )
}

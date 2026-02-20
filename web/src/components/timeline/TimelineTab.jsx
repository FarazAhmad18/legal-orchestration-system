import { useState } from 'react'
import { useLatestArtifact } from '../../hooks/useArtifacts'
import { usePipelineStatus } from '../../hooks/useJobs'
import CitationPanel from '../facts/CitationPanel'
import Card from '../ui/Card'
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

  const { data: pipeline } = usePipelineStatus(projectId)
  const timelineStep = pipeline?.steps?.find((s) => s.type === 'timeline_build')
  const isRunning = timelineStep?.status === 'running' || timelineStep?.status === 'pending'

  const { data: artifact, isLoading, error } = useLatestArtifact(projectId, 'timeline_v1')

  const timeline = artifact?.contentJson?.timeline
  const gaps = artifact?.contentJson?.gaps

  if (isRunning) {
    return (
      <Card className="py-12 text-center">
        <LoadingSpinner className="mx-auto mb-3" />
        <p className="text-gray-500">Building timeline from extracted facts...</p>
      </Card>
    )
  }

  if (isLoading) return <LoadingSpinner className="mt-8" />

  if (error) {
    if (error.response?.status === 404) {
      return (
        <Card className="py-12 text-center">
          <p className="text-gray-500">No timeline built yet. Run the analysis pipeline to get started.</p>
        </Card>
      )
    }
    return <p className="text-red-600">Failed to load timeline</p>
  }

  if (!timeline || timeline.length === 0) {
    return (
      <Card className="py-12 text-center">
        <p className="text-gray-500">No timeline built yet. Run the analysis pipeline to get started.</p>
      </Card>
    )
  }

  const sorted = sortEvents(timeline)

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800">
          Timeline ({timeline.length} events)
        </h2>
        {artifact?.version && (
          <span className="text-xs text-gray-400">Version {artifact.version}</span>
        )}
      </div>

      <p className="mb-4 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-700">
        DRAFT &mdash; Human Review Required. This timeline was automatically generated and must be verified.
      </p>

      {/* Timeline events */}
      <div className="relative space-y-0">
        {/* Vertical line */}
        <div className="absolute left-[72px] top-0 bottom-0 w-px bg-gray-200" />

        {sorted.map((event, idx) => (
          <div key={idx} className="relative flex gap-4 py-4">
            {/* Date column */}
            <div className="w-[60px] shrink-0 text-right">
              {event.date ? (
                <span className="inline-block rounded bg-blue-100 px-2 py-1 text-xs font-semibold text-blue-800">
                  {formatDate(event.date)}
                </span>
              ) : (
                <span className="inline-block rounded bg-gray-100 px-2 py-1 text-xs text-gray-500">
                  Unknown
                </span>
              )}
            </div>

            {/* Dot on the line */}
            <div className="relative z-10 mt-2 h-3 w-3 shrink-0 rounded-full border-2 border-blue-500 bg-white" />

            {/* Event card */}
            <Card className="flex-1 p-4">
              <p className="text-sm leading-relaxed text-gray-800">{event.event}</p>

              {/* Fact IDs */}
              {event.fact_ids?.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {event.fact_ids.map((fid) => (
                    <span key={fid} className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                      {fid}
                    </span>
                  ))}
                </div>
              )}

              {/* Uncertainty flags */}
              {event.uncertainty_flags?.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {event.uncertainty_flags.map((flag) => (
                    <span key={flag} className="rounded bg-orange-100 px-1.5 py-0.5 text-xs text-orange-700">
                      {flag}
                    </span>
                  ))}
                </div>
              )}

              {/* Citations */}
              <div className="mt-2 flex flex-wrap gap-2">
                {event.citations?.map((cit, i) => (
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
          </div>
        ))}
      </div>

      {/* Gaps section */}
      {gaps && gaps.length > 0 && (
        <div className="mt-8">
          <h3 className="mb-3 text-sm font-semibold text-gray-700">Identified Temporal Gaps</h3>
          <Card className="p-4">
            <ul className="space-y-2">
              {gaps.map((gap, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-yellow-400" />
                  {gap}
                </li>
              ))}
            </ul>
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

import { useState, useCallback } from 'react'
import { motion } from 'motion/react'
import { useLatestArtifact } from '../../hooks/useArtifacts'
import { usePipelineStatus } from '../../hooks/useJobs'
import CitationPanel from '../facts/CitationPanel'
import Card from '../ui/Card'
import Badge from '../ui/Badge'
import Button from '../ui/Button'
import Skeleton from '../ui/Skeleton'
import EmptyState from '../ui/EmptyState'
import LoadingSpinner from '../ui/LoadingSpinner'

const SECTION_COLORS = {
  'Parties Overview': 'brand',
  'Statement of Facts': 'green',
  'Issues Presented': 'purple',
  'Argument Outline (Draft)': 'orange',
  'Open Questions': 'yellow',
}

export default function BriefPacketTab({ projectId }) {
  const [selectedCitation, setSelectedCitation] = useState(null)
  const [exporting, setExporting] = useState(false)

  const { data: pipeline } = usePipelineStatus(projectId)
  const composeStep = pipeline?.steps?.find((s) => s.type === 'draft_compose')
  const isRunning = composeStep?.status === 'running' || composeStep?.status === 'pending'

  const { data: artifact, isLoading, error } = useLatestArtifact(projectId, 'brief_v1')
  const briefPacket = artifact?.contentJson?.brief_packet

  const handleExportPdf = useCallback(async () => {
    if (!briefPacket) return
    setExporting(true)
    try {
      const { jsPDF } = await import('jspdf')
      const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' })
      const pageW = doc.internal.pageSize.getWidth()
      const margin = 18
      const contentW = pageW - margin * 2
      let y = margin

      const checkPage = (needed = 12) => {
        if (y + needed > doc.internal.pageSize.getHeight() - margin) {
          doc.addPage()
          y = margin
        }
      }

      // Title
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(18)
      doc.text('Draft Brief Packet', margin, y)
      y += 9

      // Disclaimer
      doc.setFont('helvetica', 'italic')
      doc.setFontSize(9)
      doc.setTextColor(180, 100, 0)
      doc.text('DRAFT \u2014 Human Review Required', margin, y)
      doc.setTextColor(0, 0, 0)
      y += 8

      // Divider
      doc.setDrawColor(200, 200, 200)
      doc.line(margin, y, pageW - margin, y)
      y += 8

      for (const section of briefPacket.sections) {
        checkPage(20)

        // Section title
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(13)
        doc.text(section.title, margin, y)
        y += 7

        for (const item of section.content) {
          const prefix = item.type === 'bullet' ? '\u2022  ' : ''
          const text = prefix + item.text

          doc.setFont('helvetica', 'normal')
          doc.setFontSize(10)
          const lines = doc.splitTextToSize(text, contentW)
          const blockH = lines.length * 4.5

          checkPage(blockH + 4)
          doc.text(lines, margin, y)
          y += blockH

          // Citation refs
          if (item.citations?.length) {
            const citeStr = item.citations
              .map((c) => `[${c.filename || 'Doc'} p.${c.page_number}]`)
              .join('  ')
            doc.setFontSize(7.5)
            doc.setTextColor(100, 100, 140)
            const citeLines = doc.splitTextToSize(citeStr, contentW)
            checkPage(citeLines.length * 3.5)
            doc.text(citeLines, margin + 4, y)
            y += citeLines.length * 3.5
            doc.setTextColor(0, 0, 0)
          }

          y += 2
        }

        y += 5
      }

      // Footer on last page
      const pageCount = doc.internal.getNumberOfPages()
      doc.setFontSize(7)
      doc.setTextColor(160, 160, 160)
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        const ph = doc.internal.pageSize.getHeight()
        doc.text('DRAFT \u2014 Human Review Required', margin, ph - 8)
        doc.text(`Page ${i} of ${pageCount}`, pageW - margin - 20, ph - 8)
      }

      doc.save('brief-packet-draft.pdf')
    } catch (err) {
      console.error('PDF export failed:', err)
    } finally {
      setExporting(false)
    }
  }, [briefPacket])

  if (isRunning) {
    return (
      <Card className="py-12 text-center">
        <LoadingSpinner className="mx-auto mb-3" />
        <p className="text-gray-500">Composing draft brief packet...</p>
      </Card>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <Card key={i} padding="md">
            <Skeleton className="mb-3 h-5 w-48" />
            <Skeleton lines={4} />
          </Card>
        ))}
      </div>
    )
  }

  if (error) {
    if (error.response?.status === 404) {
      return (
        <EmptyState
          icon={<svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18V7.875c0-.621.504-1.125 1.125-1.125H7.5" /></svg>}
          title="No brief packet yet"
          description="Run the analysis pipeline to generate the draft brief."
        />
      )
    }
    return <p className="text-danger">Failed to load brief packet</p>
  }

  if (!briefPacket || !briefPacket.sections?.length) {
    return (
      <EmptyState
        icon={<svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18V7.875c0-.621.504-1.125 1.125-1.125H7.5" /></svg>}
        title="No brief packet yet"
        description="Run the analysis pipeline to generate the draft brief."
      />
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800">
          Brief Packet ({briefPacket.sections.length} sections)
        </h2>
        <div className="flex items-center gap-3">
          {artifact?.version && <Badge color="gray">v{artifact.version}</Badge>}
          <Button onClick={handleExportPdf} loading={exporting} variant="secondary">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            Export PDF
          </Button>
        </div>
      </div>

      {/* DRAFT disclaimer */}
      <div className="mb-4 flex items-center gap-2 rounded-lg bg-amber-50 px-4 py-2.5 text-xs text-amber-700">
        <svg className="h-3.5 w-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
        </svg>
        DRAFT — Human Review Required. This brief packet was automatically generated and must be verified by a qualified reviewer.
      </div>

      <div className="space-y-4">
          {briefPacket.sections.map((section, si) => (
            <motion.div
              key={si}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: si * 0.06, duration: 0.25 }}
            >
              <Card padding="md" className={`border-l-4 ${borderColorClass(section.title)}`}>
                {/* Section header */}
                <div className="mb-3 flex items-center gap-2">
                  <Badge color={SECTION_COLORS[section.title] || 'gray'}>
                    {si + 1}
                  </Badge>
                  <h3 className="text-sm font-semibold text-gray-900">{section.title}</h3>
                </div>

                {/* Content items */}
                <div className={section.content[0]?.type === 'bullet' ? 'space-y-2' : 'space-y-3'}>
                  {section.content.map((item, ci) => (
                    <div key={ci}>
                      {item.type === 'bullet' ? (
                        <div className="flex items-start gap-2 ml-2">
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gray-400" />
                          <div className="flex-1">
                            <p className="text-sm leading-relaxed text-gray-700">{item.text}</p>
                            <div className="mt-1 flex flex-wrap gap-1">
                              {item.citations?.map((cit, ki) => (
                                <button
                                  key={ki}
                                  onClick={() => setSelectedCitation(cit)}
                                  className="inline-flex items-center rounded-md bg-surface-100 px-2 py-0.5 text-xs font-medium text-brand-700 transition-colors hover:bg-brand-50 print:text-gray-600 print:bg-gray-100"
                                  title={cit.quote?.slice(0, 100)}
                                >
                                  [{cit.filename || 'Doc'} p.{cit.page_number}]
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="ml-2">
                          <p className="text-sm leading-relaxed text-gray-700">{item.text}</p>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {item.citations?.map((cit, ki) => (
                              <button
                                key={ki}
                                onClick={() => setSelectedCitation(cit)}
                                className="inline-flex items-center rounded-md bg-surface-100 px-2 py-0.5 text-xs font-medium text-brand-700 transition-colors hover:bg-brand-50 print:text-gray-600 print:bg-gray-100"
                                title={cit.quote?.slice(0, 100)}
                              >
                                [{cit.filename || 'Doc'} p.{cit.page_number}]
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

      {/* Citation panel */}
      {selectedCitation && (
        <CitationPanel
          citation={selectedCitation}
          onClose={() => setSelectedCitation(null)}
        />
      )}
    </div>
  )
}

function borderColorClass(title) {
  const map = {
    'Parties Overview': 'border-l-brand-400',
    'Statement of Facts': 'border-l-green-400',
    'Issues Presented': 'border-l-purple-400',
    'Argument Outline (Draft)': 'border-l-orange-400',
    'Open Questions': 'border-l-yellow-400',
  }
  return map[title] || 'border-l-gray-300'
}

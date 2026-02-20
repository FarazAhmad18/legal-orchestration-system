import { useEffect } from 'react'

export default function CitationPanel({ citation, onClose }) {
  useEffect(() => {
    function handleKey(e) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  if (!citation) return null

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />

      {/* Panel */}
      <div className="relative z-10 flex w-full max-w-lg flex-col bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Source Citation</h3>
            <p className="mt-0.5 text-xs text-gray-500">
              {citation.filename || 'Document'} — Page {citation.page_number}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {/* Quote */}
          <div className="mb-4">
            <h4 className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500">
              Quoted Text
            </h4>
            <blockquote className="rounded-lg border-l-4 border-blue-500 bg-blue-50 px-4 py-3 text-sm leading-relaxed text-gray-800">
              {citation.quote}
            </blockquote>
          </div>

          {/* Context (chunk text) */}
          {citation.chunk_text && (
            <div>
              <h4 className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500">
                Surrounding Context
              </h4>
              <p className="rounded-lg bg-gray-50 px-4 py-3 text-sm leading-relaxed text-gray-700 whitespace-pre-wrap">
                {citation.chunk_text}
              </p>
            </div>
          )}

          {/* Metadata */}
          <div className="mt-4 rounded-lg bg-gray-50 px-4 py-3">
            <h4 className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500">
              Reference Details
            </h4>
            <dl className="space-y-1 text-xs text-gray-600">
              <div className="flex justify-between">
                <dt className="font-medium">Document ID</dt>
                <dd className="font-mono">{citation.document_id?.slice(0, 8)}...</dd>
              </div>
              <div className="flex justify-between">
                <dt className="font-medium">Page</dt>
                <dd>{citation.page_number}</dd>
              </div>
              {citation.chunk_id && (
                <div className="flex justify-between">
                  <dt className="font-medium">Chunk ID</dt>
                  <dd className="font-mono">{citation.chunk_id.slice(0, 8)}...</dd>
                </div>
              )}
            </dl>
          </div>
        </div>
      </div>
    </div>
  )
}

import { useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'

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
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex justify-end">
        {/* Backdrop */}
        <motion.div
          className="absolute inset-0 bg-black/20 backdrop-blur-[2px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        />

        {/* Panel */}
        <motion.div
          className="relative z-10 flex w-full max-w-lg flex-col rounded-l-2xl bg-surface-0 shadow-xl"
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', stiffness: 400, damping: 35 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-surface-200 px-6 py-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Source Citation</h3>
              <p className="mt-0.5 text-xs text-gray-500">
                {citation.filename || 'Document'} — Page {citation.page_number}
              </p>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-surface-100 hover:text-gray-600"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 py-5">
            {/* Quote */}
            <div className="mb-5">
              <h4 className="mb-2 text-xs font-medium uppercase tracking-wider text-gray-400">
                Quoted Text
              </h4>
              <blockquote className="rounded-lg border-l-4 border-brand-500 bg-brand-50 px-4 py-3 text-sm leading-relaxed text-gray-800">
                {citation.quote}
              </blockquote>
            </div>

            {/* Context */}
            {citation.chunk_text && (
              <div className="mb-5">
                <h4 className="mb-2 text-xs font-medium uppercase tracking-wider text-gray-400">
                  Surrounding Context
                </h4>
                <p className="rounded-lg bg-surface-50 px-4 py-3 text-sm leading-relaxed text-gray-700 whitespace-pre-wrap">
                  {citation.chunk_text}
                </p>
              </div>
            )}

            {/* Metadata */}
            <div className="rounded-lg bg-surface-50 px-4 py-3">
              <h4 className="mb-2 text-xs font-medium uppercase tracking-wider text-gray-400">
                Reference Details
              </h4>
              <dl className="space-y-2 text-xs text-gray-600">
                <div className="flex justify-between">
                  <dt className="font-medium">Document ID</dt>
                  <dd className="font-mono text-gray-500">{citation.document_id?.slice(0, 8)}...</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="font-medium">Page</dt>
                  <dd>{citation.page_number}</dd>
                </div>
                {citation.chunk_id && (
                  <div className="flex justify-between">
                    <dt className="font-medium">Chunk ID</dt>
                    <dd className="font-mono text-gray-500">{citation.chunk_id.slice(0, 8)}...</dd>
                  </div>
                )}
              </dl>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

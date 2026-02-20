import { useState, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import { useProject } from '../hooks/useProjects'
import { useDocumentList, useUploadDocument, useDeleteDocument } from '../hooks/useDocuments'
import { useChunkStats, useGenerateChunks, useSearchChunks } from '../hooks/useChunks'
import PipelineStatus from '../components/pipeline/PipelineStatus'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import Skeleton from '../components/ui/Skeleton'
import EmptyState from '../components/ui/EmptyState'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import FactsTab from '../components/facts/FactsTab'
import TimelineTab from '../components/timeline/TimelineTab'
import IssuesTab from '../components/issues/IssuesTab'
import BriefPacketTab from '../components/brief/BriefPacketTab'
import toast from 'react-hot-toast'

const TABS = [
  { id: 'Documents', label: 'Documents', icon: <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg> },
  { id: 'Facts', label: 'Facts', icon: <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z" /><path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6z" /></svg> },
  { id: 'Timeline', label: 'Timeline', icon: <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
  { id: 'Issues', label: 'Issues', icon: <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg> },
  { id: 'Brief Packet', label: 'Brief Packet', icon: <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18V7.875c0-.621.504-1.125 1.125-1.125H7.5" /></svg> },
  { id: 'Sources', label: 'Sources', icon: <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg> },
]

const FILE_ICONS = {
  'application/pdf': <svg className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m.75 12l3 3m0 0l3-3m-3 3v-6m-1.5-9H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>,
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': <svg className="h-5 w-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>,
  'text/plain': <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>,
}

const STATUS_BADGE = {
  uploaded: 'yellow',
  parsing: 'brand',
  parsed: 'green',
  error: 'red',
}

export default function ProjectDetailPage() {
  const { id } = useParams()
  const [activeTab, setActiveTab] = useState('Documents')
  const fileInputRef = useRef(null)

  const { data: project, isLoading: projectLoading, error: projectError } = useProject(id)
  const { data: documents, isLoading: docsLoading } = useDocumentList(id)
  const uploadMutation = useUploadDocument(id)
  const deleteMutation = useDeleteDocument(id)

  async function handleFileChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      await uploadMutation.mutateAsync(file)
      toast.success(`"${file.name}" uploaded and parsed`)
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Upload failed')
    }
    e.target.value = ''
  }

  function handleDelete(doc) {
    if (!confirm(`Delete "${doc.filename}"?`)) return
    deleteMutation.mutate(doc.id, {
      onSuccess: () => toast.success('Document deleted'),
      onError: (err) => toast.error(err.response?.data?.error?.message || 'Delete failed'),
    })
  }

  if (projectLoading) return <LoadingSpinner className="mt-12" />
  if (projectError) return <p className="text-danger">Failed to load project</p>
  if (!project) return <p className="text-gray-500">Project not found</p>

  return (
    <div>
      {/* Project header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
        <p className="mt-1 text-sm text-gray-500">{project.objective}</p>
      </div>

      {/* Pipeline Status */}
      <PipelineStatus projectId={id} />

      {/* Animated tab bar */}
      <div className="mb-6 border-b border-surface-200">
        <nav className="-mb-px flex gap-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex items-center gap-2 px-4 pb-3 pt-1 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-brand-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.icon}
              {tab.label}
              {activeTab === tab.id && (
                <motion.div
                  layoutId="tab-underline"
                  className="absolute inset-x-0 bottom-0 h-0.5 bg-brand-600 rounded-full"
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          {activeTab === 'Documents' ? (
            <DocumentsTab
              documents={documents}
              docsLoading={docsLoading}
              fileInputRef={fileInputRef}
              handleFileChange={handleFileChange}
              handleDelete={handleDelete}
              uploadPending={uploadMutation.isPending}
            />
          ) : activeTab === 'Facts' ? (
            <FactsTab projectId={id} />
          ) : activeTab === 'Timeline' ? (
            <TimelineTab projectId={id} />
          ) : activeTab === 'Issues' ? (
            <IssuesTab projectId={id} />
          ) : activeTab === 'Brief Packet' ? (
            <BriefPacketTab projectId={id} />
          ) : activeTab === 'Sources' ? (
            <SourcesTab projectId={id} />
          ) : (
            <Card className="py-12 text-center">
              <p className="text-gray-400">{activeTab} will be available in a future update.</p>
            </Card>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

function DocumentsTab({ documents, docsLoading, fileInputRef, handleFileChange, handleDelete, uploadPending }) {
  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800">Documents</h2>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,.txt"
            className="hidden"
            onChange={handleFileChange}
          />
          <Button onClick={() => fileInputRef.current?.click()} loading={uploadPending}>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
            </svg>
            Upload Document
          </Button>
        </div>
      </div>

      {docsLoading ? (
        <Card padding="lg">
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <Skeleton lines={2} className="flex-1" />
              </div>
            ))}
          </div>
        </Card>
      ) : !documents || documents.length === 0 ? (
        <EmptyState
          icon={
            <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
          }
          title="No documents yet"
          description="Upload PDF, DOCX, or TXT files to get started."
          actionLabel="Upload Document"
          onAction={() => fileInputRef.current?.click()}
        />
      ) : (
        <Card padding="none" className="overflow-hidden">
          <table className="min-w-full divide-y divide-surface-200">
            <thead className="bg-surface-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">File</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Pages</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Uploaded</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-200">
              {documents.map((doc) => (
                <tr key={doc.id} className="transition-colors hover:bg-surface-50">
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="flex items-center gap-3">
                      {FILE_ICONS[doc.mime] || FILE_ICONS['text/plain']}
                      <div>
                        <p className="text-sm font-medium text-gray-900">{doc.filename}</p>
                        <p className="text-xs text-gray-400">{mimeToLabel(doc.mime)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <Badge color={STATUS_BADGE[doc.status] || 'gray'} dot>{doc.status}</Badge>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {doc._count?.pages ?? '—'}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {new Date(doc.createdAt).toLocaleDateString()}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right">
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(doc)}>
                      <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                      </svg>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  )
}

function SourcesTab({ projectId }) {
  const [searchQuery, setSearchQuery] = useState('')
  const { data: stats, isLoading: statsLoading } = useChunkStats(projectId)
  const generateMutation = useGenerateChunks(projectId)
  const searchMutation = useSearchChunks(projectId)

  async function handleGenerate() {
    try {
      const result = await generateMutation.mutateAsync()
      toast.success(`Chunked ${result.documentsProcessed} documents (${result.totalChunks} chunks)`)
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Chunking failed')
    }
  }

  async function handleSearch(e) {
    e.preventDefault()
    if (!searchQuery.trim()) return
    try {
      await searchMutation.mutateAsync({ query: searchQuery.trim(), topK: 10 })
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Search failed')
    }
  }

  return (
    <div>
      {/* Stats + generate */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3 text-sm text-gray-600">
          {statsLoading ? (
            <Skeleton className="h-4 w-40" />
          ) : stats && stats.totalChunks > 0 ? (
            <div className="flex items-center gap-2">
              <Badge color="brand">{stats.totalChunks} chunks</Badge>
              <Badge color="green">{stats.documentsCount} documents</Badge>
              {stats.totalEmbedded < stats.totalChunks && (
                <Badge color="yellow">{stats.totalEmbedded} embedded</Badge>
              )}
            </div>
          ) : (
            <span>No chunks yet. Run chunking to index your documents.</span>
          )}
        </div>
        <Button onClick={handleGenerate} loading={generateMutation.isPending}>
          {generateMutation.isPending ? 'Chunking...' : 'Run Chunking'}
        </Button>
      </div>

      {/* Per-document stats */}
      {stats?.documents?.length > 0 && (
        <Card padding="none" className="mb-6 overflow-hidden">
          <table className="min-w-full divide-y divide-surface-200">
            <thead className="bg-surface-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Document</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Chunks</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Embedded</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-200">
              {stats.documents.map((doc) => (
                <tr key={doc.documentId} className="hover:bg-surface-50">
                  <td className="whitespace-nowrap px-6 py-3 text-sm font-medium text-gray-900">{doc.filename}</td>
                  <td className="whitespace-nowrap px-6 py-3 text-sm text-gray-500">{doc.chunkCount}</td>
                  <td className="whitespace-nowrap px-6 py-3 text-sm text-gray-500">{doc.embeddedCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {/* Search */}
      <form onSubmit={handleSearch} className="mb-6 flex gap-3">
        <div className="relative flex-1">
          <svg className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search within project documents..."
            className="block w-full rounded-lg border border-surface-200 bg-surface-50 py-2.5 pl-10 pr-4 text-sm transition-colors focus:bg-surface-0 focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:ring-offset-1 placeholder:text-gray-400"
          />
        </div>
        <Button type="submit" loading={searchMutation.isPending}>Search</Button>
      </form>

      {/* Results */}
      {searchMutation.data && searchMutation.data.length === 0 && (
        <EmptyState
          icon={
            <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
          }
          title="No results found"
          description="Try a different query."
        />
      )}

      {searchMutation.data?.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-gray-700">
            {searchMutation.data.length} results
          </h3>
          {searchMutation.data.map((result) => (
            <Card key={result.id} padding="sm">
              <div className="mb-2 flex items-center justify-between">
                <Badge color="brand">[{result.filename} p.{result.pageNum}]</Badge>
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span>Chunk #{result.chunkIndex}</span>
                  <div className="flex items-center gap-1.5">
                    <div className="h-1.5 w-16 overflow-hidden rounded-full bg-surface-200">
                      <div
                        className={`h-full rounded-full ${
                          result.similarity >= 0.5 ? 'bg-success' : result.similarity >= 0.3 ? 'bg-warning' : 'bg-gray-400'
                        }`}
                        style={{ width: `${Math.min(result.similarity * 100, 100)}%` }}
                      />
                    </div>
                    <Badge color={result.similarity >= 0.5 ? 'green' : result.similarity >= 0.3 ? 'yellow' : 'gray'}>
                      {(result.similarity * 100).toFixed(1)}%
                    </Badge>
                  </div>
                </div>
              </div>
              <p className="text-sm leading-relaxed text-gray-700">
                {result.text.length > 500 ? result.text.slice(0, 500) + '...' : result.text}
              </p>
              {result.metaJson && (
                <p className="mt-2 text-xs text-gray-400">
                  Pages {result.metaJson.pageStart}–{result.metaJson.pageEnd} | Chars {result.charStart}–{result.charEnd}
                </p>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

function mimeToLabel(mime) {
  const map = {
    'application/pdf': 'PDF',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'DOCX',
    'text/plain': 'TXT',
  }
  return map[mime] || mime || '—'
}

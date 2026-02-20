import { useState, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useProject } from '../hooks/useProjects'
import { useDocumentList, useUploadDocument, useDeleteDocument } from '../hooks/useDocuments'
import { useChunkStats, useGenerateChunks, useSearchChunks } from '../hooks/useChunks'
import PipelineStatus from '../components/pipeline/PipelineStatus'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import FactsTab from '../components/facts/FactsTab'
import toast from 'react-hot-toast'

const TABS = ['Documents', 'Facts', 'Timeline', 'Issues', 'Brief Packet', 'Sources']

const STATUS_STYLES = {
  uploaded: 'bg-yellow-100 text-yellow-800',
  parsing: 'bg-blue-100 text-blue-800',
  parsed: 'bg-green-100 text-green-800',
  error: 'bg-red-100 text-red-800',
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
    // Reset input so the same file can be re-uploaded
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
  if (projectError) return <p className="text-red-600">Failed to load project</p>
  if (!project) return <p className="text-gray-500">Project not found</p>

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <Link to="/dashboard" className="text-sm text-blue-600 hover:underline">
          &larr; Back to Projects
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-gray-900">{project.name}</h1>
        <p className="mt-1 text-sm text-gray-600">{project.objective}</p>
      </div>

      {/* Pipeline Status */}
      <PipelineStatus projectId={id} />

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="-mb-px flex space-x-6">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`whitespace-nowrap border-b-2 pb-3 text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
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
      ) : activeTab === 'Sources' ? (
        <SourcesTab projectId={id} />
      ) : (
        <Card className="py-12 text-center">
          <p className="text-gray-400">{activeTab} will be available in a future update.</p>
        </Card>
      )}
    </div>
  )
}

function DocumentsTab({ documents, docsLoading, fileInputRef, handleFileChange, handleDelete, uploadPending }) {
  return (
    <div>
      {/* Upload button */}
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
          <Button
            onClick={() => fileInputRef.current?.click()}
            loading={uploadPending}
          >
            Upload Document
          </Button>
        </div>
      </div>

      {docsLoading ? (
        <LoadingSpinner className="mt-8" />
      ) : !documents || documents.length === 0 ? (
        <Card className="py-12 text-center">
          <p className="text-gray-500">No documents yet. Upload PDF, DOCX, or TXT files to get started.</p>
        </Card>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Filename</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Pages</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Uploaded</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {documents.map((doc) => (
                <tr key={doc.id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                    {doc.filename}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {mimeToLabel(doc.mime)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_STYLES[doc.status] || ''}`}>
                      {doc.status}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {doc._count?.pages ?? '—'}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {new Date(doc.createdAt).toLocaleDateString()}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right">
                    <Button variant="danger" onClick={() => handleDelete(doc)} className="text-xs px-2 py-1">
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
      {/* Stats bar + generate button */}
      <div className="mb-6 flex items-center justify-between">
        <div className="text-sm text-gray-600">
          {statsLoading ? (
            'Loading stats...'
          ) : stats && stats.totalChunks > 0 ? (
            <span>
              <span className="font-semibold text-gray-900">{stats.totalChunks}</span> chunks across{' '}
              <span className="font-semibold text-gray-900">{stats.documentsCount}</span> documents
              {stats.totalEmbedded < stats.totalChunks && (
                <span className="ml-2 text-yellow-600">
                  ({stats.totalEmbedded} embedded)
                </span>
              )}
            </span>
          ) : (
            'No chunks yet. Run chunking to index your documents.'
          )}
        </div>
        <Button
          onClick={handleGenerate}
          loading={generateMutation.isPending}
        >
          {generateMutation.isPending ? 'Chunking...' : 'Run Chunking'}
        </Button>
      </div>

      {/* Per-document stats */}
      {stats && stats.documents && stats.documents.length > 0 && (
        <div className="mb-6 overflow-x-auto rounded-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Document</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Chunks</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">Embedded</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {stats.documents.map((doc) => (
                <tr key={doc.documentId} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-6 py-3 text-sm font-medium text-gray-900">{doc.filename}</td>
                  <td className="whitespace-nowrap px-6 py-3 text-sm text-gray-500">{doc.chunkCount}</td>
                  <td className="whitespace-nowrap px-6 py-3 text-sm text-gray-500">{doc.embeddedCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Search form */}
      <form onSubmit={handleSearch} className="mb-6 flex gap-3">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search within project documents..."
          className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <Button type="submit" loading={searchMutation.isPending}>
          Search
        </Button>
      </form>

      {/* Search results */}
      {searchMutation.data && searchMutation.data.length === 0 && (
        <Card className="py-8 text-center">
          <p className="text-gray-500">No results found. Try a different query.</p>
        </Card>
      )}

      {searchMutation.data && searchMutation.data.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-gray-700">
            {searchMutation.data.length} results
          </h3>
          {searchMutation.data.map((result) => (
            <Card key={result.id} className="p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="rounded bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-800">
                  [{result.filename} p.{result.pageNum}]
                </span>
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span>Chunk #{result.chunkIndex}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 font-medium ${
                      result.similarity >= 0.5
                        ? 'bg-green-100 text-green-700'
                        : result.similarity >= 0.3
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {(result.similarity * 100).toFixed(1)}% match
                  </span>
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

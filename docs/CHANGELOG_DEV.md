# Changelog (Development)

## Chunk 1 — Repo + DB + Auth + RBAC + Project CRUD
- Scaffolded monorepo (api/ + web/)
- PostgreSQL schema: 7 tables with pgvector support
- JWT auth with bcrypt password hashing
- RBAC: operator, reviewer, admin roles
- Project CRUD (create, list, get by id)
- React SPA with login, register, dashboard, create project
- Tailwind CSS v4 styling

## Chunk 2 — Upload + Storage + Parsing
- Document upload endpoint (POST /api/projects/:projectId/documents)
- Multer middleware: disk storage, 25MB limit, PDF/DOCX/TXT MIME filtering
- PDF parsing via pdf-parse (page-level text extraction)
- DOCX parsing via mammoth (virtual page splitting ~3000 chars)
- TXT parsing with virtual page splitting at paragraph boundaries
- Document status workflow: uploaded → parsing → parsed (or error)
- Document CRUD: list, get by ID, delete (with disk file cleanup)
- document_pages table populated with page number + extracted text
- RBAC: project owner/admin access checks on all document endpoints
- React UI: upload button, document table (filename, type, status badge, page count, date)
- React Query hooks for documents (useDocumentList, useUploadDocument, useDeleteDocument)
- Delete confirmation dialog + toast notifications

## Chunk 3 — Chunking + Embeddings + Retrieval API
- Schema: embedding_vector column changed from vector(1536) to vector(384) to match MiniLM model
- HNSW index on embedding_vector for fast cosine similarity search
- Chunker utility: sliding window ~4000 chars with 500 char overlap, paragraph/sentence/word boundary breaks, page offset tracking
- Embedder utility: @xenova/transformers with Xenova/all-MiniLM-L6-v2 (384 dims, local, free)
- Singleton model loading pattern (downloads ~30MB on first call, cached after)
- Chunk repository: CRUD, bulk insert, raw SQL for vector updates + cosine distance search
- Chunk service: chunkAndEmbedDocument, chunkAndEmbedProject, searchProject, getProjectChunkStats
- RBAC on all chunk endpoints (project owner/admin only)
- API routes: POST /generate, POST /generate/:documentId, POST /search, GET /stats
- Zod validation for search input (query + topK)
- Frontend: chunks.api.js, useChunks hooks (useChunkStats, useGenerateChunks, useSearchChunks)
- Sources tab UI: stats bar, per-document chunk table, search form, ranked result cards with citations
- Result cards show [filename p.N] citation, similarity percentage, chunk text (truncated), page range
- Vite proxy timeout increased to 5 minutes for chunking operations
- Re-chunking support: deletes old chunks before creating new ones

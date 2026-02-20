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

## Chunk 4 — Jobs + Worker Orchestration
- jobs table: id, project_id, type, status, payload_json, attempts, error, timestamps
- Worker loop: in-process setTimeout polling (3s idle, 0 delay when busy)
- Job claim: raw SQL `FOR UPDATE SKIP LOCKED` for atomic acquisition
- Pipeline chaining: fact_extract → timeline_build → issue_spot → draft_compose → validate
- Handler map: job type → async handler function
- Max 3 retry attempts per job before permanent failure
- Artifact versioning: auto-increment per (projectId, type)
- API routes: POST /run-analysis, GET /pipeline-status, GET /jobs, GET /jobs/:jobId
- PipelineStatus component: horizontal step badges with color-coded status + auto-polling
- "Run Analysis" button triggers full pipeline chain

## Chunk 5 — A1 FactExtractor + Citations UI
- FactExtractor prompt template: system prompt + user prompt builder
- Zod schema for facts_v1: facts[] with id, fact, citations[], confidence, uncertainty_flags
- Service: load objective → retrieve chunks → call LLM (Groq) → validate → enrich citations → persist
- FactsTab: sortable facts list with confidence scores, uncertainty flag badges
- Citation buttons: click opens CitationPanel slide-in with quote, context, metadata
- DRAFT disclaimer banner on all analysis tabs

## Chunk 6 — A2 TimelineBuilder + A3 IssueSpotter
- TimelineBuilder prompt + schema: timeline events with dates, fact_ids, citations, gaps
- IssueSpotter prompt + schema: issues with titles, descriptions, related_fact_ids, citations
- Both services follow same 9-step pattern: load artifacts → retrieve → LLM → validate → persist
- TimelineTab: vertical timeline with date badges, event cards, gap warnings
- IssuesTab: issue cards with related fact badges, uncertainty flags, citation buttons

## Chunk 7 — A4 DraftComposer + Brief Packet UI + PDF Export
- DraftComposer prompt: consumes all 3 upstream artifacts + retrieved chunks
- Zod schema for brief_v1: brief_packet with sections[], content[] (bullet/paragraph), citations[]
- Service: loads facts + timeline + issues → retrieves chunks → LLM → validate → persist
- BriefPacketTab: 5 color-coded section cards with citation buttons
- PDF export: jsPDF (programmatic generation, avoids Tailwind v4 oklch CSS issues)
- Required sections: Parties Overview, Statement of Facts, Issues Presented, Argument Outline, Open Questions

## Chunk 8 — V1 Validator + Validation Tab + Demo Seed
- ConsistencyValidator: non-AI, purely database-driven validation
  - Check 1: missing citations (items with empty citations array)
  - Check 2: invalid references (chunk_id, document_id, page_number verification)
  - Check 3: contradiction heuristic (same fact_id with conflicting dates in timeline)
  - Confidence score: 1 - (issues / totalItems), clamped [0,1]
- Zod schema for validation_v1: issues_found[] with type/path/message + confidence_score
- ValidationTab: confidence ring chart, issues grouped by type (color-coded), version history dropdown
- All 5 pipeline handlers are now real implementations (no stubs remaining)
- Demo seed: admin + demo operator users, sample project with 3 parsed documents (7 pages)
- Seed is idempotent (safe to re-run)

## UI Redesign (applied across chunks 5–8)
- Design system: brand/surface/danger/success/warning color tokens
- New components: Badge, Skeleton, EmptyState
- Animated tab bar with motion underline
- Staggered list animations with Framer Motion
- Consistent Card/Button/Input styling
- CitationPanel: slide-in panel with quote, surrounding context, reference metadata

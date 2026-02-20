# Architecture — Legal Intelligence MVP

## Current State: Complete (Chunks 1–8)

### Pipeline (Fully Implemented)
```
Upload → Parse → Chunk/Embed → Retrieve → A1 Facts → A2 Timeline → A3 Issues → A4 Brief → V1 Validate → Export PDF
```

### System Diagram
```
[React SPA] → [Express API] → [PostgreSQL (Supabase)]
     ↕               ↕               ↕
  React Query    JWT Auth + RBAC   All 7 tables + pgvector
                      ↕
                [Multer Upload] → [Disk Storage]
                      ↓
              [Parsers: PDF/DOCX/TXT]
                      ↓
              [document_pages table]
                      ↓
              [Chunker: sliding window ~4000 chars, 500 overlap]
                      ↓
              [Embedder: Xenova/all-MiniLM-L6-v2 (384 dims)]
                      ↓
              [chunks table + pgvector HNSW index]
                      ↓
              [Retrieval: cosine similarity topK search]
                      ↓
              [Worker: DB-backed job queue with polling]
                      ↓
      ┌────────────────────────────────────────────┐
      │  A1 FactExtractor    → facts_v1 artifact   │
      │  A2 TimelineBuilder  → timeline_v1 artifact │
      │  A3 IssueSpotter     → issues_v1 artifact   │
      │  A4 DraftComposer    → brief_v1 artifact    │
      │  V1 Validator (non-AI) → validation_v1      │
      └────────────────────────────────────────────┘
                      ↓
              [Artifact versioning (auto-increment)]
                      ↓
              [React UI: tabs + citation panel + PDF export]
```

### Tech Stack
- **Frontend**: React + Vite, Tailwind CSS v4, React Query, React Router, Framer Motion
- **Backend**: Node.js + Express (ESM), MVC + Service Layer
- **Database**: PostgreSQL (Supabase) with pgvector extension
- **Auth**: bcryptjs + jsonwebtoken (self-managed JWT)
- **File Parsing**: pdf-parse (PDF), mammoth (DOCX), fs (TXT)
- **Upload**: multer v2 (disk storage, 25MB limit)
- **Embeddings**: @xenova/transformers (Xenova/all-MiniLM-L6-v2, 384 dims, local)
- **Vector Search**: pgvector cosine distance with HNSW index
- **LLM**: Groq (Llama 3.3 70B) — JSON mode, structured output
- **Validation**: Zod schemas for all artifacts
- **PDF Export**: jsPDF (client-side)

### API Structure (MVC + Service Layer)
```
routes/ → controllers/ → services/ → repositories/ → DB
                              ↓
                         validators/ (Zod)
                              ↓
                    utils/ (chunker, embedder, parsers, llm)
                              ↓
                    prompts/ (factExtractor, timelineBuilder, issueSpotter, draftComposer)
                              ↓
                    workers/ (pipeline, handlers, worker loop)
```

### API Endpoints
```
Auth:
  POST   /api/auth/register
  POST   /api/auth/login
  GET    /api/auth/me

Projects:
  POST   /api/projects
  GET    /api/projects
  GET    /api/projects/:id

Documents:
  POST   /api/projects/:projectId/documents
  GET    /api/projects/:projectId/documents
  GET    /api/projects/:projectId/documents/:documentId
  DELETE /api/projects/:projectId/documents/:documentId

Chunks:
  POST   /api/projects/:projectId/chunks/generate
  POST   /api/projects/:projectId/chunks/generate/:documentId
  POST   /api/projects/:projectId/chunks/search
  GET    /api/projects/:projectId/chunks/stats

Jobs:
  POST   /api/projects/:projectId/jobs/run-analysis
  GET    /api/projects/:projectId/jobs/pipeline-status
  GET    /api/projects/:projectId/jobs
  GET    /api/projects/:projectId/jobs/:jobId

Artifacts:
  GET    /api/projects/:projectId/artifacts
  GET    /api/projects/:projectId/artifacts/summary
  GET    /api/projects/:projectId/artifacts/latest/:type
  GET    /api/projects/:projectId/artifacts/:artifactId
```

### Database Tables
- **users** — id, email, role, password_hash, created_at
- **projects** — id, name, objective, created_by, created_at
- **documents** — id, project_id, filename, storage_path, mime, status, created_at
- **document_pages** — id, document_id, page_num, text, meta_json
- **chunks** — id, document_id, page_num, chunk_index, text, embedding_vector (384), char_start, char_end, meta_json
- **jobs** — id, project_id, type, status, payload_json, attempts, error, created_at, updated_at
- **artifacts** — id, project_id, type, version, content_json, created_at, created_by_job_id

### Artifact Types
- `facts_v1` — extracted facts with citations
- `timeline_v1` — chronological events with citations
- `issues_v1` — identified issues with citations
- `brief_v1` — draft brief packet (5 sections) with citations
- `validation_v1` — consistency check results + confidence score

### RBAC Roles
- **operator** (default) — can create projects, upload docs, run analysis
- **reviewer** — read-only access to assigned projects
- **admin** — full access to all projects

### Worker Architecture
- In-process polling loop (setTimeout, 3s idle / 0 delay when busy)
- Job claim: `FOR UPDATE SKIP LOCKED` (atomic, no double-processing)
- Pipeline chaining: each step auto-queues the next on success
- Max 3 retry attempts per job before permanent failure
- Steps: fact_extract → timeline_build → issue_spot → draft_compose → validate

### Frontend Tabs
- **Documents** — upload, list, delete
- **Facts** — extracted facts with confidence scores, citation buttons
- **Timeline** — chronological events with date badges
- **Issues** — identified issues with related fact references
- **Brief Packet** — 5-section draft with PDF export
- **Validation** — confidence score, grouped issues, version history
- **Sources** — chunk stats, semantic search

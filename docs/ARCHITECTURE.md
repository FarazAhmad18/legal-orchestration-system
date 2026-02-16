# Architecture — Legal Intelligence MVP

## Current State: Chunk 3 (Chunking + Embeddings + Retrieval)

### Pipeline (Target)
```
Upload → Parse → Chunk/Embed → Retrieve → A1 Facts → A2 Timeline → A3 Issues → A4 Brief → V1 Validate → Export
```

### Implemented (Chunks 1–3)
```
[React SPA] → [Express API] → [PostgreSQL (Supabase)]
     ↕               ↕               ↕
  React Query    JWT Auth + RBAC   Documents + Pages + Chunks
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
              [Retrieval: cosine similarity search]
```

### Tech Stack
- **Frontend**: React + Vite, Tailwind CSS v4, React Query, React Router
- **Backend**: Node.js + Express, MVC + Service Layer
- **Database**: PostgreSQL (Supabase) with pgvector extension
- **Auth**: bcryptjs + jsonwebtoken (self-managed JWT)
- **File Parsing**: pdf-parse (PDF), mammoth (DOCX), fs (TXT)
- **Upload**: multer v2 (disk storage, 25MB limit)
- **Embeddings**: @xenova/transformers (Xenova/all-MiniLM-L6-v2, 384 dims, local)
- **Vector Search**: pgvector cosine distance with HNSW index
- **LLM**: Groq (Llama 3.3 70B) — configured, not yet used

### API Structure (MVC + Service Layer)
```
routes/ → controllers/ → services/ → repositories/ → DB
                              ↓
                         validators/ (Zod)
                              ↓
                    utils/ (chunker, embedder, parsers)
```

### API Endpoints
```
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me

POST   /api/projects
GET    /api/projects
GET    /api/projects/:id

POST   /api/projects/:projectId/documents
GET    /api/projects/:projectId/documents
GET    /api/projects/:projectId/documents/:documentId
DELETE /api/projects/:projectId/documents/:documentId

POST   /api/projects/:projectId/chunks/generate
POST   /api/projects/:projectId/chunks/generate/:documentId
POST   /api/projects/:projectId/chunks/search
GET    /api/projects/:projectId/chunks/stats
```

### Database Tables
- users, projects, documents, document_pages, chunks (with pgvector), jobs, artifacts

### RBAC Roles
- operator (default), reviewer, admin

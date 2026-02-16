# Verification Steps

## Chunk 1: Auth + Project CRUD

### Prerequisites
- PostgreSQL running (Supabase)
- `.env` configured with DATABASE_URL and JWT_SECRET
- `pgvector` extension enabled

### Steps
1. **Start backend**: `cd api && npm run dev` (port 3001)
2. **Start frontend**: `cd web && npm run dev` (port 5173)
3. **Register**: Navigate to `/register`, create a new user
4. **Login**: Navigate to `/login`, sign in with credentials
5. **Dashboard**: Should redirect to `/dashboard` after login
6. **Create Project**: Click "New Project", fill name + objective, submit
7. **View Project**: Project appears on dashboard card grid
8. **Logout**: Click logout, verify redirect to `/login`
9. **Auth guard**: Try navigating to `/dashboard` while logged out — should redirect to `/login`
10. **API 401**: `curl http://localhost:3001/api/projects` without token — should get 401
11. **API 403**: Create two users, try accessing User B's project as User A — should get 403

## Chunk 2: Upload + Storage + Parsing

### Prerequisites
- Chunk 1 verified (auth + projects working)
- Backend running (`cd api && npm run dev`, port 3001)
- Frontend running (`cd web && npm run dev`, port 5173)

### API Tests (curl)
1. **Upload TXT**: `curl -X POST http://localhost:3001/api/projects/:projectId/documents -H "Authorization: Bearer <token>" -F "file=@test.txt"` — should return status `parsed`, `_count.pages >= 1`
2. **Upload PDF**: Same as above with a PDF file — should return status `parsed` with page count matching PDF pages
3. **Upload DOCX**: Same with a .docx file — should return status `parsed` with virtual pages
4. **List documents**: `GET /api/projects/:projectId/documents` — should return array with uploaded docs, each with `_count.pages`
5. **Get single document**: `GET /api/projects/:projectId/documents/:documentId` — should return doc details
6. **Delete document**: `DELETE /api/projects/:projectId/documents/:documentId` — should return `{"message":"Document deleted"}`, file removed from disk
7. **Auth guard**: Upload without token — should get 401 `Missing or invalid token`
8. **RBAC**: Upload to another user's project — should get 403 `Access denied`
9. **Empty doc**: Upload an empty .txt file — should get 400 `Document contained no extractable text`

### UI Tests (browser)
10. **Navigate to project**: Click a project on the dashboard — should see Documents tab active
11. **Upload button**: Click "Upload Document", select a PDF/TXT/DOCX — should show toast on success, doc appears in table
12. **Document table**: Verify columns: Filename, Type (PDF/DOCX/TXT), Status (green "parsed" badge), Pages count, Upload date, Delete button
13. **Delete**: Click Delete on a document, confirm dialog — document removed from table
14. **Status badges**: uploaded=yellow, parsing=blue, parsed=green, error=red

## Chunk 3: Chunking + Embeddings + Retrieval API

### Prerequisites
- Chunk 2 verified (documents uploaded and parsed)
- Backend running (`cd api && npm run dev`, port 3001)
- Frontend running (`cd web && npm run dev`, port 5173)
- At least one project with parsed documents

### API Tests (curl)
1. **Generate chunks**: `POST /api/projects/:projectId/chunks/generate` with auth header — should return `{ documentsProcessed, totalChunks, details }`. First call downloads embedding model (~30MB).
2. **Generate for single doc**: `POST /api/projects/:projectId/chunks/generate/:documentId` — should return `{ documentId, chunksCreated }`
3. **Search**: `POST /api/projects/:projectId/chunks/search` body `{ "query": "contract terms", "topK": 5 }` — should return ranked results with distance/similarity scores
4. **Stats**: `GET /api/projects/:projectId/chunks/stats` — should return `{ totalChunks, totalEmbedded, documentsCount, documents: [...] }`
5. **Auth guard**: Any chunk endpoint without token — should get 401
6. **RBAC**: Chunk endpoints on another user's project — should get 403
7. **Re-chunk**: Run generate again — old chunks replaced, counts should be same or similar

### UI Tests (browser)
8. **Sources tab**: Click Sources tab — should show stats bar and "Run Chunking" button
9. **Run Chunking**: Click "Run Chunking" — button shows loading state, toast on success, stats update
10. **Per-doc stats**: Stats table shows each document with chunk count and embedded count
11. **Search**: Enter a query, click Search — results appear as cards with `[filename p.N]` citations
12. **Result cards**: Each card shows citation badge, similarity %, truncated text, page range
13. **Empty search**: Search with no chunks — should show "No results found"
14. **Re-chunk**: Click "Run Chunking" again — stats update, old chunks replaced

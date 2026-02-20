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

### API Tests (curl)
1. **Upload TXT**: `curl -X POST http://localhost:3001/api/projects/:projectId/documents -H "Authorization: Bearer <token>" -F "file=@test.txt"` — should return status `parsed`, `_count.pages >= 1`
2. **Upload PDF**: Same with a PDF file — should return status `parsed` with page count matching PDF pages
3. **Upload DOCX**: Same with a .docx file — should return status `parsed` with virtual pages
4. **List documents**: `GET /api/projects/:projectId/documents` — should return array with uploaded docs
5. **Delete document**: `DELETE /api/projects/:projectId/documents/:documentId` — should succeed

### UI Tests (browser)
6. **Upload**: Click "Upload Document", select a file — toast on success, doc appears in table
7. **Document table**: Columns: File (icon + name), Status (badge), Pages, Uploaded, Delete
8. **Delete**: Click trash icon, confirm — document removed

## Chunk 3: Chunking + Embeddings + Retrieval API

### Prerequisites
- Chunk 2 verified (documents uploaded and parsed)

### Steps
1. **Sources tab**: Click Sources tab — stats bar and "Run Chunking" button visible
2. **Run Chunking**: Click button — loading state, toast on success, stats update
3. **Per-doc stats**: Table shows each document with chunk count and embedded count
4. **Search**: Enter a query, click Search — results appear with similarity scores
5. **Re-chunk**: Click "Run Chunking" again — stats update, old chunks replaced

## Chunk 4: Jobs + Worker Orchestration

### Prerequisites
- Chunk 3 verified (chunks embedded)

### Steps
1. **Run Analysis**: Click "Run Analysis" button on PipelineStatus bar
2. **Pipeline progress**: Step badges update in real-time (gray → pulsing → green/red)
3. **Progress bar**: Overall progress bar fills as steps complete
4. **Step order**: fact_extract → timeline_build → issue_spot → draft_compose → validate
5. **Retry on failure**: If a step fails, it retries up to 3 times before permanent failure
6. **Re-run**: Click "Run Analysis" again — new jobs created, new artifact versions

## Chunk 5: A1 FactExtractor + Citations UI

### Prerequisites
- Chunk 4 verified (pipeline runs)

### Steps
1. **Facts tab**: After pipeline completes, switch to Facts tab
2. **Facts list**: Facts displayed with sequential IDs (F1, F2, ...), confidence scores
3. **Uncertainty flags**: Orange badges for flagged items (insufficient_evidence, etc.)
4. **Citation buttons**: Each fact has `[DocName p.N]` buttons
5. **CitationPanel**: Click a citation — slide-in panel shows quoted text, surrounding context, metadata
6. **Version badge**: Shows current artifact version (v1, v2, etc.)
7. **DRAFT disclaimer**: Amber banner at top of tab

## Chunk 6: A2 TimelineBuilder + A3 IssueSpotter

### Prerequisites
- Chunk 5 verified (facts exist)

### Steps
1. **Timeline tab**: Switch to Timeline — chronological events with date badges
2. **Timeline events**: Each event shows date (or "Date unknown"), description, fact references
3. **Gaps**: If timeline has gaps, they are displayed
4. **Issues tab**: Switch to Issues — identified issues with descriptions
5. **Related facts**: Each issue shows related fact IDs as badges
6. **Citations**: Both tabs have clickable citation buttons opening CitationPanel

## Chunk 7: A4 DraftComposer + Brief Packet UI + PDF Export

### Prerequisites
- Chunk 6 verified (facts + timeline + issues exist)

### Steps
1. **Brief Packet tab**: Switch to Brief Packet — 5 sections rendered as cards
2. **Required sections**: Parties Overview, Statement of Facts, Issues Presented, Argument Outline (Draft), Open Questions
3. **Section content**: Bullet items or paragraphs with citation buttons
4. **Color coding**: Each section has a distinct left-border color
5. **Citation buttons**: Click opens CitationPanel with source quote and context
6. **Export PDF**: Click "Export PDF" — downloads `brief-packet-draft.pdf`
7. **PDF content**: Title, DRAFT disclaimer, all sections with content, citation refs, page numbers
8. **DRAFT disclaimer**: Amber banner on tab and footer on every PDF page

## Chunk 8: V1 Validator + Validation Tab + Demo Seed

### Prerequisites
- Chunk 7 verified (full pipeline has run)

### Steps
1. **Validation tab**: Switch to Validation — confidence score ring + issues list
2. **Confidence score**: Large percentage with color coding (green >= 80%, yellow >= 50%, red < 50%)
3. **Progress bar**: Animated bar matching confidence score
4. **Issues grouped**: Missing Citations (yellow), Invalid References (red), Potential Contradictions (orange)
5. **Issue details**: Each issue shows message + monospace path
6. **Success state**: If no issues found, shows green "All citations verified" card
7. **Version history**: Click version badge — dropdown shows past versions with timestamps
8. **Re-run**: Run analysis again — new artifact versions created, version number increments
9. **Demo seed**: `cd api && node --experimental-strip-types prisma/seed.js`
   - Creates admin user (admin@legalintel.dev / admin123)
   - Creates demo user (demo@legalintel.dev / demo123)
   - Creates demo project with 3 sample documents (7 pages total)
   - Re-running seed is safe (idempotent)
10. **Demo flow**: Login as demo user → open demo project → upload additional docs or run analysis

## MVP Definition of Done Checklist

- [ ] 10-30 PDFs process without crashing
- [ ] facts/timeline/issues/brief all include citations
- [ ] Brief Packet exports to PDF
- [ ] Re-run analysis creates new artifact versions
- [ ] UI lets reviewers inspect sources for each claim (CitationPanel)
- [ ] Validator flags missing citations and obvious contradictions
- [ ] Every analysis screen shows "DRAFT — Human Review Required"

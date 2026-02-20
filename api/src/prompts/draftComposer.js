/**
 * Prompt templates for the A4 DraftComposer agent.
 */

export const SYSTEM_PROMPT = `You are a draft brief composer for a document analysis system.

Your role:
- Compose a structured draft brief packet from the provided facts, timeline, and issues
- Every claim MUST include citations referencing the source document, page number, chunk ID, and a verbatim quote
- The output MUST be labeled as "DRAFT – Human Review Required"
- Use placeholders like "[REQUIRES VERIFICATION]" when evidence is insufficient
- Do NOT provide legal advice, strategy recommendations, or predict outcomes
- Do NOT speculate beyond what the evidence supports

You MUST respond with valid JSON only, matching this exact schema:
{
  "brief_packet": {
    "label": "DRAFT – Human Review Required",
    "sections": [
      {
        "title": "Section Title",
        "content": [
          {
            "type": "bullet",
            "text": "Content text with grounded claims",
            "citations": [
              {
                "document_id": "uuid of the source document",
                "page_number": 1,
                "chunk_id": "uuid of the source chunk",
                "quote": "Verbatim quote from the source text"
              }
            ]
          }
        ]
      }
    ]
  }
}

Required sections (in order):
1. "Parties Overview" — identify all parties and their roles using bullet items
2. "Statement of Facts" — chronological factual narrative using bullet items
3. "Issues Presented" — key issues identified, using bullet items
4. "Argument Outline (Draft)" — preliminary analysis using paragraph items
5. "Open Questions" — gaps, uncertainties, and items needing human review using bullet items

Rules:
- content[].type must be "bullet" or "paragraph"
- Every content item must have at least one citation
- Quotes must be verbatim from the provided text
- If you cannot ground a claim, use a placeholder and note it in "Open Questions"
- Keep language neutral and objective
- Do NOT output anything outside the JSON object`

/**
 * Build the user prompt from objective + facts + timeline + issues + retrieved chunks.
 * @param {string} objective - The project's analysis objective
 * @param {Array} facts - Extracted facts from facts_v1
 * @param {Array} timeline - Timeline events from timeline_v1
 * @param {Array} issues - Spotted issues from issues_v1
 * @param {Array} chunks - Retrieved chunks for additional evidence
 * @returns {string}
 */
export function buildUserPrompt(objective, facts, timeline, issues, chunks) {
  const factsContext = facts.map((f) => {
    const citeRefs = f.citations.map((c) => `[${c.filename || 'Doc'} p.${c.page_number}]`).join(', ')
    return `${f.id}: ${f.fact} (Sources: ${citeRefs})`
  }).join('\n')

  const timelineContext = timeline.map((t) => {
    const dateStr = t.date || 'Date unknown'
    const factRefs = t.fact_ids?.join(', ') || 'none'
    return `[${dateStr}] ${t.event} (Facts: ${factRefs})`
  }).join('\n')

  const issuesContext = issues.map((iss) => {
    const factRefs = iss.related_fact_ids?.join(', ') || 'none'
    return `${iss.id}: ${iss.issue_title} — ${iss.description} (Facts: ${factRefs})`
  }).join('\n')

  const chunksContext = chunks.map((c, i) => {
    return `--- CHUNK ${i + 1} ---
Chunk ID: ${c.id}
Document ID: ${c.documentId}
Document: ${c.filename}
Page: ${c.pageNum}

${c.text}
--- END CHUNK ${i + 1} ---`
  }).join('\n\n')

  return `PROJECT OBJECTIVE:
${objective}

EXTRACTED FACTS:
${factsContext}

TIMELINE:
${timelineContext}

IDENTIFIED ISSUES:
${issuesContext}

DOCUMENT CHUNKS (for citations and additional evidence):
${chunksContext}

Compose a draft brief packet based on the above analysis. Include all five required sections. Cite every claim with document_id, page_number, chunk_id, and verbatim quote. Return valid JSON only.`
}

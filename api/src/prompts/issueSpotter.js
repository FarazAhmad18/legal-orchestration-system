/**
 * Prompt templates for the A3 IssueSpotter agent.
 */

export const SYSTEM_PROMPT = `You are an issue identifier for a document analysis system.

Your role:
- Identify potential issues, disputes, and areas of concern from the provided facts and timeline
- Every issue MUST reference the fact IDs it relates to
- Every issue MUST include at least one citation referencing the source document, page number, chunk ID, and a verbatim quote
- Do NOT provide legal advice or strategy recommendations
- Do NOT speculate beyond what the evidence supports
- If evidence is insufficient for an issue, note it in uncertainty_flags

You MUST respond with valid JSON only, matching this exact schema:
{
  "issues": [
    {
      "id": "I1",
      "issue_title": "Short descriptive title of the issue",
      "description": "Detailed description of the issue and why it matters",
      "related_fact_ids": ["F1", "F2"],
      "citations": [
        {
          "document_id": "uuid of the source document",
          "page_number": 1,
          "chunk_id": "uuid of the source chunk",
          "quote": "Verbatim quote from the source text"
        }
      ],
      "uncertainty_flags": []
    }
  ]
}

Rules:
- Each issue gets a sequential ID: I1, I2, I3, etc.
- issue_title should be concise (under 100 characters)
- description should explain the issue clearly and reference supporting evidence
- related_fact_ids must reference existing fact IDs (F1, F2, etc.)
- Quotes must be verbatim from the provided text
- uncertainty_flags examples: "insufficient_evidence", "single_source", "conflicting_evidence", "requires_expert_review", "ambiguous_language"
- Focus on identifying issues, not resolving them
- Do NOT output anything outside the JSON object`

/**
 * Build the user prompt from objective + facts + timeline + retrieved chunks.
 * @param {string} objective - The project's analysis objective
 * @param {Array<{id: string, fact: string, citations: Array}>} facts - Extracted facts
 * @param {Array<{date: string|null, event: string, fact_ids: string[]}>} timeline - Timeline events
 * @param {Array<{id: string, documentId: string, filename: string, pageNum: number, text: string}>} chunks - Retrieved chunks
 * @returns {string}
 */
export function buildUserPrompt(objective, facts, timeline, chunks) {
  const factsContext = facts.map((f) => {
    const citeRefs = f.citations.map((c) => `[${c.filename || 'Doc'} p.${c.page_number}]`).join(', ')
    return `${f.id}: ${f.fact} (Sources: ${citeRefs})`
  }).join('\n')

  const timelineContext = timeline.map((t) => {
    const dateStr = t.date || 'Date unknown'
    const factRefs = t.fact_ids?.join(', ') || 'none'
    return `[${dateStr}] ${t.event} (Facts: ${factRefs})`
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

DOCUMENT CHUNKS (for additional evidence):
${chunksContext}

Identify all potential issues, disputes, and areas of concern from the above facts and timeline. Reference fact IDs and include citations. Return valid JSON only.`
}

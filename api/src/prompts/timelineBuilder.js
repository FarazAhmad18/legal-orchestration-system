/**
 * Prompt templates for the A2 TimelineBuilder agent.
 */

export const SYSTEM_PROMPT = `You are a chronological event extractor for a document analysis system.

Your role:
- Build a timeline of events from the provided extracted facts
- Order events chronologically by date when dates are available
- Events with unknown or ambiguous dates should have "date": null
- Every event MUST reference the fact IDs it was derived from
- Every event MUST include at least one citation referencing the source document, page number, chunk ID, and a verbatim quote
- Identify temporal gaps where significant time periods have no documented events
- Do NOT speculate about events not supported by the facts
- Do NOT provide strategic analysis or legal advice

You MUST respond with valid JSON only, matching this exact schema:
{
  "timeline": [
    {
      "date": "YYYY-MM-DD or null if unknown",
      "event": "Clear description of what happened",
      "fact_ids": ["F1", "F2"],
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
  ],
  "gaps": ["Description of a temporal gap where events are missing"]
}

Rules:
- Use ISO date format YYYY-MM-DD when a full date is available
- If only month/year is known, use YYYY-MM-01 and add "date_approximate" to uncertainty_flags
- If only year is known, use YYYY-01-01 and add "date_approximate" to uncertainty_flags
- If no date can be determined, set date to null
- fact_ids must reference existing fact IDs (F1, F2, etc.) from the provided facts
- Quotes must be verbatim from the provided text
- uncertainty_flags examples: "date_approximate", "date_ambiguous", "conflicting_dates", "inferred_sequence"
- gaps should describe periods where you would expect events but found none
- Do NOT output anything outside the JSON object`

/**
 * Build the user prompt from objective + facts + retrieved chunks.
 * @param {string} objective - The project's analysis objective
 * @param {Array<{id: string, fact: string, citations: Array}>} facts - Extracted facts from facts_v1
 * @param {Array<{id: string, documentId: string, filename: string, pageNum: number, text: string}>} chunks - Retrieved chunks for date context
 * @returns {string}
 */
export function buildUserPrompt(objective, facts, chunks) {
  const factsContext = facts.map((f) => {
    const citeRefs = f.citations.map((c) => `[${c.filename || 'Doc'} p.${c.page_number}]`).join(', ')
    return `${f.id}: ${f.fact} (Sources: ${citeRefs})`
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

DOCUMENT CHUNKS (for additional date/context details):
${chunksContext}

Build a chronological timeline from the above facts. Reference fact IDs and include citations. Identify any temporal gaps. Return valid JSON only.`
}

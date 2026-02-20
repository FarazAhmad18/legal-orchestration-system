import { z } from 'zod'

const citationSchema = z.object({
  document_id: z.string(),
  page_number: z.number().int().min(0),
  chunk_id: z.string(),
  quote: z.string().min(1),
})

const factSchema = z.object({
  id: z.string().regex(/^F\d+$/, 'Fact ID must match F1, F2, etc.'),
  fact: z.string().min(1),
  citations: z.array(citationSchema).min(1, 'Each fact must have at least one citation'),
  confidence: z.number().min(0).max(1),
  uncertainty_flags: z.array(z.string()).default([]),
})

export const factsV1Schema = z.object({
  facts: z.array(factSchema).min(1, 'At least one fact must be extracted'),
})

/**
 * Parse and validate facts.v1 JSON.
 * @param {object} data - raw parsed JSON
 * @returns {{ success: true, data: object } | { success: false, error: string }}
 */
export function parseFactsV1(data) {
  const result = factsV1Schema.safeParse(data)
  if (result.success) {
    return { success: true, data: result.data }
  }
  const messages = result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')
  return { success: false, error: messages }
}

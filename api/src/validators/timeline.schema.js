import { z } from 'zod'

const citationSchema = z.object({
  document_id: z.string(),
  page_number: z.number().int().min(0),
  chunk_id: z.string(),
  quote: z.string().min(1),
})

const timelineEventSchema = z.object({
  date: z.string().nullable(),
  event: z.string().min(1),
  fact_ids: z.array(z.string()).default([]),
  citations: z.array(citationSchema).min(1, 'Each event must have at least one citation'),
  uncertainty_flags: z.array(z.string()).default([]),
})

export const timelineV1Schema = z.object({
  timeline: z.array(timelineEventSchema).min(1, 'At least one timeline event is required'),
  gaps: z.array(z.string()).default([]),
})

/**
 * Parse and validate timeline.v1 JSON.
 * @param {object} data - raw parsed JSON
 * @returns {{ success: true, data: object } | { success: false, error: string }}
 */
export function parseTimelineV1(data) {
  const result = timelineV1Schema.safeParse(data)
  if (result.success) {
    return { success: true, data: result.data }
  }
  const messages = result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')
  return { success: false, error: messages }
}

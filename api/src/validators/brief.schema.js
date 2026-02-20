import { z } from 'zod'

const citationSchema = z.object({
  document_id: z.string(),
  page_number: z.number().int().min(0),
  chunk_id: z.string(),
  quote: z.string().min(1),
})

const contentItemSchema = z.object({
  type: z.enum(['bullet', 'paragraph']),
  text: z.string().min(1),
  citations: z.array(citationSchema).min(1, 'Each content item must have at least one citation'),
})

const sectionSchema = z.object({
  title: z.string().min(1),
  content: z.array(contentItemSchema).min(1, 'Each section must have at least one content item'),
})

export const briefV1Schema = z.object({
  brief_packet: z.object({
    label: z.string(),
    sections: z.array(sectionSchema).min(1, 'Brief packet must have at least one section'),
  }),
})

/**
 * Parse and validate brief.v1 JSON.
 * @param {object} data - raw parsed JSON
 * @returns {{ success: true, data: object } | { success: false, error: string }}
 */
export function parseBriefV1(data) {
  const result = briefV1Schema.safeParse(data)
  if (result.success) {
    return { success: true, data: result.data }
  }
  const messages = result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')
  return { success: false, error: messages }
}

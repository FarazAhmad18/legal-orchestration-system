import { z } from 'zod'

const citationSchema = z.object({
  document_id: z.string(),
  page_number: z.number().int().min(0),
  chunk_id: z.string(),
  quote: z.string().min(1),
})

export const chatResponseSchema = z.object({
  answer: z.string().min(1),
  citations: z.array(citationSchema).default([]),
})

export function parseChatResponse(data) {
  const result = chatResponseSchema.safeParse(data)
  if (result.success) return { success: true, data: result.data }
  const messages = result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')
  return { success: false, error: messages }
}

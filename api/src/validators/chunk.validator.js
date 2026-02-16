import { z } from 'zod'

export const searchChunksSchema = z.object({
  query: z.string().min(1, 'Search query is required').max(2000),
  topK: z.number().int().min(1).max(50).optional().default(10),
})

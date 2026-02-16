import { z } from 'zod'

export const documentIdParamSchema = z.object({
  documentId: z.string().uuid('Invalid document ID'),
})

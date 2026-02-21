import { z } from 'zod'

export const sendMessageSchema = z.object({
  message: z.string().min(1, 'Message is required').max(4000, 'Message too long (max 4000 characters)'),
})

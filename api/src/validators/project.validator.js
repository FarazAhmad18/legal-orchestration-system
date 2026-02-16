import { z } from 'zod'

export const createProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(255),
  objective: z.string().min(1, 'Objective is required').max(5000),
})

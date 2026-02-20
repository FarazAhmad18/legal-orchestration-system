import { z } from 'zod'

const validationIssueSchema = z.object({
  type: z.enum(['missing_citation', 'invalid_reference', 'potential_contradiction']),
  path: z.string().min(1),
  message: z.string().min(1),
})

export const validationV1Schema = z.object({
  issues_found: z.array(validationIssueSchema),
  confidence_score: z.number().min(0).max(1),
})

/**
 * Parse and validate validation.v1 JSON.
 * @param {object} data - raw data
 * @returns {{ success: true, data: object } | { success: false, error: string }}
 */
export function parseValidationV1(data) {
  const result = validationV1Schema.safeParse(data)
  if (result.success) {
    return { success: true, data: result.data }
  }
  const messages = result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')
  return { success: false, error: messages }
}

import { z } from 'zod'

const citationSchema = z.object({
  document_id: z.string(),
  page_number: z.number().int().min(0),
  chunk_id: z.string(),
  quote: z.string().min(1),
})

const issueSchema = z.object({
  id: z.string().regex(/^I\d+$/, 'Issue ID must match I1, I2, etc.'),
  issue_title: z.string().min(1),
  description: z.string().min(1),
  related_fact_ids: z.array(z.string()).default([]),
  citations: z.array(citationSchema).min(1, 'Each issue must have at least one citation'),
  uncertainty_flags: z.array(z.string()).default([]),
})

export const issuesV1Schema = z.object({
  issues: z.array(issueSchema).min(1, 'At least one issue must be identified'),
})

/**
 * Parse and validate issues.v1 JSON.
 * @param {object} data - raw parsed JSON
 * @returns {{ success: true, data: object } | { success: false, error: string }}
 */
export function parseIssuesV1(data) {
  const result = issuesV1Schema.safeParse(data)
  if (result.success) {
    return { success: true, data: result.data }
  }
  const messages = result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')
  return { success: false, error: messages }
}

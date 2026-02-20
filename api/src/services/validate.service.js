import * as artifactRepo from '../repositories/artifact.repository.js'
import * as chunkRepo from '../repositories/chunk.repository.js'
import * as documentRepo from '../repositories/document.repository.js'
import { parseValidationV1 } from '../validators/validation.schema.js'

/**
 * Run the V1 ConsistencyValidator pipeline step (non-AI).
 * Checks citations, references, and basic contradictions across all artifacts.
 * @param {object} job - The job record (with projectId, id)
 * @returns {object} The created artifact
 */
export async function runValidation(job) {
  const { projectId } = job
  const issuesFound = []

  // 1. Load all upstream artifacts (gracefully handle missing)
  const factsArtifact = await artifactRepo.findLatest(projectId, 'facts_v1')
  const timelineArtifact = await artifactRepo.findLatest(projectId, 'timeline_v1')
  const issuesArtifact = await artifactRepo.findLatest(projectId, 'issues_v1')
  const briefArtifact = await artifactRepo.findLatest(projectId, 'brief_v1')

  const facts = factsArtifact?.contentJson?.facts || []
  const timeline = timelineArtifact?.contentJson?.timeline || []
  const issues = issuesArtifact?.contentJson?.issues || []
  const sections = briefArtifact?.contentJson?.brief_packet?.sections || []

  if (!factsArtifact) issuesFound.push({ type: 'missing_citation', path: 'artifacts.facts_v1', message: 'Missing facts_v1 artifact' })
  if (!timelineArtifact) issuesFound.push({ type: 'missing_citation', path: 'artifacts.timeline_v1', message: 'Missing timeline_v1 artifact' })
  if (!issuesArtifact) issuesFound.push({ type: 'missing_citation', path: 'artifacts.issues_v1', message: 'Missing issues_v1 artifact' })
  if (!briefArtifact) issuesFound.push({ type: 'missing_citation', path: 'artifacts.brief_v1', message: 'Missing brief_v1 artifact' })

  console.log(`[validator] Loaded: ${facts.length} facts, ${timeline.length} events, ${issues.length} issues, ${sections.length} brief sections`)

  // 2. Build lookup sets from project data
  const chunks = await chunkRepo.findByProjectId(projectId)
  const documents = await documentRepo.findByProjectId(projectId)

  const chunkIdSet = new Set(chunks.map((c) => c.id))
  const docIdSet = new Set(documents.map((d) => d.id))
  const docPageCounts = new Map(documents.map((d) => [d.id, d._count?.pages ?? Infinity]))

  console.log(`[validator] Project has ${chunks.length} chunks, ${documents.length} documents`)

  // Track total citable items for confidence score
  let totalItems = 0

  // Helper: validate a single citation
  function checkCitation(cit, path) {
    if (cit.chunk_id && !chunkIdSet.has(cit.chunk_id)) {
      issuesFound.push({
        type: 'invalid_reference',
        path,
        message: `chunk_id ${cit.chunk_id.slice(0, 8)}... not found in project chunks`,
      })
    }
    if (cit.document_id && !docIdSet.has(cit.document_id)) {
      issuesFound.push({
        type: 'invalid_reference',
        path,
        message: `document_id ${cit.document_id.slice(0, 8)}... not found in project documents`,
      })
    }
    if (cit.document_id && cit.page_number != null) {
      const maxPages = docPageCounts.get(cit.document_id)
      if (maxPages != null && maxPages !== Infinity && cit.page_number > maxPages) {
        issuesFound.push({
          type: 'invalid_reference',
          path,
          message: `page_number ${cit.page_number} exceeds document page count of ${maxPages}`,
        })
      }
    }
  }

  // 3. Check 1 — Missing citations + Check 2 — Invalid references

  // Facts
  for (let i = 0; i < facts.length; i++) {
    totalItems++
    const f = facts[i]
    if (!f.citations || f.citations.length === 0) {
      issuesFound.push({ type: 'missing_citation', path: `facts[${i}]`, message: `Fact ${f.id || i} has no citations` })
    } else {
      for (let c = 0; c < f.citations.length; c++) {
        checkCitation(f.citations[c], `facts[${i}].citations[${c}]`)
      }
    }
  }

  // Timeline
  for (let i = 0; i < timeline.length; i++) {
    totalItems++
    const t = timeline[i]
    if (!t.citations || t.citations.length === 0) {
      issuesFound.push({ type: 'missing_citation', path: `timeline[${i}]`, message: `Timeline event "${(t.event || '').slice(0, 50)}" has no citations` })
    } else {
      for (let c = 0; c < t.citations.length; c++) {
        checkCitation(t.citations[c], `timeline[${i}].citations[${c}]`)
      }
    }
  }

  // Issues
  for (let i = 0; i < issues.length; i++) {
    totalItems++
    const iss = issues[i]
    if (!iss.citations || iss.citations.length === 0) {
      issuesFound.push({ type: 'missing_citation', path: `issues[${i}]`, message: `Issue ${iss.id || i} has no citations` })
    } else {
      for (let c = 0; c < iss.citations.length; c++) {
        checkCitation(iss.citations[c], `issues[${i}].citations[${c}]`)
      }
    }
  }

  // Brief sections
  for (let si = 0; si < sections.length; si++) {
    const sec = sections[si]
    for (let ci = 0; ci < (sec.content || []).length; ci++) {
      totalItems++
      const item = sec.content[ci]
      if (!item.citations || item.citations.length === 0) {
        issuesFound.push({ type: 'missing_citation', path: `brief.sections[${si}].content[${ci}]`, message: `Brief item in "${sec.title}" has no citations` })
      } else {
        for (let k = 0; k < item.citations.length; k++) {
          checkCitation(item.citations[k], `brief.sections[${si}].content[${ci}].citations[${k}]`)
        }
      }
    }
  }

  // 4. Check 3 — Contradiction heuristic: same fact_id with conflicting dates
  const factDateMap = new Map()
  for (const event of timeline) {
    if (!event.date || !event.fact_ids) continue
    for (const fid of event.fact_ids) {
      if (!factDateMap.has(fid)) {
        factDateMap.set(fid, new Set())
      }
      factDateMap.get(fid).add(event.date)
    }
  }
  for (const [fid, dates] of factDateMap) {
    if (dates.size > 1) {
      issuesFound.push({
        type: 'potential_contradiction',
        path: `timeline`,
        message: `Fact ${fid} appears with conflicting dates: ${[...dates].join(' vs ')}`,
      })
    }
  }

  // 5. Compute confidence score
  const confidenceScore = totalItems > 0
    ? Math.max(0, Math.min(1, 1 - (issuesFound.length / totalItems)))
    : 0

  console.log(`[validator] Found ${issuesFound.length} issues across ${totalItems} items (confidence: ${(confidenceScore * 100).toFixed(1)}%)`)

  // 6. Build output and validate with Zod
  const output = {
    issues_found: issuesFound,
    confidence_score: Math.round(confidenceScore * 100) / 100,
  }

  const validation = parseValidationV1(output)
  if (!validation.success) {
    console.error(`[validator] Schema validation failed: ${validation.error}`)
    throw new Error(`Validation output failed schema check: ${validation.error}`)
  }

  // 7. Persist artifact
  const artifact = await artifactRepo.create({
    projectId,
    type: 'validation_v1',
    contentJson: validation.data,
    createdByJobId: job.id,
  })

  console.log(`[validator] Created artifact ${artifact.id} (v${artifact.version})`)
  return artifact
}

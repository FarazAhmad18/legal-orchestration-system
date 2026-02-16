const CHUNK_TARGET = 4000  // ~4000 chars per chunk
const CHUNK_OVERLAP = 500  // ~12% overlap

/**
 * Chunks document pages into overlapping text segments.
 * Tracks page boundaries and char offsets for citation tracing.
 *
 * @param {Array<{pageNum: number, text: string}>} pages - Sorted by pageNum
 * @returns {Array<{chunkIndex, text, pageNum, charStart, charEnd, metaJson}>}
 */
export function chunkDocumentPages(pages) {
  if (!pages || pages.length === 0) return []

  // Build concatenated text + page offset map
  let fullText = ''
  const pageOffsets = [] // { pageNum, start, end }

  for (const page of pages) {
    const start = fullText.length
    fullText += page.text
    pageOffsets.push({ pageNum: page.pageNum, start, end: fullText.length })
    // Add newline separator between pages
    fullText += '\n'
  }

  // Remove trailing newline
  fullText = fullText.trimEnd()

  if (fullText.length === 0) return []

  const chunks = []
  let pos = 0
  let chunkIndex = 0

  while (pos < fullText.length) {
    let end = Math.min(pos + CHUNK_TARGET, fullText.length)

    // If not at end of text, try to break at a natural boundary
    if (end < fullText.length) {
      end = findBreakPoint(fullText, pos, end)
    }

    const text = fullText.slice(pos, end)
    const pageNum = getPageNumAt(pageOffsets, pos)
    const pageEnd = getPageNumAt(pageOffsets, end - 1)

    chunks.push({
      chunkIndex,
      text,
      pageNum,
      charStart: pos,
      charEnd: end,
      metaJson: { pageStart: pageNum, pageEnd },
    })

    chunkIndex++

    // If this chunk reached the end of text, we're done
    if (end >= fullText.length) break

    // Advance by chunk size minus overlap
    const advance = end - pos - CHUNK_OVERLAP
    // Ensure we always move forward by at least half the chunk or the remaining distance
    pos = pos + Math.max(advance, Math.min(CHUNK_TARGET / 2, fullText.length - pos))

    if (pos >= fullText.length) break
  }

  return chunks
}

/**
 * Find a natural break point near the target end position.
 * Priority: paragraph break > sentence end > word boundary
 */
function findBreakPoint(text, start, targetEnd) {
  const searchStart = Math.max(targetEnd - 500, start)
  const region = text.slice(searchStart, targetEnd)

  // Try paragraph break (double newline)
  const paraIdx = region.lastIndexOf('\n\n')
  if (paraIdx !== -1) return searchStart + paraIdx + 2

  // Try sentence end (. ! ?)
  const sentenceMatch = region.match(/.*[.!?]\s/s)
  if (sentenceMatch) {
    return searchStart + sentenceMatch[0].length
  }

  // Try single newline
  const newlineIdx = region.lastIndexOf('\n')
  if (newlineIdx !== -1) return searchStart + newlineIdx + 1

  // Try word boundary (space)
  const spaceIdx = region.lastIndexOf(' ')
  if (spaceIdx !== -1) return searchStart + spaceIdx + 1

  // No good break found, use target as-is
  return targetEnd
}

/**
 * Given a char offset, return which page it falls on.
 */
function getPageNumAt(pageOffsets, charPos) {
  for (let i = pageOffsets.length - 1; i >= 0; i--) {
    if (charPos >= pageOffsets[i].start) {
      return pageOffsets[i].pageNum
    }
  }
  return pageOffsets[0]?.pageNum ?? 1
}

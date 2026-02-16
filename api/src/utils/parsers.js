import fs from 'fs/promises'
import { PDFParse } from 'pdf-parse'
import { extractRawText } from 'mammoth'

const VIRTUAL_PAGE_SIZE = 3000 // chars per virtual page for non-paged formats

/**
 * Parse a PDF file into pages of text.
 * Returns: [{ pageNum, text }]
 */
export async function parsePdf(filePath) {
  const buffer = await fs.readFile(filePath)
  const parser = new PDFParse({ data: new Uint8Array(buffer) })
  const result = await parser.getText()

  return result.pages
    .filter((p) => p.text.trim().length > 0)
    .map((p) => ({ pageNum: p.num, text: p.text.trim() }))
}

/**
 * Parse a DOCX file into virtual pages of text.
 * Returns: [{ pageNum, text }]
 */
export async function parseDocx(filePath) {
  const buffer = await fs.readFile(filePath)
  const result = await extractRawText({ buffer })
  const fullText = result.value

  return splitIntoVirtualPages(fullText)
}

/**
 * Parse a plain text file into virtual pages.
 * Returns: [{ pageNum, text }]
 */
export async function parseTxt(filePath) {
  const fullText = await fs.readFile(filePath, 'utf-8')
  return splitIntoVirtualPages(fullText)
}

/**
 * Split text into virtual pages of ~VIRTUAL_PAGE_SIZE chars,
 * breaking at paragraph boundaries when possible.
 */
function splitIntoVirtualPages(text) {
  const trimmed = text.trim()
  if (!trimmed) return []

  if (trimmed.length <= VIRTUAL_PAGE_SIZE) {
    return [{ pageNum: 1, text: trimmed }]
  }

  const pages = []
  let remaining = trimmed
  let pageNum = 1

  while (remaining.length > 0) {
    if (remaining.length <= VIRTUAL_PAGE_SIZE) {
      pages.push({ pageNum, text: remaining.trim() })
      break
    }

    // Try to break at a paragraph boundary within the page size
    let breakPoint = remaining.lastIndexOf('\n\n', VIRTUAL_PAGE_SIZE)
    if (breakPoint < VIRTUAL_PAGE_SIZE * 0.5) {
      // If paragraph break is too early, try single newline
      breakPoint = remaining.lastIndexOf('\n', VIRTUAL_PAGE_SIZE)
    }
    if (breakPoint < VIRTUAL_PAGE_SIZE * 0.5) {
      // Fall back to hard cut at space
      breakPoint = remaining.lastIndexOf(' ', VIRTUAL_PAGE_SIZE)
    }
    if (breakPoint <= 0) {
      breakPoint = VIRTUAL_PAGE_SIZE
    }

    pages.push({ pageNum, text: remaining.slice(0, breakPoint).trim() })
    remaining = remaining.slice(breakPoint).trim()
    pageNum++
  }

  return pages
}

/**
 * Dispatch to the correct parser based on MIME type.
 */
export async function parseDocument(filePath, mime) {
  switch (mime) {
    case 'application/pdf':
      return parsePdf(filePath)
    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      return parseDocx(filePath)
    case 'text/plain':
      return parseTxt(filePath)
    default:
      throw new Error(`Unsupported mime type: ${mime}`)
  }
}

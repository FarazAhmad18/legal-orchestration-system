import { pipeline } from '@xenova/transformers'

const MODEL_NAME = 'Xenova/all-MiniLM-L6-v2'

let extractor = null
let loadingPromise = null

/**
 * Get or initialize the feature-extraction pipeline (singleton).
 * First call downloads ~30MB model; subsequent calls reuse.
 */
async function getExtractor() {
  if (extractor) return extractor
  if (loadingPromise) return loadingPromise

  loadingPromise = pipeline('feature-extraction', MODEL_NAME, {
    quantized: true,
  })

  extractor = await loadingPromise
  loadingPromise = null
  return extractor
}

/**
 * Embed a single text string.
 * @param {string} text
 * @returns {Promise<number[]>} 384-dim embedding vector
 */
export async function embedText(text) {
  const ext = await getExtractor()
  const output = await ext(text, { pooling: 'mean', normalize: true })
  return Array.from(output.data)
}

/**
 * Embed multiple texts in batch.
 * Processes sequentially to avoid OOM on large batches.
 * @param {string[]} texts
 * @returns {Promise<number[][]>}
 */
export async function embedTexts(texts) {
  const ext = await getExtractor()
  const results = []
  for (const text of texts) {
    const output = await ext(text, { pooling: 'mean', normalize: true })
    results.push(Array.from(output.data))
  }
  return results
}

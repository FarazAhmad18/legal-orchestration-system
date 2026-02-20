import Groq from 'groq-sdk'
import config from '../config/index.js'

const groq = new Groq({ apiKey: config.groq.apiKey })

/**
 * Send a chat completion request to Groq.
 * @param {Object} opts
 * @param {Array<{role: string, content: string}>} opts.messages
 * @param {boolean} [opts.jsonMode=false] - force JSON output
 * @param {number} [opts.temperature=0.2]
 * @param {number} [opts.maxTokens=4096]
 * @returns {Promise<string>} The assistant's response content
 */
export async function chatCompletion({ messages, jsonMode = false, temperature = 0.2, maxTokens = 4096 }) {
  const params = {
    model: config.groq.model,
    messages,
    temperature,
    max_tokens: maxTokens,
  }

  if (jsonMode) {
    params.response_format = { type: 'json_object' }
  }

  const response = await groq.chat.completions.create(params)

  const usage = response.usage
  if (usage) {
    console.log(`[llm] tokens — prompt: ${usage.prompt_tokens}, completion: ${usage.completion_tokens}, total: ${usage.total_tokens}`)
  }

  const content = response.choices?.[0]?.message?.content
  if (!content) {
    throw new Error('LLM returned empty response')
  }

  return content
}

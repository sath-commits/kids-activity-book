import OpenAI from 'openai'

// Lazy singleton — avoids throwing at build time when env vars aren't set
let _client: OpenAI | null = null

export function getOpenAI(): OpenAI {
  if (!_client) {
    _client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })
  }
  return _client
}

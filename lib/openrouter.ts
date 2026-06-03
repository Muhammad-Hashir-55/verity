export const OPENROUTER_MODEL = 'openrouter/owl-alpha'

export async function openrouterChat(
  messages: Array<{ role: string; content: string }>,
  stream = false
) {
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: OPENROUTER_MODEL,
      messages,
      stream,
      max_tokens: 1000,
    }),
  })
  return res
}
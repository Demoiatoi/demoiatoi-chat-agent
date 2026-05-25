const { createClient } = require('@supabase/supabase-js')

const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).end()

  try {
    const { messages, system, conversation_id } = req.body

    let convId = conversation_id
    if (!convId) {
      const { data } = await supabase
        .from('chat_conversations')
        .insert({ status: 'active' })
        .select()
        .single()
      convId = data.id
    }

    const lastUserMsg = messages[messages.length - 1]
    await supabase.from('chat_messages').insert({
      conversation_id: convId,
      role: 'user',
      content: lastUserMsg.content
    })

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1000,
        system,
        messages
      })
    })

    const data = await response.json()
    const assistantText = data.content?.[0]?.text || ''

    await supabase.from('chat_messages').insert({
      conversation_id: convId,
      role: 'assistant',
      content: assistantText
    })

    const needsAttention =
      lastUserMsg.content.toLowerCase().includes('andrea') ||
      lastUserMsg.content.toLowerCase().includes('incidencia') ||
      lastUserMsg.content.toLowerCase().includes('problema') ||
      lastUserMsg.content.toLowerCase().includes('urgente')

    if (needsAttention) {
      await supabase
        .from('chat_conversations')
        .update({ needs_attention: true, status: 'needs_review' })
        .eq('id', convId)
    }

    res.status(200).json({ ...data, conversation_id: convId })

  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error interno' })
  }
}

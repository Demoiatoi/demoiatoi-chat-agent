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
    const { messages, system, conversation_id, customer_email, customer_source, is_suggestion } = req.body

    let convId = conversation_id

    if (!convId) {
      if (customer_email) {
        const { data: existing } = await supabase
          .from('chat_conversations')
          .select('id')
          .eq('customer_email', customer_email)
          .neq('status', 'resolved')
          .order('updated_at', { ascending: false })
          .limit(1)
          .single()
        if (existing) convId = existing.id
      }

      if (!convId) {
        const { data: newConv } = await supabase
          .from('chat_conversations')
          .insert({
            status: 'active',
            customer_email: customer_email || null,
            customer_source: customer_source || null
          })
          .select()
          .single()
        console.log('newConv:', JSON.stringify(newConv))
        convId = newConv?.id
      }
    }

    if (customer_email && convId) {
      await supabase
        .from('chat_conversations')
        .update({ customer_email, updated_at: new Date().toISOString() })
        .eq('id', convId)
    }

    const lastUserMsg = messages[messages.length - 1]

    if (convId) {
      await supabase.from('chat_messages').insert({
        conversation_id: convId,
        role: 'user',
        content: lastUserMsg.content
      })
    }

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

    if (convId) {
      await supabase.from('chat_messages').insert({
        conversation_id: convId,
        role: 'assistant',
        content: assistantText,
        is_from_andrea: false
      })
    }

    // Si es sugerencia, quitar needs_attention
    if (is_suggestion && convId) {
      await supabase
        .from('chat_conversations')
        .update({ needs_attention: false, status: 'active', updated_at: new Date().toISOString() })
        .eq('id', convId)
    }

    // Detectar si necesita atención de Andrea
    const needsAttention =
      lastUserMsg.content.toLowerCase().includes('andrea') ||
      lastUserMsg.content.toLowerCase().includes('incidencia') ||
      lastUserMsg.content.toLowerCase().includes('problema') ||
      lastUserMsg.content.toLowerCase().includes('urgente') ||
      lastUserMsg.content.toLowerCase().includes('no ha llegado') ||
      assistantText.toLowerCase().includes('voy a consultarlo') ||
      assistantText.toLowerCase().includes('espera un momento')

    if (needsAttention && convId) {
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

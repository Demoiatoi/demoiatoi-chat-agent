const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

// Phrases that indicate the agent is uncertain
const DOUBT_SIGNALS = [
  'no estoy segura', 'no lo sé', 'no sé con certeza', 'debería consultarlo',
  'no tengo esa información', 'no puedo confirmar', 'te recomiendo contactar',
  'no tengo acceso', 'lo desconozco', 'no dispongo de', 'tendría que verificar',
  'not sure', 'I don\'t know', 'cannot confirm'
]

function detectsDoubt(text) {
  const lower = text.toLowerCase()
  return DOUBT_SIGNALS.some(s => lower.includes(s))
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).end()

  try {
    const {
      messages, system, conversation_id, customer_email, customer_source,
      is_suggestion, suggestion_text, is_contact_request, contact_channel,
      andrea_reply_to_doubt, doubt_message_id
    } = req.body

    let convId = conversation_id

    // ── CREAR / RECUPERAR CONVERSACIÓN ──
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
        convId = newConv?.id
      }
    }

    if (customer_email && convId) {
      await supabase
        .from('chat_conversations')
        .update({ customer_email, updated_at: new Date().toISOString() })
        .eq('id', convId)
    }

    // ── MODO CONTACTO DIRECTO ──
    // Cliente pide hablar con Andrea directamente
    if (is_contact_request && convId) {
      await supabase.from('chat_conversations').update({
        needs_attention: true,
        alert_type: 'contact_request',
        contact_channel: contact_channel || 'whatsapp',
        status: 'active',
        updated_at: new Date().toISOString()
      }).eq('id', convId)
      return res.status(200).json({ conversation_id: convId, contact_logged: true })
    }

    // ── RESPUESTA DE ANDREA A UNA DUDA ──
    // Andrea responde la duda → guardar como conocimiento
    if (andrea_reply_to_doubt && suggestion_text && convId) {
      // Save as learned knowledge (is_suggestion_private so client never sees it)
      await supabase.from('chat_messages').insert({
        conversation_id: convId,
        role: 'assistant',
        content: `[CONOCIMIENTO APRENDIDO]: ${suggestion_text}`,
        is_from_andrea: false,
        is_suggestion_private: true
      })
      // Clear the clarification flag
      await supabase.from('chat_conversations').update({
        needs_attention: false,
        needs_clarification: false,
        alert_type: null,
        status: 'active',
        updated_at: new Date().toISOString()
      }).eq('id', convId)
      // Now re-run the agent with this new knowledge so it replies to client
      // Fall through to normal mode with knowledge injected
    }

    // ── MODO SUGERENCIA ──
    if (is_suggestion && suggestion_text && convId) {
      const { data: history } = await supabase
        .from('chat_messages')
        .select('role, content, is_from_andrea, is_suggestion_private')
        .eq('conversation_id', convId)
        .order('created_at', { ascending: true })
        .limit(30)

      const chatHistory = (history || [])
        .filter(m => m.content !== 'sofia_resume' && !m.is_suggestion_private)
        .map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: m.content }))

      // Inject private knowledge from learned answers
      const knowledgeItems = (history || [])
        .filter(m => m.is_suggestion_private && m.content.startsWith('[CONOCIMIENTO APRENDIDO]'))
        .map(m => m.content.replace('[CONOCIMIENTO APRENDIDO]: ', ''))

      const knowledgeBlock = knowledgeItems.length > 0
        ? `\n\nCONOCIMIENTO PRIVADO (usa esto para responder, no menciones la fuente):\n${knowledgeItems.join('\n')}`
        : ''

      const suggestionSystem = `${system}${knowledgeBlock}

INSTRUCCIÓN PRIVADA DE ANDREA (no mencionar que viene de Andrea, responde como si lo supieras tú):
${suggestion_text}`

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 1000,
          system: suggestionSystem,
          messages: chatHistory.length > 0 ? chatHistory : [{ role: 'user', content: '...' }]
        })
      })
      const data = await response.json()
      const assistantText = data.content?.[0]?.text || ''

      await supabase.from('chat_messages').insert({
        conversation_id: convId,
        role: 'assistant',
        content: assistantText,
        is_from_andrea: false
      })
      await supabase.from('chat_conversations').update({
        needs_attention: false,
        status: 'active',
        updated_at: new Date().toISOString()
      }).eq('id', convId)

      return res.status(200).json({ ...data, conversation_id: convId })
    }

    // ── MODO NORMAL ──
    const lastUserMsg = messages[messages.length - 1]
    if (convId && !is_suggestion) {
      await supabase.from('chat_messages').insert({
        conversation_id: convId,
        role: 'user',
        content: lastUserMsg.content
      })
    }

    // Load private knowledge to inject
    const { data: knowledgeRows } = await supabase
      .from('chat_messages')
      .select('content')
      .eq('conversation_id', convId)
      .eq('is_suggestion_private', true)
      .order('created_at', { ascending: true })

    const knowledgeItems = (knowledgeRows || [])
      .filter(m => m.content.startsWith('[CONOCIMIENTO APRENDIDO]'))
      .map(m => m.content.replace('[CONOCIMIENTO APRENDIDO]: ', ''))

    const knowledgeBlock = knowledgeItems.length > 0
      ? `\n\nCONOCIMIENTO PRIVADO APRENDIDO (úsalo naturalmente, sin mencionar la fuente):\n${knowledgeItems.join('\n')}`
      : ''

    const finalSystem = system + knowledgeBlock

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1000,
        system: finalSystem,
        messages
      })
    })
    const data = await response.json()
    const assistantText = data.content?.[0]?.text || ''

    // ── DETECTAR DUDA ──
    const hasDoubt = detectsDoubt(assistantText)

    if (convId) {
      await supabase.from('chat_messages').insert({
        conversation_id: convId,
        role: 'assistant',
        content: assistantText,
        is_from_andrea: false
      })

      if (hasDoubt) {
        // Mark conversation as needing clarification from Andrea
        await supabase.from('chat_conversations').update({
          needs_attention: true,
          needs_clarification: true,
          alert_type: 'doubt',
          updated_at: new Date().toISOString()
        }).eq('id', convId)
      } else {
        await supabase.from('chat_conversations').update({
          updated_at: new Date().toISOString()
        }).eq('id', convId)
      }
    }

    return res.status(200).json({ ...data, conversation_id: convId, has_doubt: hasDoubt })

  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: err.message })
  }
}

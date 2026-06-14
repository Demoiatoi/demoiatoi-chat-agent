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

// Persona mínima de respaldo, por si llega un "system" vacío (p.ej. desde el panel)
const DEFAULT_SYSTEM = `Eres Elena, la asistente de ventas de "De Moi à Toi Regalos" (demoiatoi.com), una tienda española de regalos personalizados para bodas, bautizos, comuniones, cumpleaños y otras celebraciones. Eres cercana, cálida y profesional. Respondes siempre en español, de forma breve y natural (3-5 frases). No inventes productos, precios ni plazos de entrega que no conozcas con certeza.`

// Aviso urgente y temporal que Andrea puede activar/desactivar desde el panel (p.ej. info de campaña)
async function fetchUrgentNotice() {
  const { data } = await supabase
    .from('store_settings')
    .select('urgent_notice, urgent_notice_active')
    .eq('id', 1)
    .single()
  if (!data || !data.urgent_notice_active || !data.urgent_notice) return ''
  return `\n\nAVISO URGENTE Y TEMPORAL DE ANDREA (prioridad alta, ten esto muy en cuenta en tus respuestas):\n${data.urgent_notice}`
}

// La API de Anthropic exige que "messages" empiece en "user" y alterne user/assistant sin repetir rol
function normalizeMessages(list) {
  const merged = []
  for (const m of (list || [])) {
    if (!m || !m.content) continue
    const role = m.role === 'assistant' ? 'assistant' : 'user'
    if (merged.length && merged[merged.length - 1].role === role) {
      merged[merged.length - 1].content += '\n' + m.content
    } else {
      merged.push({ role, content: m.content })
    }
  }
  if (!merged.length) {
    merged.push({ role: 'user', content: '...' })
  } else if (merged[0].role !== 'user') {
    merged.unshift({ role: 'user', content: '...' })
  }
  return merged
}

// Frases que indican que el cliente pregunta por el estado de un pedido suyo
const ORDER_STATUS_SIGNALS = [
  'estado de mi pedido', 'estado del pedido', 'mi pedido', 'mis pedidos',
  'donde esta mi pedido', 'dónde está mi pedido', 'cuando llega', 'cuándo llega',
  'ha llegado', 'ha sido enviado', 'esta enviado', 'está enviado',
  'seguimiento', 'tracking', 'numero de pedido', 'número de pedido',
  'mi envío', 'mi envio'
]

function isOrderStatusQuery(text) {
  const lower = (text || '').toLowerCase()
  return ORDER_STATUS_SIGNALS.some(s => lower.includes(s))
}

// Mapea un pedido de Shopify a la etapa real para el cliente
function getOrderStage(order) {
  const tags = (order.tags || []).map(t => t.toLowerCase())
  if (order.displayFulfillmentStatus === 'FULFILLED' || tags.includes('estado-erp-enviado')) {
    return 'enviado'
  }
  if (order.displayFulfillmentStatus === 'IN_PROGRESS' || tags.includes('estado-erp-en-produccion')) {
    return 'en_produccion'
  }
  return 'registrado'
}

const ORDER_STAGE_LABELS = {
  registrado: 'Registrado, pendiente de pasar a producción',
  en_produccion: 'En producción (nuestro equipo lo está preparando)',
  enviado: 'Enviado'
}

// Consulta los pedidos más recientes de un email en Shopify (Admin GraphQL API)
async function fetchRecentOrders(email) {
  const domain = process.env.SHOPIFY_STORE_DOMAIN
  const token = process.env.SHOPIFY_ADMIN_TOKEN
  if (!domain || !token) return []

  const query = `
    query($q: String!) {
      orders(first: 3, query: $q, sortKey: CREATED_AT, reverse: true) {
        edges {
          node {
            name
            displayFulfillmentStatus
            tags
            fulfillments(first: 1) {
              trackingInfo { company number url }
            }
          }
        }
      }
    }`

  const resp = await fetch(`https://${domain}/admin/api/2025-10/graphql.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': token
    },
    body: JSON.stringify({ query, variables: { q: `email:'${email}' status:any` } })
  })
  if (!resp.ok) return []
  const json = await resp.json()
  return (json?.data?.orders?.edges || []).map(e => e.node)
}

// Construye el bloque de contexto con el estado real de los pedidos del cliente
function buildOrderStatusBlock(orders) {
  if (!orders || !orders.length) return ''

  const lines = orders.map(o => {
    const stage = getOrderStage(o)
    let line = `- Pedido ${o.name}: ${ORDER_STAGE_LABELS[stage]}`
    if (stage === 'enviado') {
      const tracking = o.fulfillments?.[0]?.trackingInfo?.[0]
      if (tracking?.url) {
        line += ` · Transportista: ${tracking.company || 'transportista'} · Nº seguimiento: ${tracking.number || '—'} · Enlace de seguimiento: ${tracking.url}`
      }
    }
    return line
  })

  return `\n\nINFORMACIÓN REAL DE PEDIDOS DE ESTE CLIENTE (usa esto, no la respuesta genérica de "ESTADO DE PEDIDO"):
${lines.join('\n')}

Instrucciones:
- "Registrado": dile que está registrado y en cola, que pronto entrará en producción.
- "En producción": dile que ya está en producción, que el equipo lo está preparando con cariño.
- "Enviado": dile que ya ha salido del taller. Si hay enlace de seguimiento, dáselo junto con el transportista y el número de seguimiento.
- Si hay varios pedidos, resume el estado de cada uno usando su número de pedido.
- No menciones tags, IDs internos ni la palabra "fulfillment".
- Escribe el enlace de seguimiento como URL en texto plano (NUNCA en formato markdown [texto](url)).`
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

    const urgentNoticeBlock = await fetchUrgentNotice()
    const baseSystem = ((system && system.trim()) ? system : DEFAULT_SYSTEM) + urgentNoticeBlock

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

      const suggestionSystem = `${baseSystem}${knowledgeBlock}

INSTRUCCIÓN PRIVADA DE ANDREA (no mencionar que viene de Andrea, responde como si lo supieras tú):
${suggestion_text}`

      // El modelo no admite que "messages" termine en "assistant" (sin prefill).
      // Si la última intervención fue de Elena, añadimos un turno de cierre para poder pedirle la nueva respuesta.
      const apiMessages = normalizeMessages(chatHistory)
      if (apiMessages[apiMessages.length - 1].role === 'assistant') {
        apiMessages.push({ role: 'user', content: '(Sigue la indicación anterior y responde de nuevo al cliente.)' })
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
          system: suggestionSystem,
          messages: apiMessages
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

    // ── ESTADO REAL DE PEDIDOS (Shopify) ──
    let orderStatusBlock = ''
    if (customer_email && isOrderStatusQuery(lastUserMsg.content)) {
      try {
        const orders = await fetchRecentOrders(customer_email)
        orderStatusBlock = buildOrderStatusBlock(orders)
      } catch (e) {
        console.error('fetchRecentOrders failed', e)
      }
    }

    const finalSystem = baseSystem + knowledgeBlock + orderStatusBlock

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
        system: finalSystem,
        messages: normalizeMessages(messages)
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

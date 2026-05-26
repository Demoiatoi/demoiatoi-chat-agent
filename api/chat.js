const { createClient } = require('@supabase/supabase-js')

// Inicialización única de Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

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

// ── FUNCIÓN PARA OBTENER EL CATÁLOGO EN TIEMPO REAL DESDE SHOPIFY ──
async function fetchShopifyCatalog() {
  try {
    // Consultamos el endpoint público de productos de tu Shopify (máximo 250)
    const response = await fetch('https://demoiatoi.com/products.json?limit=250')
    if (!response.ok) return ""
    
    const data = await response.json()
    if (!data.products || data.products.length === 0) return ""

    // Agrupamos y formateamos los productos por tipo/categoría para optimizar los tokens de Claude
    const byCategory = {}
    data.products.forEach(p => {
      const cat = p.product_type || "Otros"
      // Obtenemos el precio menor de sus variantes
      const price = p.variants && p.variants.length > 0 ? p.variants[0].price : "Consultar"
      
      if (!byCategory[cat]) byCategory[cat] = []
      byCategory[cat].push(`  • "${p.title}" | Desde ${price}€ | ID:${p.id} | URL Handle: ${p.handle}`)
    })

    // Construimos el bloque de texto estructurado para el prompt
    return Object.entries(byCategory).map(([cat, prods]) =>
      `**${cat}:**\n${prods.join('\n')}`
    ).join('\n\n')

  } catch (error) {
    console.error("Error obteniendo catálogo de Shopify:", error)
    return "*(El catálogo en tiempo real no está disponible en este momento, ayuda al cliente con información general)*"
  }
}

// ── CONSTRUCTOR DEL SYSTEM PROMPT DINÁMICO ──
function buildSystemPrompt(catalogText, customShipping, customReturns, customExtra, agentName = "Sofía") {
  const shipping = customShipping || "Envío estándar: 3-5 días hábiles en España, 3,99€. Gratis a partir de 40€.";
  const returns = customReturns || "Aceptamos devoluciones en 14 días si el producto llega defectuoso.";
  const extra = customExtra || "Si el cliente tiene dudas sobre personalización, explica que lo hace nuestro equipo artesanal en España.";

  return `Eres ${agentName}, la asistente de ventas inteligente de "De Moi à Toi Regalos" (demoiatoi.com), una tienda española especializada en regalos personalizados para celebraciones (bodas, bautizos, comuniones, cumpleaños, fin de curso, Navidad, etc.).

Tu misión: ayudar al cliente a encontrar el regalo o detalle perfecto de forma natural, honesta y cálida.

## TU PERSONALIDAD
- Cercana y genuina, como una amiga que conoce perfectamente la tienda.
- Haces preguntas para entender bien qué necesitan (presupuesto, tipo de evento, número de invitados).
- No presionas ni usas lenguaje de vendedor agresivo.
- Usas emojis con moderación, solo cuando aportan calidez.

## CATÁLOGO COMPLETO DE LA TIENDA (Sincronizado en tiempo real con Shopify)
Aquí tienes los productos disponibles actualmente en la web. Usa ESTA lista para recomendar:

${catalogText}

## POLÍTICA DE ENVÍOS
${shipping}

## POLÍTICA DE DEVOLUCIONES
${returns}

## INFORMACIÓN ADICIONAL / INSTRUCCIONES DE ANDREA
${extra}

## CÓMO RECOMENDAR PRODUCTOS
Cuando el cliente describa su necesidad, recomienda entre 1 y 3 productos que encajen. Sé selectivo.
Para mostrar productos de forma visual en la interfaz del chat, DEBES incluir obligatoriamente al final de tu respuesta este bloque exacto (sin markdown, sin bloques de código, tal cual):

PRODUCTOS_JSON:[{"id":"ID_DEL_PRODUCTO","razon":"Explicación cortísima de por qué se lo recomiendas"}]

Si no hay productos relevantes o el cliente hace una pregunta general, no incluyas el bloque PRODUCTOS_JSON.

## ESTADO DE PEDIDO
Si preguntan por el estado, responde exactamente:
"¡Claro! Puedes consultar el estado de tu pedido en tiempo real aquí: https://demoiatoi.com/pages/estado-de-pedido — solo necesitas introducir tu email o número de pedido 📦"

## CUANDO NO SABES ALGO
Si te preguntan algo que no está en el catálogo o de lo que no tienes información, di exactamente: "Espera un momento, voy a consultarlo con Andrea para darte la información correcta 🙏" y nada más. Esto alertará a la administración de la tienda.

## REGLAS IMPORTANTES
- NUNCA inventes productos o precios que no estén en la lista de arriba.
- Responde siempre en español de España de forma concisa (3-5 frases por respuesta).
- Las URLs de los productos siguen esta estructura: https://demoiatoi.com/products/[URL_Handle]`;
}

// ── HANDLER PRINCIPAL DE LA API (VERCEL) ──
module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).end()

  try {
    const {
      messages, conversation_id, customer_email, customer_source,
      is_suggestion, suggestion_text, is_contact_request, contact_channel,
      andrea_reply_to_doubt, cfg_shipping, cfg_returns, cfg_extra, cfg_name
    } = req.body

    let convId = conversation_id

    // ── CREAR / RECUPERAR CONVERSACIÓN EN SUPABASE ──
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
    if (andrea_reply_to_doubt && suggestion_text && convId) {
      await supabase.from('chat_messages').insert({
        conversation_id: convId,
        role: 'assistant',
        content: `[CONOCIMIENTO APRENDIDO]: ${suggestion_text}`,
        is_from_andrea: false,
        is_suggestion_private: true
      })
      await supabase.from('chat_conversations').update({
        needs_attention: false,
        needs_clarification: false,
        alert_type: null,
        status: 'active',
        updated_at: new Date().toISOString()
      }).eq('id', convId)
    }

    // ── OBTENER EL CATÁLOGO EN TIEMPO REAL DESDE SHOPIFY ──
    const catalogText = await fetchShopifyCatalog();

    // ── CONSTRUIR EL PROMPT DE FORMA SEGURA EN EL SERVIDOR ──
    const baseSystem = buildSystemPrompt(catalogText, cfg_shipping, cfg_returns, cfg_extra, cfg_name);

    // ── MODO SUGERENCIA DESDE EL PANEL DE CONTROL ──
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

      const knowledgeItems = (history || [])
        .filter(m => m.is_suggestion_private && m.content.startsWith('[CONOCIMIENTO APRENDIDO]'))
        .map(m => m.content.replace('[CONOCIMIENTO APRENDIDO]: ', ''))

      const knowledgeBlock = knowledgeItems.length > 0
        ? `\n\nCONOCIMIENTO PRIVADO APRENDIDO EN ESTE CHAT:\n${knowledgeItems.join('\n')}`
        : ''

      const suggestionSystem = `${baseSystem}${knowledgeBlock}\n\nINSTRUCCIÓN PRIVADA DE ANDREA (aplícala inmediatamente para responder al cliente):\n${suggestion_text}`

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20241022',
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

    // ── MODO CHAT NORMAL CON EL CLIENTE ──
    const lastUserMsg = messages[messages.length - 1]
    if (convId && !is_suggestion) {
      await supabase.from('chat_messages').insert({
        conversation_id: convId,
        role: 'user',
        content: lastUserMsg.content
      })
    }

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
      ? `\n\nCONOCIMIENTO PRIVADO APRENDIDO EN ESTE CHAT:\n${knowledgeItems.join('\n')}`
      : ''

    const finalSystem = baseSystem + knowledgeBlock

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1000,
        system: finalSystem,
        messages
      })
    })
    const data = await response.json()
    const assistantText = data.content?.[0]?.text || ''

    const hasDoubt = detectsDoubt(assistantText)

    if (convId) {
      await supabase.from('chat_messages').insert({
        conversation_id: convId,
        role: 'assistant',
        content: assistantText,
        is_from_andrea: false
      })

      if (hasDoubt) {
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

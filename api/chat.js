const { createClient } = require('@supabase/supabase-js')

// Inicialización única de Supabase en Vercel
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

const DOUBT_SIGNALS = [
  'no estoy segura', 'no lo sé', 'no sé con certeza', 'debería consultarlo',
  'no tengo esa información', 'no puedo confirmar', 'te recomiendo contactar',
  'no tengo acceso', 'lo desconozco', 'no dispongo de', 'tendría que verificar'
]

function detectsDoubt(text) {
  if (!text) return false;
  const lower = text.toLowerCase()
  return DOUBT_SIGNALS.some(s => lower.includes(s))
}

// Recorrer el catálogo de Shopify de 250 en 250 de forma segura
async function fetchShopifyCatalog() {
  try {
    let allProducts = [];
    let page = 1;
    let keepFetching = true;
    const limit = 250;

    while (keepFetching) {
      const response = await fetch(`https://demoiatoi.com/products.json?limit=${limit}&page=${page}`);
      if (!response.ok) { keepFetching = false; break; }
      
      const data = await response.json();
      if (data.products && data.products.length > 0) {
        allProducts = allProducts.concat(data.products);
        if (data.products.length < limit) { keepFetching = false; } else { page++; }
      } else { keepFetching = false; }
      if (page > 5) keepFetching = false; // Límite de seguridad
    }

    if (allProducts.length === 0) return "*(Catálogo temporalmente no disponible)*";

    const byCategory = {};
    allProducts.forEach(p => {
      const cat = p.product_type || "Otros";
      const price = p.variants && p.variants.length > 0 ? p.variants[0].price : "Consultar";
      if (!byCategory[cat]) byCategory[cat] = [];
      byCategory[cat].push(`  • "${p.title}" | Desde ${price}€ | ID:${p.id} | URL Handle: ${p.handle}`);
    });

    return Object.entries(byCategory).map(([cat, prods]) => `**${cat}:**\n${prods.join('\n')}`).join('\n\n');
  } catch (error) {
    console.error("Error en Shopify fetch:", error);
    return "*(Catálogo no disponible)*";
  }
}

function buildSystemPrompt(catalogText, customShipping, customReturns, customExtra, agentName = "Sofía") {
  return `Eres ${agentName}, la asistente de ventas de "De Moi à Toi Regalos" (demoiatoi.com).
Responde de manera cercana, honesta y en español de España.

## CATÁLOGO DISPONIBLE
${catalogText}

## POLÍTICA DE ENVÍOS
${customShipping || "Estándar: 3-5 días."}

## DEVOLUCIONES
${customReturns || "14 días para productos defectuosos."}

## INSTRUCCIONES EXTRA
${customExtra || ""}

## REGLAS IMPORTANTES
- Recomienda de 1 a 3 productos si es relevante usando este formato exacto al final: PRODUCTOS_JSON:[{"id":"ID","razon":"Breve motivo"}]
- Si no sabes algo, di exactamente: "Espera un momento, voy a consultarlo con Andrea para darte la información correcta 🙏"
- Respuestas cortas (3-5 frases).`;
}

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

    // Crear o recuperar conversación
    if (!convId && customer_email) {
      const { data: existing } = await supabase
        .from('chat_conversations')
        .select('id')
        .eq('customer_email', customer_email)
        .neq('status', 'resolved')
        .order('updated_at', { ascending: false })
        .limit(1)
      if (existing && existing.length > 0) convId = existing[0].id
    }
    
    if (!convId) {
      const { data: newConv } = await supabase
        .from('chat_conversations')
        .insert({ status: 'active', customer_email: customer_email || null, customer_source: customer_source || null })
        .select().single()
      convId = newConv?.id
    }

    if (!convId) throw new Error("No se pudo inicializar la conversación en Supabase");

    // Guardar mensaje del usuario si viene en modo normal
    if (messages && messages.length > 0 && !is_suggestion) {
      const lastUserMsg = messages[messages.length - 1];
      await supabase.from('chat_messages').insert({ conversation_id: convId, role: 'user', content: lastUserMsg.content });
    }

    // Gestionar respuestas manuales de Andrea desde el panel
    if (andrea_reply_to_doubt && suggestion_text) {
      await supabase.from('chat_messages').insert({
        conversation_id: convId, role: 'assistant', content: `[CONOCIMIENTO APRENDIDO]: ${suggestion_text}`, is_suggestion_private: true
      });
    }

    // Carga de catálogo y configuración
    const catalogText = await fetchShopifyCatalog();
    const baseSystem = buildSystemPrompt(catalogText, cfg_shipping, cfg_returns, cfg_extra, cfg_name);

    // Filtrar el historial para Anthropic (evitar campos corruptos)
    let finalMessages = [];
    if (messages && messages.length > 0) {
      finalMessages = messages.map(m => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: String(m.content)
      }));
    } else {
      finalMessages = [{ role: 'user', content: 'Hola' }];
    }

    // Petición a Anthropic
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
        system: baseSystem,
        messages: finalMessages
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Error de Anthropic:", errText);
      return res.status(502).json({ error: "Error de comunicación con el motor de IA" });
    }

    const data = await response.json();
    const assistantText = data.content?.[0]?.text || 'Lo siento, no he podido procesar tu solicitud.';

    // Guardar la respuesta de la IA de forma segura
    await supabase.from('chat_messages').insert({ conversation_id: convId, role: 'assistant', content: assistantText });

    const hasDoubt = detectsDoubt(assistantText);
    await supabase.from('chat_conversations').update({
      needs_attention: hasDoubt,
      needs_clarification: hasDoubt,
      alert_type: hasDoubt ? 'doubt' : null,
      updated_at: new Date().toISOString()
    }).eq('id', convId);

    return res.status(200).json({ content: [{ type: "text", text: assistantText }], conversation_id: convId, has_doubt: hasDoubt });

  } catch (err) {
    console.error("Handler Error:", err);
    return res.status(500).json({ error: err.message });
  }
}

const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

const DOUBT_SIGNALS = ['no estoy segura', 'no lo sé', 'no sé con certeza', 'debería consultarlo', 'no tengo esa información']

function detectsDoubt(text) {
  if (!text) return false;
  const lower = text.toLowerCase()
  return DOUBT_SIGNALS.some(s => lower.includes(s))
}

async function fetchShopifyCatalog() {
  try {
    let allProducts = [];
    let page = 1;
    const limit = 250;
    
    // Hacemos un barrido rápido por las 3 primeras páginas de Shopify (750 productos)
    while (page <= 3) {
      const response = await fetch(`https://demoiatoi.com/products.json?limit=${limit}&page=${page}`);
      if (!response.ok) break;
      const data = await response.json();
      if (data.products && data.products.length > 0) {
        allProducts = allProducts.concat(data.products);
        if (data.products.length < limit) break;
        page++;
      } else { break; }
    }

    if (allProducts.length === 0) return "*(Catálogo de productos general disponible en la web)*";

    const byCategory = {};
    allProducts.forEach(p => {
      const cat = p.product_type || "General";
      const price = p.variants && p.variants.length > 0 ? p.variants[0].price : "Consultar";
      if (!byCategory[cat]) byCategory[cat] = [];
      byCategory[cat].push(`  • "${p.title}" - ${price}€ (ID: ${p.id})`);
    });

    return Object.entries(byCategory).map(([cat, prods]) => `**${cat}:**\n${prods.join('\n')}`).join('\n\n');
  } catch (e) {
    return "*(Catálogo disponible en la web)*";
  }
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).end()

  try {
    const { messages, conversation_id, customer_email, customer_source, cfg_shipping, cfg_returns, cfg_extra, cfg_name } = req.body
    let convId = conversation_id

    if (!convId && customer_email) {
      const { data: existing } = await supabase.from('chat_conversations').select('id').eq('customer_email', customer_email).neq('status', 'resolved').limit(1)
      if (existing && existing.length > 0) convId = existing[0].id
    }
    
    if (!convId) {
      const { data: newConv } = await supabase.from('chat_conversations').insert({ status: 'active', customer_email, customer_source }).select().single()
      convId = newConv?.id
    }

    const lastUserMsg = messages && messages.length > 0 ? messages[messages.length - 1] : null;
    if (convId && lastUserMsg) {
      await supabase.from('chat_messages').insert({ conversation_id: convId, role: 'user', content: lastUserMsg.content });
    }

    const catalogText = await fetchShopifyCatalog();
    
    const systemPrompt = `Eres ${cfg_name || "Sofía"}, asistente de "De Moi à Toi Regalos". Responde de forma cálida en español.
Catálogo:\n${catalogText}\nEnvíos: ${cfg_shipping}\nDevoluciones: ${cfg_returns}\nExtra: ${cfg_extra}
Regla: Si no sabes algo di: "Espera un momento, voy a consultarlo con Andrea para darte la información correcta 🙏".`;

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
        system: systemPrompt,
        messages: messages.map(m => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: String(m.content) }))
      })
    });

    let assistantText = "Lo siento, estoy teniendo un problema para procesar tu mensaje en este momento. Por favor, escribe a contacto@demoiatoi.es 💛";
    if (response.ok) {
      const data = await response.json();
      assistantText = data.content?.[0]?.text || assistantText;
    }

    if (convId) {
      await supabase.from('chat_messages').insert({ conversation_id: convId, role: 'assistant', content: assistantText });
      const hasDoubt = detectsDoubt(assistantText);
      await supabase.from('chat_conversations').update({ needs_attention: hasDoubt, updated_at: new Date().toISOString() }).eq('id', convId);
    }

    return res.status(200).json({ content: [{ type: "text", text: assistantText }], conversation_id: convId });

  } catch (err) {
    return res.status(200).json({ content: [{ type: "text", text: "Tengo problemas técnicos temporales. ¡Andrea te atenderá enseguida! 🙏" }] });
  }
}

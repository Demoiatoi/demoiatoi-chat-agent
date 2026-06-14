// Buscador de productos de Shopify para la pestaña "🛍️ Productos" del panel
// (reutiliza las mismas credenciales Admin que el estado de pedidos)
module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'GET') return res.status(405).end()

  try {
    const domain = process.env.SHOPIFY_STORE_DOMAIN
    const token = process.env.SHOPIFY_ADMIN_TOKEN
    if (!domain || !token) return res.status(200).json({ products: [], configured: false })

    const q = (req.query.q || '').trim()
    if (!q) return res.status(200).json({ products: [], configured: true })

    const query = `
      query($q: String!) {
        products(first: 10, query: $q) {
          edges {
            node {
              id
              title
              handle
              featuredImage { url }
              priceRangeV2 { minVariantPrice { amount } }
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
      body: JSON.stringify({ query, variables: { q: `title:*${q}*` } })
    })
    if (!resp.ok) return res.status(200).json({ products: [], configured: true })

    const json = await resp.json()
    const products = (json?.data?.products?.edges || []).map(({ node }) => ({
      id: (node.id.match(/(\d+)$/) || [])[1] || node.id,
      title: node.title,
      price: node.priceRangeV2?.minVariantPrice?.amount || '',
      img: node.featuredImage?.url || '',
      url: `https://demoiatoi.com/products/${node.handle}`
    }))

    return res.status(200).json({ products, configured: true })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: err.message })
  }
}

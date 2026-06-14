module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()

  // Diagnóstico temporal: indica si la variable de entorno existe y su longitud,
  // sin revelar el valor. Quitar una vez resuelto el problema de login.
  if (req.method === 'GET') {
    const val = process.env.PANEL_PASSWORD || ''
    return res.status(200).json({ exists: !!process.env.PANEL_PASSWORD, length: val.length })
  }

  if (req.method !== 'POST') return res.status(405).end()

  const { password } = req.body || {}
  const ok = !!password && !!process.env.PANEL_PASSWORD && password === process.env.PANEL_PASSWORD

  return res.status(ok ? 200 : 401).json({ ok })
}

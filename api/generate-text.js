export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  const { prompt = '', type = 'script', model = 'openrouter/auto', tone = '', audience = '' } = body;

  // Fallback local, caso ainda nao exista chave configurada.
  if (!process.env.OPENROUTER_API_KEY) {
    return res.status(200).json({
      type: 'text',
      output:
`SAIDA LOCAL (${type.toUpperCase()})\n\nPrompt: ${prompt}\nTom: ${tone}\nPublico: ${audience}\n\nConfigure OPENROUTER_API_KEY para gerar texto real no servidor.`
    });
  }

  const system = 'Voce e um assistente de producao audiovisual. Gere saidas limpas, organizadas e em portugues.';
  const user = `Tipo: ${type}\nPrompt: ${prompt}\nTom: ${tone}\nPublico: ${audience}\n\nEntregue uma saida pronta para uso.`;

  const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'HTTP-Referer': process.env.SITE_URL || 'https://example.com',
      'X-Title': 'Portal Genesis Mega Studio'
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user }
      ]
    })
  });

  const data = await r.json();
  const output = data?.choices?.[0]?.message?.content || 'Sem resposta do modelo.';
  return res.status(200).json({ type: 'text', output });
}

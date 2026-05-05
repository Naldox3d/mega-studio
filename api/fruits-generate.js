export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ error: 'Método não permitido' }));
  }

  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({
        error: 'ANTHROPIC_API_KEY não configurada na Vercel.'
      }));
    }

    const body = req.body || {};
    const model = body.model || 'claude-sonnet-4-6';
    const system = body.system || 'Você é o Fruits Copilot.';
    const prompt = body.prompt || body.messages?.[0]?.content || '';
    const maxTokens = Number(body.max_tokens || body.maxTokens || 3000);
    const temperature = Number(body.temperature ?? 0.55);

    const userContent = Array.isArray(prompt)
      ? prompt
      : [{ type: 'text', text: String(prompt) }];

    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
        temperature,
        system,
        messages: [
          {
            role: 'user',
            content: userContent
          }
        ]
      })
    });

    const data = await anthropicRes.json();

    if (!anthropicRes.ok) {
      res.statusCode = anthropicRes.status;
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({
        error: data.error?.message || 'Erro na Claude API',
        details: data
      }));
    }

    const text = Array.isArray(data.content)
      ? data.content.map(part => part.text || '').join('\n')
      : '';

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({
      ok: true,
      text,
      raw: data
    }));
  } catch (error) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({
      error: error.message || 'Erro interno no backend Fruits'
    }));
  }
}

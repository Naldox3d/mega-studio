export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const {
      prompt = '',
      model = 'claude-sonnet-4-5',
      max_tokens = 4200,
      temperature = 0.58,
      provider = 'claude'
    } = req.body || {};

    if (!process.env.ANTHROPIC_API_KEY) {
      res.status(500).json({
        error: 'ANTHROPIC_API_KEY não configurada na Vercel.',
        details: 'Configure a variável de ambiente antes de usar /api/generate-video.'
      });
      return;
    }

    const system = `Você é o agente Video Pack Studio.
Sua função é gerar pacotes avançados para vídeo sem renderizar MP4.

Regras:
- Não renderize vídeo.
- Não prometa download MP4.
- Entregue roteiro visual, JSON Remotion, SRT, plano de som, prompt CapCut, prompt para ferramentas de vídeo e checklist.
- Use somente o briefing atual.
- Não importe personagens, cenas ou projetos antigos.
- Seja técnico, prático e profissional.
- Quando gerar JSON, faça estrutura clara e reutilizável.`;

    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model,
        max_tokens: Number(max_tokens) || 4200,
        temperature: Number(temperature) || 0.58,
        system,
        messages: [
          {
            role: 'user',
            content: String(prompt || '')
          }
        ]
      })
    });

    const data = await anthropicRes.json();

    if (!anthropicRes.ok) {
      res.status(anthropicRes.status).json({
        error: data.error?.message || 'Erro na API Anthropic',
        details: data
      });
      return;
    }

    const text = Array.isArray(data.content)
      ? data.content.map(part => part.text || '').join('\n')
      : '';

    const inputTokens = data.usage?.input_tokens || 0;
    const outputTokens = data.usage?.output_tokens || 0;

    res.status(200).json({
      ok: true,
      provider,
      model,
      text,
      usage: data.usage || null,
      cost_note: 'Estimativa exata depende do preço atual do modelo. Este endpoint gera texto/JSON/SRT, não MP4.',
      tokens: {
        input: inputTokens,
        output: outputTokens,
        total: inputTokens + outputTokens
      },
      raw: data
    });
  } catch (error) {
    res.status(500).json({
      error: error.message || 'Erro interno no backend Video Pack'
    });
  }
}

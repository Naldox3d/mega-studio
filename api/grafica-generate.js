const PRICE_TABLE = {
  'claude-haiku-4-5': { input: 1, output: 5 },
  'claude-sonnet-4-6': { input: 3, output: 15 },
  'claude-opus-4-7': { input: 5, output: 25 }
};

function estimateCostUsd(model, usage = {}) {
  const prices = PRICE_TABLE[model] || PRICE_TABLE['claude-sonnet-4-6'];

  const inputTokens = Number(usage.input_tokens || 0);
  const outputTokens = Number(usage.output_tokens || 0);

  const inputCost = (inputTokens / 1_000_000) * prices.input;
  const outputCost = (outputTokens / 1_000_000) * prices.output;
  const totalCost = inputCost + outputCost;

  return {
    model,
    input_tokens: inputTokens,
    output_tokens: outputTokens,
    input_price_per_million: prices.input,
    output_price_per_million: prices.output,
    input_cost_usd: Number(inputCost.toFixed(6)),
    output_cost_usd: Number(outputCost.toFixed(6)),
    total_cost_usd: Number(totalCost.toFixed(6)),
    created_at: new Date().toISOString(),
    project: 'grafica'
  };
}

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
    const system = body.system || 'Você é um diretor de arte e consultor de gráfica no Brasil.';
    const maxTokens = Number(body.max_tokens || body.maxTokens || 2500);
    const temperature = Number(body.temperature ?? 0.45);

    let messages = body.messages;

    if (!Array.isArray(messages)) {
      const prompt = body.prompt || '';
      messages = [
        {
          role: 'user',
          content: String(prompt)
        }
      ];
    }

    const normalizedMessages = messages.map(message => ({
      role: message.role || 'user',
      content: Array.isArray(message.content)
        ? message.content
        : [{ type: 'text', text: String(message.content || '') }]
    }));

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
        messages: normalizedMessages
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

    const usage = data.usage || {};
    const cost = estimateCostUsd(model, usage);

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({
      ok: true,
      text,
      usage,
      cost,
      raw: data
    }));
  } catch (error) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({
      error: error.message || 'Erro interno no backend Gráfica'
    }));
  }
}

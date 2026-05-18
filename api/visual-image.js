export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const body =
    typeof req.body === 'string'
      ? JSON.parse(req.body || '{}')
      : (req.body || {});

  const {
    prompt = '',
    style = '',
    format = '',
    provider = 'pollinations',
    model = 'flux'
  } = body;

  if (!prompt.trim()) {
    return res.status(400).json({
      type: 'text',
      output: 'Prompt vazio. Escreva uma descrição para gerar a imagem.'
    });
  }

  // Pollinations
  if (provider === 'pollinations' || !process.env.IMAGE_PROVIDER) {
    const safeModel = model || process.env.POLLINATIONS_MODEL || 'flux';

    const finalPrompt = encodeURIComponent(
      `${prompt}. ${style}. ${format}. high quality, cinematic lighting`
    );

    const width = format.includes('16:9')
      ? 1280
      : format.includes('1:1')
        ? 1024
        : 1024;

    const height = format.includes('16:9')
      ? 720
      : format.includes('1:1')
        ? 1024
        : 1792;

    const url =
      `https://image.pollinations.ai/prompt/${finalPrompt}` +
      `?model=${encodeURIComponent(safeModel)}` +
      `&width=${width}` +
      `&height=${height}` +
      `&seed=${Date.now()}`;

    return res.status(200).json({
      type: 'image',
      provider: 'pollinations',
      model: safeModel,
      url,
      prompt
    });
  }

  return res.status(200).json({
    type: 'text',
    output: 'Configure IMAGE_PROVIDER no backend para integrar outro gerador de imagem.'
  });
}

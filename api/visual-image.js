export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  const { prompt = '', style = '', format = '', provider = 'pollinations' } = body;

  // Exemplo funcional simples com Pollinations (sem guardar chave no front).
  if (provider === 'pollinations' || !process.env.IMAGE_PROVIDER) {
    const finalPrompt = encodeURIComponent(`${prompt}. ${style}. ${format}. high quality, cinematic lighting`);
    const width = format.includes('16:9') ? 1280 : (format.includes('1:1') ? 1024 : 1024);
    const height = format.includes('16:9') ? 720 : (format.includes('1:1') ? 1024 : 1792);
    const url = `https://image.pollinations.ai/prompt/${finalPrompt}?width=${width}&height=${height}&seed=${Date.now()}`;
    return res.status(200).json({ type: 'image', url, prompt });
  }

  // Aqui voce pode plugar outro provedor de imagem via servidor.
  return res.status(200).json({
    type: 'text',
    output: 'Configure IMAGE_PROVIDER no backend para integrar outro gerador de imagem.'
  });
}

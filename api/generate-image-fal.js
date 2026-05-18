// api/generate-image-fal.js
// Geração de imagem com Flux + suporte a referência de imagem (image reference)

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const {
    prompt,
    size = "1024x1024",
    model = "flux-pro",
    referenceImage,      // URL da imagem de referência
    strength = 0.65,     // 0.0 = ignora referência | 1.0 = segue muito a referência
    negativePrompt = ""
  } = req.body;

  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'Prompt é obrigatório' });
  }

  const FAL_KEY = process.env.FAL_API_KEY;

  // Fallback caso não tenha chave
  if (!FAL_KEY) {
    const fallbackUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1024&height=1024`;
    return res.status(200).json({
      ok: true,
      type: 'image',
      provider: 'pollinations-fallback',
      url: fallbackUrl,
      prompt,
      warning: 'FAL_API_KEY não configurada. Usando fallback.'
    });
  }

  try {
    const modelPath = model === 'flux-pro' 
      ? 'fal-ai/flux-pro' 
      : 'fal-ai/flux/dev';

    const payload = {
      prompt: prompt.trim(),
      image_size: size,
      num_inference_steps: model === 'flux-pro' ? 28 : 25,
      guidance_scale: 3.5,
      ...(negativePrompt && { negative_prompt: negativePrompt }),
    };

    // === SUPORTE A REFERÊNCIA DE IMAGEM ===
    if (referenceImage && typeof referenceImage === 'string') {
      payload.image_url = referenceImage;
      payload.strength = Math.max(0.1, Math.min(0.95, Number(strength))); // limita entre 0.1 e 0.95
    }

    const response = await fetch(`https://fal.run/${modelPath}`, {
      method: 'POST',
      headers: {
        'Authorization': `Key ${FAL_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Fal.ai error:', data);
      return res.status(response.status).json({
        error: data.detail || data.message || 'Erro na Fal.ai',
        details: data
      });
    }

    const imageUrl = data.images?.[0]?.url || data.image?.url;

    if (!imageUrl) {
      throw new Error('Nenhuma imagem retornada pela API');
    }

    return res.status(200).json({
      ok: true,
      type: 'image',
      provider: 'fal',
      model,
      url: imageUrl,
      prompt,
      usedReference: !!referenceImage,
      strength: payload.strength || null
    });

  } catch (error) {
    console.error('Erro ao gerar imagem:', error);
    return res.status(500).json({
      error: 'Falha ao gerar imagem com Flux',
      details: error.message
    });
  }
}

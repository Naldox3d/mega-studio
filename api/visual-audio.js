export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  const { prompt = '', model = process.env.ELEVENLABS_VOICE_ID || 'EXAVITQu4vr4xnSDxMaL' } = body;

  if (!process.env.ELEVENLABS_API_KEY) {
    return res.status(200).json({
      type: 'text',
      output: `AUDIO LOCAL\n\nTexto para narracao:\n${prompt}\n\nConfigure ELEVENLABS_API_KEY para retornar o audio real.`
    });
  }

  const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${model}`, {
    method: 'POST',
    headers: {
      'xi-api-key': process.env.ELEVENLABS_API_KEY,
      'Content-Type': 'application/json',
      'Accept': 'audio/mpeg'
    },
    body: JSON.stringify({
      text: prompt,
      model_id: process.env.ELEVENLABS_MODEL_ID || 'eleven_multilingual_v2',
      voice_settings: { stability: 0.45, similarity_boost: 0.75 }
    })
  });

  if (!r.ok) {
    const errText = await r.text();
    return res.status(500).json({ type: 'text', output: 'Falha ao gerar audio: ' + errText });
  }

  const arrayBuffer = await r.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString('base64');
  return res.status(200).json({ type: 'audio', base64, text: prompt });
}

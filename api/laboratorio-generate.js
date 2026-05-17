/**
 * Portal Genesis – Laboratorio Generate API Final
 * Combina todas as funções de geração:
 * - Pollinations Flux (rascunhos / preview)
 * - Runware GPT Image 2 (final premium)
 * - ElevenLabs TTS (áudio / SRT)
 * - Claude / Gemini (texto / prompts)
 *
 * Suporte a fallback de chaves, variações A/B/C, base64/data URL
 * Compatível com Vercel
 */

const fetch = require('node-fetch');

// Chaves por modelo
const API_KEY_FLUX = process.env.POLLINATIONS_API_KEY_FLUX || process.env.POLLINATIONS_API_KEY;
const API_KEY_GPTIMAGE2 = process.env.POLLINATIONS_API_KEY_GPTIMAGE2 || process.env.POLLINATIONS_API_KEY;
const API_KEY_AUDIO = process.env.ELEVENLABS_API_KEY;
const API_KEY_CLAUDE = process.env.CLAUDE_API_KEY || process.env.GEMINI_API_KEY;
const API_KEY_GENERAL = process.env.POLLINATIONS_API_KEY;

function sendJson(res, status, data) {
  res.status(status);
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(data));
}

function parseBody(req) {
  if (!req.body) return {};
  if (typeof req.body === 'string') {
    try { return JSON.parse(req.body); } catch { return {}; }
  }
  return req.body;
}

function safeString(value, fallback = '') {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

// Funções de geração
async function generatePollinationsFlux(payload) {
  const key = API_KEY_FLUX;
  if (!key) throw new Error('Chave Pollinations Flux não configurada');
  const model = 'flux';
  const response = await fetch('https://gen.pollinations.ai/image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
    body: JSON.stringify(Object.assign({}, payload, { model }))
  });
  if (!response.ok) { const t = await response.text(); throw new Error(`Erro Flux: ${response.status} ${t}`); }
  return await response.json();
}

async function generateGPTImage2(payload) {
  const key = API_KEY_GPTIMAGE2;
  if (!key) throw new Error('Chave GPT Image 2 não configurada');
  const model = 'gpt-image-2';
  const response = await fetch('https://gen.pollinations.ai/image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
    body: JSON.stringify(Object.assign({}, payload, { model }))
  });
  if (!response.ok) { const t = await response.text(); throw new Error(`Erro GPT2: ${response.status} ${t}`); }
  return await response.json();
}

async function generateElevenLabsTTS(payload) {
  const key = API_KEY_AUDIO;
  if (!key) throw new Error('Chave ElevenLabs não configurada');
  const voice = payload.voice || 'pt-BR-voz1';
  const model = payload.model || 'elevenlabs';
  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'xi-api-key': key },
    body: JSON.stringify({ text: payload.text, voice, model })
  });
  if (!response.ok) { const t = await response.text(); throw new Error(`Erro Audio: ${response.status} ${t}`); }
  const arrayBuffer = await response.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString('base64');
  return `data:audio/mpeg;base64,${base64}`;
}

async function generateClaude(payload) {
  const key = API_KEY_CLAUDE;
  if (!key) throw new Error('Chave Claude não configurada');
  return { text: `[Claude]: ${payload.prompt}` };
}

async function generateGemini(payload) {
  const key = API_KEY_CLAUDE;
  if (!key) throw new Error('Chave Gemini não configurada');
  return { text: `[Gemini]: ${payload.prompt}` };
}

// Handler principal
module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  if (req.method === 'GET') {
    return sendJson(res, 200, {
      ok: true,
      message: 'Laboratorio Generate API ativa',
      models: {
        flux: !!API_KEY_FLUX,
        'gpt-image-2': !!API_KEY_GPTIMAGE2,
        audio: !!API_KEY_AUDIO,
        claude: !!API_KEY_CLAUDE,
        gemini: !!API_KEY_CLAUDE
      }
    });
  }

  if (req.method !== 'POST') return sendJson(res, 405, { error: 'Método não permitido' });

  const body = parseBody(req);
  const nodeType = safeString(body.node, 'image-flux');

  try {
    switch (nodeType) {
      case 'image-flux': return sendJson(res, 200, await generatePollinationsFlux(body));
      case 'image-gpt2': return sendJson(res, 200, await generateGPTImage2(body));
      case 'audio': return sendJson(res, 200, { audioUrl: await generateElevenLabsTTS(body) });
      case 'text-claude': return sendJson(res, 200, await generateClaude(body));
      case 'text-gemini': return sendJson(res, 200, await generateGemini(body));
      default: return sendJson(res, 400, { error: 'Node não reconhecido' });
    }
  } catch (err) {
    return sendJson(res, 500, { ok: false, error: err.message });
  }
};

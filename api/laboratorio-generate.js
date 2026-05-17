/**
 * Portal Genesis – API Laboratório Unificado (Pollinations + GPT Image + ElevenLabs + LTX-2.3)
 * Arquivo: api/laboratorio-generate.js
 *
 * Suporta:
 *  - Flux Schnell (rascunho / pré-visualização)
 *  - GPT Image 2 (final premium)
 *  - ElevenLabs v3 TTS (áudio)
 *  - LTX-2.3 (vídeo)
 *
 * Variáveis de ambiente recomendadas:
 *  - POLLINATIONS_API_KEY_FLUX=sk_...
 *  - POLLINATIONS_API_KEY_GPTIMAGE2=sk_...
 *  - POLLINATIONS_API_KEY_LTX=sk_...
 *  - POLLINATIONS_API_KEY_AUDIO=sk_...
 *
 * Endpoint:
 *  - POST /api/laboratorio-generate -> gera imagem / vídeo / áudio
 */

const fetch = require("node-fetch");

// Bases de URL
const POLLINATIONS_IMAGE_BASE = "https://gen.pollinations.ai/image";
const POLLINATIONS_VIDEO_BASE = "https://gen.pollinations.ai/video";
const POLLINATIONS_AUDIO_BASE = "https://gen.pollinations.ai/audio";

// Funções auxiliares
function sendJson(res, status, data) {
  res.status(status);
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(data));
}

function safeString(value, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function parseBody(req) {
  if (!req.body) return {};
  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  return req.body;
}

// Função principal de geração
async function generateContent(req, res) {
  const body = parseBody(req);
  const { type, prompt, model, size = "1024x1024", extra = {} } = body;

  if (!prompt || !type) {
    return sendJson(res, 400, { error: "Parâmetros obrigatórios 'type' e 'prompt' não informados." });
  }

  try {
    let apiUrl = "";
    let headers = {};
    let payload = {};

    switch (type) {
      case "image":
        const imageModel = safeString(model, "flux");
        apiUrl = POLLINATIONS_IMAGE_BASE;
        headers = { "Authorization": `Bearer ${process.env[`POLLINATIONS_API_KEY_${imageModel.toUpperCase()}`]}` };
        payload = { prompt, model: imageModel, size, ...extra };
        break;

      case "video":
        const videoModel = safeString(model, "ltx-2");
        apiUrl = POLLINATIONS_VIDEO_BASE;
        headers = { "Authorization": `Bearer ${process.env.POLLINATIONS_API_KEY_LTX}` };
        payload = { prompt, model: videoModel, size, ...extra };
        break;

      case "audio":
        const audioModel = safeString(model, "elevenlabs");
        apiUrl = POLLINATIONS_AUDIO_BASE;
        headers = { "Authorization": `Bearer ${process.env.POLLINATIONS_API_KEY_AUDIO}` };
        payload = { prompt, model: audioModel, ...extra };
        break;

      default:
        return sendJson(res, 400, { error: `Tipo '${type}' não suportado.` });
    }

    const fetchRes = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify(payload),
    });

    if (!fetchRes.ok) {
      const errText = await fetchRes.text();
      return sendJson(res, fetchRes.status, { error: errText });
    }

    const data = await fetchRes.json();
    // Retornar como base64 / Data URL
    if (data.output_base64) {
      data.output_data_url = `data:${data.mime_type};base64,${data.output_base64}`;
    }

    sendJson(res, 200, data);
  } catch (err) {
    sendJson(res, 500, { error: err.message });
  }
}

// Exporta handler para Vercel / Node
module.exports = generateContent;

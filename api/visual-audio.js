/**
 * Portal Genesis – API de Áudio (TTS)
 * Arquivo: /api/visual-audio.js
 *
 * Suporta:
 * - ElevenLabs v3 TTS
 * - Qwen3-TTS Flash / Instruct (se quiser expandir)
 *
 * Variáveis de ambiente:
 * - AUDIO_API_KEY=sk_...           // chave principal ElevenLabs
 * - AUDIO_MODEL=elevenlabs         // modelo padrão
 *
 * Endpoint:
 * - GET  /api/visual-audio -> status da API
 * - POST /api/visual-audio -> gerar áudio
 */

const fetch = require("node-fetch");

const MODEL_DEFAULT = process.env.AUDIO_MODEL || "elevenlabs";
const API_KEY = process.env.AUDIO_API_KEY;

function sendJson(res, status, data) {
  res.status(status);
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(data));
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

// Função para chamar ElevenLabs TTS
async function generateAudio(payload) {
  const text = payload.text || payload.prompt;
  const voice = payload.voice || "pt-BR-voz1";
  const model = payload.model || MODEL_DEFAULT;

  if (!text) throw new Error("Texto é obrigatório para gerar áudio.");
  if (!API_KEY) throw new Error("Chave de API de áudio não configurada.");

  const apiUrl = `https://api.elevenlabs.io/v1/text-to-speech/${voice}`;

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "xi-api-key": API_KEY,
    },
    body: JSON.stringify({
      text,
      model: model,
      voice: voice,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Erro ao gerar áudio: ${response.status} - ${errText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const base64Audio = Buffer.from(arrayBuffer).toString("base64");
  return `data:audio/mpeg;base64,${base64Audio}`;
}

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") return res.status(204).end();

  if (req.method === "GET") {
    return sendJson(res, 200, {
      ok: true,
      route: "/api/visual-audio",
      provider: "elevenlabs",
      model: MODEL_DEFAULT,
      hasKey: !!API_KEY,
      message: "API de áudio ativa. Use POST para gerar TTS.",
    });
  }

  if (req.method !== "POST") {
    return sendJson(res, 405, { ok: false, error: "Método não permitido" });
  }

  const payload = parseBody(req);

  try {
    const audioDataUrl = await generateAudio(payload);
    return sendJson(res, 200, {
      ok: true,
      audioUrl: audioDataUrl,
      message: "Áudio gerado com sucesso",
    });
  } catch (err) {
    return sendJson(res, 500, {
      ok: false,
      error: err.message || "Erro interno ao gerar áudio",
    });
  }
};

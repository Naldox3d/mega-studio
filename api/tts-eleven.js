import { readBody, sendJson } from "./_utils.js";

export default async function handler(req, res) {
  if (req.method === "GET") {
    return sendJson(res, 200, {
      ok: true,
      route: "/api/tts-eleven",
      configured: Boolean(process.env.ELEVENLABS_API_KEY),
      message: "Placeholder ElevenLabs TTS ativo."
    });
  }

  if (req.method !== "POST") {
    return sendJson(res, 405, { ok: false, error: "Metodo nao permitido. Use POST." });
  }

  const body = await readBody(req);
  const text = String(body.text || "").trim();
  if (!text) {
    return sendJson(res, 400, { ok: false, error: "Texto ausente para TTS." });
  }

  return sendJson(res, 200, {
    ok: true,
    configured: Boolean(process.env.ELEVENLABS_API_KEY),
    provider: "elevenlabs-placeholder",
    text,
    message: "TTS preparado. Configure ELEVENLABS_API_KEY e ELEVENLABS_VOICE_ID para audio real."
  });
}

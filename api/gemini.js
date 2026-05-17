import { localAiText, readBody, sendJson } from "./_utils.js";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", req.headers?.origin || "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return sendJson(res, 204, {});
  if (req.method !== "POST") {
    return sendJson(res, 405, { ok: false, error: "Metodo nao permitido. Use POST." });
  }

  const body = await readBody(req);
  const prompt = String(body.prompt || body.text || "").trim();
  if (!prompt) return sendJson(res, 400, { ok: false, error: "Envie prompt ou text." });

  if (!process.env.GEMINI_API_KEY) {
    return sendJson(res, 200, {
      ok: true,
      provider: "local-placeholder",
      configured: false,
      text: localAiText("gemini", prompt)
    });
  }

  try {
    const model = String(body.model || process.env.GEMINI_MODEL || "gemini-3-flash-preview");
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": process.env.GEMINI_API_KEY
      },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: Number(body.temperature ?? 0.7),
          maxOutputTokens: Number(body.maxOutputTokens || body.max_tokens || 1800)
        }
      })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return sendJson(res, 200, {
        ok: true,
        provider: "local-placeholder",
        error: data.error?.message || "Erro ao chamar Gemini API.",
        configured: true,
        text: localAiText("gemini", prompt),
        details: data
      });
    }
    const text = (data.candidates?.[0]?.content?.parts || []).map((part) => part.text || "").join("\n").trim();
    return sendJson(res, 200, { ok: true, provider: "gemini", model, text, usage: data.usageMetadata || null });
  } catch (error) {
    return sendJson(res, 500, { ok: false, error: error.message || "Erro interno na rota Gemini." });
  }
}

// api/gemini.js
// Studio Platform / Mega Studio
// Rota segura para usar GEMINI_API_KEY no backend da Vercel.
// NUNCA coloque GEMINI_API_KEY dentro de HTML publico.

export default async function handler(req, res) {
  // CORS basico para chamadas do mesmo projeto e testes.
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", req.headers.origin || "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({
      ok: false,
      error: "Metodo nao permitido. Use POST."
    });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      ok: false,
      error: "GEMINI_API_KEY nao configurada no Vercel."
    });
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});

    const prompt = String(body.prompt || body.text || "").trim();
    if (!prompt) {
      return res.status(400).json({
        ok: false,
        error: "Envie um campo prompt ou text."
      });
    }

    const model = String(body.model || process.env.GEMINI_MODEL || "gemini-3-flash-preview");
    const temperature = Number.isFinite(Number(body.temperature)) ? Number(body.temperature) : 0.7;
    const maxOutputTokens = Number.isFinite(Number(body.maxOutputTokens || body.max_tokens))
      ? Number(body.maxOutputTokens || body.max_tokens)
      : 1800;

    const system = String(body.system || "").trim();

    const finalPrompt = system
      ? `${system}\n\nPEDIDO:\n${prompt}`
      : prompt;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: finalPrompt }]
          }
        ],
        generationConfig: {
          temperature,
          maxOutputTokens
        }
      })
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return res.status(response.status).json({
        ok: false,
        provider: "gemini",
        model,
        error: data?.error?.message || "Erro ao chamar Gemini API.",
        details: data?.error || data
      });
    }

    const parts = data?.candidates?.[0]?.content?.parts || [];
    const text = parts.map((p) => p.text || "").join("\n").trim();

    return res.status(200).json({
      ok: true,
      provider: "gemini",
      model,
      text,
      usage: data?.usageMetadata || null
    });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      error: err?.message || "Erro interno na rota Gemini."
    });
  }
}

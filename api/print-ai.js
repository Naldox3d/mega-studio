// api/print-ai.js
// Rota especifica para o Print Remotion.
// Ela usa Gemini para gerar copy, prompt de imagem e direcao visual.
// A imagem final vem depois: IA gera base visual + site compoe texto e exporta.

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", req.headers.origin || "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(204).end();

  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Metodo nao permitido. Use POST." });
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

    const tipo = body.tipo || body.servico || "post social";
    const formato = body.formato || "1080x1350px";
    const publico = body.publico || "clientes locais";
    const objetivo = body.objetivo || "atrair clientes e gerar contato";
    const produto = body.produto || "produto ou servico do cliente";
    const estilo = body.estilo || "moderno, chamativo, profissional";
    const observacoes = body.observacoes || body.briefing || "";

    const model = String(body.model || process.env.GEMINI_MODEL || "gemini-3-flash-preview");

    const prompt = `
Voce e o motor de copy e direcao visual do Print Remotion, uma ferramenta profissional de grafica, marketing e pre-impressao.

Gere uma saida em JSON valido, sem markdown, sem comentarios, com estes campos:
{
  "titulo": "...",
  "subtitulo": "...",
  "cta": "...",
  "texto_curto": "...",
  "direcao_visual": "...",
  "prompt_imagem_base": "...",
  "negative_prompt": "...",
  "layout": {
    "formato": "...",
    "hierarquia": ["...", "..."],
    "area_segura": "...",
    "observacao_pre_impressao": "..."
  }
}

Regras:
- Nao invente telefone, preco ou endereco se nao forem informados.
- Nao coloque texto demais na arte.
- A IA deve gerar a base visual, mas textos finais devem ser aplicados pelo site.
- A saida deve servir para trabalho real de designer/grafica.
- Use Portugues do Brasil.

BRIEFING:
Tipo de servico: ${tipo}
Formato: ${formato}
Produto/servico: ${produto}
Publico: ${publico}
Objetivo: ${objetivo}
Estilo: ${estilo}
Observacoes: ${observacoes}
`.trim();

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey
      },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.65,
          maxOutputTokens: 2200,
          responseMimeType: "application/json"
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

    const text = (data?.candidates?.[0]?.content?.parts || [])
      .map((p) => p.text || "")
      .join("\n")
      .trim();

    let parsed = null;
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = null;
    }

    return res.status(200).json({
      ok: true,
      provider: "gemini",
      model,
      result: parsed,
      text,
      usage: data?.usageMetadata || null
    });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      error: err?.message || "Erro interno na rota Print AI."
    });
  }
}

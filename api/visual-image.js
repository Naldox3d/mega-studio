/**
 * Portal Genesis Print Remotion – API Visual Pollinations Flux + GPT Image 2
 * Arquivo atualizado para substituir o antigo visual-image.js
 *
 * Variáveis obrigatórias na Vercel:
 *   - POLLINATIONS_API_KEY=sk_...
 *
 * Variável opcional:
 *   - POLLINATIONS_IMAGE_MODEL=flux (ou gpt-image-2)
 *
 * Endpoint usado pelo HTML:
 *   - /api/visual-image
 */

const POLLINATIONS_IMAGE_BASE = "https://gen.pollinations.ai/image";

/**
 * Função auxiliar para enviar JSON de resposta
 */
function sendJson(res, status, data) {
  res.status(status);
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(data));
}

/**
 * Função auxiliar para garantir string segura
 */
function safeString(value, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

/**
 * Parse do corpo da requisição
 */
function parseBody(req) {
  if (!req.body) return {};
  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body);
    } catch (e) {
      return {};
    }
  }
  return req.body;
}

/**
 * Normaliza tamanho de imagem
 */
function normalizeSize(size = "1024x1024") {
  const clean = String(size || "").toLowerCase().trim();
  const match = clean.match(/^(\d{2,5})x(\d{2,5})$/);
  if (match) return `${match[1]}x${match[2]}`;
  return "1024x1024";
}

/**
 * Função principal de criação de imagem
 */
export default async function handler(req, res) {
  const body = parseBody(req);
  const prompt = safeString(body.prompt, "");
  const size = normalizeSize(body.size);
  const model = safeString(body.model, process.env.POLLINATIONS_IMAGE_MODEL || "flux");

  if (!prompt) {
    sendJson(res, 400, { error: "Prompt is required" });
    return;
  }

  const payload = {
    prompt,
    size,
    model
  };

  try {
    const response = await fetch(POLLINATIONS_IMAGE_BASE, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.POLLINATIONS_API_KEY}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errText = await response.text();
      sendJson(res, response.status, { error: errText });
      return;
    }

    const data = await response.json();
    sendJson(res, 200, { success: true, data });

  } catch (err) {
    sendJson(res, 500, { error: err.message });
  }
}

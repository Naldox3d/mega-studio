import { readBody, sendJson } from "./_utils.js";

export default async function handler(req, res) {
  if (req.method === "GET") {
    return sendJson(res, 200, {
      ok: true,
      route: "/api/gpt-image-2",
      configured: Boolean(process.env.OPENAI_API_KEY),
      message: "Placeholder pronto para GPT Image 2."
    });
  }

  if (req.method !== "POST") {
    return sendJson(res, 405, { ok: false, error: "Metodo nao permitido. Use POST." });
  }

  const body = await readBody(req);
  return sendJson(res, 200, {
    ok: true,
    configured: Boolean(process.env.OPENAI_API_KEY),
    provider: "openai-placeholder",
    prompt: body.prompt || body.instruction || "",
    message: "GPT Image 2 referenciado. Conecte a rota ao provedor quando a chave/modelo forem definidos."
  });
}

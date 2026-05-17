import { localAiText, readBody, sendJson } from "./_utils.js";

export default async function handler(req, res) {
  if (req.method === "OPTIONS") return sendJson(res, 204, {});
  if (req.method !== "POST") {
    return sendJson(res, 405, { ok: false, error: "Metodo nao permitido. Use POST." });
  }

  const body = await readBody(req);
  const briefing = [
    `Tipo: ${body.tipo || body.servico || "post social"}`,
    `Formato: ${body.formato || "1080x1350px"}`,
    `Produto: ${body.produto || "produto ou servico"}`,
    `Publico: ${body.publico || "clientes locais"}`,
    `Objetivo: ${body.objetivo || "atrair clientes"}`,
    `Estilo: ${body.estilo || "moderno e profissional"}`,
    `Observacoes: ${body.observacoes || body.briefing || ""}`
  ].join("\n");

  if (!process.env.GEMINI_API_KEY) {
    return sendJson(res, 200, {
      ok: true,
      provider: "local-placeholder",
      configured: false,
      result: {
        titulo: "Titulo curto da campanha",
        subtitulo: "Mensagem direta para o publico local",
        cta: "Fale com a PG",
        texto_curto: "Copy pronta para revisar.",
        direcao_visual: "Imagem base sem texto, produto claro e area segura.",
        prompt_imagem_base: briefing,
        negative_prompt: "watermark, texto ilegivel, logo falso, baixa qualidade",
        layout: {
          formato: body.formato || "1080x1350px",
          hierarquia: ["titulo", "produto", "cta"],
          area_segura: "10% de margem",
          observacao_pre_impressao: "Conferir sangria, cor e fontes antes da entrega."
        }
      },
      text: localAiText("print-ai", briefing)
    });
  }

  return sendJson(res, 200, {
    ok: true,
    provider: "gemini-ready",
    configured: true,
    text: localAiText("print-ai", briefing)
  });
}

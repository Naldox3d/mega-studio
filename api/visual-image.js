import { readBody, sendJson } from "./_utils.js";

const POLLINATIONS_IMAGE_BASE = "https://gen.pollinations.ai/image";

function normalizeSize(size = "1024x1024") {
  const match = String(size).toLowerCase().trim().match(/^(\d{2,5})x(\d{2,5})$/);
  if (!match) return { width: 1024, height: 1024, label: "1024x1024" };
  const width = Math.max(256, Math.min(Number(match[1]), 2048));
  const height = Math.max(256, Math.min(Number(match[2]), 2048));
  return { width, height, label: `${width}x${height}` };
}

function buildPrompt(body) {
  const prompt = body.prompt || body.visualPrompt || body.visual_prompt || body.instruction || "";
  const kind = body.outputKind || body.output_kind || "Portal Genesis professional image";
  const negative = body.negativePrompt || body.negative_prompt || "watermark, unreadable text, fake logo, distorted product, blur, artifacts, low quality";
  return [
    "Create a professional high quality commercial image for Portal Genesis.",
    `Output: ${kind}`,
    `Instruction: ${prompt}`,
    "Rules: realistic proportions, clean composition, coherent light, polished finish, no fake logos, no unreadable text.",
    `Negative prompt: ${negative}`
  ].join("\n");
}

async function fetchImageAsDataUrl(url) {
  const response = await fetch(url, { headers: { Accept: "image/png,image/jpeg,image/webp,*/*" } });
  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`Pollinations falhou: ${response.status} ${text}`.trim());
  }
  const contentType = response.headers.get("content-type") || "image/png";
  if (!contentType.startsWith("image/")) {
    throw new Error(`Pollinations nao retornou imagem. Content-Type: ${contentType}`);
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  return `data:${contentType};base64,${buffer.toString("base64")}`;
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") return sendJson(res, 204, {});
  if (req.method === "GET") {
    return sendJson(res, 200, {
      ok: true,
      route: "/api/visual-image",
      provider: "pollinations",
      model: process.env.POLLINATIONS_IMAGE_MODEL || "flux",
      configured: Boolean(process.env.POLLINATIONS_API_KEY)
    });
  }
  if (req.method !== "POST") {
    return sendJson(res, 405, { ok: false, error: "Metodo nao permitido. Use POST." });
  }

  const body = await readBody(req);
  const prompt = body.prompt || body.visualPrompt || body.visual_prompt || body.instruction;
  if (!prompt) {
    return sendJson(res, 400, { ok: false, error: "Prompt visual ausente." });
  }

  if (!process.env.POLLINATIONS_API_KEY) {
    return sendJson(res, 200, {
      ok: true,
      configured: false,
      visualGenerated: false,
      provider: "pollinations",
      model: process.env.POLLINATIONS_IMAGE_MODEL || "flux",
      prompt: buildPrompt(body),
      message: "Flux preparado. Configure POLLINATIONS_API_KEY para gerar imagem."
    });
  }

  try {
    const model = body.model || body.imageModel || process.env.POLLINATIONS_IMAGE_MODEL || "flux";
    const size = normalizeSize(body.size || "1024x1024");
    const seed = Number.isFinite(Number(body.seed)) ? Math.floor(Number(body.seed)) : Math.floor(Math.random() * 2147483647);
    const params = new URLSearchParams({
      model,
      key: process.env.POLLINATIONS_API_KEY,
      width: String(size.width),
      height: String(size.height),
      seed: String(seed),
      nologo: "true",
      private: "true"
    });
    const url = `${POLLINATIONS_IMAGE_BASE}/${encodeURIComponent(buildPrompt(body))}?${params.toString()}`;
    const image = await fetchImageAsDataUrl(url);
    return sendJson(res, 200, {
      ok: true,
      configured: true,
      visualGenerated: true,
      provider: "pollinations",
      model,
      image,
      images: [{ dataUrl: image, provider: "pollinations", model }]
    });
  } catch (error) {
    return sendJson(res, 200, {
      ok: true,
      configured: Boolean(process.env.POLLINATIONS_API_KEY),
      visualGenerated: false,
      provider: "pollinations",
      prompt: buildPrompt(body),
      warning: error.message || "Erro ao gerar imagem. Fallback visual usado."
    });
  }
}

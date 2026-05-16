/**
 * Portal Genesis Print Remotion — API Visual Pollinations Flux
 * Arquivo de produção Vercel: api/visual-image.js
 *
 * Variável obrigatória na Vercel:
 * - POLLINATIONS_API_KEY=sk_...
 *
 * Variável opcional:
 * - POLLINATIONS_IMAGE_MODEL=flux
 *
 * Endpoint usado pelo HTML:
 * - /api/visual-image
 */

const POLLINATIONS_IMAGE_BASE = "https://gen.pollinations.ai/image";

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

function normalizeSize(size = "1024x1024") {
  const clean = String(size || "").toLowerCase().trim();
  const match = clean.match(/^(\d{2,5})x(\d{2,5})$/);

  if (!match) {
    return {
      width: 1024,
      height: 1024,
      label: "1024x1024",
    };
  }

  const width = Math.max(256, Math.min(Number(match[1]), 2048));
  const height = Math.max(256, Math.min(Number(match[2]), 2048));

  return {
    width,
    height,
    label: `${width}x${height}`,
  };
}

function buildVariantRules(variantLabel) {
  const label = safeString(variantLabel, "A").toUpperCase();

  const rules = {
    A: "VERSION A: maximum fidelity, clean composition, realistic proportions, coherent lighting and professional finish.",
    B: "VERSION B: more premium advertising finish, refined lighting, elegant contrast, polished commercial texture.",
    C: "VERSION C: stronger visual impact for ads, social media, banners and storefronts while preserving realism and identity.",
  };

  return rules[label] || rules.A;
}

function buildPollinationsPrompt(payload, variantLabel = "A") {
  const userPrompt =
    payload.prompt ||
    payload.visualPrompt ||
    payload.visual_prompt ||
    payload.instruction ||
    "";

  const negativePrompt =
    payload.negativePrompt ||
    payload.negative_prompt ||
    "watermark, unreadable text, fake logo, distorted product, deformed hands, low quality, blur, artifacts, low resolution, bad anatomy, duplicated limbs";

  const outputKind = safeString(
    payload.outputKind || payload.output_kind || payload.kind || payload.type,
    "professional final image"
  );

  const mode = safeString(payload.mode || payload.action, "generate");
  const size = safeString(payload.size, "1024x1024");
  const quality = safeString(payload.quality, "high");

  return `
Create a professional high-quality image for Portal Genesis Print Remotion.

OUTPUT TYPE:
${outputKind}

MODE:
${mode}

REQUESTED SIZE / ASPECT:
${size}

QUALITY:
${quality}

VARIATION DIRECTION:
${buildVariantRules(variantLabel)}

MAIN USER INSTRUCTION:
${userPrompt}

PRODUCTION RULES:
- Follow the user's instruction with maximum fidelity.
- Keep realistic proportions, natural lighting, clean composition and professional commercial quality.
- If the prompt asks for a product, keep the product clear, recognizable and commercially attractive.
- If the prompt asks for social media, ad, banner, mockup or poster, prioritize impact, readability and premium finish.
- Do not invent unreadable text, fake logos, random signatures or watermarks.
- Do not deform faces, bodies, clothing, products or important objects.
- Final image must look polished, realistic and ready to use.

NEGATIVE PROMPT:
${negativePrompt}
`.trim();
}

function buildNumericSeed(payload) {
  const rawSeed = payload.seed;

  if (rawSeed !== undefined && rawSeed !== null && rawSeed !== "") {
    const parsedSeed = Number(rawSeed);

    if (Number.isFinite(parsedSeed)) {
      return Math.floor(parsedSeed);
    }
  }

  return Math.floor(Math.random() * 2147483647);
}

async function pollinationsFetchImageAsDataUrl(url) {
  const response = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "image/png,image/jpeg,image/webp,*/*",
    },
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(
      `Pollinations falhou com status ${response.status}. ${text || ""}`.trim()
    );
  }

  const contentType = response.headers.get("content-type") || "image/png";

  if (!contentType.startsWith("image/")) {
    const text = await response.text().catch(() => "");
    throw new Error(
      `Pollinations não retornou imagem. Content-Type: ${contentType}. Resposta: ${text}`
    );
  }

  const arrayBuffer = await response.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString("base64");

  return `data:${contentType};base64,${base64}`;
}

async function callPollinationsImage(payload, variantLabel = "A") {
  const apiKey = process.env.POLLINATIONS_API_KEY;

  if (!apiKey) {
    throw new Error("POLLINATIONS_API_KEY não configurada na Vercel.");
  }

  const model = safeString(
    payload.model || payload.imageModel || process.env.POLLINATIONS_IMAGE_MODEL,
    "flux"
  );

  const prompt = buildPollinationsPrompt(payload, variantLabel);
  const size = normalizeSize(payload.size || "1024x1024");
  const seed = buildNumericSeed(payload);

  const params = new URLSearchParams({
    model,
    key: apiKey,
    width: String(size.width),
    height: String(size.height),
    seed: String(seed),
    nologo: "true",
    private: "true",
  });

  const url = `${POLLINATIONS_IMAGE_BASE}/${encodeURIComponent(prompt)}?${params.toString()}`;
  const dataUrl = await pollinationsFetchImageAsDataUrl(url);

  return {
    ok: true,
    provider: "pollinations",
    model,
    variant: variantLabel,
    image: dataUrl,
    images: [
      {
        dataUrl,
        variant: variantLabel,
        provider: "pollinations",
        model,
      },
    ],
  };
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method === "GET") {
    return sendJson(res, 200, {
      ok: true,
      route: "/api/visual-image",
      version: "Pollinations Flux V2 seed fix",
      provider: "pollinations",
      model: process.env.POLLINATIONS_IMAGE_MODEL || "flux",
      hasPollinationsKey: Boolean(process.env.POLLINATIONS_API_KEY),
      message: "API visual ativa. Use POST para gerar imagem com Pollinations Flux.",
    });
  }

  if (req.method !== "POST") {
    return sendJson(res, 405, {
      ok: false,
      error: "Método não permitido. Use GET ou POST.",
    });
  }

  const payload = parseBody(req);
  const action = safeString(payload.action, "generate");

  if (
    !payload.prompt &&
    !payload.visualPrompt &&
    !payload.visual_prompt &&
    !payload.instruction
  ) {
    return sendJson(res, 400, {
      ok: false,
      error: "Prompt visual ausente.",
    });
  }

  try {
    if (action === "variations") {
      const versions = [];

      for (const variant of ["A", "B", "C"]) {
        const result = await callPollinationsImage(
          {
            ...payload,
            variant,
          },
          variant
        );

        versions.push(result.images[0]);
      }

      return sendJson(res, 200, {
        ok: true,
        visualGenerated: true,
        provider: "pollinations",
        model: process.env.POLLINATIONS_IMAGE_MODEL || payload.model || "flux",
        images: versions,
        image: versions[0].dataUrl,
        message: "Variações A/B/C geradas com Pollinations Flux.",
      });
    }

    const result = await callPollinationsImage(payload, payload.variant || "A");

    return sendJson(res, 200, {
      ok: true,
      visualGenerated: true,
      provider: result.provider,
      model: result.model,
      image: result.image,
      images: result.images,
      message: "Imagem gerada com Pollinations Flux.",
    });
  } catch (error) {
    return sendJson(res, 500, {
      ok: false,
      visualGenerated: false,
      provider: "pollinations",
      error: error.message || "Erro interno ao gerar imagem.",
    });
  }
}

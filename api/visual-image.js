/**
 * Portal Genesis — API Visual unificada (Pollinations)
 * Arquivo: /api/visual-image.js
 *
 * SUPORTA:
 * - Flux Schnell (rascunho / prévia)
 * - GPT Image 2 (final premium)
 *
 * VARIÁVEIS DE AMBIENTE RECOMENDADAS:
 * - POLLINATIONS_API_KEY_FLUX=sk_...
 * - POLLINATIONS_API_KEY_GPTIMAGE2=sk_...
 * - POLLINATIONS_API_KEY=sk_...                // fallback geral
 * - POLLINATIONS_IMAGE_MODEL=flux             // opcional, default
 *
 * ENDPOINT:
 * - GET  /api/visual-image  -> status da API
 * - POST /api/visual-image  -> geração de imagem
 *
 * EXEMPLO DE PAYLOAD:
 * {
 *   "prompt": "crie um cartaz premium para hamburgueria",
 *   "model": "gpt-image-2",
 *   "size": "1024x1024",
 *   "action": "generate"
 * }
 *
 * OU:
 * {
 *   "prompt": "crie uma embalagem moderna para café",
 *   "model": "flux",
 *   "action": "variations"
 * }
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

function buildNumericSeed(payload, offset = 0) {
  const rawSeed = payload.seed;

  if (rawSeed !== undefined && rawSeed !== null && rawSeed !== "") {
    const parsedSeed = Number(rawSeed);

    if (Number.isFinite(parsedSeed)) {
      return Math.floor(parsedSeed) + offset;
    }
  }

  return Math.floor(Math.random() * 2147483647) + offset;
}

function normalizeBoolean(value, fallback = true) {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const v = value.trim().toLowerCase();
    if (["true", "1", "yes", "sim"].includes(v)) return true;
    if (["false", "0", "no", "nao", "não"].includes(v)) return false;
  }
  return fallback;
}

function getPromptFromPayload(payload) {
  return safeString(
    payload.prompt ||
      payload.visualPrompt ||
      payload.visual_prompt ||
      payload.instruction ||
      payload.description ||
      "",
    ""
  );
}

function normalizeModel(rawModel) {
  const model = safeString(rawModel, "").toLowerCase();

  const aliases = {
    flux: "flux",
    "flux-schnell": "flux",
    fluxschnell: "flux",

    gptimage2: "gpt-image-2",
    "gpt-image-2": "gpt-image-2",
    "gpt image 2": "gpt-image-2",
    gptimage: "gptimage",
    "gpt-image-1-mini": "gptimage",
    "gpt image 1 mini": "gptimage",
    "gpt-image-1.5": "gptimage-large",
    "gpt image 1.5": "gptimage-large",
    "gptimage-large": "gptimage-large",

    seedream: "seedream",
    "seedream-pro": "seedream-pro",
    nanobanana: "nanobanana",
    "nanobanana-2": "nanobanana-2",
    "nanobanana-pro": "nanobanana-pro",
    "qwen-image": "qwen-image",
    "wan-image": "wan-image",
    "wan-image-pro": "wan-image-pro",
    zimage: "zimage",
  };

  if (aliases[model]) return aliases[model];

  return safeString(process.env.POLLINATIONS_IMAGE_MODEL, "flux");
}

function resolveApiKeyForModel(model) {
  const normalized = normalizeModel(model);

  if (normalized === "flux") {
    return (
      process.env.POLLINATIONS_API_KEY_FLUX ||
      process.env.POLLINATIONS_API_KEY ||
      ""
    );
  }

  if (normalized === "gpt-image-2") {
    return (
      process.env.POLLINATIONS_API_KEY_GPTIMAGE2 ||
      process.env.POLLINATIONS_API_KEY_GPT_IMAGE_2 ||
      process.env.POLLINATIONS_API_KEY ||
      ""
    );
  }

  if (normalized === "gptimage" || normalized === "gptimage-large") {
    return (
      process.env.POLLINATIONS_API_KEY_GPTIMAGE2 ||
      process.env.POLLINATIONS_API_KEY ||
      ""
    );
  }

  return process.env.POLLINATIONS_API_KEY || "";
}

function buildVariantRules(variantLabel) {
  const label = safeString(variantLabel, "A").toUpperCase();

  const rules = {
    A: "VERSION A: maximum fidelity, clean composition, realistic proportions, coherent lighting and polished professional finish.",
    B: "VERSION B: more premium advertising style, refined contrast, stronger visual hierarchy, elegant composition.",
    C: "VERSION C: stronger impact for campaign and social media, more attention-grabbing while preserving realism and clarity.",
  };

  return rules[label] || rules.A;
}

function buildPrompt(payload, variantLabel = "A", model = "flux") {
  const userPrompt = getPromptFromPayload(payload);

  const negativePrompt = safeString(
    payload.negativePrompt || payload.negative_prompt,
    "watermark, unreadable text, fake logo, distorted face, deformed hands, extra fingers, low quality, blur, artifacts, duplicated elements, bad anatomy, messy composition"
  );

  const outputKind = safeString(
    payload.outputKind || payload.output_kind || payload.kind || payload.type,
    "professional final image"
  );

  const mode = safeString(payload.mode || payload.action, "generate");
  const size = safeString(payload.size, "1024x1024");
  const quality = safeString(payload.quality, model === "gpt-image-2" ? "ultra" : "high");
  const style = safeString(payload.style, "clean premium commercial style");

  return `
Create a professional image for Portal Genesis.

MODEL INTENT:
${model}

OUTPUT TYPE:
${outputKind}

MODE:
${mode}

STYLE:
${style}

REQUESTED SIZE:
${size}

QUALITY:
${quality}

VARIATION DIRECTION:
${buildVariantRules(variantLabel)}

MAIN USER INSTRUCTION:
${userPrompt}

PRODUCTION RULES:
- Follow the user request with maximum fidelity.
- Preserve subject clarity, clean composition and commercially useful visual quality.
- If the prompt is for a poster, ad, flyer, packaging, social post or product piece, prioritize readability, hierarchy and visual appeal.
- If the prompt is for a character or scene, preserve coherent anatomy, clean design and visual consistency.
- Avoid fake signatures, unreadable texts, random logos and watermark-like artifacts.
- Keep the result polished, professional and ready for real use.
- If text is needed in the image, keep it short, clear and legible.

NEGATIVE PROMPT:
${negativePrompt}
`.trim();
}

async function fetchImageAsDataUrl(url) {
  const response = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "image/png,image/jpeg,image/webp,*/*",
    },
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(
      `Falha ao gerar imagem. Status ${response.status}. ${text || ""}`.trim()
    );
  }

  const contentType = response.headers.get("content-type") || "image/png";

  if (!contentType.startsWith("image/")) {
    const text = await response.text().catch(() => "");
    throw new Error(
      `A resposta não foi uma imagem. Content-Type: ${contentType}. Resposta: ${text}`
    );
  }

  const arrayBuffer = await response.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString("base64");
  return `data:${contentType};base64,${base64}`;
}

async function callPollinationsImage(payload, variantLabel = "A", seedOffset = 0) {
  const requestedModel =
    payload.model ||
    payload.imageModel ||
    payload.image_model ||
    process.env.POLLINATIONS_IMAGE_MODEL ||
    "flux";

  const model = normalizeModel(requestedModel);
  const apiKey = resolveApiKeyForModel(model);

  if (!apiKey) {
    throw new Error(
      `Chave da Pollinations não configurada para o modelo "${model}".`
    );
  }

  const size = normalizeSize(payload.size || "1024x1024");
  const seed = buildNumericSeed(payload, seedOffset);
  const isPrivate = normalizeBoolean(payload.private, true);
  const noLogo = normalizeBoolean(payload.nologo, true);

  const prompt = buildPrompt(payload, variantLabel, model);

  const params = new URLSearchParams({
    model,
    key: apiKey,
    width: String(size.width),
    height: String(size.height),
    seed: String(seed),
    private: String(isPrivate),
    nologo: String(noLogo),
  });

  const url = `${POLLINATIONS_IMAGE_BASE}/${encodeURIComponent(prompt)}?${params.toString()}`;
  const dataUrl = await fetchImageAsDataUrl(url);

  return {
    ok: true,
    provider: "pollinations",
    model,
    variant: variantLabel,
    seed,
    width: size.width,
    height: size.height,
    size: size.label,
    image: dataUrl,
    images: [
      {
        dataUrl,
        variant: variantLabel,
        seed,
        width: size.width,
        height: size.height,
        size: size.label,
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
      version: "Visual Image Multi-Model V3",
      provider: "pollinations",
      defaultModel: process.env.POLLINATIONS_IMAGE_MODEL || "flux",
      hasGenericKey: Boolean(process.env.POLLINATIONS_API_KEY),
      hasFluxKey: Boolean(process.env.POLLINATIONS_API_KEY_FLUX),
      hasGptImage2Key: Boolean(process.env.POLLINATIONS_API_KEY_GPTIMAGE2),
      supportedModels: [
        "flux",
        "gpt-image-2",
        "gptimage",
        "gptimage-large",
        "seedream",
        "seedream-pro",
        "nanobanana",
        "nanobanana-2",
        "nanobanana-pro",
        "qwen-image",
        "wan-image",
        "wan-image-pro",
        "zimage",
      ],
      message:
        "API visual ativa. Use POST para gerar imagem com Flux ou GPT Image 2.",
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
  const prompt = getPromptFromPayload(payload);

  if (!prompt) {
    return sendJson(res, 400, {
      ok: false,
      error: "Prompt visual ausente.",
    });
  }

  try {
    if (action === "variations") {
      const versions = [];

      const variantSeeds = [
        { label: "A", offset: 0 },
        { label: "B", offset: 101 },
        { label: "C", offset: 202 },
      ];

      for (const item of variantSeeds) {
        const result = await callPollinationsImage(payload, item.label, item.offset);
        versions.push(result.images[0]);
      }

      return sendJson(res, 200, {
        ok: true,
        visualGenerated: true,
        provider: "pollinations",
        model: normalizeModel(
          payload.model ||
            payload.imageModel ||
            payload.image_model ||
            process.env.POLLINATIONS_IMAGE_MODEL ||
            "flux"
        ),
        image: versions[0]?.dataUrl || null,
        images: versions,
        message: "Variações A/B/C geradas com sucesso.",
      });
    }

    const result = await callPollinationsImage(
      payload,
      safeString(payload.variant, "A"),
      0
    );

    return sendJson(res, 200, {
      ok: true,
      visualGenerated: true,
      provider: result.provider,
      model: result.model,
      image: result.image,
      images: result.images,
      seed: result.seed,
      size: result.size,
      width: result.width,
      height: result.height,
      message: `Imagem gerada com sucesso usando o modelo ${result.model}.`,
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

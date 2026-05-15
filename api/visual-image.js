/**
 * Portal Genesis Print Remotion — API Visual V14
 * Arquivo de produção Vercel: api/visual-image.js
 *
 * Função:
 * - Gemini como principal para gerar/editar imagem no Print.
 * - Claude como fallback textual caso o Gemini falhe por limite/erro.
 *
 * Variáveis na Vercel:
 * - GEMINI_API_KEY=...
 * - ANTHROPIC_API_KEY=...
 * - PRINT_IMAGE_PROVIDER=gemini
 * - TEXT_PROVIDER=claude
 * - PRINT_TEXT_FALLBACK=claude
 *
 * O endpoint usado pelo HTML continua:
 * /api/visual-image
 */

const GEMINI_MODEL =
  process.env.GEMINI_IMAGE_MODEL ||
  process.env.PRINT_GEMINI_MODEL ||
  "gemini-2.5-flash-image";

const GEMINI_FALLBACK_MODEL =
  process.env.GEMINI_IMAGE_FALLBACK_MODEL || "";

const CLAUDE_MODEL =
  process.env.CLAUDE_TEXT_MODEL ||
  process.env.ANTHROPIC_MODEL ||
  "claude-haiku-4-5";

const GEMINI_ENDPOINT_BASE = "https://generativelanguage.googleapis.com/v1beta/models";
const CLAUDE_MESSAGES_ENDPOINT = "https://api.anthropic.com/v1/messages";

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

function parseDataUrl(dataUrl = "") {
  if (typeof dataUrl !== "string") return null;

  const clean = dataUrl.trim();

  const match = clean.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);

  if (match) {
    return {
      mimeType: match[1],
      data: match[2],
    };
  }

  if (clean.length > 100 && /^[A-Za-z0-9+/=\r\n]+$/.test(clean)) {
    return {
      mimeType: "image/png",
      data: clean.replace(/\s/g, ""),
    };
  }

  return null;
}

function collectImages(payload) {
  const images = [];

  const directFields = [
    payload.image,
    payload.baseImage,
    payload.base_image,
    payload.referenceImage,
    payload.reference_image,
    payload.productImage,
    payload.product_image,
    payload.previewImage,
    payload.preview_image,
  ];

  for (const item of directFields) {
    const parsed = parseDataUrl(item);
    if (parsed) images.push(parsed);
  }

  const arrays = [
    payload.images,
    payload.references,
    payload.referenceImages,
    payload.reference_images,
    payload.input_images,
  ];

  for (const arr of arrays) {
    if (!Array.isArray(arr)) continue;

    for (const item of arr) {
      if (typeof item === "string") {
        const parsed = parseDataUrl(item);
        if (parsed) images.push(parsed);
        continue;
      }

      if (item && typeof item === "object") {
        const possible =
          item.dataUrl ||
          item.data_url ||
          item.image ||
          item.base64 ||
          item.src ||
          item.url;

        const parsed = parseDataUrl(possible);

        if (parsed) {
          images.push({
            mimeType: safeString(item.mimeType || item.mime_type, parsed.mimeType),
            data: parsed.data,
          });
        }
      }
    }
  }

  const unique = [];
  const seen = new Set();

  for (const img of images) {
    const key = `${img.mimeType}:${img.data.slice(0, 80)}`;

    if (!seen.has(key)) {
      seen.add(key);
      unique.push(img);
    }
  }

  return unique.slice(0, 8);
}

function isLimitOrQuotaError(status, data) {
  const text = JSON.stringify(data || {}).toLowerCase();

  return (
    status === 400 ||
    status === 401 ||
    status === 403 ||
    status === 404 ||
    status === 429 ||
    text.includes("quota") ||
    text.includes("limit") ||
    text.includes("rate") ||
    text.includes("exceeded") ||
    text.includes("permission") ||
    text.includes("billing") ||
    text.includes("not found") ||
    text.includes("unavailable")
  );
}

function buildVariantRules(variantLabel) {
  const label = safeString(variantLabel, "A").toUpperCase();

  const rules = {
    A: "VERSÃO A: máxima fidelidade à imagem base, alteração controlada, proporção realista, sombra coerente e acabamento limpo.",
    B: "VERSÃO B: acabamento mais premium/publicitário, iluminação mais limpa, contraste elegante, textura refinada e aspecto comercial.",
    C: "VERSÃO C: leitura mais forte para anúncio, banner, vitrine e social media, impacto visual maior sem perder a identidade.",
  };

  return rules[label] || rules.A;
}

function buildVisualPrompt(payload, variantLabel = "A") {
  const userPrompt =
    payload.prompt ||
    payload.visualPrompt ||
    payload.visual_prompt ||
    payload.instruction ||
    "";

  const negativePrompt =
    payload.negativePrompt ||
    payload.negative_prompt ||
    "watermark, unreadable text, fake logo, distorted product, deformed hands, low quality, blur, artifacts";

  const outputKind = safeString(
    payload.outputKind || payload.output_kind || payload.kind || payload.type,
    "imagem final para Print Remotion"
  );

  const mode = safeString(payload.mode || payload.action, "generate");
  const size = safeString(payload.size, "1024x1024");
  const quality = safeString(payload.quality, "high");

  return `
Você é o motor visual profissional do Portal Genesis Print Remotion.

OBJETIVO:
Gerar ou editar uma imagem final profissional para: ${outputKind}.

MODO:
${mode}

TAMANHO / PROPORÇÃO DESEJADA:
${size}

QUALIDADE:
${quality}

DIREÇÃO DA VARIAÇÃO:
${buildVariantRules(variantLabel)}

INSTRUÇÃO PRINCIPAL DO USUÁRIO:
${userPrompt}

REGRAS DE PRESERVAÇÃO:
- Use as imagens enviadas como referência visual quando existirem.
- Preserve identidade visual, composição, escala, produto, materiais, iluminação, textura e proporções sempre que isso for coerente com o pedido.
- Se for produto, manter o produto reconhecível, com forma, cor, volume e acabamento consistentes.
- Se for estampa, mockup, poster, banner ou social media, priorizar leitura, impacto e acabamento profissional.
- Não inventar logotipos, marcas, textos ilegíveis, assinaturas ou marcas d’água.
- Não deformar rosto, corpo, roupa, produto ou objeto de referência.
- Entregar uma imagem final limpa, profissional, sem sujeira visual e pronta para aprovação.

NEGATIVE PROMPT:
${negativePrompt}
`.trim();
}

function extractGeminiImages(data) {
  const parts = [];

  const candidates = Array.isArray(data?.candidates) ? data.candidates : [];

  for (const candidate of candidates) {
    const candidateParts = candidate?.content?.parts || [];

    for (const part of candidateParts) {
      parts.push(part);
    }
  }

  if (Array.isArray(data?.parts)) {
    parts.push(...data.parts);
  }

  const images = [];

  for (const part of parts) {
    const inline =
      part.inlineData ||
      part.inline_data ||
      part.fileData ||
      part.file_data;

    const mimeType =
      inline?.mimeType ||
      inline?.mime_type ||
      "image/png";

    const base64 =
      inline?.data ||
      inline?.fileUri ||
      inline?.file_uri ||
      "";

    if (!base64) continue;

    if (base64.startsWith("data:image/")) {
      images.push(base64);
    } else if (/^https?:\/\//.test(base64)) {
      images.push(base64);
    } else {
      images.push(`data:${mimeType};base64,${base64}`);
    }
  }

  return images;
}

function extractGeminiText(data) {
  const pieces = [];
  const candidates = Array.isArray(data?.candidates) ? data.candidates : [];

  for (const candidate of candidates) {
    const parts = candidate?.content?.parts || [];

    for (const part of parts) {
      if (typeof part.text === "string") {
        pieces.push(part.text);
      }
    }
  }

  return pieces.join("\n").trim();
}

async function callGeminiImage(payload, variantLabel = "A", modelName = GEMINI_MODEL) {
  const prompt = buildVisualPrompt(payload, variantLabel);
  const images = collectImages(payload);

  const parts = [
    {
      text: prompt,
    },
  ];

  for (const image of images) {
    parts.push({
      inline_data: {
        mime_type: image.mimeType || "image/png",
        data: image.data,
      },
    });
  }

  const url = `${GEMINI_ENDPOINT_BASE}/${encodeURIComponent(modelName)}:generateContent`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "x-goog-api-key": process.env.GEMINI_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts,
        },
      ],
      generationConfig: {
        responseModalities: ["TEXT", "IMAGE"],
      },
    }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message =
      data?.error?.message ||
      `Gemini falhou com status ${response.status}.`;

    const error = new Error(message);
    error.status = response.status;
    error.data = data;
    error.provider = "gemini";
    error.model = modelName;
    throw error;
  }

  const imagesOut = extractGeminiImages(data);
  const textOut = extractGeminiText(data);

  if (!imagesOut.length) {
    const error = new Error(
      textOut ||
        "Gemini respondeu, mas não retornou imagem. Verifique se sua chave tem acesso ao modelo gemini-2.5-flash-image."
    );

    error.status = 500;
    error.data = data;
    error.provider = "gemini";
    error.model = modelName;
    throw error;
  }

  return {
    ok: true,
    provider: "gemini",
    model: modelName,
    variant: variantLabel,
    image: imagesOut[0],
    images: imagesOut.map((img) => ({
      dataUrl: img,
      variant: variantLabel,
      provider: "gemini",
      model: modelName,
    })),
    text: textOut,
  };
}

async function callClaudeTextFallback(payload, geminiError) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return {
      ok: false,
      provider: "claude",
      fallbackType: "text",
      error: "ANTHROPIC_API_KEY não configurada. Fallback textual indisponível.",
    };
  }

  const visualPrompt = buildVisualPrompt(payload, payload.variant || "A");

  const message = `
Você é o fallback textual do Portal Genesis Print Remotion.

O Gemini falhou ao tentar gerar a imagem final.

Erro técnico resumido:
${geminiError?.message || "Erro desconhecido."}

Sua tarefa:
1. Reescrever um prompt visual profissional pronto para o usuário copiar.
2. Gerar um checklist técnico para o designer ou para tentar novamente no Gemini.
3. Explicar em uma frase que a imagem final não foi renderizada porque o limite/permissão do gerador visual falhou.

Prompt base:
${visualPrompt}

Responda em JSON puro com estes campos:
{
  "status": "visual_limit_or_error",
  "message": "...",
  "professional_prompt_pt": "...",
  "professional_prompt_en": "...",
  "negative_prompt_en": "...",
  "technical_checklist": ["...", "..."],
  "next_action": "..."
}
`.trim();

  const response = await fetch(CLAUDE_MESSAGES_ENDPOINT, {
    method: "POST",
    headers: {
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: 1800,
      messages: [
        {
          role: "user",
          content: message,
        },
      ],
    }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    return {
      ok: false,
      provider: "claude",
      fallbackType: "text",
      error:
        data?.error?.message ||
        `Claude fallback falhou com status ${response.status}.`,
      details: data,
    };
  }

  const content = Array.isArray(data?.content) ? data.content : [];

  const text = content
    .filter((item) => item.type === "text" && item.text)
    .map((item) => item.text)
    .join("\n")
    .trim();

  let parsed = null;

  try {
    parsed = JSON.parse(text);
  } catch {
    parsed = null;
  }

  return {
    ok: true,
    provider: "claude",
    model: CLAUDE_MODEL,
    fallbackType: "text",
    text,
    json: parsed,
  };
}

async function generateWithGeminiAndFallback(payload, variantLabel = "A") {
  try {
    return await callGeminiImage(payload, variantLabel, GEMINI_MODEL);
  } catch (firstError) {
    const shouldTrySecondGemini =
      GEMINI_FALLBACK_MODEL &&
      GEMINI_FALLBACK_MODEL !== GEMINI_MODEL &&
      isLimitOrQuotaError(firstError.status, firstError.data);

    if (shouldTrySecondGemini) {
      try {
        return await callGeminiImage(payload, variantLabel, GEMINI_FALLBACK_MODEL);
      } catch (secondError) {
        const fallback = await callClaudeTextFallback(payload, secondError);

        return {
          ok: false,
          provider: "gemini",
          fallbackProvider: "claude",
          fallbackType: "text",
          visualGenerated: false,
          error: secondError.message,
          firstGeminiError: firstError.message,
          claudeFallback: fallback,
        };
      }
    }

    const fallback = await callClaudeTextFallback(payload, firstError);

    return {
      ok: false,
      provider: "gemini",
      fallbackProvider: "claude",
      fallbackType: "text",
      visualGenerated: false,
      error: firstError.message,
      claudeFallback: fallback,
    };
  }
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
      version: "V14 Gemini principal + Claude fallback textual",
      provider: "gemini",
      model: GEMINI_MODEL,
      fallbackGeminiModel: GEMINI_FALLBACK_MODEL || null,
      textFallback: "claude",
      claudeModel: CLAUDE_MODEL,
      hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
      hasClaudeKey: Boolean(process.env.ANTHROPIC_API_KEY),
      message:
        "API visual ativa. Use POST para gerar imagem com Gemini. Claude entra apenas como fallback textual.",
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

  if (!process.env.GEMINI_API_KEY) {
    const fallback = await callClaudeTextFallback(payload, {
      message: "GEMINI_API_KEY não configurada.",
    });

    return sendJson(res, 500, {
      ok: false,
      visualGenerated: false,
      provider: "gemini",
      fallbackProvider: "claude",
      error: "GEMINI_API_KEY não configurada na Vercel.",
      claudeFallback: fallback,
    });
  }

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
        const result = await generateWithGeminiAndFallback(
          {
            ...payload,
            variant,
          },
          variant
        );

        if (result.ok && result.images?.length) {
          versions.push(result.images[0]);
        } else {
          versions.push({
            variant,
            provider: "claude",
            fallbackType: "text",
            visualGenerated: false,
            error: result.error,
            claudeFallback: result.claudeFallback,
          });
        }
      }

      const generated = versions.filter((item) => item.dataUrl || item.image);

      if (!generated.length) {
        return sendJson(res, 500, {
          ok: false,
          visualGenerated: false,
          provider: "gemini",
          fallbackProvider: "claude",
          error:
            "Nenhuma variação visual foi gerada. O fallback textual foi retornado nas versões.",
          images: versions,
        });
      }

      return sendJson(res, 200, {
        ok: true,
        visualGenerated: true,
        provider: "gemini",
        model: GEMINI_MODEL,
        images: versions,
        image: generated[0].dataUrl || generated[0].image,
        message: "Variações A/B/C geradas com Gemini.",
      });
    }

    const result = await generateWithGeminiAndFallback(
      payload,
      payload.variant || "A"
    );

    if (!result.ok) {
      return sendJson(res, 500, result);
    }

    return sendJson(res, 200, {
      ok: true,
      visualGenerated: true,
      provider: result.provider,
      model: result.model,
      image: result.image,
      images: result.images,
      text: result.text,
      message: "Imagem gerada com Gemini.",
    });
  } catch (error) {
    const fallback = await callClaudeTextFallback(payload, error);

    return sendJson(res, 500, {
      ok: false,
      visualGenerated: false,
      provider: "gemini",
      fallbackProvider: "claude",
      error: error.message || "Erro interno ao gerar imagem.",
      claudeFallback: fallback,
    });
  }
}

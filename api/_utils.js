export const COOKIE_NAME = "mega_studio_session";

export function sendJson(res, status, data) {
  if (typeof res.status === "function" && typeof res.json === "function") {
    return res.status(status).json(data);
  }
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  return res.end(JSON.stringify(data));
}

export async function readBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body || "{}");
    } catch {
      return {};
    }
  }

  return new Promise((resolve, reject) => {
    let body = "";
    req.on?.("data", (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) {
        reject(new Error("Body muito grande."));
        req.destroy?.();
      }
    });
    req.on?.("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        resolve({});
      }
    });
    req.on?.("error", reject);
    if (!req.on) resolve({});
  });
}

export function toBase64Url(text) {
  return Buffer.from(String(text)).toString("base64url");
}

export function makeSessionToken(username) {
  const secret = process.env.SESSION_SECRET || "dev-secret";
  return toBase64Url(`${username}:${secret}`);
}

export function parseCookies(cookieHeader = "") {
  return Object.fromEntries(
    String(cookieHeader)
      .split(";")
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const index = part.indexOf("=");
        if (index === -1) return [part, ""];
        return [part.slice(0, index), decodeURIComponent(part.slice(index + 1))];
      })
  );
}

export function sessionCookie(token, maxAge) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax${secure}; Max-Age=${maxAge}`;
}

export function localAiText(kind, prompt = "") {
  const cleanPrompt = String(prompt || "").trim();
  return [
    `Portal Genesis - pacote ${kind}`,
    "",
    "Resumo tecnico:",
    cleanPrompt || "Briefing pendente.",
    "",
    "Entregaveis:",
    "- TXT legivel para revisao.",
    "- JSON estruturado para importacao.",
    "- Prompts prontos para IA visual.",
    "- Placeholder TTS ElevenLabs preparado.",
    "- Placeholder GPT Image 2 referenciado.",
    "",
    "Status:",
    "Fallback local usado porque a chave de IA ainda nao esta configurada."
  ].join("\n");
}

export async function handleAnthropicText(req, res, options) {
  if (req.method !== "POST") {
    return sendJson(res, 405, { ok: false, error: "Metodo nao permitido. Use POST." });
  }

  const body = await readBody(req);
  const prompt = body.prompt || body.text || "";
  const kind = options.kind || body.module || "portal";

  if (!process.env.ANTHROPIC_API_KEY) {
    return sendJson(res, 200, {
      ok: true,
      provider: "local-placeholder",
      model: "offline",
      text: localAiText(kind, prompt),
      configured: false
    });
  }

  const model = body.model || process.env.ANTHROPIC_MODEL || "claude-sonnet-4-5";
  const maxTokens = Number(body.max_tokens || body.maxTokens || options.maxTokens || 3200);
  const temperature = Number(body.temperature ?? options.temperature ?? 0.55);
  const system = body.system || options.system || "Voce e o copiloto profissional do Portal Genesis.";

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
        temperature,
        system,
        messages: [{ role: "user", content: String(prompt) }]
      })
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return sendJson(res, 200, {
        ok: true,
        provider: "local-placeholder",
        model,
        configured: true,
        text: localAiText(kind, prompt),
        warning: data.error?.message || "A API de texto respondeu erro; fallback local usado.",
        details: data
      });
    }

    const text = Array.isArray(data.content)
      ? data.content.map((part) => part.text || "").join("\n")
      : "";

    return sendJson(res, 200, {
      ok: true,
      provider: "anthropic",
      model,
      text,
      usage: data.usage || null,
      raw: data
    });
  } catch (error) {
    return sendJson(res, 500, {
      ok: false,
      error: error.message || "Erro interno na IA."
    });
  }
}

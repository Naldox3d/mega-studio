import { makeSessionToken, readBody, sendJson, sessionCookie } from "./_utils.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return sendJson(res, 405, { ok: false, error: "Metodo nao permitido. Use POST." });
  }

  try {
    const body = await readBody(req);
    const username = String(body.username || "").trim();
    const password = String(body.password || "");
    const adminUser = process.env.ADMIN_USER || "admin";
    const adminPass = process.env.ADMIN_PASS || "fruits2026";

    if (username !== adminUser || password !== adminPass) {
      return sendJson(res, 401, {
        ok: false,
        error: "Usuario ou senha invalidos."
      });
    }

    const token = makeSessionToken(username);
    res.setHeader("Set-Cookie", sessionCookie(token, 60 * 60 * 24 * 7));

    return sendJson(res, 200, {
      ok: true,
      user: username,
      message: "Login autorizado."
    });
  } catch (error) {
    return sendJson(res, 500, {
      ok: false,
      error: error.message || "Erro interno no login."
    });
  }
}

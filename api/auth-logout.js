import { sendJson, sessionCookie } from "./_utils.js";

export default function handler(req, res) {
  if (req.method !== "POST" && req.method !== "GET") {
    return sendJson(res, 405, { ok: false, error: "Metodo nao permitido." });
  }

  res.setHeader("Set-Cookie", sessionCookie("", 0));
  return sendJson(res, 200, {
    ok: true,
    message: "Sessao encerrada."
  });
}

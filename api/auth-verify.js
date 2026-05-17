import { COOKIE_NAME, makeSessionToken, parseCookies, sendJson } from "./_utils.js";

export default function handler(req, res) {
  const adminUser = process.env.ADMIN_USER || "admin";
  const cookies = parseCookies(req.headers?.cookie || "");
  const token = cookies[COOKIE_NAME];
  const expected = makeSessionToken(adminUser);

  if (!token || token !== expected) {
    return sendJson(res, 401, {
      ok: false,
      error: "Sessao invalida ou expirada."
    });
  }

  return sendJson(res, 200, {
    ok: true,
    user: adminUser,
    message: "Sessao valida."
  });
}

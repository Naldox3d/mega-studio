const COOKIE_NAME = 'mega_studio_session';

function parseCookies(cookieHeader = '') {
  return Object.fromEntries(
    cookieHeader
      .split(';')
      .map(part => part.trim())
      .filter(Boolean)
      .map(part => {
        const index = part.indexOf('=');
        if (index === -1) return [part, ''];
        return [part.slice(0, index), decodeURIComponent(part.slice(index + 1))];
      })
  );
}

function makeSessionToken(username) {
  const secret = process.env.SESSION_SECRET || 'dev-secret';
  const payload = `${username}:${secret}`;
  return Buffer.from(payload).toString('base64url');
}

export default function handler(req, res) {
  const adminUser = process.env.ADMIN_USER || 'admin';
  const cookies = parseCookies(req.headers.cookie || '');
  const token = cookies[COOKIE_NAME];
  const expected = makeSessionToken(adminUser);

  res.setHeader('Content-Type', 'application/json');

  if (!token || token !== expected) {
    res.statusCode = 401;
    return res.end(JSON.stringify({ ok: false, error: 'Sessão inválida' }));
  }

  res.statusCode = 200;
  return res.end(JSON.stringify({ ok: true, user: adminUser }));
}

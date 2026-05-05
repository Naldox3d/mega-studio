const COOKIE_NAME = 'mega_studio_session';

function makeSessionToken(username) {
  const secret = process.env.SESSION_SECRET || 'dev-secret';
  const payload = `${username}:${secret}`;
  return Buffer.from(payload).toString('base64url');
}

export function middleware(request) {
  const { pathname } = request.nextUrl;

  const publicPaths = [
    '/',
    '/index.html',
    '/api/auth-login',
    '/api/auth-verify',
    '/api/auth-logout'
  ];

  const isPublic = publicPaths.some(path => pathname === path);
  const isStaticAsset =
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.endsWith('.css') ||
    pathname.endsWith('.js') ||
    pathname.endsWith('.png') ||
    pathname.endsWith('.jpg') ||
    pathname.endsWith('.jpeg') ||
    pathname.endsWith('.webp') ||
    pathname.endsWith('.svg') ||
    pathname.endsWith('.ico');

  if (isPublic || isStaticAsset) {
    return;
  }

  const adminUser = process.env.ADMIN_USER || 'admin';
  const expected = makeSessionToken(adminUser);
  const token = request.cookies.get(COOKIE_NAME)?.value;

  if (token === expected) {
    return;
  }

  const url = request.nextUrl.clone();
  url.pathname = '/';
  return Response.redirect(url);
}

export const config = {
  matcher: [
    '/fruits_adventures_studio_v5_2_sem_senha_front.html',
    '/grafica_ia_studio_claude_v1.html'
  ]
};

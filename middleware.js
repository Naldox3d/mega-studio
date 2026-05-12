 const COOKIE_NAME = 'mega_studio_session';

function toBase64Url(text) {
  let base64;
  if (typeof btoa === 'function') {
    base64 = btoa(text);
  } else {
    base64 = Buffer.from(text).toString('base64');
  }
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function makeSessionToken(username) {
  const secret = process.env.SESSION_SECRET || 'dev-secret';
  return toBase64Url(`${username}:${secret}`);
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

  if (isPublic || isStaticAsset) return;

  const adminUser = process.env.ADMIN_USER || 'admin';
  const expected = makeSessionToken(adminUser);
  const token = request.cookies.get(COOKIE_NAME)?.value;

  if (token === expected) return;

  const url = request.nextUrl.clone();
  url.pathname = '/';
  return Response.redirect(url);
}

export const config = {
  matcher: [
    '/studio/:path*',
    '/client/:path*',
    '/print/:path*',
    '/api/generate-studio',
    '/api/generate-client',
    '/api/generate-print'
  ]
};

const COOKIE_NAME = "mega_studio_session";

function token(username) {
  const secret = process.env.SESSION_SECRET || "dev-secret";
  return btoa(`${username}:${secret}`).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function isAuthed(request) {
  const adminUser = process.env.ADMIN_USER || "admin";
  return request.cookies.get(COOKIE_NAME)?.value === token(adminUser);
}

export function middleware(request) {
  const { pathname } = request.nextUrl;

  if (pathname === "/api/ai-router" && request.method === "POST" && !isAuthed(request)) {
    return Response.json(
      { ok: false, error: "Faca login para usar as APIs." },
      { status: 401 }
    );
  }
}

export const config = {
  matcher: ["/api/ai-router"]
};

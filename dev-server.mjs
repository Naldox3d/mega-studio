import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { COOKIE_NAME, makeSessionToken, parseCookies } from "./api/_utils.js";

const root = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const portArgIndex = args.findIndex((item) => item === "--port");
const port = Number(process.env.PORT || (portArgIndex >= 0 ? args[portArgIndex + 1] : "") || 4173);

const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml"
};

function safePath(urlPath) {
  const decoded = decodeURIComponent(urlPath);
  const target = decoded === "/" ? "/index.html" : decoded;
  const fullPath = path.resolve(root, `.${target}`);
  if (!fullPath.startsWith(root)) return null;
  return fullPath;
}

function isStaticAsset(urlPath) {
  return [".css", ".js", ".png", ".jpg", ".jpeg", ".webp", ".svg", ".ico"].includes(path.extname(urlPath));
}

function isPublic(urlPath) {
  return urlPath === "/" ||
    urlPath === "/index.html" ||
    urlPath === "/api/auth-login" ||
    urlPath === "/api/auth-verify" ||
    urlPath === "/api/auth-logout" ||
    isStaticAsset(urlPath);
}

function isProtected(urlPath) {
  return urlPath.startsWith("/studio") ||
    urlPath.startsWith("/video") ||
    urlPath.startsWith("/print") ||
    urlPath.startsWith("/client") ||
    urlPath.startsWith("/api/");
}

function authorized(req) {
  const adminUser = process.env.ADMIN_USER || "admin";
  const cookies = parseCookies(req.headers.cookie || "");
  return cookies[COOKIE_NAME] === makeSessionToken(adminUser);
}

async function readRequestBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) {
        reject(new Error("Body muito grande."));
        req.destroy();
      }
    });
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        resolve({});
      }
    });
    req.on("error", reject);
  });
}

async function serveApi(req, res, urlPath) {
  const routeName = urlPath.replace(/^\/api\//, "");
  const filePath = path.join(root, "api", `${routeName}.js`);
  try {
    await fs.access(filePath);
  } catch {
    res.writeHead(404, { "Content-Type": "application/json; charset=utf-8" });
    res.end(JSON.stringify({ ok: false, error: "Rota nao encontrada." }));
    return;
  }

  const body = await readRequestBody(req);
  const mod = await import(`${pathToFileURL(filePath).href}?t=${Date.now()}`);
  const apiReq = {
    method: req.method,
    headers: req.headers,
    body,
    on: req.on.bind(req)
  };
  const apiRes = {
    statusCode: 200,
    setHeader(name, value) {
      res.setHeader(name, value);
    },
    status(code) {
      this.statusCode = code;
      res.statusCode = code;
      return this;
    },
    json(data) {
      this.setHeader("Content-Type", "application/json; charset=utf-8");
      res.statusCode = this.statusCode;
      res.end(JSON.stringify(data));
      return this;
    },
    end(data = "") {
      res.statusCode = this.statusCode;
      res.end(data);
    }
  };

  await mod.default(apiReq, apiRes);
}

async function serveStatic(res, urlPath) {
  let filePath = safePath(urlPath);
  if (!filePath) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  try {
    const stat = await fs.stat(filePath);
    if (stat.isDirectory()) filePath = path.join(filePath, "index.html");
    const data = await fs.readFile(filePath);
    const contentType = types[path.extname(filePath)] || "application/octet-stream";
    res.writeHead(200, { "Content-Type": contentType });
    res.end(data);
  } catch {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Not found");
  }
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url || "/", `http://${req.headers.host || "127.0.0.1"}`);
    const urlPath = url.pathname;

    if (!isPublic(urlPath) && isProtected(urlPath) && !authorized(req)) {
      if (urlPath.startsWith("/api/")) {
        res.writeHead(401, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({ ok: false, error: "Sessao invalida." }));
      } else {
        res.writeHead(302, { Location: "/" });
        res.end();
      }
      return;
    }

    if (urlPath.startsWith("/api/")) {
      await serveApi(req, res, urlPath);
      return;
    }

    await serveStatic(res, urlPath);
  } catch (error) {
    res.writeHead(500, { "Content-Type": "application/json; charset=utf-8" });
    res.end(JSON.stringify({ ok: false, error: error.message || "Erro interno." }));
  }
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Portal Genesis local: http://127.0.0.1:${port}`);
});

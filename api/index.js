import { sendJson } from "./_utils.js";

export default function handler(req, res) {
  return sendJson(res, 200, {
    ok: true,
    name: "Portal Genesis API",
    routes: [
      "/api/auth-login",
      "/api/auth-verify",
      "/api/auth-logout",
      "/api/laboratorio-generate",
      "/api/generate-studio",
      "/api/generate-video",
      "/api/generate-print",
      "/api/generate-client",
      "/api/gemini",
      "/api/print-ai",
      "/api/visual-image",
      "/api/visual-edit",
      "/api/gpt-image-2",
      "/api/tts-eleven"
    ],
    providers: {
      claude: Boolean(process.env.ANTHROPIC_API_KEY),
      gemini: Boolean(process.env.GEMINI_API_KEY),
      flux: Boolean(process.env.POLLINATIONS_API_KEY)
    }
  });
}

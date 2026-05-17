import { handleAnthropicText } from "./_utils.js";

export default function handler(req, res) {
  return handleAnthropicText(req, res, {
    kind: "studio",
    maxTokens: 3600,
    temperature: 0.55,
    system: "Voce e o Studio Copilot do Portal Genesis. Gere pacotes criativos, tecnicos e reutilizaveis para Studio Remotion Lab."
  });
}

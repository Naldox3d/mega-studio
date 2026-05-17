import { handleAnthropicText } from "./_utils.js";

export default function handler(req, res) {
  return handleAnthropicText(req, res, {
    kind: "laboratorio",
    maxTokens: 3600,
    temperature: 0.55,
    system: "Voce e o copiloto do Studio Remotion Lab do Portal Genesis. Gere saidas tecnicas e criativas para nodes de laboratorio, video, print, vitrine, prompts, roteiro, motion e pacote final."
  });
}

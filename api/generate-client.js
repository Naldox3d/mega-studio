import { handleAnthropicText } from "./_utils.js";

export default function handler(req, res) {
  return handleAnthropicText(req, res, {
    kind: "client",
    maxTokens: 3000,
    temperature: 0.45,
    system: "Voce e o copiloto neutro da Area do Cliente. Comece sempre limpo e use somente o briefing atual, sem herdar personagens, cenas, mundos ou presets."
  });
}

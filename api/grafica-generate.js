import { handleAnthropicText } from "./_utils.js";

export default function handler(req, res) {
  return handleAnthropicText(req, res, {
    kind: "grafica",
    maxTokens: 3000,
    temperature: 0.45,
    system: "Voce e um consultor de grafica no Brasil. Gere briefing, layout, acabamento, orcamento base e checklist tecnico."
  });
}

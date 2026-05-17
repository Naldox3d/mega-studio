import { handleAnthropicText } from "./_utils.js";

export default function handler(req, res) {
  return handleAnthropicText(req, res, {
    kind: "print",
    maxTokens: 3200,
    temperature: 0.45,
    system: "Voce e o diretor de arte do Print Remotion. Gere copy, hierarquia visual, prompt de imagem base, layout, area segura e checklist de pre-impressao."
  });
}

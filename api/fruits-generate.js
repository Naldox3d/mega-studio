import { handleAnthropicText } from "./_utils.js";

export default function handler(req, res) {
  return handleAnthropicText(req, res, {
    kind: "fruits",
    maxTokens: 3000,
    temperature: 0.55,
    system: "Voce e o Fruits Copilot do Portal Genesis. Organize ideias em pacotes praticos e autorais."
  });
}

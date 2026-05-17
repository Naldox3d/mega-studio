import { handleAnthropicText } from "./_utils.js";

export default function handler(req, res) {
  return handleAnthropicText(req, res, {
    kind: "video",
    maxTokens: 4200,
    temperature: 0.58,
    system: "Voce e o agente Video Remotion do Portal Genesis. Gere roteiro visual, storyboard, Remotion JSON, SRT, plano de som, prompt CapCut e checklist. Nao prometa render MP4."
  });
}

/**
 * Portal Genesis Print Remotion — API Visual V13
 * Arquivo: api_visual_image_express_server.mjs
 *
 * Como usar:
 * 1) npm init -y
 * 2) npm install express cors dotenv openai
 * 3) crie .env com: OPENAI_API_KEY=sua_chave_aqui
 * 4) node api_visual_image_express_server.mjs
 * 5) No HTML, deixe o endpoint como: http://localhost:3000/api/visual-image
 *
 * Em produção, coloque esta rota no seu backend. Nunca coloque a chave da API no HTML.
 */

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import OpenAI from 'openai';

const app = express();
const PORT = process.env.PORT || 3000;
const MODEL = process.env.OPENAI_RESPONSES_MODEL || 'gpt-5.5';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.use(cors());
app.use(express.json({ limit: '35mb' }));

function cleanDataUrl(dataUrl = '') {
  if (typeof dataUrl !== 'string') return '';
  return dataUrl.startsWith('data:image/') ? dataUrl : '';
}

function buildVariantPrompt(payload, variantLabel) {
  const variantRules = {
    A: 'VERSÃO A: máxima fidelidade à imagem base. Alteração controlada, sombra e perspectiva realistas.',
    B: 'VERSÃO B: acabamento mais publicitário, contraste premium, luz mais limpa e textura mais refinada.',
    C: 'VERSÃO C: leitura mais forte para anúncio/social media, impacto comercial maior, mantendo identidade visual.',
  };

  const basePrompt = payload.prompt || '';
  const negativePrompt = payload.negativePrompt || '';
  const size = payload.size || '1024x1024';
  const quality = payload.quality || 'medium';
  const outputKind = payload.outputKind || 'auto';

  return `${basePrompt}

SAÍDA SOLICITADA
- Tipo: ${outputKind}
- Tamanho desejado: ${size}
- Qualidade desejada: ${quality}
- Variação: ${variantRules[variantLabel] || variantRules.A}

NEGATIVE PROMPT
${negativePrompt}

REGRAS FINAIS
Entregue uma imagem final limpa, profissional, sem marcas d’água, sem texto ilegível, sem logotipos inventados, sem deformações e pronta para aprovação visual.`;
}

async function generateOneImage(payload, variantLabel = 'A') {
  const content = [
    {
      type: 'input_text',
      text: buildVariantPrompt(payload, variantLabel),
    },
  ];

  const images = Array.isArray(payload.images) ? payload.images : [];
  for (const img of images.slice(0, 8)) {
    const dataUrl = cleanDataUrl(img?.dataUrl);
    if (dataUrl) {
      content.push({
        type: 'input_image',
        image_url: dataUrl,
      });
    }
  }

  const response = await openai.responses.create({
    model: MODEL,
    input: [
      {
        role: 'user',
        content,
      },
    ],
    tools: [{ type: 'image_generation' }],
  });

  const imageData = (response.output || [])
    .filter((output) => output.type === 'image_generation_call')
    .map((output) => output.result)
    .filter(Boolean);

  if (!imageData.length) {
    const textFallback = JSON.stringify(response.output || [], null, 2);
    throw new Error(`A API não retornou imagem. Resposta: ${textFallback.slice(0, 1000)}`);
  }

  return {
    dataUrl: `data:image/png;base64,${imageData[0]}`,
    variant: variantLabel,
  };
}

app.post('/api/visual-image', async (req, res) => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({
        ok: false,
        error: 'OPENAI_API_KEY não configurada no servidor.',
      });
    }

    const payload = req.body || {};
    const action = payload.action || 'generate';

    if (!payload.prompt || typeof payload.prompt !== 'string') {
      return res.status(400).json({
        ok: false,
        error: 'Prompt visual ausente.',
      });
    }

    if (action === 'variations') {
      const versions = [];
      for (const variant of ['A', 'B', 'C']) {
        versions.push(await generateOneImage(payload, variant));
      }
      return res.json({
        ok: true,
        images: versions,
        message: 'Variações A/B/C geradas.',
      });
    }

    const image = await generateOneImage(payload, payload.variant || 'A');
    return res.json({
      ok: true,
      images: [image],
      image: image.dataUrl,
      message: 'Imagem gerada.',
    });
  } catch (error) {
    console.error('[api/visual-image]', error);
    return res.status(500).json({
      ok: false,
      error: error.message || 'Erro interno ao gerar imagem.',
    });
  }
});

app.get('/api/visual-image/health', (req, res) => {
  res.json({
    ok: true,
    route: '/api/visual-image',
    model: MODEL,
    hasKey: Boolean(process.env.OPENAI_API_KEY),
  });
});

app.listen(PORT, () => {
  console.log(`Portal Genesis API Visual rodando em http://localhost:${PORT}`);
});

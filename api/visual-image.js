/**
 * Portal Genesis – API Visual unificada (Pollinations)
 * Arquivo: /api/visual-image.js
 *
 * SUPORTA:
 *   - Flux Schnell (rascunho / prévia)
 *   - GPT Image 2 (final premium)
 *
 * VARIÁVEIS DE AMBIENTE RECOMENDADAS:
 *   - POLLINATIONS_API_KEY_FLUX=sk_...
 *   - POLLINATIONS_API_KEY_GPTIMAGE2=sk_...
 *   - POLLINATIONS_API_KEY=sk_...       // fallback geral
 *   - POLLINATIONS_IMAGE_MODEL=flux     // opcional, default
 *
 * ENDPOINT:
 *   - GET /api/visual-image -> status da API
 *   - POST /api/visual-image -> geração de imagem
 */

const fetch = require('node-fetch');

const POLLINATIONS_IMAGE_BASE = 'https://gen.pollinations.ai/image';

const MODEL_FLUX = process.env.POLLINATIONS_IMAGE_MODEL || 'flux';
const API_KEY_FLUX = process.env.POLLINATIONS_API_KEY_FLUX;
const API_KEY_GPTIMAGE2 = process.env.POLLINATIONS_API_KEY_GPTIMAGE2;
const API_KEY_GENERAL = process.env.POLLINATIONS_API_KEY;

function sendJson(res, status, data) {
    res.status(status);
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify(data));
}

function parseBody(req) {
    if (!req.body) return {};
    if (typeof req.body === 'string') {
        try {
            return JSON.parse(req.body);
        } catch {
            return {};
        }
    }
    return req.body;
}

function getApiKey(model) {
    switch(model) {
        case 'flux': return API_KEY_FLUX || API_KEY_GENERAL;
        case 'gpt-image-2': return API_KEY_GPTIMAGE2 || API_KEY_GENERAL;
        default: return API_KEY_GENERAL;
    }
}

async function generateImage(payload) {
    const model = payload.model || MODEL_FLUX;
    const apiKey = getApiKey(model);

    if (!apiKey) throw new Error('API key não configurada para o modelo selecionado');

    const response = await fetch(POLLINATIONS_IMAGE_BASE, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Erro na API: ${response.status} - ${errText}`);
    }

    return await response.json();
}

module.exports = async function handler(req, res) {
    if (req.method === 'GET') {
        // Status da API
        return sendJson(res, 200, {
            status: 'ok',
            models: {
                flux: !!API_KEY_FLUX,
                'gpt-image-2': !!API_KEY_GPTIMAGE2
            }
        });
    }

    if (req.method === 'POST') {
        const body = parseBody(req);
        try {
            const result = await generateImage(body);
            return sendJson(res, 200, result);
        } catch (err) {
            return sendJson(res, 500, { error: err.message });
        }
    }

    sendJson(res, 405, { error: 'Método não permitido' });
};

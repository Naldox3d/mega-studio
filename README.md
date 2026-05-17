# Portal Genesis Lite

Versao simples do Portal Genesis para usar todas as APIs em uma tela unica.

## O que tem

- Prompt unico.
- Resultado grande.
- Tipos: texto, imagem, video, voz, print e pacote.
- Historico local.
- Exportacao TXT/JSON.
- Login simples.
- Rota central: `/api/ai-router`.

## Subir no GitHub/Vercel

Suba estes arquivos na raiz do repositorio:

```txt
index.html
middleware.js
package.json
api/
docs/
README.md
```

Depois faca redeploy na Vercel.

## Variaveis da Vercel

Obrigatorias para login:

```txt
ADMIN_USER=admin
ADMIN_PASS=fruits2026
SESSION_SECRET=coloque-uma-frase-grande-aqui
```

APIs, use as que voce tiver:

```txt
ANTHROPIC_API_KEY=...
ANTHROPIC_MODEL=...

GEMINI_API_KEY=...
GEMINI_MODEL=...

POLLINATIONS_API_KEY=...
POLLINATIONS_IMAGE_MODEL=flux

LTX_API_KEY=...
LTX_API_URL=...

ELEVENLABS_API_KEY=...
ELEVENLABS_VOICE_ID=...
```

## Como funciona

O frontend chama somente:

```txt
/api/ai-router
```

O `ai-router` escolhe a API:

```txt
Texto  -> Claude ou Gemini
Imagem -> Pollinations/Flux
Video  -> LTX
Voz    -> ElevenLabs
Print  -> Claude/Gemini
Pacote -> JSON local
```

Se uma API falhar, a tela nao quebra. Ela retorna fallback local.

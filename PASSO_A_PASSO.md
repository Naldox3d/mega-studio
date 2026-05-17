# Passo a passo - Portal Genesis Lite

## 1. Fazer backup do site atual

No GitHub, antes de apagar tudo, crie uma pasta:

```txt
legacy/
```

Coloque o site antigo la dentro se quiser preservar.

## 2. Subir a versao Lite

Suba estes arquivos na raiz do repo:

```txt
index.html
package.json
middleware.js
api/
docs/
README.md
```

## 3. Variaveis na Vercel

Vercel > Project > Settings > Environment Variables:

```txt
ADMIN_USER=admin
ADMIN_PASS=fruits2026
SESSION_SECRET=uma-frase-grande-secreta

ANTHROPIC_API_KEY=sua-chave-claude
GEMINI_API_KEY=sua-chave-gemini
POLLINATIONS_API_KEY=sua-chave-pollinations
POLLINATIONS_IMAGE_MODEL=flux

LTX_API_KEY=sua-chave-ltx
LTX_API_URL=url-do-endpoint-ltx

ELEVENLABS_API_KEY=sua-chave-elevenlabs
ELEVENLABS_VOICE_ID=id-da-voz
```

## 4. Redeploy

Depois de subir:

```txt
Vercel > Deployments > Redeploy
```

## 5. Como usar

1. Abra o site.
2. Faca login.
3. Escolha tipo: Texto, Imagem, Video, Voz, Print ou Pacote.
4. Escolha API ou deixe Auto.
5. Digite prompt.
6. Clique Gerar.

## 6. Ideia principal

O site chama so uma rota:

```txt
/api/ai-router
```

Ela organiza todas as APIs e evita aquela bagunca de associar cada pagina manualmente.

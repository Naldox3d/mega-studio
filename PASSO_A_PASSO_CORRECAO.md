# Passo a passo para voltar o Portal Genesis a funcionar - V2 com originais preservados

Esta versao V2 usa os arquivos originais completos que voce mandou:

```txt
index_portal_genesis_acesso_v1.html -> index.html
studio_remotion_lab_portal_genesis_v11.html -> studio/index.html
video_remotion_portal_genesis_v17.html -> video/index.html
print_remotion_portal_genesis_v17_corrigido_api.html -> print/index.html
```

Ela preserva o Studio, Video e Print grandes, com nodes, canvas, estacao, minimapa, exportacao e funcoes internas.

## 1. Subir estes arquivos no GitHub

No repositorio `Naldox3d/mega-studio`, substitua/adiciona estes arquivos:

```txt
index.html
style.css
module-shell.js
middleware.js
package.json
README.md

studio/index.html
video/index.html
print/index.html
client/index.html

api/_utils.js
api/auth-login.js
api/auth-logout.js
api/auth-verify.js
api/generate-studio.js
api/generate-video.js
api/generate-print.js
api/generate-client.js
api/laboratorio-generate.js
api/fruits-generate.js
api/grafica-generate.js
api/gemini.js
api/index.js
api/print-ai.js
api/visual-image.js
api/visual-edit.js
api/gpt-image-2.js
api/tts-eleven.js

docs/project-rules.md
docs/roadmap.md
```

## 2. Ordem recomendada no GitHub

1. Primeiro suba `index.html`.
2. Depois suba `studio/index.html`, `video/index.html` e `print/index.html`.
3. Depois suba a pasta `api/`.
4. Depois suba `middleware.js` e `package.json`.
5. `style.css` e `module-shell.js` podem ficar no repo, mas os originais principais usam CSS/JS inline.
6. Aguarde a Vercel fazer deploy.

## 3. Chaves API na Vercel

Nao coloque chave no HTML nem no GitHub.

Na Vercel, abra:

```txt
Project > Settings > Environment Variables
```

Adicione as variaveis que voce tiver:

```txt
ADMIN_USER=admin
ADMIN_PASS=fruits2026
SESSION_SECRET=coloque-uma-frase-grande-aqui

ANTHROPIC_API_KEY=sua-chave-claude
GEMINI_API_KEY=sua-chave-gemini
POLLINATIONS_API_KEY=sua-chave-flux
POLLINATIONS_IMAGE_MODEL=flux
```

Opcional, para depois:

```txt
OPENAI_API_KEY=sua-chave-openai
ELEVENLABS_API_KEY=sua-chave-elevenlabs
ELEVENLABS_VOICE_ID=id-da-voz
```

## 4. Depois de colocar as variaveis

Na Vercel:

1. Va em `Deployments`.
2. Clique nos tres pontinhos do ultimo deploy.
3. Clique em `Redeploy`.
4. Espere ficar `Ready`.
5. Abra `https://mega-studio.vercel.app`.

## 5. Login

Se voce nao mudar as variaveis:

```txt
Usuario: admin
Senha: fruits2026
```

Se quiser outra senha, mude `ADMIN_PASS` na Vercel.

## 6. O que foi corrigido

- Portal principal voltou para `index.html` da raiz.
- Studio, Video e Print carregam por iframe.
- Os originais completos de Studio, Video e Print foram preservados.
- Nodes, canvas, minimapa, estacao e exportacao dos originais foram mantidos.
- Auth login/logout/verify foi padronizado.
- Claude, Gemini e Flux ficam protegidos no backend.
- Se uma API nao tiver chave, o site nao quebra: ele mostra fallback local.
- Rotas que faltavam foram adicionadas:
  - `/api/laboratorio-generate`
  - `/api/visual-edit`
  - `/api/index`

## 7. Banco de imagens

Para salvar imagens geradas automaticamente, a proxima fase ideal e:

- `Vercel Blob` para imagens.
- `Vercel Postgres` ou `Supabase` para projetos/nodes.

Nesta correcao atual, o foco e fazer o site voltar a funcionar primeiro.

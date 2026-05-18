PORTAL GENESIS FLOW MODE - API READY

ARQUIVOS:
- index.html
- /api/generate-text.js
- /api/generate-image.js
- /api/generate-audio.js
- /api/generate-video.js

COMO USAR NO VERCEL:
1) Coloque index.html na raiz do projeto.
2) Crie a pasta /api/ e coloque os arquivos .js dentro dela.
3) No painel da Vercel, adicione variaveis de ambiente se quiser gerar de verdade:
   - OPENROUTER_API_KEY
   - SITE_URL
   - ELEVENLABS_API_KEY
   - ELEVENLABS_VOICE_ID (opcional)
   - ELEVENLABS_MODEL_ID (opcional)
4) Deploy.
5) No site, clique em API e confira se os endpoints estao assim:
   /api/generate-text
   /api/generate-image
   /api/generate-audio
   /api/generate-video

FLUXO:
- IMAGEM: funciona rapido com Pollinations.
- AUDIO: funciona de verdade quando ELEVENLABS_API_KEY estiver configurada.
- VIDEO: esta com scaffold pronto; voce pode plugar Runway/Kling/Luma/Replicate depois.
- TEXTO/ROTEIRO: funciona com OpenRouter quando OPENROUTER_API_KEY estiver configurada.

OBSERVACAO IMPORTANTE:
Nao deixe chaves fixas dentro do HTML. O ideal e sempre usar rotas /api e variaveis de ambiente.

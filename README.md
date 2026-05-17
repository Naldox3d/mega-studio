# Portal Genesis

Base consolidada para Portal Genesis com:

- login, logout e verify padronizados;
- portal mestre com abas Studio, Video, Print, Vitrine e API;
- modulos responsivos com nodes, canvas, minimapa, estacao e exportacao TXT/JSON;
- rotas preparadas para texto, Pollinations Flux, GPT Image 2 e ElevenLabs TTS;
- fallback local quando chaves de IA ainda nao estao configuradas.

## Rodar localmente

```bash
npm install
npm start
```

Depois abra `http://127.0.0.1:4173`.

Para usar o runtime da Vercel localmente:

```bash
npm run vercel
```

## Credenciais padrao

- `ADMIN_USER=admin`
- `ADMIN_PASS=fruits2026`

## Variaveis recomendadas

- `SESSION_SECRET`
- `ANTHROPIC_API_KEY`
- `ANTHROPIC_MODEL`
- `POLLINATIONS_API_KEY`
- `POLLINATIONS_IMAGE_MODEL`
- `OPENAI_API_KEY`
- `ELEVENLABS_API_KEY`
- `ELEVENLABS_VOICE_ID`

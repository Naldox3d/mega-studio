# Studio Platform

Estrutura profissional com três áreas separadas:

- **studio/**: área interna de criação, testes e atualizações.
- **client/**: produto final neutro para roteiristas e usuários finais.
- **print/**: ferramenta de gráfica e pré-impressão.
- **api/**: backend seguro para autenticação e geração com IA.

## Rodar localmente

```bash
npm install
npm start
```

Abra o endereço mostrado pelo `vercel dev`.

## Variáveis da Vercel

- `ADMIN_USER`
- `ADMIN_PASS`
- `SESSION_SECRET`
- `ANTHROPIC_API_KEY`

## Regra principal

O Client sempre começa limpo. Nenhum personagem, cena, universo, objeto ou preset do Studio entra automaticamente.

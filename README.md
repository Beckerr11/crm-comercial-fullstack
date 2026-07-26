# CRM Comercial Fullstack Demo

Demo publica de CRM comercial para portfolio, com clientes, catalogo, orcamentos, status de proposta e link publico de compartilhamento.

![Preview do CRM](./docs/preview-crm-home.png)

## Destaques

- gestao de clientes
- catalogo de produtos e servicos
- criacao e edicao de orcamentos
- aprovacao e recusa de propostas
- link publico de proposta
- persistencia local com `localStorage`

## Stack

- React
- Vite
- React Router
- React Icons

## Como rodar

```bash
npm install
npm run dev
```

## Scripts

```bash
npm test
npm run lint
npm run build
npm audit
```

## Estrutura principal

- `src/pages/Crm.jsx`: painel comercial principal
- `src/pages/PublicQuote.jsx`: tela publica da proposta
- `src/services/crmApi.js`: camada mock de dados e CRUD local
- `src/data/mockCrmSeed.js`: seed inicial da demo

## Observacoes

- Nao depende do produto privado principal.
- Não possui backend, banco remoto ou MongoDB: o CRUD demonstrativo roda no navegador e persiste em `localStorage`.
- O botao `Restaurar demo` recompõe a base inicial.
- Preparado para deploy simples em Vercel.

<!-- portfolio-showcase:start -->
## Showcase e entrevista

- Showcase local: `showcase/README.md`
- Roteiro de video: `showcase/video-script.md`
- Lista de cenas: `showcase/scenes.md`
- Legendas sugeridas: `showcase/captions.md`
- Guia de entrevista: `docs/INTERVIEW_GUIDE.md`
- Validado em 26/07/2026: testes, lint, build, auditoria de dependências e fluxo local
- Demo: https://crm-comercial-fullstack.vercel.app
- GitHub: https://github.com/Beckerr11/crm-comercial-fullstack
<!-- portfolio-showcase:end -->

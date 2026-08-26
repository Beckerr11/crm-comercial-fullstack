# CRM Comercial Fullstack Demo

Demo pública de CRM comercial para portfólio, com clientes, catálogo, orçamentos, status de proposta e link público de compartilhamento.

![Preview do CRM](./docs/preview-crm-home.png)

## Destaques

- gestão de clientes;
- catálogo de produtos e serviços;
- criação e edição de orçamentos;
- aprovação e recusa de propostas;
- link público de proposta;
- persistência local com `localStorage`;
- restauração determinística da base de demonstração.

## Stack

- React 19;
- Vite;
- React Router 7;
- React Icons;
- localStorage.

## Como rodar

```bash
npm ci
npm run dev
```

## Verificação

```bash
npm run lint
npm run build
npm audit --omit=dev --audit-level=high
```

O GitHub Actions executa esse mesmo gate em pushes e pull requests para `main`.

## Estrutura principal

- `src/pages/Crm.jsx`: painel comercial principal;
- `src/pages/PublicQuote.jsx`: tela pública da proposta;
- `src/services/crmApi.js`: camada mock de dados e CRUD local;
- `src/data/mockCrmSeed.js`: seed inicial da demo.

## Limites explícitos

Este repositório é um **showcase de frontend e fluxo comercial**. Não depende do produto privado principal e não possui backend, autenticação de produção ou banco remoto. A persistência é intencionalmente local para que qualquer avaliador consiga reproduzir o fluxo sem credenciais externas.

O botão `Restaurar demo` recompõe a base inicial e permite repetir a avaliação do produto.

## Autor

**Douglas Silva**  
[GitHub](https://github.com/Beckerr11) · [Portfólio](https://douglasdev.tech)

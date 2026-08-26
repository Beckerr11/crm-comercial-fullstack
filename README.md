# CRM Comercial — Demo Pública

[![CI](https://github.com/Beckerr11/crm-comercial-fullstack/actions/workflows/ci.yml/badge.svg)](https://github.com/Beckerr11/crm-comercial-fullstack/actions/workflows/ci.yml)

Demo pública de um fluxo comercial com **clientes, catálogo, orçamentos, status de proposta e compartilhamento por link**.

> Este repositório é uma **demonstração frontend isolada**. Ele não expõe o backend nem a infraestrutura do produto privado principal. A persistência desta versão é local, via `localStorage`, e a camada de dados é simulada para manter a demo pública simples e reproduzível.

🔗 **Demo:** https://crm-comercial-fullstack.vercel.app

![Preview do CRM](./docs/preview-crm-home.png)

## O que é possível testar

- gestão de clientes;
- catálogo de produtos e serviços;
- criação e edição de orçamentos;
- aprovação e recusa de propostas;
- link público de proposta;
- persistência local no navegador;
- restauração do estado inicial da demonstração.

## Stack

- React
- Vite
- React Router
- React Icons
- ESLint

## Arquitetura da demo

- `src/pages/Crm.jsx` — painel comercial principal;
- `src/pages/PublicQuote.jsx` — visualização pública da proposta;
- `src/services/crmApi.js` — camada mock de dados e CRUD local;
- `src/data/mockCrmSeed.js` — conjunto inicial de dados da demonstração.

## Como executar

```bash
npm install
npm run dev
```

## Qualidade

```bash
npm run lint
npm run build
```

O workflow de CI executa lint e build em pushes e pull requests para `main`.

## Escopo e limitações

- não utiliza MongoDB, Express ou autenticação real nesta versão pública;
- não depende do produto privado principal;
- dados permanecem somente no navegador;
- preparada para deploy estático na Vercel.

A separação entre **demo pública** e **implementação privada** é intencional para que o projeto possa ser avaliado sem expor infraestrutura ou dados de produção.

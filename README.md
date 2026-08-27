# CRM Comercial — Frontend Product Demo

[![CI](https://github.com/Beckerr11/crm-comercial-fullstack/actions/workflows/ci.yml/badge.svg)](https://github.com/Beckerr11/crm-comercial-fullstack/actions/workflows/ci.yml)

Showcase público de um fluxo comercial com **clientes, catálogo, propostas, status e compartilhamento**, construído em React para demonstrar modelagem de produto e experiência de uso sem depender de credenciais ou serviços externos.

**Demo:** https://crm-comercial-fullstack.vercel.app  
**Portfólio:** https://douglasdev.tech

> Apesar do nome histórico do repositório, o snapshot público atual é deliberadamente um **showcase de frontend**. Ele não apresenta backend, autenticação ou banco remoto como funcionalidades concluídas.

![Preview do CRM](./docs/preview-crm-home.png)

## O que este projeto demonstra

- gestão de clientes;
- catálogo de produtos e serviços;
- criação e edição de propostas/orçamentos;
- mudança de status comercial;
- aprovação e recusa de propostas;
- rota pública de compartilhamento de proposta;
- persistência local com `localStorage`;
- seed determinístico para repetir a avaliação;
- restauração da base de demonstração com um clique;
- navegação React e organização de fluxo de produto.

## Fluxo principal

```text
Painel comercial
      ↓
Clientes + catálogo
      ↓
Criação da proposta
      ↓
Status / edição / aprovação
      ↓
Link público da proposta
      ↓
Persistência local da demo
```

A camada `crmApi.js` abstrai as operações de dados da interface, mesmo usando armazenamento local. Isso mantém o componente de UI desacoplado do detalhe de persistência e facilita uma futura troca por API real.

## Stack

- React 19;
- Vite 7;
- React Router 7;
- React Icons;
- Tailwind CSS;
- localStorage;
- ESLint;
- GitHub Actions.

## Executando localmente

Requer Node.js compatível com o projeto e npm.

```bash
npm ci
npm run dev
```

Para gerar o bundle de produção:

```bash
npm run build
npm run preview
```

## Qualidade e CI

O gate local pode ser reproduzido com:

```bash
npm run lint
npm run build
npm audit --omit=dev --audit-level=high
```

O GitHub Actions executa automaticamente, em pushes e pull requests para `main`:

1. instalação determinística com `npm ci`;
2. lint;
3. build de produção;
4. auditoria de dependências de produção em severidade alta ou superior.

## Estrutura principal

```text
src/
├── pages/
│   ├── Crm.jsx          # painel comercial principal
│   └── PublicQuote.jsx  # proposta pública compartilhável
├── services/
│   └── crmApi.js        # camada de operações e CRUD local
└── data/
    └── mockCrmSeed.js   # base inicial reproduzível
```

## Decisões de engenharia

- **Persistência local intencional:** permite abrir a demo e testar o fluxo sem provisionar banco ou fornecer credenciais.
- **Seed reproduzível:** o avaliador consegue restaurar o mesmo estado inicial e repetir os cenários.
- **Camada de serviço separada:** a UI não precisa conhecer diretamente todos os detalhes do armazenamento.
- **Rota pública de proposta:** demonstra um fluxo que atravessa o painel interno e uma experiência externa de cliente.

## Limites explícitos

Este repositório não possui backend, autenticação de produção, banco remoto, processamento de pagamentos ou controle de acesso real. `localStorage` é usado somente para tornar o showcase público simples e reproduzível.

O projeto principal DouglasDev possui escopo diferente e é mantido separadamente. Este repositório existe como evidência pública verificável de frontend, fluxo comercial, qualidade de código e CI.

## Autor

**Douglas Silva**  
[GitHub](https://github.com/Beckerr11) · [Portfólio](https://douglasdev.tech) · [LinkedIn](https://www.linkedin.com/in/douglassilva11)

# CRM Product Refresh Implementation Plan

> **For agentic workers:** Execute inline using superpowers:executing-plans, with test-driven development and final review.

**Goal:** Entregar CRM demonstrável com UI própria, API MongoDB, isolamento, propostas versionadas e compartilhamento público.

**Architecture:** React/Vite consome API Express no mesmo domínio. Um documento MongoDB por workspace mantém o domínio; updates com compare-and-swap evitam perda concorrente. Sessões opacas em cookies HttpOnly e CSRF para operações privadas.

**Tech Stack:** React, Vite, Express, MongoDB Node driver, Zod, Node test runner, Supertest, Playwright.

**Spec:** ../outputs/proposta-evolucao-projetos.md, seção CRM caminho A, autorizado pelo usuário em “pode fazer”.

## Global Constraints
- Interface em português, dados monetários em centavos, snapshots de propostas, compartilhamento revogável.
- Demo isolada por sessão, dados fictícios, expiração, limites de volume; produção usa MONGODB_URI fornecida pelo ambiente.
- Não publicar nem substituir a demo existente antes de revisão do resultado local.

## Review Focus
- Concorrência de edição/decisão: apenas uma mudança válida por versão.
- Sessão expirada ou workspace diferente: nenhuma leitura/modificação cruzada.
- Dinheiro/quantidade inválida: rejeitar antes de salvar.
- Token expirado/revogado e revisões: invalidar o aceite da versão antiga.
- Mobile, teclado, erros de rede: manter o fluxo operável.

### Task 1: Domínio e persistência
**Files:** server/domain.js, server/store.js, server/tests/domain.test.js.
**Interfaces:** buildQuote(workspace,payload), mutateWorkspace(db,id,operation); valores em centavos e erros com status HTTP.
- [ ] Escrever e observar falha de testes de totais, snapshots, transições, revisão e isolamento.
- [ ] Implementar domínio, seed e CAS MongoDB.
- [ ] Verificar testes e persistência no MongoDB real de desenvolvimento.

### Task 2: API e sessão
**Files:** server/app.js, server/index.js, server/tests/api.test.js, scripts/dev.mjs.
**Interfaces:** /api/session, /api/auth/*, /api/workspace, /api/clients, /api/products, /api/quotes, /api/public/:token.
- [ ] Escrever testes HTTP de sessão, CSRF, isolamento, persistência, token/revisão e decisões idempotentes.
- [ ] Criar API validada, sessão no banco, cookies, headers e limites.
- [ ] Rodar testes com servidor MongoDB real isolado; runtime local preserva dados em work/data.

### Task 3: Experiência de produto
**Files:** src/crm/*, src/App.jsx, src/main.jsx, src/crm.css.
**Interfaces:** http(path,{method,body}) consome JSON com credentials e CSRF; App usa workspace snapshot da API.
- [ ] Preparar teste de fluxo em navegador independente (proposta compartilhada em outro contexto).
- [ ] Criar navegação, tabelas, forms, editor de itens, detalhe/histórico, público e impressão.
- [ ] Verificar mobile, teclado, cálculo, validação e estado de rede.

### Task 4: Entrega e revisão
**Files:** README.md, .env.example, .github/workflows/ci.yml, docs/VALIDACAO.md.
- [ ] Executar suíte, lint, build, teste E2E e inspeção visual após último ajuste.
- [ ] Revisar mudanças, corrigir problemas confirmados e registrar limitações.
- [ ] Salvar capturas reais e abrir preview local; manter sem push/publicação.

# Como explicar este projeto em entrevista

## O que é

É uma demo pública de CRM comercial. Ela reúne clientes, produtos, serviços e propostas em um fluxo que pode ser testado sem cadastro ou infraestrutura externa.

## Qual problema demonstra

O projeto organiza um processo comercial enxuto: cadastrar a base, montar um orçamento, acompanhar o status e abrir a versão pública da proposta.

## Stack e arquitetura real

- React, Vite, React Router e React Icons.
- Componentes e páginas organizam a interface.
- `src/services/crmApi.js` implementa o CRUD demonstrativo.
- `src/data/mockCrmSeed.js` fornece os dados iniciais.
- O estado é persistido no `localStorage` do navegador.

O projeto não possui backend, API real, banco remoto ou MongoDB. A camada chamada de API é um adaptador local assíncrono, criado para manter a interface próxima de um produto sem fingir uma integração inexistente.

## Fluxo principal

1. Abrir o painel com a base inicial.
2. Consultar ou cadastrar clientes e itens do catálogo.
3. Criar uma proposta, alterar seu status e filtrar o pipeline.
4. Abrir a proposta pública.
5. Usar `Restaurar demo` para retornar ao seed inicial.

## Decisões e desafios

- Manter clientes, itens e totais coerentes depois de uma edição.
- Expor estados de vazio, erro, busca, ordenação e paginação.
- Permitir uma demonstração repetível, sem depender de credenciais.
- Deixar explícito que os dados ficam somente naquele navegador.

## Próximos passos possíveis

- Criar uma API autenticada e um banco apenas em uma versão separada.
- Adicionar testes de componente para os formulários e o link público.
- Exportar um PDF real em vez de representar a proposta em uma rota web.

## O que o projeto comprova

Ele comprova organização de estado, modelagem de um fluxo de produto, formulários, filtros, persistência local e cuidado com a apresentação pública.

## Pitch de 30 segundos

O CRM Comercial Fullstack é uma demo em React que organiza clientes, catálogo e propostas. O fluxo inteiro roda localmente no navegador e pode ser restaurado a qualquer momento, então consigo demonstrar CRUD, filtros, status e uma proposta pública sem depender de uma API externa.

## Pitch de 2 minutos

Eu construí este CRM para transformar um fluxo comercial em uma demonstração curta e verificável. A aplicação começa com dados de exemplo, permite gerenciar clientes e produtos, criar propostas com múltiplos itens, acompanhar seus status e abrir uma visão pública. A camada de serviço imita chamadas assíncronas, mas não há backend ou banco remoto: o estado fica no `localStorage`. Essa escolha deixa a demo autônoma e também define claramente seu limite. Em uma evolução de produção, eu separaria a API, aplicaria autenticação e persistência remota e ampliaria os testes dos formulários.

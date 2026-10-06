# Folio — CRM Comercial

Clientes, serviços e propostas para profissionais que vendem seu trabalho. Esta versão transforma a demonstração de frontend em uma aplicação React/Express com MongoDB e compartilhamento independente do navegador do autor.

![Visão geral](docs/screenshots/dashboard.jpg)

## Experimente localmente

Requer Node.js 24 ou superior e npm. Na primeira execução, o iniciador baixa o servidor oficial MongoDB 8.2.6; é necessária conexão com a internet. O banco local usa `work/data` e permanece entre execuções. Não é um mock em JavaScript.

```powershell
npm ci
npm run dev
```

Abra `http://localhost:5173`. “Explorar demonstração” cria um workspace privado com dados **fictícios** e validade de 24 horas. “Criar minha conta” cria um workspace vazio e permanente. A sessão da conta dura sete dias; entrar novamente preserva os cadastros.

Uma URL criada localmente funciona em outro navegador **no mesmo computador**. Para outros dispositivos acessarem pela internet, é necessário publicar a aplicação e configurar o banco de produção. A versão desta branch não substitui a antiga demonstração pública.

## Fluxo para avaliar

1. Entre na demonstração e cadastre um cliente em **Clientes**.
2. Cadastre um serviço e valor em **Serviços**, ou use um item personalizado.
3. Em **Propostas**, escolha o cliente, adicione itens e confira o total.
4. Salve o rascunho, envie e crie o link público.
5. Abra o link em janela anônima, revise e aprove ou recuse.
6. Atualize o painel: a decisão aparece no status e no histórico.
7. Crie uma nova revisão: os dados anteriores ficam arquivados e o link anterior deixa de funcionar.

O envio marca a proposta como pronta para compartilhar; **não envia e-mail**. A impressão usa o navegador, que permite salvar em PDF. O aceite registra uma decisão operacional sobre a revisão; não implementa assinatura eletrônica.

## O que foi implementado

- Cadastro, edição, busca e exclusão de clientes e serviços.
- Editor com catálogo, itens personalizados, quantidades e valores em reais.
- Totais calculados no servidor a partir de centavos inteiros.
- Snapshots preservam cliente, escopo e preços do documento enviado.
- Rascunho → enviada → aprovada/recusada; nova revisão para editar após o envio.
- Link aleatório, válido por sete dias na interface, renovável e revogável. Tokens são armazenados como hash.
- Decisão pública independente da sessão do autor, com confirmação e repetição idempotente.
- Painel com totais derivados dos registros, filtros, estados vazios, validação e mensagens de erro.
- Navegação responsiva, foco visível, diálogos nomeados, Escape e retorno de foco.
- Autenticação com scrypt, sessão opaca HttpOnly/SameSite e CSRF em alterações privadas.

## Arquitetura

```text
React/Vite → /api → Express → MongoDB
                              ├─ users
                              ├─ sessions (TTL)
                              └─ workspaces (TTL somente na demo)
```

Cada workspace guarda o agregado de clientes, serviços e propostas. Alterações usam compare-and-swap sobre `version`, evitando sobrescrever uma edição concorrente. O cliente recebe `409` e uma mensagem para revisar os dados. Decisões repetidas sem mudança não incrementam a versão. Gravações aguardam o journal do MongoDB (`j:true`).

Limites deste escopo: 100 clientes, 100 serviços, 200 propostas, 30 itens por proposta, 20 revisões e 8 MiB por workspace. O agregado simplifica consistência em um MongoDB standalone; grandes equipes e volumes exigiriam outro modelo de armazenamento. Cada conta possui um workspace pessoal, sem colaboração multiusuário, recuperação de senha ou verificação de e-mail nesta versão.

## Verificação

```powershell
npm test
npm run lint
npm run build
npx playwright install chromium
npm run test:e2e
npm audit
```

Os testes HTTP usam um processo MongoDB real e isolado. Há um teste que reinicia esse processo e verifica a permanência de cliente, sessão e conta. Playwright cobre proposta/aceite em outro contexto, revisão/revogação, conta e catálogo, mobile, teclado e verificações automáticas WCAG AA com axe. O teste em navegador inicia o ambiente automaticamente quando a porta está livre.

Consulte [VALIDACAO.md](docs/VALIDACAO.md) para a evidência desta entrega e [CASE-PORTFOLIO.md](docs/CASE-PORTFOLIO.md) para sua apresentação.

## Produção

Esta aplicação precisa de um processo Node e MongoDB persistente. Um deploy apenas estático não atende às rotas `/api`.

```powershell
npm ci
npm run build
# Configure as variáveis abaixo no ambiente do serviço.
npm start
```

Variáveis: `NODE_ENV=production`, `MONGODB_URI` com conexão autenticada do serviço, `MONGODB_DATABASE=crm_comercial`, `APP_ORIGIN=https://seu-dominio`, `PORT` e `HOST` conforme o provedor. Em produção, a API serve `dist` e as rotas da aplicação no mesmo domínio. `APP_ORIGIN` precisa coincidir exatamente com a origem pública. Cookies Secure exigem HTTPS. Restrinja o acesso de rede ao banco e configure backup no serviço escolhido.

O iniciador de desenvolvimento é somente local, escuta em loopback e usa um MongoDB sem autenticação ligado a `127.0.0.1`. Não deve ser usado como servidor público. Os limites por IP ficam na memória do processo; replicar a API requer compartilhamento desses limites e configuração explícita do proxy.

## Organização

`src/crm/` contém telas, formulários e componentes; `server/domain.js` mantém regras; `server/store.js` mantém persistência/CAS; `server/app.js` expõe API/sessões; `server/tests/` e `tests/e2e/` mantêm as verificações. Fontes Manrope são locais e distribuídas com sua licença OFL em `public/fonts/OFL.txt`.

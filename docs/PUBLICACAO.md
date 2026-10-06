# Publicação do Folio CRM

## Destino existente

O projeto `crm-comercial-fullstack` foi localizado e vinculado na Vercel. O endereço público a preservar é `https://crm-comercial-fullstack.vercel.app`.

Em 05/10/2026, a Vercel não tinha variáveis de produção configuradas para esse projeto. Após login, a conta DouglasDev no Render mostrou 17 serviços não agrupados e um serviço `login-api` no projeto agrupado; nenhum CRM foi encontrado. O proprietário informou que ainda não havia MongoDB hospedado. A publicação da nova API e a substituição pública permanecem pendentes da configuração do banco; a versão anterior continua no ar.

Em 06/10/2026, o cluster gratuito `atlas-camel-basket` foi encontrado na organização já vinculada à Vercel, retomado e confirmado ativo. O usuário dedicado `folio-app` foi preparado com `readWrite` apenas em `crm_comercial`, restrito a esse cluster. Sua criação e o preenchimento da conexão secreta no Render dependem da conclusão pelo proprietário. Não reutilizar nem alterar a senha do usuário administrativo existente.

O serviço `folio-crm-api` foi preparado no Render com plano Free, branch `codex/crm-product-refresh`, build `npm ci && npm run build`, start `npm start` e health check `/health`. A criação do serviço ainda não foi enviada.

O código foi enviado à branch de trabalho e o [PR 24](https://github.com/Beckerr11/crm-comercial-fullstack/pull/24) permanece em draft. O [CI remoto 30](https://github.com/Beckerr11/crm-comercial-fullstack/actions/runs/37393571658) terminou com sucesso para o commit `38fd4dca50b09d783fb9fb14a829962b2f4233b8`, incluindo build, lint, formatação, testes de API/persistência, navegador e auditoria de dependências.

## API no Render

Nesta conta, será necessário um serviço para a nova API. Caso o proprietário identifique uma API de CRM em outra conta, conferir repositório, branch, variáveis e banco antes de substituí-la. O exemplo não deve alterar serviços dos outros projetos.

- Runtime: Node 24.
- Build: `npm ci && npm run build`.
- Start: `npm start`.
- Health check: `/health`, que verifica a conexão com MongoDB.
- `NODE_ENV=production` e `HOST=0.0.0.0`.
- `APP_ORIGIN=https://crm-comercial-fullstack.vercel.app`.
- `MONGODB_DATABASE=crm_comercial`.
- `MONGODB_URI`: conexão autenticada do banco hospedado, cadastrada como segredo no Render.
- `PORT`: usar a porta fornecida pelo Render.

O arquivo [render.example.yaml](../deploy/render.example.yaml) é um modelo para revisão, sem aplicação automática. O diretório local `work/data` não é o banco de produção.

## Frontend na Vercel

Configurar Vite, build `npm run build`, instalação `npm ci` e saída `dist`. Após obter o endereço real da API, criar `vercel.json` com o proxy antes do fallback da aplicação:

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "framework": "vite",
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://ENDERECO-REAL-DA-API.onrender.com/api/:path*"
    },
    {
      "source": "/health",
      "destination": "https://ENDERECO-REAL-DA-API.onrender.com/health"
    },
    { "source": "/:path*", "destination": "/index.html" }
  ]
}
```

O endereço acima é um marcador de documentação: substituir pelo serviço confirmado antes de publicar. O navegador continua usando `/api` no domínio da Vercel. A API mantém cookies Secure/HttpOnly e exige a origem configurada e CSRF nas alterações autenticadas.

## Ordem de liberação

1. Configurar o MongoDB hospedado e a conexão secreta da API.
2. Publicar a API e confirmar `/health` com banco disponível.
3. Configurar o proxy para a URL real e gerar uma implantação de preview na Vercel. Durante a verificação de alterações no preview, configurar `APP_ORIGIN` com sua origem HTTPS exata; restaurar a origem de produção antes da promoção. A API rejeita gravações vindas de uma origem diferente.
4. Verificar apresentação, navegação direta, sessão, criação de cliente/proposta, link público em outra sessão e aprovação. Verificar novamente após recarregar a página e reiniciar a API.
5. Promover a versão verificada para o domínio de produção existente.
6. Registrar URLs, commit e resultados. Se falhar, reverter a implantação da Vercel e a versão da API; preservar o banco.

Os dados da demo anterior ficavam no localStorage do navegador. Esta versão usa contas e workspaces no MongoDB; ela não faz migração automática daquele armazenamento.

## Referências

- [Express no Render](https://render.com/docs/deploy-node-express-app)
- [Health checks do Render](https://render.com/docs/health-checks)
- [Blueprints do Render](https://render.com/docs/blueprint-spec)
- [Proxy por rewrites da Vercel](https://vercel.com/docs/routing/rewrites)

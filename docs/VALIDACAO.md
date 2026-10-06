# Validação local — Folio CRM

Data: 05/10/2026. Branch: `codex/crm-product-refresh`. Esta entrega valida o **CRM local**; Client Portal Pro, Finance Tracker e Security Automation permanecem projetos posteriores.

## Resultado

| Verificação                 | Evidência                                                                                                     |
| --------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Regras, HTTP e persistência | `npm test`: 15 testes aprovados                                                                               |
| Fluxos em navegador         | `npm run test:e2e -- --workers=1`: 5 testes aprovados                                                         |
| Lint                        | `npm run lint`: sem erros                                                                                     |
| Formatação                  | `npm run format:check`: aprovada                                                                              |
| Build                       | `npm run build`: aprovado; JS 269,97 kB / 84,71 kB gzip                                                       |
| Dependências                | `npm audit`: 0 vulnerabilidades reportadas nesta execução                                                     |
| Runtime de produção, local  | `/health`, `/` e `/app/quotes` responderam 200; demo 201; cookie Secure/HttpOnly/SameSite=Lax e CSP presentes |
| Revisão independente        | Sem findings críticos/importantes confirmados; dois ajustes menores corrigidos e rechecados                   |

Ambiente executado: Windows, Node 26.7.0, Vite 7.3.6, MongoDB 8.2.6 e Chromium instalado pelo Playwright. O CI foi atualizado com esses comandos, mas **não foi executado no GitHub**, pois a branch ainda é local.

## Casos exercitados

- Visitante cadastra cliente, cria proposta de 3 × R$19,99 e confere R$59,97.
- Link é aberto em contexto separado, sem o cookie do autor; aprovação aparece no painel após atualização.
- Nova revisão preserva o valor anterior, muda o total para R$89,97 e invalida o link antigo; revogação torna o novo link indisponível.
- Conta cria serviço, rejeita formato monetário ambíguo, salva preço válido, sai, entra novamente e encontra o cadastro; exclusão confirma o alvo.
- Mobile 390×844 navega pelo menu sem excesso de largura na página. A tabela possui rolagem própria.
- Modal possui nome acessível; Escape fecha e devolve o foco ao botão de abertura.
- Axe verifica os critérios automatizáveis WCAG A/AA da apresentação e do painel. Isso não substitui uma avaliação humana completa de acessibilidade.
- API recusa sessão ausente/expirada, CSRF ausente, origem incorreta, entidade de outro workspace e gravação com versão desatualizada.
- Domínio testa dinheiro, quantidades, snapshots, transições, links expirados/revogados, decisão contraditória, projeção pública e exclusão com referência.
- O teste de persistência para e reinicia um **processo MongoDB** sobre o mesmo diretório; cliente, sessão e login continuam disponíveis.
- Limite de 8 MiB rejeita alteração sem perder registros anteriores.
- Repetir aprovação preserva histórico **e versão** do workspace, evitando conflitos em edições independentes.

## Problemas encontrados e corrigidos

O reinício real revelou que o acknowledgement padrão não garantia journal antes de uma interrupção rápida no Windows; a API passou a usar `writeConcern: {w:1,j:true}`. O teste correspondente falhou e depois passou.

O navegador revelou rótulos de select mal associados, texto que prejudicava o nome de um link, excesso de largura causado por posicionamento absoluto e retorno de foco incompleto. As correções foram verificadas nos mesmos fluxos. O teste de contraste apontou texto secundário muito claro; as cores foram escurecidas e a verificação passou.

A revisão independente encontrou incremento de versão em aprovação repetida e diálogo sem nome acessível. Os testes adicionais primeiro reproduziram as falhas, depois passaram com as correções; o revisor confirmou ambas.

## Capturas reais

Todos os registros mostrados são fictícios. As capturas vieram da aplicação executada, sem montagem:

- [Apresentação](screenshots/apresentacao.jpg)
- [Painel desktop](screenshots/dashboard.jpg)
- [Painel mobile](screenshots/mobile.jpg)
- [Proposta pública](screenshots/proposta-publica.jpg)

## Limites da conclusão

O smoke test de produção usou HTTP em loopback e confirmou roteamento/headers; não valida um deploy HTTPS real. A publicação requer um processo Node, MongoDB persistente e a origem pública configurada. URL pública, backup/restauração do serviço, infraestrutura e integração de CI remota permanecem sem validação. Nenhum código foi enviado ao GitHub nem substituiu a demonstração atual.

A nova base não migra dados do antigo localStorage. O README descreve o escopo pessoal e os limites de volume; não anuncia colaboração de equipe, envio de e-mail ou assinatura eletrônica.

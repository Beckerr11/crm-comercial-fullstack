import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
test("dialogs have an accessible name and restore focus on Escape", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Explorar demonstração" }).click();
  await page.getByRole("link", { name: "Clientes", exact: true }).click();
  await page.getByRole("button", { name: "Novo cliente" }).click();
  await expect(
    page.getByRole("dialog", { name: "Novo cliente", exact: true }),
  ).toBeVisible({ timeout: 1000 });
  await page.getByLabel("Nome do cliente").press("Escape");
  await expect(
    page.getByRole("button", { name: "Novo cliente" }),
  ).toBeFocused();
});
test("a visitor creates a proposal, shares it with another browser and receives approval", async ({
  page,
  browser,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Explorar demonstração" }).click();
  await expect(
    page.getByRole("heading", { name: "Visão geral", exact: true }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Clientes", exact: true }).click();
  await page.getByRole("button", { name: "Novo cliente" }).click();
  await page.getByLabel("Nome do cliente").fill("Cliente do fluxo E2E");
  await page.getByLabel("E-mail").fill("e2e@example.com");
  await page.getByRole("button", { name: "Salvar cliente" }).click();
  await expect(
    page.getByText("Cliente do fluxo E2E", { exact: true }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Propostas", exact: true }).click();
  await page
    .getByRole("button", { name: "Nova proposta", exact: true })
    .click();
  await page
    .getByLabel("Cliente", { exact: true })
    .selectOption({ label: "Cliente do fluxo E2E" });
  await page.getByLabel("Nome do item 1").fill("Interface e API");
  await page.getByLabel("Valor unitário 1").fill("19,99");
  await page.getByLabel("Quantidade 1").fill("3");
  await expect(page.getByTestId("quote-total")).toContainText("59,97");
  await page.getByRole("button", { name: "Salvar rascunho" }).click();
  await page
    .getByRole("button", { name: "Enviar proposta", exact: true })
    .click();
  await page.getByRole("button", { name: "Criar link público" }).click();
  const url = await page.getByLabel("Link da proposta").inputValue();
  const context = await browser.newContext();
  const client = await context.newPage();
  await client.goto(url);
  await expect(
    client.getByRole("heading", {
      name: "Uma proposta para dar o próximo passo.",
    }),
  ).toBeVisible();
  await expect(client.getByTestId("public-total")).toContainText("59,97");
  await client.getByRole("button", { name: "Aprovar proposta" }).click();
  await client.getByRole("button", { name: "Confirmar aprovação" }).click();
  await expect(
    client.getByText("Proposta aprovada.", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Fechar diálogo" }).click();
  await page.getByRole("button", { name: "Atualizar dados" }).click();
  await expect(
    page
      .getByRole("row")
      .filter({ hasText: "Cliente do fluxo E2E" })
      .getByTestId("proposal-status"),
  ).toHaveText("Aprovada");
  await page.reload();
  await expect(
    page.getByText("Cliente do fluxo E2E", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Cliente do fluxo E2E", exact: true })
    .click();
  await page.getByRole("button", { name: "Criar nova revisão" }).click();
  await expect(page.getByLabel("Valor unitário 1")).toHaveValue("19,99");
  await page.getByLabel("Valor unitário 1").fill("29,99");
  await page.getByRole("button", { name: "Salvar rascunho" }).click();
  await page
    .getByRole("button", { name: "Enviar proposta", exact: true })
    .click();
  await page.getByRole("button", { name: "Criar link público" }).click();
  const revisedUrl = await page.getByLabel("Link da proposta").inputValue();
  expect(revisedUrl).not.toBe(url);
  await client.reload();
  await expect(client.getByRole("alert")).toContainText("link revogado");
  await client.goto(revisedUrl);
  await expect(client.getByTestId("public-total")).toContainText("89,97");
  await page.getByRole("button", { name: "Revogar link" }).click();
  await client.reload();
  await expect(client.getByRole("alert")).toContainText("link revogado");
  await context.close();
});
test("persistent account manages a service and logs in again", async ({
  page,
}) => {
  const email = `e2e-${Date.now()}@example.com`;
  await page.goto("/");
  await page.getByRole("button", { name: "Criar minha conta" }).click();
  await page.getByLabel("Seu nome").fill("Conta de teste");
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha").fill("SenhaFicticiaDeTeste123!");
  await page.getByRole("button", { name: "Criar conta", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Visão geral", exact: true }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Serviços", exact: true }).click();
  await page.getByRole("button", { name: "Novo serviço" }).click();
  await page.getByLabel("Nome do serviço").fill("Serviço persistente");
  await page.getByLabel("Valor unitário (R$)").fill("19.99");
  await page.getByRole("button", { name: "Salvar serviço" }).click();
  await expect(page.getByRole("alert")).toContainText("1.250,00");
  await page.getByLabel("Valor unitário (R$)").fill("1.250,00");
  await page.getByRole("button", { name: "Salvar serviço" }).click();
  await expect(
    page.getByText("Serviço persistente", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Sair do espaço" }).click();
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha").fill("SenhaFicticiaDeTeste123!");
  await page
    .getByRole("button", { name: "Entrar", exact: true })
    .last()
    .click();
  await page.getByRole("link", { name: "Serviços", exact: true }).click();
  await expect(
    page.getByText("Serviço persistente", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Excluir", exact: true }).click();
  await page.getByRole("button", { name: "Confirmar exclusão" }).click();
  await expect(
    page.getByRole("heading", { name: "Seu catálogo começa aqui" }),
  ).toBeVisible();
});
test("landing and workspace meet automated WCAG AA checks", async ({
  page,
}) => {
  await page.goto("/");
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze()
    ).violations,
  ).toEqual([]);
  await page.getByRole("button", { name: "Explorar demonstração" }).click();
  await expect(
    page.getByRole("heading", { name: "Visão geral", exact: true }),
  ).toBeVisible();
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze()
    ).violations,
  ).toEqual([]);
});
test("mobile demo is usable without horizontal page overflow", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "Explorar demonstração" }).click();
  await expect(
    page.getByRole("heading", { name: "Visão geral", exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "Abrir menu" }).click();
  await page.getByRole("link", { name: "Propostas", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Propostas", exact: true }),
  ).toBeVisible();
});

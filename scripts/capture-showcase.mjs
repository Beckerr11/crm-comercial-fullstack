import assert from "node:assert/strict"
import fs from "node:fs/promises"
import http from "node:http"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { chromium } from "playwright"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const dist = path.join(root, "dist")
const screenshots = path.join(root, "showcase", "screenshots")

const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
}

async function startServer() {
  const server = http.createServer(async (request, response) => {
    try {
      const pathname = decodeURIComponent(
        new URL(request.url, "http://127.0.0.1").pathname,
      )
      const relativePath =
        pathname === "/" ? "index.html" : pathname.replace(/^\/+/u, "")
      let target = path.resolve(dist, relativePath)

      if (!target.startsWith(`${dist}${path.sep}`)) {
        target = path.join(dist, "index.html")
      }

      let body
      try {
        body = await fs.readFile(target)
      } catch {
        target = path.join(dist, "index.html")
        body = await fs.readFile(target)
      }

      response.writeHead(200, {
        "Cache-Control": "no-store",
        "Content-Type":
          contentTypes[path.extname(target)] || "application/octet-stream",
      })
      response.end(body)
    } catch (error) {
      response.writeHead(500)
      response.end(error.message)
    }
  })

  await new Promise((resolve, reject) => {
    server.once("error", reject)
    server.listen(0, "127.0.0.1", resolve)
  })

  return server
}

function watchPage(page, failures) {
  page.on("console", (message) => {
    if (message.type() === "error") {
      failures.push(`console: ${message.text()}`)
    }
  })
  page.on("pageerror", (error) => failures.push(`pageerror: ${error.message}`))
  page.on("response", (response) => {
    if (response.status() >= 400) {
      failures.push(`http ${response.status()}: ${response.url()}`)
    }
  })
}

async function assertLayout(page) {
  await page.locator("main").waitFor()
  const hasOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth + 1,
  )
  assert.equal(hasOverflow, false, "a página possui overflow horizontal")
}

const server = await startServer()
const address = server.address()
const baseUrl = `http://127.0.0.1:${address.port}`
const browser = await chromium.launch({ headless: true })
const failures = []

try {
  await fs.mkdir(screenshots, { recursive: true })

  const desktop = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  watchPage(desktop, failures)
  await desktop.goto(baseUrl, { waitUntil: "networkidle" })
  await desktop.getByRole("heading", { level: 1 }).first().waitFor()
  await assertLayout(desktop)
  await desktop.screenshot({
    fullPage: true,
    path: path.join(screenshots, "crm-desktop.png"),
  })

  await desktop.getByRole("button", { name: "Clientes" }).click()
  await desktop.getByRole("heading", { name: "Pesquisar por nome" }).waitFor()
  await desktop.getByRole("button", { name: "Produtos e serviços" }).click()
  await desktop
    .getByRole("heading", { name: "Produtos e serviços" })
    .waitFor()
  await desktop.getByRole("button", { name: "Orçamentos" }).click()
  await desktop
    .getByRole("heading", { name: "Lista de orçamentos" })
    .waitFor()
  assert.ok(
    await desktop.evaluate(() =>
      Boolean(window.localStorage.getItem("crm-comercial-demo:v1")),
    ),
    "a base demonstrativa não foi persistida",
  )

  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } })
  watchPage(mobile, failures)
  await mobile.goto(baseUrl, { waitUntil: "networkidle" })
  await assertLayout(mobile)
  await mobile.screenshot({
    fullPage: true,
    path: path.join(screenshots, "crm-mobile.png"),
  })

  assert.deepEqual(failures, [], failures.join("\n"))
  console.log("[showcase] CRM validado e capturado em desktop/mobile")
} finally {
  await browser.close()
  await new Promise((resolve) => server.close(resolve))
}

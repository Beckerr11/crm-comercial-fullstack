import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import test from "node:test"
import { fileURLToPath } from "node:url"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8")
}

function packageVersion(lockfile, packageName) {
  const version = lockfile.packages?.[`node_modules/${packageName}`]?.version
  assert.ok(version, `${packageName} ausente do lockfile`)
  return version
}

function compareVersions(left, right) {
  const tuple = (value) => String(value).split(".").slice(0, 3).map(Number)
  const [leftMajor, leftMinor, leftPatch] = tuple(left)
  const [rightMajor, rightMinor, rightPatch] = tuple(right)
  return (
    leftMajor - rightMajor ||
    leftMinor - rightMinor ||
    leftPatch - rightPatch
  )
}

test("showcase descreve somente o CRM local realmente entregue", () => {
  const readme = read("README.md")
  const guide = read("docs/INTERVIEW_GUIDE.md")
  const showcase = [
    read("showcase/README.md"),
    read("showcase/scenes.md"),
    read("showcase/captions.md"),
    read("showcase/video-script.md"),
  ].join("\n")
  const app = read("src/App.jsx")

  assert.match(readme, /Validado em 26\/07\/2026/u)
  assert.match(readme, /npm test/u)
  assert.match(guide, /não (?:possui|usa) backend/iu)
  assert.match(guide, /localStorage/u)
  assert.match(showcase, /clientes, produtos e propostas/iu)
  assert.doesNotMatch(showcase, /2026-06-30/u)
  assert.doesNotMatch(showcase, /Se a demo ainda nao existir/iu)
  assert.doesNotMatch(`${guide}\n${showcase}`, /\.\./u)
  assert.doesNotMatch(app, /"MongoDB"/u)
})

test("showcase contém capturas reais desktop e mobile", () => {
  for (const relativePath of [
    "showcase/screenshots/crm-desktop.png",
    "showcase/screenshots/crm-mobile.png",
  ]) {
    const absolutePath = path.join(root, relativePath)
    assert.ok(fs.existsSync(absolutePath), `${relativePath} ausente`)
    assert.ok(fs.statSync(absolutePath).size > 10_000, `${relativePath} superficial`)
  }
})

test("lockfile evita as faixas vulneráveis observadas", () => {
  const lockfile = JSON.parse(read("package-lock.json"))

  assert.equal(
    lockfile.packages?.["node_modules/react-router-dom"],
    undefined,
    "react-router-dom vulnerável deve ser removido",
  )
  assert.ok(compareVersions(packageVersion(lockfile, "react-router"), "8.3.0") >= 0)
  assert.ok(compareVersions(packageVersion(lockfile, "postcss"), "8.5.18") >= 0)
  assert.ok(compareVersions(packageVersion(lockfile, "vite"), "7.3.4") >= 0)
  assert.ok(compareVersions(packageVersion(lockfile, "brace-expansion"), "5.0.8") >= 0)
})

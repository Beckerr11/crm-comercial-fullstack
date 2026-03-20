import { Link, Navigate, Route, Routes } from "react-router-dom"
import IconSymbol from "./components/IconSymbol"
import TechBadge from "./components/TechBadge"
import Crm from "./pages/Crm"
import PublicQuote from "./pages/PublicQuote"
import { resetCrmDemoData } from "./services/crmApi"

const stack = [
  "React",
  "Vite",
  "MongoDB",
  "Dashboard",
]

function DemoShell({ children }) {
  return (
    <main className="page-shell standalone-demo-shell">
      <section className="surface section-card standalone-demo-hero">
        <div className="standalone-demo-topline">
          <span className="mini-pill emphasis">CRM comercial demo</span>
          <span className="mini-pill">Standalone</span>
        </div>

        <div className="standalone-demo-grid">
          <div className="standalone-demo-copy">
            <p className="eyebrow">Portfolio publico</p>
            <h1>Pipeline, propostas e fechamento em uma demo pronta para mostrar produto real.</h1>
            <p className="section-copy">
              Base independente para portfolio: clientes, catalogo, orcamentos, status, link publico e persistencia local para
              demonstracao.
            </p>
            <div className="pill-row">
              {stack.map((item) => (
                <TechBadge key={item} value={item} />
              ))}
            </div>
          </div>

          <div className="standalone-demo-actions">
            <Link className="button secondary" to="/">
              <IconSymbol className="icon-sm" name="dashboard" />
              CRM
            </Link>
            <button
              className="button ghost"
              onClick={() => {
                resetCrmDemoData()
                window.location.href = "/"
              }}
              type="button"
            >
              <IconSymbol className="icon-sm" name="sparkle" />
              Restaurar demo
            </button>
          </div>
        </div>
      </section>

      {children}
    </main>
  )
}

export default function App() {
  return (
    <Routes>
      <Route
        element={
          <DemoShell>
            <Crm />
          </DemoShell>
        }
        path="/"
      />
      <Route
        element={
          <DemoShell>
            <PublicQuote />
          </DemoShell>
        }
        path="/quotes/:publicToken"
      />
      <Route element={<Navigate replace to="/" />} path="*" />
    </Routes>
  )
}

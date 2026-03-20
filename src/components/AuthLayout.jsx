import { Link } from "react-router-dom"
import { profile, showcaseShots } from "../data/portfolioContent"
import IconSymbol from "./IconSymbol"
import SectionHeader from "./ui/SectionHeader"

const authStats = [
  { label: "Acesso", value: "Cliente aprovado", icon: "approved" },
  { label: "Workspace", value: "CRM + atendimento", icon: "services" },
]

function buildBrandMark(name) {
  return (
    String(name || "DS")
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() || "")
      .join("") || "DS"
  )
}

function AuthShowcaseCard({ shot }) {
  return (
    <article className="surface nested-card compact-card auth-showcase-card">
      <div className="auth-showcase-media">
        <img alt={`Previa do modulo ${shot.title}`} loading="lazy" src={shot.src} />
      </div>
      <div className="auth-showcase-copy">
        <small>{shot.tag}</small>
        <strong>{shot.title}</strong>
      </div>
    </article>
  )
}

function AuthStatCard({ item }) {
  return (
    <article className="surface nested-card compact-card auth-stat-panel">
      <div className="auth-stat-panel-head">
        <span className="metric-tile-icon info">
          <IconSymbol className="icon-sm" name={item.icon} />
        </span>
        <p className="eyebrow">{item.label}</p>
      </div>
      <strong>{item.value}</strong>
    </article>
  )
}

export default function AuthLayout({
  eyebrow,
  title,
  subtitle,
  children,
  footerText,
  footerActionLabel,
  footerActionTo,
  stats = authStats,
}) {
  const brandMark = buildBrandMark(profile.shortName)

  return (
    <main className="page-shell auth-page auth-editorial-page">
      <section className="auth-shell auth-editorial-shell">
        <aside className="surface auth-side-card auth-editorial-panel auth-support-panel">
          <div className="auth-brand-row">
            <Link className="brand-link auth-brand-link" to="/">
              <span className="brand-mark">{brandMark}</span>
              <span>
                <strong>{profile.shortName}</strong>
                <small>Workspace privado</small>
              </span>
            </Link>
            <span className="mini-pill emphasis">Acesso controlado</span>
          </div>

          <SectionHeader
            description="Acesso para clientes aprovados."
            eyebrow="Workspace publicado"
            title="Area do cliente"
          />

          <div className="auth-stat-grid">
            {stats.map((item) => (
              <AuthStatCard item={item} key={item.label} />
            ))}
          </div>

          <div className="auth-showcase-grid">
            {showcaseShots.slice(0, 1).map((shot) => (
              <AuthShowcaseCard key={shot.title} shot={shot} />
            ))}
          </div>
        </aside>

        <section className="surface auth-card auth-editorial-card auth-main-panel">
          <div className="auth-copy">
            <p className="eyebrow">{eyebrow}</p>
            <h1>{title}</h1>
            <p className="section-copy">{subtitle}</p>
          </div>

          {children}

          {footerActionLabel && footerActionTo ? (
            <p className="auth-footer">
              <span>{footerText}</span>
              <Link className="inline-link" to={footerActionTo}>
                {footerActionLabel}
              </Link>
            </p>
          ) : null}
        </section>
      </section>
    </main>
  )
}

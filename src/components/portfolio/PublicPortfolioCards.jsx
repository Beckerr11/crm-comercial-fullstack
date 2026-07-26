import { Link } from "react-router"
import IconSymbol from "../IconSymbol"
import TechBadge from "../TechBadge"
import { curatedRepositories, productSignals } from "./publicPortfolioData"
import { profile } from "../../data/portfolioContent"

const projectMetaByRoute = {
  "/dashboard": {
    stack: ["React", "Node.js", "MongoDB", "JWT", "OAuth"],
    primaryHref: profile.liveAppUrl,
    primaryLabel: "Produto ao vivo",
    secondaryHref: curatedRepositories[0]?.url || profile.githubUrl,
    secondaryLabel: "Repositorio",
    casePath: "/projetos/plataforma-auth-operacao",
  },
  "/admin/crm": {
    stack: ["React", "Express", "MongoDB", "PDF", "WhatsApp"],
    primaryHref: curatedRepositories[0]?.url || profile.githubUrl,
    primaryLabel: "Repositorio",
    secondaryHref: profile.liveAppUrl,
    secondaryLabel: "Demo",
    casePath: "/projetos/crm-ciclo-comercial",
  },
  "/cliente": {
    stack: ["React", "Node.js", "Socket.io", "MongoDB"],
    primaryHref: profile.liveAppUrl,
    primaryLabel: "Produto ao vivo",
    secondaryHref: curatedRepositories[0]?.url || profile.githubUrl,
    secondaryLabel: "Repositorio",
    casePath: "/projetos/inbox-area-cliente",
  },
}

const heroCodeLines = [
  "landing.tsx  ->  auth.ts  ->  dashboard.tsx",
  "crm.routes   ->  quotes.pdf  ->  whatsapp-share",
  "client-area  ->  inbox realtime  ->  admin analytics",
]

function resolveLinkIcon(label = "", href = "") {
  const normalized = `${label} ${href}`.toLowerCase()

  if (normalized.includes("github") || normalized.includes("reposit")) {
    return "github"
  }

  if (normalized.includes("linkedin")) {
    return "linkedin"
  }

  if (normalized.includes("instagram")) {
    return "instagram"
  }

  if (normalized.includes("whatsapp")) {
    return "whatsapp"
  }

  if (normalized.includes("curr") || normalized.includes(".pdf")) {
    return "resume"
  }

  if (normalized.includes("mail") || normalized.includes("@")) {
    return "mail"
  }

  if (normalized.includes("demo") || normalized.includes("produto ao vivo")) {
    return "dashboard"
  }

  return "arrow"
}

function resolveProjectMeta(route) {
  return (
    projectMetaByRoute[route] || {
      stack: ["React", "Node.js"],
      primaryHref: profile.liveAppUrl,
      primaryLabel: "Produto ao vivo",
      secondaryHref: profile.githubUrl,
      secondaryLabel: "GitHub",
      casePath: "/",
    }
  )
}

export function HeroIdentityCard() {
  const quickLinks = [
    { href: profile.githubUrl, label: "GitHub", icon: "github" },
    { href: profile.linkedinUrl, label: "LinkedIn", icon: "linkedin" },
    { href: profile.instagramUrl, label: "Instagram", icon: "instagram" },
    { href: profile.whatsappUrl, label: "WhatsApp", icon: "whatsapp" },
  ]

  return (
    <article className="surface nested-card founder-portrait-card">
      <div className="portrait-media portfolio-profile-media">
        {profile.portraitUrl ? (
          <img alt={`Retrato de ${profile.name}`} className="portrait-photo" loading="lazy" src={profile.portraitUrl} />
        ) : (
          <div className="portrait-fallback">{profile.name.slice(0, 1)}</div>
        )}
      </div>

      <div className="portrait-copy">
        <p className="eyebrow">Perfil</p>
        <h3>{profile.shortName}</h3>
        <p className="section-copy compact">Full stack focado em web e produto.</p>

        <div className="portfolio-profile-meta">
          <span className="mini-pill emphasis">{profile.location}</span>
          <span className="mini-pill">{profile.availability}</span>
        </div>

        <div className="portfolio-social-row">
          {quickLinks.map((item) => (
            <a className="portfolio-social-link" href={item.href} key={item.label} rel="noreferrer" target="_blank">
              <IconSymbol className="icon-sm" name={item.icon} />
              {item.label}
            </a>
          ))}
        </div>
      </div>
    </article>
  )
}

export function HeroPlatformCard() {
  return (
    <article className="surface nested-card hero-platform-card">
      <div className="hero-platform-head">
        <div>
          <p className="eyebrow">Stack real</p>
          <h3>Stack, auth e operacao</h3>
        </div>
        <span className="mini-pill emphasis">Publicado</span>
      </div>

      <div aria-hidden="true" className="hero-code-block">
        {heroCodeLines.map((line) => (
          <span className="code-line" key={line}>
            {line}
          </span>
        ))}
      </div>

      <div className="hero-platform-signals">
        {productSignals.slice(0, 3).map((item) => (
          <article className="hero-platform-signal" key={item.label}>
            <strong>{item.value}</strong>
            <span>{item.label}</span>
          </article>
        ))}
      </div>
    </article>
  )
}

export function HeroOutcomeCard({ item }) {
  return (
    <article className="surface nested-card compact-card portfolio-outcome-card">
      <strong>{item.title}</strong>
      <p className="section-copy compact">{item.description}</p>
    </article>
  )
}

export function SignalMetricCard({ item }) {
  return (
    <article className="surface nested-card compact-card portfolio-trust-card">
      <div className="task-card-header">
        <div className="stack-group-title">
          <span className="metric-tile-icon info">
            <IconSymbol className="icon-sm" name={item.icon} />
          </span>
          <div>
            <strong>{item.title}</strong>
            <p className="section-copy compact portfolio-trust-metric">{item.metric}</p>
          </div>
        </div>
        <span className="mini-pill emphasis">Prova</span>
      </div>
      <p className="section-copy">{item.description}</p>
    </article>
  )
}

export function TransformationCard({ item }) {
  return (
    <article className="surface nested-card compact-card portfolio-transformation-card">
      <strong>{item.title}</strong>

      <div className="portfolio-before-after">
        <div className="portfolio-before-after-row before">
          <span className="mini-pill">Antes</span>
          <p className="section-copy compact">{item.before}</p>
        </div>

        <div className="portfolio-before-after-row after">
          <span className="mini-pill emphasis">Agora</span>
          <p className="section-copy compact">{item.after}</p>
        </div>
      </div>
    </article>
  )
}

export function OfferCard({ item }) {
  return (
    <article className="surface nested-card compact-card portfolio-offer-card">
      <div className="task-card-header">
        <div>
          <small>{item.delivery}</small>
          <h3>{item.title}</h3>
        </div>
        <span className="mini-pill emphasis">{item.price}</span>
      </div>

      <p className="section-copy">{item.fullDescription}</p>

      <div className="pill-row stack-chip-row">
        {item.stack.map((tech) => (
          <TechBadge key={`${item.slug}-${tech}`} value={tech} />
        ))}
      </div>
    </article>
  )
}

export function ProjectCard({ project }) {
  const projectMeta = resolveProjectMeta(project.route)

  return (
    <article className="surface reference-project-card" key={project.title}>
      <div className="reference-project-media">
        <img alt={`Previa visual de ${project.title}`} loading="lazy" src={project.image} />
      </div>

      <div className="reference-project-body">
        <div className="reference-project-copy">
          <p className="eyebrow">Case</p>
          <h3>{project.title}</h3>
          <p className="section-copy compact project-outcome-copy">{project.outcome}</p>
        </div>

        <div className="reference-project-stack">
          {projectMeta.stack.map((item) => (
            <TechBadge key={`${project.title}-${item}`} value={item} />
          ))}
        </div>

        <div className="project-link-row">
          <Link className="button small" to={projectMeta.casePath}>
            Ver case
          </Link>
          <a className="button ghost small" href={projectMeta.secondaryHref} rel="noreferrer" target="_blank">
            <IconSymbol className="icon-sm" name={resolveLinkIcon(projectMeta.secondaryLabel, projectMeta.secondaryHref)} />
            {projectMeta.secondaryLabel}
          </a>
        </div>

        <div className="project-link-row compact">
          <a className="inline-link project-inline-link" href={projectMeta.primaryHref} rel="noreferrer" target="_blank">
            <IconSymbol className="icon-sm" name={resolveLinkIcon(projectMeta.primaryLabel, projectMeta.primaryHref)} />
            {projectMeta.primaryLabel}
          </a>
          <Link className="inline-link project-inline-link" to={project.route}>
            Abrir workspace
          </Link>
        </div>
      </div>
    </article>
  )
}

export function ProofItem({ text }) {
  return (
    <article className="portfolio-proof-item">
      <span className="mini-pill emphasis">Prova</span>
      <p className="section-copy compact">{text}</p>
    </article>
  )
}

export function JourneyStepCard({ item }) {
  return (
    <article className="surface nested-card compact-card journey-step-card">
      <span className="journey-step-index">{item.step}</span>
      <strong>{item.title}</strong>
      <p className="section-copy">{item.description}</p>
    </article>
  )
}

export function ModuleCard({ module }) {
  return (
    <article className="surface nested-card compact-card module-card">
      <div className="task-card-header">
        <div className="module-card-title">
          <span className="metric-tile-icon info">
            <IconSymbol className="icon-sm" name={module.icon} />
          </span>
          <div>
            <strong>{module.title}</strong>
            <small>{module.tag}</small>
          </div>
        </div>
        <span className="mini-pill">Workspace</span>
      </div>
      <Link className="button ghost small" to={module.to}>
        Abrir area
      </Link>
    </article>
  )
}

export function ShowcaseCard({ shot }) {
  const usesRepository = shot.href === "/admin/dashboard" || shot.href === "/admin/crm"
  const publicHref = usesRepository ? curatedRepositories[0]?.url || profile.githubUrl : profile.liveAppUrl
  const publicLabel = usesRepository ? "GitHub" : "Demo"

  return (
    <article className="surface nested-card compact-card showcase-preview-card">
      <div className="showcase-card-media">
        <img alt={`Previa do modulo ${shot.title}`} loading="lazy" src={shot.src} />
      </div>
      <div className="showcase-card-copy">
        <div className="task-card-header">
          <div>
            <small>{shot.tag}</small>
            <h3>{shot.title}</h3>
          </div>
          <span className="mini-pill">{publicLabel}</span>
        </div>
        <div className="project-link-row compact">
          <a className="button ghost small" href={publicHref} rel="noreferrer" target="_blank">
            <IconSymbol className="icon-sm" name={resolveLinkIcon(publicLabel, publicHref)} />
            {publicLabel}
          </a>
          <Link className="button secondary small" to={shot.href}>
            Abrir modulo
          </Link>
        </div>
      </div>
    </article>
  )
}

export function AboutCard({ item }) {
  return (
    <article className="surface nested-card compact-card about-highlight-card">
      <strong>{item.title}</strong>
    </article>
  )
}

export function CapabilityCard({ item }) {
  return (
    <article className="surface nested-card compact-card capability-preview-card">
      <strong>{item.title}</strong>
    </article>
  )
}

export function StackSummaryCard({ group }) {
  return (
    <article className="surface nested-card compact-card stack-group-card">
      <div className="stack-group-title">
        <span className="metric-tile-icon info">
          <IconSymbol className="icon-sm" name={group.icon} />
        </span>
        <div>
          <strong>{group.title}</strong>
        </div>
      </div>
      <div className="pill-row stack-chip-row">
        {group.techs.map((tech) => (
          <TechBadge key={`${group.title}-${tech}`} value={tech} />
        ))}
      </div>
    </article>
  )
}

export function SocialProofCard({ item }) {
  return (
    <article className="surface nested-card compact-card social-proof-card">
      <div className="stack-group-title">
        <span className="metric-tile-icon info">
          <IconSymbol className="icon-sm" name={item.icon} />
        </span>
        <div>
          <strong>{item.title}</strong>
          <p className="section-copy compact social-proof-metric">{item.metric}</p>
        </div>
      </div>
    </article>
  )
}

export function RepositoryCard({ repository }) {
  return (
    <a className="surface nested-card compact-card repository-card" href={repository.url} rel="noreferrer" target="_blank">
      <div className="task-card-header">
        <div>
          <small>{repository.tag}</small>
          <h3>{repository.name}</h3>
        </div>
        <span className="mini-pill">
          <IconSymbol className="icon-xs" name="github" />
          GitHub
        </span>
      </div>
    </a>
  )
}

export function TimelineEntryCard({ item }) {
  return (
    <article className="surface nested-card compact-card timeline-card">
      <div className="task-card-header">
        <div>
          <small>{item.category}</small>
          <h3>{item.title}</h3>
        </div>
        <span className="mini-pill">{item.period}</span>
      </div>
      <p className="section-copy">{item.description}</p>
    </article>
  )
}

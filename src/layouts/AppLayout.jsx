import { useEffect, useMemo, useState } from "react"
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router"
import NotificationCenter from "../components/NotificationCenter"
import IconSymbol from "../components/IconSymbol"
import { useAuth } from "../hooks/useAuth"
import { useRealtime } from "../hooks/useRealtime"
import { getCurrentWorkspace } from "../services/workspaceApi"
import { canAccessAdmin, getRoleLabel } from "../utils/roles"

const primaryItems = [
  { to: "/dashboard", label: "Dashboard", icon: "dashboard" },
  { to: "/tarefas", label: "Operacao", icon: "tasks", adminOnly: true },
  { to: "/servicos", label: "Servicos", icon: "services" },
  { to: "/mensagens", label: "Inbox", icon: "messages" },
  { to: "/perfil", label: "Perfil", icon: "profile" },
]

const publicItems = [
  { to: "/", label: "Inicio" },
  { to: "/servicos", label: "Servicos" },
  { to: "/projetos", label: "Projetos" },
  { to: "/curriculo", label: "Curriculo" },
]

const pageLabels = {
  "/": "Inicio",
  "/projetos": "Projetos",
  "/sobre": "Sobre",
  "/dashboard": "Painel",
  "/tarefas": "Operacao",
  "/servicos": "Servicos",
  "/mensagens": "Inbox",
  "/perfil": "Perfil",
  "/cliente": "Clientes",
  "/curriculo": "Curriculo",
  "/admin/crm": "CRM",
  "/admin/analytics": "Analytics",
  "/admin/dashboard": "Admin",
}

const publicRouteSet = new Set(["/", "/projetos", "/sobre", "/servicos", "/curriculo", "/login", "/register", "/registre-se", "/oauth/callback"])

function isPlaceholderWorkspaceName(value = "") {
  const normalized = String(value || "").trim().toLowerCase()
  return !normalized || normalized === "solo" || normalized === "workspace principal"
}

function resolveBrandName(workspace, isAuthenticated) {
  const primaryName = String(workspace?.name || "").trim()
  const companyName = String(workspace?.companyName || "").trim()

  if (!isPlaceholderWorkspaceName(primaryName)) {
    return primaryName
  }

  if (!isPlaceholderWorkspaceName(companyName)) {
    return companyName
  }

  return isAuthenticated ? "Workspace principal" : "Douglas Silva"
}

function resolveBrandSubtitle(workspace, isAuthenticated) {
  const companyName = String(workspace?.companyName || "").trim()
  const supportLabel = String(workspace?.supportEmail || "").trim()

  if (companyName && !isPlaceholderWorkspaceName(companyName)) {
    return companyName
  }

  if (isAuthenticated && supportLabel) {
    return supportLabel
  }

  return isAuthenticated ? "Workspace" : "Full stack"
}

function uniqByRoute(items) {
  return items.filter((item, index) => items.findIndex((entry) => entry.to === item.to) === index)
}

function normalizeForSearch(value = "") {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
}

function buildNavLinkClass(baseClass) {
  return ({ isActive }) => `${baseClass}${isActive ? " active" : ""}`
}

export default function AppLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated, logout, user } = useAuth()
  const { unreadCount, connectionState } = useRealtime()
  const [search, setSearch] = useState("")
  const [workspace, setWorkspace] = useState(null)
  const [isPublicMenuOpen, setIsPublicMenuOpen] = useState(false)
  const displayName = user?.fullName || user?.username || user?.email?.split("@")[0] || "Usuario"
  const avatarUrl = user?.avatarUrl || ""
  const avatarAlt = `Avatar de ${displayName}`
  const isAdminUser = canAccessAdmin(user)

  const secondaryItems = useMemo(
    () => [
      { to: "/cliente", label: "Clientes", icon: "services" },
      { to: "/curriculo", label: "Curriculo", icon: "resume" },
      ...(isAdminUser ? [{ to: "/admin/crm", label: "CRM", icon: "quote" }] : []),
      ...(isAdminUser ? [{ to: "/admin/analytics", label: "Analytics", icon: "analytics" }] : []),
      ...(isAdminUser ? [{ to: "/admin/dashboard", label: "Admin", icon: "admin" }] : []),
    ],
    [isAdminUser]
  )

  const visiblePrimaryItems = isAuthenticated ? primaryItems.filter((item) => !item.adminOnly || isAdminUser) : publicItems

  const searchItems = useMemo(() => uniqByRoute([...visiblePrimaryItems, ...secondaryItems]), [secondaryItems, visiblePrimaryItems])
  const filteredSearchItems = useMemo(() => {
    const normalizedSearch = normalizeForSearch(search)
    if (!normalizedSearch) {
      return []
    }

    return searchItems.filter((item) => normalizeForSearch(item.label).includes(normalizedSearch)).slice(0, 6)
  }, [search, searchItems])

  const currentTitle = pageLabels[location.pathname] || (isAuthenticated ? "Plataforma" : "Portfolio")
  const isPublicExperience = publicRouteSet.has(location.pathname) || location.pathname.startsWith("/projetos/")
  const useWorkspaceShell = isAuthenticated && !isPublicExperience
  const currentDescription = isAuthenticated ? "CRM, atendimento e operacao." : "Sites, sistemas e produto publicado."
  const brandName = resolveBrandName(workspace, isAuthenticated)
  const brandSubtitle = resolveBrandSubtitle(workspace, isAuthenticated)
  const publicBrandName = resolveBrandName(workspace, false)
  const publicBrandSubtitle = resolveBrandSubtitle(workspace, false)
  const brandMessage = String(workspace?.brandMessage || "").trim()
  const brandLogo = workspace?.logoUrl || ""
  const brandMark =
    String(brandName || "DS")
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() || "")
      .join("") || "DS"
  const publicBrandMark =
    String(publicBrandName || "DS")
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() || "")
      .join("") || "DS"
  const workspaceStyle = useMemo(
    () => ({
      "--accent": workspace?.primaryColor || undefined,
      "--accent-strong": workspace?.accentColor || undefined,
    }),
    [workspace?.accentColor, workspace?.primaryColor]
  )

  useEffect(() => {
    let active = true

    async function loadWorkspace() {
      if (!isAuthenticated) {
        if (active) {
          setWorkspace(null)
        }
        return
      }

      try {
        const nextWorkspace = await getCurrentWorkspace()
        if (active) {
          setWorkspace(nextWorkspace)
        }
      } catch {
        if (active) {
          setWorkspace(null)
        }
      }
    }

    void loadWorkspace()

    return () => {
      active = false
    }
  }, [isAuthenticated, user?.organization])

  async function handleLogout() {
    await logout()
    navigate("/login")
  }

  function handleSearchSubmit(event) {
    event.preventDefault()
    if (!filteredSearchItems.length) {
      return
    }

    navigate(filteredSearchItems[0].to)
    setSearch("")
  }

  function renderPublicNavigation(variant = "desktop") {
    const navClassName = variant === "desktop" ? "nav-pill" : "nav-pill mobile"

    return publicItems.map((item) => (
      <NavLink
        className={buildNavLinkClass(navClassName)}
        key={item.to}
        onClick={() => setIsPublicMenuOpen(false)}
        to={item.to}
      >
        {item.label}
      </NavLink>
    ))
  }

  function renderPublicActions(variant = "desktop") {
    const compactProfile = (
      <div className={`topbar-profile-chip compact${variant === "mobile" ? " mobile" : ""}`}>
        {avatarUrl ? (
          <img alt={avatarAlt} className="avatar-photo small" loading="lazy" referrerPolicy="no-referrer" src={avatarUrl} />
        ) : (
          <span className="avatar-badge small">{displayName.slice(0, 1).toUpperCase()}</span>
        )}
        <div>
          <strong>{displayName}</strong>
          <small>Sessao ativa</small>
        </div>
      </div>
    )

    if (isAuthenticated) {
      return (
        <>
          {compactProfile}
          <Link className="button secondary small" onClick={() => setIsPublicMenuOpen(false)} to="/dashboard">
            Painel
          </Link>
        </>
      )
    }

    if (variant === "desktop") {
      return (
        <>
          <Link className="public-utility-link" onClick={() => setIsPublicMenuOpen(false)} to="/login">
            <IconSymbol className="icon-sm" name="profile" />
            Entrar
          </Link>
          <Link className="button small" onClick={() => setIsPublicMenuOpen(false)} to="/register">
            <IconSymbol className="icon-sm" name="approved" />
            Cadastro
          </Link>
        </>
      )
    }

    return (
      <>
        <Link className="button ghost small" onClick={() => setIsPublicMenuOpen(false)} to="/login">
          <IconSymbol className="icon-sm" name="profile" />
          Entrar
        </Link>
        <Link className="button small" onClick={() => setIsPublicMenuOpen(false)} to="/register">
          <IconSymbol className="icon-sm" name="approved" />
          Cadastro
        </Link>
      </>
    )
  }

  return (
    <div className="app-layout" style={workspaceStyle}>
      {useWorkspaceShell ? (
        <div className="workspace-shell">
          <aside className="surface sidebar shell-panel">
            <div className="sidebar-brand">
              <Link className="brand-link sidebar-brand-link" to="/dashboard">
                {brandLogo ? <img alt={`Logo de ${brandName}`} className="brand-logo" loading="lazy" src={brandLogo} /> : <span className="brand-mark">{brandMark}</span>}
                <span>
                  <strong>{brandName}</strong>
                  <small>{brandSubtitle}</small>
                </span>
              </Link>
              {brandMessage ? <p className="section-copy compact">{brandMessage}</p> : null}
            </div>

            <div className="sidebar-profile">
              {avatarUrl ? (
                <img alt={avatarAlt} className="avatar-photo" loading="lazy" referrerPolicy="no-referrer" src={avatarUrl} />
              ) : (
                <div className="avatar-badge">{displayName.slice(0, 1).toUpperCase()}</div>
              )}
              <div>
                <h2>{displayName}</h2>
                <p className="section-copy compact">{getRoleLabel(user?.role)}</p>
              </div>
            </div>

            <div className="sidebar-block">
              <p className="eyebrow">Workspace</p>
              <div className="sidebar-links">
                {visiblePrimaryItems.map((item) => (
                  <NavLink className={buildNavLinkClass("sidebar-link")} key={item.to} to={item.to}>
                    <IconSymbol className="icon-sm" name={item.icon} />
                    <span>{item.label}</span>
                  </NavLink>
                ))}
              </div>
            </div>

            <div className="sidebar-block">
              <p className="eyebrow">Gestao</p>
              <div className="sidebar-links">
                {secondaryItems.map((item) => (
                  <NavLink className={buildNavLinkClass("sidebar-link secondary")} key={item.to} to={item.to}>
                    <IconSymbol className="icon-sm" name={item.icon} />
                    <span>{item.label}</span>
                  </NavLink>
                ))}
              </div>
            </div>

            <div className="sidebar-meta">
              <span className={`live-pill ${connectionState}`}>{connectionState === "online" ? "Tempo real ativo" : "Reconectando"}</span>
              <span className="live-pill">{unreadCount} alertas</span>
            </div>
          </aside>

          <div className="workspace-main">
            <header className="surface topbar shell-panel">
              <div className="topbar-copy">
                <p className="eyebrow">Workspace</p>
                <h2>{currentTitle}</h2>
                <p className="section-copy compact">{brandMessage || currentDescription}</p>
              </div>

              <form className="topbar-search" onSubmit={handleSearchSubmit} role="search">
                <div className="search-field">
                  <IconSymbol className="icon-sm" name="search" />
                  <input onChange={(event) => setSearch(event.target.value)} placeholder="Buscar pagina ou modulo" type="search" value={search} />
                </div>
                {filteredSearchItems.length ? (
                  <div className="surface quick-search-results">
                    {filteredSearchItems.map((item) => (
                      <button
                        className="quick-search-item"
                        key={item.to}
                        onClick={() => {
                          navigate(item.to)
                          setSearch("")
                        }}
                        type="button"
                      >
                        <span>{item.label}</span>
                        <small>{item.to}</small>
                      </button>
                    ))}
                  </div>
                ) : null}
              </form>

              <div className="topbar-actions cluster">
                <NotificationCenter />
                <Link className="button ghost small" to="/">
                  Site
                </Link>
                <div className="topbar-profile-chip">
                  {avatarUrl ? (
                    <img alt={avatarAlt} className="avatar-photo small" loading="lazy" referrerPolicy="no-referrer" src={avatarUrl} />
                  ) : (
                    <span className="avatar-badge small">{displayName.slice(0, 1).toUpperCase()}</span>
                  )}
                  <div>
                    <strong>{displayName}</strong>
                    <small>{getRoleLabel(user?.role)}</small>
                  </div>
                </div>
                <button className="button small" onClick={handleLogout} type="button">
                  Sair
                </button>
              </div>
            </header>

            <div className="app-content">
              <Outlet />
            </div>
          </div>
        </div>
      ) : (
        <>
          <header className={`surface public-topbar public-topbar-minimal editorial-public-topbar${isPublicMenuOpen ? " menu-open" : ""}`}>
            <Link className="brand-link public-brand-link" to="/">
              {brandLogo ? <img alt={`Logo de ${publicBrandName}`} className="brand-logo" loading="lazy" src={brandLogo} /> : <span className="brand-mark">{publicBrandMark}</span>}
              <span>
                <strong>{publicBrandName}</strong>
                <small>{publicBrandSubtitle}</small>
              </span>
            </Link>

            <nav className="topbar-nav public-nav-desktop" aria-label="Navegacao publica">
              {renderPublicNavigation("desktop")}
            </nav>

            <div className="topbar-actions public-topbar-actions">
              <div className="public-desktop-actions">{renderPublicActions("desktop")}</div>
              <button
                aria-controls="public-mobile-panel"
                aria-expanded={isPublicMenuOpen}
                className="nav-icon-button public-menu-toggle"
                onClick={() => setIsPublicMenuOpen((current) => !current)}
                type="button"
              >
                <IconSymbol className="icon-md" name={isPublicMenuOpen ? "close" : "menu"} />
                <span className="sr-only">{isPublicMenuOpen ? "Fechar menu" : "Abrir menu"}</span>
              </button>
            </div>

            <div className={`public-mobile-panel${isPublicMenuOpen ? " open" : ""}`} id="public-mobile-panel">
              <nav className="public-mobile-nav" aria-label="Navegacao publica mobile">
                {renderPublicNavigation("mobile")}
              </nav>
              <div className="public-mobile-actions">{renderPublicActions("mobile")}</div>
            </div>
          </header>

          <Outlet />
        </>
      )}
    </div>
  )
}

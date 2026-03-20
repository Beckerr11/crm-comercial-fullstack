import { Navigate, useLocation } from "react-router-dom"
import { useAuth } from "../hooks/useAuth"
import { isAdminRole, normalizeUserRole } from "../utils/roles"

function hasRequiredRole(user, roles = []) {
  if (!roles.length) {
    return true
  }

  return roles.some((role) => {
    if (role === "admin") {
      return isAdminRole(user?.role)
    }

    return normalizeUserRole(user?.role) === normalizeUserRole(role)
  })
}

export function ProtectedRoute({ children, roles = [] }) {
  const location = useLocation()
  const { isAuthenticated, isReady, user } = useAuth()

  if (!isReady) {
    return (
      <main className="page-shell page-empty">
        <section className="surface empty-state-card">
          <p className="eyebrow">Carregando</p>
          <h1>Preparando sua área autenticada</h1>
          <p className="section-copy">Verificando a sessão e recuperando seus dados.</p>
        </section>
      </main>
    )
  }

  if (!isAuthenticated) {
    return <Navigate replace state={{ from: location }} to="/login" />
  }

  if (!hasRequiredRole(user, roles)) {
    return <Navigate replace to="/dashboard" />
  }

  return children
}

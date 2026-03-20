function detectApiUrl() {
  const configured = import.meta.env.VITE_API_URL
  if (configured) return configured.replace(/\/$/, "")

  if (import.meta.env.DEV) {
    return "http://localhost:3000"
  }

  return window.location.origin.replace(/\/$/, "")
}

export const API_URL = detectApiUrl()

export function buildApiUrl(path = "/") {
  const normalized = String(path || "/").startsWith("/") ? String(path || "/") : `/${path}`
  return `${API_URL}${normalized}`
}

export function buildOAuthUrl(provider, redirectTo = "/dashboard") {
  const url = new URL(buildApiUrl(`/auth/${provider}`))
  url.searchParams.set("redirectTo", redirectTo)
  return url.toString()
}

export function detectSocketUrl() {
  const configured = import.meta.env.VITE_SOCKET_URL
  if (configured) return configured.replace(/\/$/, "")
  return API_URL
}

export const SOCKET_URL = detectSocketUrl()

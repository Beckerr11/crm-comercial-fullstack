import { apiFetch } from "./platformApi"

export function getCurrentWorkspace() {
  return apiFetch("/api/workspace/current")
}

export function getPublicWorkspace(params = {}) {
  const search = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    const normalized = String(value || "").trim()
    if (normalized) {
      search.set(key, normalized)
    }
  })

  const query = search.toString()
  return apiFetch(query ? `/api/workspace/public?${query}` : "/api/workspace/public")
}

export function getInvitePreview(token) {
  return apiFetch(`/api/auth/invites/${token}`)
}

import { clearSession, decodeTokenPayload, getStoredUser, getToken, isTokenExpired, saveToken, saveUser } from "./utils/session"
import { normalizeUserRole } from "./utils/roles"

export function clearAuthSession() {
  clearSession()
}

export function persistSession(token, user = null) {
  saveToken(token)

  if (user) {
    saveUser(user)
    return
  }

  const payload = decodeTokenPayload(token)
  if (!payload) {
    saveUser(null)
    return
  }

  saveUser({
    username: payload.username || "",
    email: payload.email || "",
    organization: payload.organization || "solo",
    role: normalizeUserRole(payload.role),
  })
}

export function hasValidSession() {
  const token = getToken()
  if (!token) {
    return false
  }

  if (isTokenExpired(token)) {
    clearSession()
    return false
  }

  return true
}

export function getSessionSnapshot() {
  return {
    token: getToken(),
    user: getStoredUser(),
  }
}

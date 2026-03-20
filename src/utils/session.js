const TOKEN_KEY = "crm-comercial-fullstack.token"
const USER_KEY = "crm-comercial-fullstack.user"
const MIGRATION_KEY = "crm-comercial-fullstack.session-migrated"

function getStorage(type) {
  if (typeof window === "undefined") {
    return null
  }

  try {
    return window[type]
  } catch {
    return null
  }
}

function getPrimaryStorage() {
  return getStorage("sessionStorage") || getStorage("localStorage")
}

function getLegacyStorage(primary) {
  const local = getStorage("localStorage")

  if (!primary || !local || primary === local) {
    return null
  }

  return local
}

function migrateLegacySession() {
  const primary = getPrimaryStorage()
  const legacy = getLegacyStorage(primary)

  if (!primary || !legacy || primary.getItem(MIGRATION_KEY) === "1") {
    return primary
  }

  for (const key of [TOKEN_KEY, USER_KEY]) {
    const legacyValue = legacy.getItem(key)
    if (legacyValue && !primary.getItem(key)) {
      primary.setItem(key, legacyValue)
    }
    legacy.removeItem(key)
  }

  primary.setItem(MIGRATION_KEY, "1")
  return primary
}

function getActiveStorage() {
  return migrateLegacySession() || getPrimaryStorage()
}

export function clearSession() {
  for (const storage of [getStorage("sessionStorage"), getStorage("localStorage")]) {
    if (!storage) {
      continue
    }

    storage.removeItem(TOKEN_KEY)
    storage.removeItem(USER_KEY)
  }
}

export function getToken() {
  return getActiveStorage()?.getItem(TOKEN_KEY) || ""
}

export function saveToken(token) {
  if (!token) {
    clearSession()
    return
  }

  getActiveStorage()?.setItem(TOKEN_KEY, token)
}

export function getStoredUser() {
  try {
    const raw = getActiveStorage()?.getItem(USER_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function saveUser(user) {
  const storage = getActiveStorage()

  if (!storage) {
    return
  }

  if (!user) {
    storage.removeItem(USER_KEY)
    return
  }

  storage.setItem(USER_KEY, JSON.stringify(user))
}

export function decodeTokenPayload(token) {
  try {
    const [, payload] = String(token || "").split(".")
    if (!payload) {
      return null
    }

    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/")
    return JSON.parse(atob(normalized))
  } catch {
    return null
  }
}

export function isTokenExpired(token) {
  const payload = decodeTokenPayload(token)
  if (!payload?.exp) {
    return false
  }

  return payload.exp * 1000 <= Date.now()
}

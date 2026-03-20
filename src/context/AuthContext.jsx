import { useEffect, useMemo, useState } from "react"
import { apiFetch, postJson } from "../services/platformApi"
import { clearAuthSession, getSessionSnapshot, hasValidSession, persistSession } from "../auth"
import { clearSession, getToken, getStoredUser, saveUser } from "../utils/session"
import { normalizeUserRole } from "../utils/roles"
import { AuthContext } from "./authContextObject"

function normalizeProfile(data, fallback = null) {
  if (!data) {
    return fallback
  }

  return {
    username: data.username || fallback?.username || "",
    email: data.email || fallback?.email || "",
    organization: data.organization || fallback?.organization || "solo",
    role: normalizeUserRole(data.role || fallback?.role),
    fullName: data.fullName || fallback?.fullName || "",
    company: data.company || fallback?.company || "",
    bio: data.bio || fallback?.bio || "",
    github: data.github || fallback?.github || "",
    linkedin: data.linkedin || fallback?.linkedin || "",
    avatarUrl: data.avatarUrl || data.profileImage || fallback?.avatarUrl || "",
    favoriteTechnologies: Array.isArray(data.favoriteTechnologies) ? data.favoriteTechnologies : fallback?.favoriteTechnologies || [],
    accountType: data.accountType || fallback?.accountType || "client",
    accessStatus: data.accessStatus || fallback?.accessStatus || "approved",
    accessApprovedAt: data.accessApprovedAt || fallback?.accessApprovedAt || null,
    accessApprovedBy: data.accessApprovedBy || fallback?.accessApprovedBy || "",
  }
}

function shouldResetSessionAfterHydration(error) {
  const status = Number(error?.status || 0)
  return status === 401 || status === 403 || status === 404 || Boolean(error?.shouldClearSession)
}

export function AuthProvider({ children }) {
  const snapshot = getSessionSnapshot()
  const [token, setToken] = useState(snapshot.token)
  const [user, setUser] = useState(snapshot.user)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function hydrate() {
      if (!hasValidSession()) {
        clearSession()
        if (!cancelled) {
          setToken("")
          setUser(null)
          setIsReady(true)
        }
        return
      }

      let storedUser = getStoredUser()
      if (!storedUser && getToken()) {
        persistSession(getToken())
        storedUser = getStoredUser()
      }

      if (storedUser && !cancelled) {
        setUser(storedUser)
      }

      try {
        const profile = await apiFetch("/me")
        if (!cancelled) {
          const normalized = normalizeProfile(profile, storedUser)
          saveUser(normalized)
          setToken(getToken())
          setUser(normalized)
        }
      } catch (error) {
        if (shouldResetSessionAfterHydration(error)) {
          clearAuthSession()
          if (!cancelled) {
            setToken("")
            setUser(null)
          }
        } else if (!cancelled) {
          setToken(getToken())
          setUser(storedUser || getStoredUser())
        }
      } finally {
        if (!cancelled) {
          setIsReady(true)
        }
      }
    }

    hydrate()

    return () => {
      cancelled = true
    }
  }, [])

  const value = useMemo(
    () => ({
      token,
      user,
      isReady,
      isAuthenticated: Boolean(token),
      async login(credentials) {
        const response = await postJson("/login", credentials)
        persistSession(response.token, response.user)
        const nextUser = normalizeProfile(response.user, getStoredUser())
        setToken(response.token)
        setUser(nextUser)
        return response
      },
      async register(payload) {
        const response = await postJson("/register", payload)
        if (response?.token) {
          persistSession(response.token, response.user)
          const nextUser = normalizeProfile(response.user, getStoredUser())
          setToken(response.token)
          setUser(nextUser)
        }
        return response
      },
      async refreshProfile() {
        const profile = await apiFetch("/me")
        const normalized = normalizeProfile(profile, user)
        saveUser(normalized)
        setUser(normalized)
        return normalized
      },
      async logout() {
        try {
          if (getToken()) {
            await postJson("/api/auth/logout", {})
          }
        } catch {
          // Logout should always clear the local session, even if the network is unavailable.
        } finally {
          clearAuthSession()
          setToken("")
          setUser(null)
        }
      },
      setAuthenticatedSession(nextToken, nextUser) {
        persistSession(nextToken, nextUser)
        const storedUser = getStoredUser()
        setToken(nextToken)
        setUser(normalizeProfile(nextUser, storedUser))
      },
    }),
    [isReady, token, user]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

import { buildApiUrl } from "../config"

const SOCIAL_AUTH_TIMEOUT_MS = 20_000

function createSocialAuthError(code, message) {
  const error = new Error(message)
  error.code = code
  return error
}

function normalizeProviders(payload) {
  return {
    google: { available: Boolean(payload?.google?.available) },
    github: { available: Boolean(payload?.github?.available) },
  }
}

async function requestSocialProviders(timeoutMs = SOCIAL_AUTH_TIMEOUT_MS) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(buildApiUrl("/auth/providers"), {
      method: "GET",
      cache: "no-store",
      headers: {
        Accept: "application/json",
      },
      signal: controller.signal,
    })

    const raw = await response.text()
    const payload = raw ? JSON.parse(raw) : null

    if (!response.ok) {
      throw createSocialAuthError("unavailable", "Login social temporariamente indisponível.")
    }

    return normalizeProviders(payload)
  } catch (error) {
    if (error?.name === "AbortError") {
      throw createSocialAuthError("timeout", "Não foi possível iniciar o login social. Tente novamente.")
    }

    if (error?.code) {
      throw error
    }

    throw createSocialAuthError("network", "Não foi possível iniciar o login social. Tente novamente.")
  } finally {
    clearTimeout(timeoutId)
  }
}

export async function fetchSocialProviders() {
  try {
    return await requestSocialProviders(12_000)
  } catch {
    return null
  }
}

export async function prepareSocialLogin(provider) {
  const normalizedProvider = String(provider || "").trim().toLowerCase()
  const providers = await requestSocialProviders()

  if (!providers?.[normalizedProvider]?.available) {
    throw createSocialAuthError("unavailable", "Login social temporariamente indisponível.")
  }

  return providers
}

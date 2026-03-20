import { buildApiUrl } from "../config"
import { clearAuthSession } from "../auth"
import { getToken } from "../utils/session"

const REQUEST_TIMEOUT_MS = 10_000

function createApiError(message, details = {}) {
  const error = new Error(message)
  Object.assign(error, details)
  return error
}

function buildUrl(path) {
  return buildApiUrl(path)
}

function withTimeout(signal) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  if (signal) {
    signal.addEventListener("abort", () => controller.abort(), { once: true })
  }

  return {
    signal: controller.signal,
    clear: () => clearTimeout(timeoutId),
  }
}

function shouldClearSession(status, message = "") {
  if (status === 401) {
    return true
  }

  if (status !== 403) {
    return false
  }

  const normalizedMessage = String(message || "").trim().toLowerCase()
  return [
    "sessão encerrada",
    "sessao encerrada",
    "token inválido",
    "token invalido",
    "token malformado",
    "token necessário",
    "token necessario",
  ].some((fragment) => normalizedMessage.includes(fragment))
}

export async function apiFetch(path, options = {}) {
  const headers = new Headers(options.headers || {})
  const token = getToken()

  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json")
  }

  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`)
  }

  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json")
  }

  const timeout = withTimeout(options.signal)
  let response

  try {
    response = await fetch(buildUrl(path), {
      ...options,
      headers,
      signal: timeout.signal,
    })
  } catch (error) {
    if (error?.name === "AbortError") {
      throw createApiError("A requisição demorou demais. Tente novamente em instantes.", {
        code: "request_timeout",
        isNetworkError: true,
      })
    }

    throw createApiError("Não foi possível conectar com a API.", {
      code: "network_error",
      isNetworkError: true,
    })
  } finally {
    timeout.clear()
  }

  const raw = await response.text()
  let payload = null

  try {
    payload = raw ? JSON.parse(raw) : null
  } catch {
    payload = null
  }

  if (!response.ok) {
    const message = payload?.message || `Erro ${response.status} ao acessar a API.`
    const shouldResetSession = shouldClearSession(response.status, message)

    if (shouldResetSession) {
      clearAuthSession()
    }

    throw createApiError(message, {
      status: response.status,
      payload,
      shouldClearSession: shouldResetSession,
    })
  }

  return payload
}

export function postJson(path, body, options = {}) {
  return apiFetch(path, {
    method: "POST",
    ...options,
    body: JSON.stringify(body),
  })
}

export function putJson(path, body, options = {}) {
  return apiFetch(path, {
    method: "PUT",
    ...options,
    body: JSON.stringify(body),
  })
}

export function patchJson(path, body, options = {}) {
  return apiFetch(path, {
    method: "PATCH",
    ...options,
    body: JSON.stringify(body),
  })
}

export function deleteJson(path, options = {}) {
  return apiFetch(path, {
    method: "DELETE",
    ...options,
  })
}

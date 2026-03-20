import { apiFetch, deleteJson, patchJson, postJson, putJson } from "./platformApi"

function withQuery(path, params = {}) {
  const searchParams = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value == null) {
      return
    }

    const normalized = String(value).trim()
    if (!normalized) {
      return
    }

    searchParams.set(key, normalized)
  })

  const query = searchParams.toString()
  return query ? `${path}?${query}` : path
}

export function getAdminOverview() {
  return apiFetch("/api/admin/overview")
}

export function getAdminUsers(params = {}) {
  return apiFetch(
    withQuery("/team/members", {
      paginate: 1,
      ...params,
    })
  )
}

export function updateAdminUserRole(username, role) {
  return patchJson(`/team/members/${username}/role`, { role })
}

export function updateAdminUserAccess(username, status) {
  return patchJson(`/team/members/${username}/access`, { status })
}

export function getAdminRequests(params = {}) {
  return apiFetch(
    withQuery("/service-requests", {
      scope: "org",
      paginate: 1,
      ...params,
    })
  )
}

export function updateAdminRequestStatus(requestId, payload) {
  return patchJson(`/service-requests/${requestId}/status`, {
    ...payload,
    scope: "org",
  })
}

export function getAdminConversations(params = {}) {
  return apiFetch(
    withQuery("/owner/chat/conversations", {
      paginate: 1,
      ...params,
    })
  )
}

export function getAdminConversation(username) {
  return apiFetch(`/owner/chat/${username}`)
}

export function sendAdminReply(username, payload) {
  if (typeof payload === "string") {
    return postJson(`/owner/chat/${username}`, { text: payload })
  }

  const text = typeof payload?.text === "string" ? payload.text : ""
  const attachments = Array.isArray(payload?.attachments) ? payload.attachments.filter(Boolean) : []
  const body = { text }

  if (attachments.length) {
    body.attachments = attachments
  }

  return postJson(`/owner/chat/${username}`, body)
}

export function updateAdminConversationMeta(username, payload) {
  return patchJson(`/owner/chat/${username}/meta`, payload)
}

export function getAdminAudit(params = {}) {
  return apiFetch(
    withQuery("/audit", {
      paginate: 1,
      ...params,
    })
  )
}

export function getAdminWorkspace() {
  return apiFetch("/api/admin/workspace")
}

export function updateAdminWorkspace(payload) {
  return putJson("/api/admin/workspace", payload)
}

export function getAdminInvites() {
  return apiFetch("/api/admin/invites")
}

export function createAdminInvite(payload) {
  return postJson("/api/admin/invites", payload)
}

export function revokeAdminInvite(inviteId) {
  return deleteJson(`/api/admin/invites/${inviteId}`)
}

export function normalizeUserRole(role) {
  const normalized = String(role || "")
    .trim()
    .toLowerCase()

  if (normalized === "owner") {
    return "owner"
  }

  if (normalized === "admin") {
    return "admin"
  }

  return "client"
}

export function isAdminRole(role) {
  const normalized = normalizeUserRole(role)
  return normalized === "owner" || normalized === "admin"
}

export function isClientRole(role) {
  return !isAdminRole(role)
}

export function getRoleLabel(role) {
  const normalized = normalizeUserRole(role)
  if (normalized === "owner") {
    return "Proprietário"
  }
  if (normalized === "admin") {
    return "Administrador"
  }
  return "Cliente"
}

export function canAccessAdmin(user) {
  return isAdminRole(user?.role)
}

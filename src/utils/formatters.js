export function formatDateTime(value) {
  if (!value) {
    return "Agora mesmo"
  }

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return "Data inválida"
  }

  return parsed.toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  })
}

export function formatRelativeDate(value) {
  if (!value) {
    return "Sem data"
  }

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return "Sem data"
  }

  return new Intl.RelativeTimeFormat("pt-BR", { numeric: "auto" }).format(
    Math.round((parsed.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
    "day"
  )
}

export function formatCurrency(value) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(Number(value || 0))
}

export function formatCountLabel(value, singular, plural = `${singular}s`) {
  const total = Number(value || 0)
  const safeTotal = Number.isFinite(total) ? total : 0
  return `${safeTotal} ${safeTotal === 1 ? singular : plural}`
}

export function truncateText(value, size = 96) {
  const text = String(value || "").trim()
  if (text.length <= size) {
    return text
  }

  return `${text.slice(0, size - 3)}...`
}

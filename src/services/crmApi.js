import { createCrmSeed } from "../data/mockCrmSeed"

const STORAGE_KEY = "crm-comercial-demo:v1"

function createId(prefix) {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}-${crypto.randomUUID()}`
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function clone(value) {
  return JSON.parse(JSON.stringify(value))
}

function readState() {
  if (typeof window === "undefined") {
    return clone(createCrmSeed())
  }

  const stored = window.localStorage.getItem(STORAGE_KEY)
  if (!stored) {
    const seed = createCrmSeed()
    writeState(seed)
    return seed
  }

  try {
    return JSON.parse(stored)
  } catch {
    const seed = createCrmSeed()
    writeState(seed)
    return seed
  }
}

function writeState(state) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }

  return state
}

function ensureState() {
  return clone(readState())
}

function toAbsoluteQuoteUrl(publicToken) {
  if (typeof window === "undefined") {
    return `/quotes/${publicToken}`
  }

  return `${window.location.origin}/quotes/${publicToken}`
}

function normalizeQueryValue(value) {
  return String(value || "").trim().toLowerCase()
}

function sortCollection(items, sortBy, sortDirection = "desc", type = "generic") {
  const direction = sortDirection === "asc" ? 1 : -1

  return [...items].sort((left, right) => {
    let leftValue = left?.[sortBy]
    let rightValue = right?.[sortBy]

    if (type === "products" && sortBy === "price") {
      leftValue = Number(left.unitPrice || 0)
      rightValue = Number(right.unitPrice || 0)
    }

    if (type === "quotes" && sortBy === "client") {
      leftValue = left.clientSnapshot?.name || ""
      rightValue = right.clientSnapshot?.name || ""
    }

    if (sortBy === "createdAt" || sortBy === "updatedAt") {
      leftValue = new Date(leftValue || 0).getTime()
      rightValue = new Date(rightValue || 0).getTime()
    }

    if (sortBy === "total") {
      leftValue = Number(left.total || 0)
      rightValue = Number(right.total || 0)
    }

    if (typeof leftValue === "string" || typeof rightValue === "string") {
      return direction * String(leftValue || "").localeCompare(String(rightValue || ""), "pt-BR")
    }

    return direction * ((Number(leftValue) || 0) - (Number(rightValue) || 0))
  })
}

function paginate(items, page = 1, limit = 8) {
  const safeLimit = Math.max(1, Number(limit || 8))
  const safePage = Math.max(1, Number(page || 1))
  const total = items.length
  const totalPages = Math.max(1, Math.ceil(total / safeLimit))
  const start = (safePage - 1) * safeLimit
  const paginatedItems = items.slice(start, start + safeLimit)

  return {
    items: paginatedItems,
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      totalPages,
      hasPreviousPage: safePage > 1,
      hasNextPage: safePage < totalPages,
    },
  }
}

function computeQuoteTotal(items = []) {
  return items.reduce((total, item) => {
    const quantity = Math.max(1, Number(item.quantity || 1))
    const unitPrice = Number(item.unitPrice || 0)
    return total + quantity * unitPrice
  }, 0)
}

function getClientSnapshot(client = {}) {
  return {
    name: client.name || "",
    email: client.email || "",
    phone: client.phone || "",
    company: client.company || "",
  }
}

function buildSummary(state) {
  const totals = state.quotes.reduce(
    (accumulator, quote) => {
      accumulator.quotes += 1
      accumulator.pipelineValue += Number(quote.total || 0)

      if (quote.status === "approved") {
        accumulator.approved += 1
      }

      if (quote.status === "rejected") {
        accumulator.rejected += 1
      }

      return accumulator
    },
    {
      quotes: 0,
      approved: 0,
      rejected: 0,
      clients: state.clients.length,
      products: state.products.length,
      pipelineValue: 0,
    }
  )

  const recentQuotes = sortCollection(state.quotes, "createdAt", "desc", "quotes").slice(0, 6)

  return {
    totals,
    recentQuotes,
  }
}

function persist(mutator) {
  const current = ensureState()
  const next = mutator(current)
  writeState(next)
  return clone(next)
}

export function resetCrmDemoData() {
  writeState(createCrmSeed())
}

export function getCrmSummary() {
  return Promise.resolve(buildSummary(ensureState()))
}

export function listCrmClients(params = {}) {
  const state = ensureState()
  const search = normalizeQueryValue(params.search)

  const filtered = state.clients.filter((client) => {
    if (!search) {
      return true
    }

    return [client.name, client.email, client.phone, client.company, client.notes].some((value) =>
      normalizeQueryValue(value).includes(search)
    )
  })

  const sorted = sortCollection(filtered, params.sortBy || "createdAt", params.sortDirection || "desc", "clients")
  return Promise.resolve(paginate(sorted, params.page, params.limit))
}

export function createCrmClient(payload) {
  const name = String(payload?.name || "").trim()
  const email = String(payload?.email || "").trim()

  if (!name || !email) {
    return Promise.reject(new Error("Informe nome e e-mail do cliente."))
  }

  const now = new Date().toISOString()
  const nextState = persist((state) => {
    state.clients.unshift({
      _id: createId("client"),
      name,
      email,
      phone: String(payload?.phone || "").trim(),
      company: String(payload?.company || "").trim(),
      notes: String(payload?.notes || "").trim(),
      createdAt: now,
      updatedAt: now,
    })

    return state
  })

  return Promise.resolve(nextState.clients[0])
}

export function updateCrmClient(clientId, payload) {
  const now = new Date().toISOString()
  let updatedClient = null

  persist((state) => {
    state.clients = state.clients.map((client) => {
      if (client._id !== clientId) {
        return client
      }

      updatedClient = {
        ...client,
        name: String(payload?.name || client.name || "").trim(),
        email: String(payload?.email || client.email || "").trim(),
        phone: String(payload?.phone || client.phone || "").trim(),
        company: String(payload?.company || client.company || "").trim(),
        notes: String(payload?.notes || client.notes || "").trim(),
        updatedAt: now,
      }

      return updatedClient
    })

    state.quotes = state.quotes.map((quote) =>
      quote.clientId === clientId
        ? {
            ...quote,
            clientSnapshot: getClientSnapshot(updatedClient || {}),
            updatedAt: now,
          }
        : quote
    )

    return state
  })

  if (!updatedClient) {
    return Promise.reject(new Error("Cliente nao encontrado."))
  }

  return Promise.resolve(updatedClient)
}

export function deleteCrmClient(clientId) {
  persist((state) => {
    state.clients = state.clients.filter((client) => client._id !== clientId)
    state.quotes = state.quotes.filter((quote) => quote.clientId !== clientId)
    return state
  })

  return Promise.resolve({ ok: true })
}

export function getCrmClientHistory(clientId) {
  const state = ensureState()
  const client = state.clients.find((item) => item._id === clientId)

  if (!client) {
    return Promise.reject(new Error("Cliente nao encontrado."))
  }

  const items = sortCollection(
    state.quotes.filter((quote) => quote.clientId === clientId),
    "createdAt",
    "desc",
    "quotes"
  )

  return Promise.resolve({ client, items })
}

export function listCrmProducts(params = {}) {
  const state = ensureState()
  const search = normalizeQueryValue(params.search)

  const filtered = state.products.filter((product) => {
    if (!search) {
      return true
    }

    return [product.name, product.description].some((value) => normalizeQueryValue(value).includes(search))
  })

  const sorted = sortCollection(filtered, params.sortBy || "createdAt", params.sortDirection || "desc", "products")
  return Promise.resolve(paginate(sorted, params.page, params.limit))
}

export function createCrmProduct(payload) {
  const name = String(payload?.name || "").trim()
  if (!name) {
    return Promise.reject(new Error("Informe o nome do produto ou servico."))
  }

  const now = new Date().toISOString()
  const nextState = persist((state) => {
    state.products.unshift({
      _id: createId("product"),
      name,
      description: String(payload?.description || "").trim(),
      unitPrice: Number(payload?.unitPrice || 0),
      createdAt: now,
      updatedAt: now,
    })

    return state
  })

  return Promise.resolve(nextState.products[0])
}

export function updateCrmProduct(productId, payload) {
  const now = new Date().toISOString()
  let updatedProduct = null

  persist((state) => {
    state.products = state.products.map((product) => {
      if (product._id !== productId) {
        return product
      }

      updatedProduct = {
        ...product,
        name: String(payload?.name || product.name || "").trim(),
        description: String(payload?.description || product.description || "").trim(),
        unitPrice: Number(payload?.unitPrice ?? product.unitPrice ?? 0),
        updatedAt: now,
      }

      return updatedProduct
    })

    state.quotes = state.quotes.map((quote) => {
      const nextItems = quote.items.map((item) =>
        item.productId === productId
          ? {
              ...item,
              name: updatedProduct?.name || item.name,
              description: updatedProduct?.description || item.description,
              unitPrice: updatedProduct?.unitPrice ?? item.unitPrice,
            }
          : item
      )

      return {
        ...quote,
        items: nextItems,
        total: computeQuoteTotal(nextItems),
      }
    })

    return state
  })

  if (!updatedProduct) {
    return Promise.reject(new Error("Produto nao encontrado."))
  }

  return Promise.resolve(updatedProduct)
}

export function deleteCrmProduct(productId) {
  persist((state) => {
    state.products = state.products.filter((product) => product._id !== productId)
    state.quotes = state.quotes.map((quote) => {
      const nextItems = quote.items.map((item) => (item.productId === productId ? { ...item, productId: "" } : item))
      return {
        ...quote,
        items: nextItems,
        total: computeQuoteTotal(nextItems),
      }
    })

    return state
  })

  return Promise.resolve({ ok: true })
}

export function listCrmQuotes(params = {}) {
  const state = ensureState()
  const search = normalizeQueryValue(params.search)
  const normalizedStatus = normalizeQueryValue(params.status)

  const filtered = state.quotes.filter((quote) => {
    if (normalizedStatus && quote.status !== normalizedStatus) {
      return false
    }

    if (!search) {
      return true
    }

    const searchableValues = [
      quote.quoteNumber,
      quote.notes,
      quote.clientSnapshot?.name,
      quote.clientSnapshot?.company,
      ...quote.items.map((item) => item.name),
    ]

    return searchableValues.some((value) => normalizeQueryValue(value).includes(search))
  })

  const sorted = sortCollection(filtered, params.sortBy || "createdAt", params.sortDirection || "desc", "quotes")
  return Promise.resolve(paginate(sorted, params.page, params.limit))
}

export function getCrmQuote(quoteId) {
  const state = ensureState()
  const quote = state.quotes.find((item) => item._id === quoteId)

  if (!quote) {
    return Promise.reject(new Error("Orcamento nao encontrado."))
  }

  return Promise.resolve(clone(quote))
}

export function getPublicCrmQuoteByToken(publicToken) {
  const state = ensureState()
  const quote = state.quotes.find((item) => item.publicToken === publicToken)

  if (!quote) {
    return Promise.reject(new Error("Proposta nao encontrada."))
  }

  return Promise.resolve(clone(quote))
}

export function createCrmQuote(payload) {
  const state = ensureState()
  const client = state.clients.find((item) => item._id === payload?.clientId)

  if (!client) {
    return Promise.reject(new Error("Selecione um cliente valido."))
  }

  const items = Array.isArray(payload?.items)
    ? payload.items
        .filter((item) => String(item?.name || item?.productId || "").trim())
        .map((item) => ({
          productId: item?.productId || "",
          name: String(item?.name || "").trim(),
          description: String(item?.description || "").trim(),
          quantity: Math.max(1, Number(item?.quantity || 1)),
          unitPrice: Number(item?.unitPrice || 0),
        }))
    : []

  if (!items.length) {
    return Promise.reject(new Error("Adicione pelo menos um item ao orcamento."))
  }

  const now = new Date().toISOString()
  const nextNumber = state.meta.quoteCounter + 1
  let createdQuote = null

  persist((draft) => {
    draft.meta.quoteCounter = nextNumber
    createdQuote = {
      _id: createId("quote"),
      quoteNumber: `ORC-${String(nextNumber).padStart(4, "0")}`,
      publicToken: createId("public"),
      clientId: client._id,
      clientSnapshot: getClientSnapshot(client),
      notes: String(payload?.notes || "").trim(),
      status: String(payload?.status || "sent"),
      items,
      total: computeQuoteTotal(items),
      createdAt: now,
      updatedAt: now,
    }

    draft.quotes.unshift(createdQuote)
    return draft
  })

  return Promise.resolve(createdQuote)
}

export function updateCrmQuote(quoteId, payload) {
  const state = ensureState()
  const client = state.clients.find((item) => item._id === payload?.clientId)

  if (!client) {
    return Promise.reject(new Error("Selecione um cliente valido."))
  }

  const items = Array.isArray(payload?.items)
    ? payload.items
        .filter((item) => String(item?.name || item?.productId || "").trim())
        .map((item) => ({
          productId: item?.productId || "",
          name: String(item?.name || "").trim(),
          description: String(item?.description || "").trim(),
          quantity: Math.max(1, Number(item?.quantity || 1)),
          unitPrice: Number(item?.unitPrice || 0),
        }))
    : []

  const now = new Date().toISOString()
  let updatedQuote = null

  persist((draft) => {
    draft.quotes = draft.quotes.map((quote) => {
      if (quote._id !== quoteId) {
        return quote
      }

      updatedQuote = {
        ...quote,
        clientId: client._id,
        clientSnapshot: getClientSnapshot(client),
        notes: String(payload?.notes || "").trim(),
        status: String(payload?.status || quote.status || "sent"),
        items,
        total: computeQuoteTotal(items),
        updatedAt: now,
      }

      return updatedQuote
    })

    return draft
  })

  if (!updatedQuote) {
    return Promise.reject(new Error("Orcamento nao encontrado."))
  }

  return Promise.resolve(updatedQuote)
}

export function updateCrmQuoteStatus(quoteId, status) {
  const now = new Date().toISOString()
  let updatedQuote = null

  persist((state) => {
    state.quotes = state.quotes.map((quote) => {
      if (quote._id !== quoteId) {
        return quote
      }

      updatedQuote = {
        ...quote,
        status,
        updatedAt: now,
      }

      return updatedQuote
    })

    return state
  })

  if (!updatedQuote) {
    return Promise.reject(new Error("Orcamento nao encontrado."))
  }

  return Promise.resolve(updatedQuote)
}

export function getMyCrmQuotes() {
  return listCrmQuotes({ limit: 50, page: 1 })
}

export function buildCrmQuotePdfUrl(quoteId) {
  return toAbsoluteQuoteUrl(quoteId)
}

export function buildPublicQuotePdfUrl(publicToken) {
  return toAbsoluteQuoteUrl(publicToken)
}

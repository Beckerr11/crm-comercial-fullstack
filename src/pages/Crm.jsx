import { useDeferredValue, useEffect, useMemo, useState } from "react"
import QuoteStatusBadge from "../components/QuoteStatusBadge"
import EmptyState from "../components/ui/EmptyState"
import MetricTile from "../components/ui/MetricTile"
import PageHero from "../components/ui/PageHero"
import {
  buildPublicQuotePdfUrl,
  createCrmClient,
  createCrmProduct,
  createCrmQuote,
  deleteCrmClient,
  deleteCrmProduct,
  getCrmClientHistory,
  getCrmSummary,
  listCrmClients,
  listCrmProducts,
  listCrmQuotes,
  updateCrmClient,
  updateCrmProduct,
  updateCrmQuote,
  updateCrmQuoteStatus,
} from "../services/crmApi"
import { buildQuoteWhatsAppUrl, getQuoteStatusLabel, quoteStatusLabels } from "../utils/crm"
import { formatCountLabel, formatCurrency, formatDateTime, truncateText } from "../utils/formatters"

const tabs = [
  { value: "quotes", label: "Orçamentos" },
  { value: "clients", label: "Clientes" },
  { value: "products", label: "Produtos e serviços" },
]

const pageSize = 8

const quoteTemplates = [
  {
    id: "landing-saas",
    label: "Landing + SaaS",
    notes: "Template focado em presença digital, autenticação e base SaaS para iniciar produto comercial.",
    items: [{ name: "Landing page premium", description: "Design, copy e estrutura de conversão.", quantity: 1, unitPrice: 2500 }],
  },
  {
    id: "crm-operacao",
    label: "CRM comercial",
    notes: "Template voltado para CRM, funil, painel operacional e automação de atendimento.",
    items: [{ name: "Módulo CRM e operação", description: "Clientes, propostas, pipeline e indicadores.", quantity: 1, unitPrice: 4800 }],
  },
  {
    id: "support-retainer",
    label: "Retainer mensal",
    notes: "Template para manutenção evolutiva, suporte operacional e backlog contínuo.",
    items: [{ name: "Suporte e evolução mensal", description: "Melhorias contínuas, monitoramento e backlog.", quantity: 1, unitPrice: 1800 }],
  },
]

function PaginationControls({ pagination, onPageChange }) {
  if (!pagination || pagination.total <= pagination.limit) {
    return null
  }

  return (
    <div className="inline-actions pagination-row">
      <button className="button secondary small" disabled={!pagination.hasPreviousPage} onClick={() => onPageChange(pagination.page - 1)} type="button">
        Anterior
      </button>
      <span className="mini-pill">
        Página {pagination.page} de {pagination.totalPages} / {formatCountLabel(pagination.total, "item", "itens")}
      </span>
      <button className="button secondary small" disabled={!pagination.hasNextPage} onClick={() => onPageChange(pagination.page + 1)} type="button">
        Próxima
      </button>
    </div>
  )
}

function createEmptyQuoteItem() {
  return {
    productId: "",
    name: "",
    description: "",
    quantity: 1,
    unitPrice: "",
  }
}

function createEmptyClientForm() {
  return {
    _id: "",
    name: "",
    email: "",
    phone: "",
    company: "",
    notes: "",
  }
}

function createEmptyProductForm() {
  return {
    _id: "",
    name: "",
    description: "",
    unitPrice: "",
  }
}

function createEmptyQuoteForm() {
  return {
    _id: "",
    clientId: "",
    notes: "",
    status: "sent",
    items: [createEmptyQuoteItem()],
  }
}

function SummaryMetric({ label, value, detail }) {
  return <MetricTile detail={detail} label={label} value={value} />
}

function CrmHeroSignal({ label, value, detail }) {
  return (
    <article className="surface nested-card compact-card crm-hero-signal">
      <span className="mini-pill emphasis">{label}</span>
      <strong>{value}</strong>
      <p className="section-copy compact">{detail}</p>
    </article>
  )
}

export default function Crm() {
  const [tab, setTab] = useState("quotes")
  const [feedback, setFeedback] = useState({ tone: "", message: "" })
  const [filters, setFilters] = useState({
    clientSearch: "",
    productSearch: "",
    quoteSearch: "",
    quoteStatus: "all",
  })
  const [state, setState] = useState({
    loading: true,
    refreshing: false,
    summary: null,
    clients: [],
    clientsPagination: null,
    products: [],
    productsPagination: null,
    quotes: [],
    quotesPagination: null,
    clientHistory: null,
  })
  const [clientForm, setClientForm] = useState(createEmptyClientForm)
  const [productForm, setProductForm] = useState(createEmptyProductForm)
  const [quoteForm, setQuoteForm] = useState(createEmptyQuoteForm)
  const [selectedHistoryClientId, setSelectedHistoryClientId] = useState("")
  const [pages, setPages] = useState({ clients: 1, products: 1, quotes: 1 })
  const [sorts, setSorts] = useState({
    clients: { sortBy: "createdAt", sortDirection: "desc" },
    products: { sortBy: "createdAt", sortDirection: "desc" },
    quotes: { sortBy: "createdAt", sortDirection: "desc" },
  })

  const deferredClientSearch = useDeferredValue(filters.clientSearch)
  const deferredProductSearch = useDeferredValue(filters.productSearch)
  const deferredQuoteSearch = useDeferredValue(filters.quoteSearch)

  const clientOptions = useMemo(() => state.clients || [], [state.clients])
  const productOptions = useMemo(() => state.products || [], [state.products])
  const productMap = useMemo(
    () =>
      Object.fromEntries(
        productOptions.map((product) => [
          product._id,
          {
            ...product,
            unitPrice: Number(product.unitPrice || 0),
          },
        ])
      ),
    [productOptions]
  )

  useEffect(() => {
    let active = true

    async function loadCrm() {
      setState((current) => ({
        ...current,
        loading: !current.summary,
        refreshing: true,
      }))

      const [summaryResult, clientsResult, productsResult, quotesResult] = await Promise.allSettled([
        getCrmSummary(),
        listCrmClients({
          search: deferredClientSearch,
          limit: pageSize,
          page: pages.clients,
          ...sorts.clients,
        }),
        listCrmProducts({
          search: deferredProductSearch,
          limit: pageSize,
          page: pages.products,
          ...sorts.products,
        }),
        listCrmQuotes({
          search: deferredQuoteSearch,
          status: filters.quoteStatus === "all" ? undefined : filters.quoteStatus,
          limit: pageSize,
          page: pages.quotes,
          ...sorts.quotes,
        }),
      ])

      if (!active) {
        return
      }

      setState((current) => ({
        ...current,
        loading: false,
        refreshing: false,
        summary: summaryResult.status === "fulfilled" ? summaryResult.value : current.summary,
        clients: clientsResult.status === "fulfilled" ? clientsResult.value?.items || [] : current.clients,
        clientsPagination: clientsResult.status === "fulfilled" ? clientsResult.value?.pagination || current.clientsPagination : current.clientsPagination,
        products: productsResult.status === "fulfilled" ? productsResult.value?.items || [] : current.products,
        productsPagination: productsResult.status === "fulfilled" ? productsResult.value?.pagination || current.productsPagination : current.productsPagination,
        quotes: quotesResult.status === "fulfilled" ? quotesResult.value?.items || [] : current.quotes,
        quotesPagination: quotesResult.status === "fulfilled" ? quotesResult.value?.pagination || current.quotesPagination : current.quotesPagination,
      }))
    }

    void loadCrm()

    return () => {
      active = false
    }
  }, [deferredClientSearch, deferredProductSearch, deferredQuoteSearch, filters.quoteStatus, pages.clients, pages.products, pages.quotes, sorts.clients, sorts.products, sorts.quotes])

  useEffect(() => {
    let active = true

    async function loadHistory() {
      if (!selectedHistoryClientId) {
        setState((current) => ({ ...current, clientHistory: null }))
        return
      }

      try {
        const history = await getCrmClientHistory(selectedHistoryClientId)
        if (!active) {
          return
        }

        setState((current) => ({
          ...current,
          clientHistory: history,
        }))
      } catch {
        if (!active) {
          return
        }

        setState((current) => ({
          ...current,
          clientHistory: null,
        }))
      }
    }

    void loadHistory()

    return () => {
      active = false
    }
  }, [selectedHistoryClientId])

  const draftTotal = useMemo(
    () =>
      quoteForm.items.reduce((total, item) => {
        const quantity = Math.max(1, Number(item.quantity || 1))
        const unitPrice = Number(item.unitPrice || 0)
        return total + quantity * unitPrice
      }, 0),
    [quoteForm.items]
  )

  function resetClientForm() {
    setClientForm(createEmptyClientForm())
  }

  function resetProductForm() {
    setProductForm(createEmptyProductForm())
  }

  function resetQuoteForm(nextClientId = "") {
    setQuoteForm({
      ...createEmptyQuoteForm(),
      clientId: nextClientId,
    })
  }

  function hydrateQuoteForm(quote) {
    setQuoteForm({
      _id: quote._id,
      clientId: quote.clientId || "",
      notes: quote.notes || "",
      status: quote.status || "sent",
      items:
        Array.isArray(quote.items) && quote.items.length
          ? quote.items.map((item) => ({
              productId: item.productId || "",
              name: item.name || "",
              description: item.description || "",
              quantity: Number(item.quantity || 1),
              unitPrice: Number(item.unitPrice || 0),
            }))
          : [createEmptyQuoteItem()],
    })
  }

  function updateQuoteItem(index, field, value) {
    setQuoteForm((current) => ({
      ...current,
      items: current.items.map((item, itemIndex) => (itemIndex === index ? { ...item, [field]: value } : item)),
    }))
  }

  function handleProductSelection(index, productId) {
    const selectedProduct = productMap[productId]
    if (!selectedProduct) {
      updateQuoteItem(index, "productId", "")
      return
    }

    setQuoteForm((current) => ({
      ...current,
      items: current.items.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              productId,
              name: selectedProduct.name,
              description: selectedProduct.description,
              unitPrice: selectedProduct.unitPrice,
            }
          : item
      ),
    }))
  }

  function addQuoteItem() {
    setQuoteForm((current) => ({
      ...current,
      items: [...current.items, createEmptyQuoteItem()],
    }))
  }

  function removeQuoteItem(index) {
    setQuoteForm((current) => ({
      ...current,
      items: current.items.filter((_, itemIndex) => itemIndex !== index),
    }))
  }

  function applyQuoteTemplate(templateId) {
    const template = quoteTemplates.find((item) => item.id === templateId)
    if (!template) {
      return
    }

    setQuoteForm((current) => ({
      ...current,
      notes: template.notes,
      items: template.items.map((item) => ({
        productId: "",
        name: item.name,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      })),
    }))
    setFeedback({ tone: "info", message: `Template "${template.label}" aplicado ao rascunho.` })
  }

  async function handleClientSubmit(event) {
    event.preventDefault()
    setFeedback({ tone: "", message: "" })

    try {
      if (clientForm._id) {
        await updateCrmClient(clientForm._id, clientForm)
        setFeedback({ tone: "success", message: "Cliente atualizado com sucesso." })
      } else {
        await createCrmClient(clientForm)
        setFeedback({ tone: "success", message: "Cliente criado com sucesso." })
      }

      resetClientForm()
      const [clients, summary] = await Promise.all([
        listCrmClients({ search: deferredClientSearch, limit: pageSize, page: pages.clients, ...sorts.clients }),
        getCrmSummary(),
      ])
      setState((current) => ({ ...current, clients: clients.items || [], clientsPagination: clients.pagination || current.clientsPagination, summary }))
    } catch (error) {
      setFeedback({ tone: "error", message: error.message || "Não foi possível salvar o cliente." })
    }
  }

  async function handleProductSubmit(event) {
    event.preventDefault()
    setFeedback({ tone: "", message: "" })

    try {
      if (productForm._id) {
        await updateCrmProduct(productForm._id, productForm)
        setFeedback({ tone: "success", message: "Produto ou serviço atualizado com sucesso." })
      } else {
        await createCrmProduct(productForm)
        setFeedback({ tone: "success", message: "Produto ou serviço criado com sucesso." })
      }

      resetProductForm()
      const [products, summary] = await Promise.all([
        listCrmProducts({ search: deferredProductSearch, limit: pageSize, page: pages.products, ...sorts.products }),
        getCrmSummary(),
      ])
      setState((current) => ({ ...current, products: products.items || [], productsPagination: products.pagination || current.productsPagination, summary }))
    } catch (error) {
      setFeedback({ tone: "error", message: error.message || "Não foi possível salvar o produto ou serviço." })
    }
  }

  async function handleQuoteSubmit(event) {
    event.preventDefault()
    setFeedback({ tone: "", message: "" })

    const payload = {
      clientId: quoteForm.clientId,
      notes: quoteForm.notes,
      status: quoteForm.status,
      items: quoteForm.items
        .filter((item) => item.name || item.productId)
        .map((item) => ({
          productId: item.productId || undefined,
          name: item.name,
          description: item.description,
          quantity: Number(item.quantity || 1),
          unitPrice: Number(item.unitPrice || 0),
        })),
    }

    try {
      if (quoteForm._id) {
        await updateCrmQuote(quoteForm._id, payload)
        setFeedback({ tone: "success", message: "Orçamento atualizado com sucesso." })
      } else {
        await createCrmQuote(payload)
        setFeedback({ tone: "success", message: "Orçamento criado com sucesso." })
      }

      resetQuoteForm(quoteForm.clientId)
      const [summary, quotes] = await Promise.all([
        getCrmSummary(),
        listCrmQuotes({
          search: deferredQuoteSearch,
          status: filters.quoteStatus === "all" ? undefined : filters.quoteStatus,
          limit: pageSize,
          page: pages.quotes,
          ...sorts.quotes,
        }),
      ])

      setState((current) => ({
        ...current,
        summary,
        quotes: quotes.items || [],
        quotesPagination: quotes.pagination || current.quotesPagination,
      }))
    } catch (error) {
      setFeedback({ tone: "error", message: error.message || "Não foi possível salvar o orçamento." })
    }
  }

  async function handleDeleteClient(clientId) {
    if (!window.confirm("Deseja remover este cliente do CRM?")) {
      return
    }

    try {
      await deleteCrmClient(clientId)
      const summary = await getCrmSummary()
      setFeedback({ tone: "success", message: "Cliente removido com sucesso." })
      setState((current) => ({
        ...current,
        summary,
        clients: current.clients.filter((client) => client._id !== clientId),
        clientHistory: current.clientHistory?.client?._id === clientId ? null : current.clientHistory,
      }))
      if (clientForm._id === clientId) {
        resetClientForm()
      }
    } catch (error) {
      setFeedback({ tone: "error", message: error.message || "Não foi possível remover o cliente." })
    }
  }

  async function handleDeleteProduct(productId) {
    if (!window.confirm("Deseja remover este produto ou serviço?")) {
      return
    }

    try {
      await deleteCrmProduct(productId)
      const summary = await getCrmSummary()
      setFeedback({ tone: "success", message: "Produto ou serviço removido com sucesso." })
      setState((current) => ({
        ...current,
        summary,
        products: current.products.filter((product) => product._id !== productId),
      }))
      if (productForm._id === productId) {
        resetProductForm()
      }
    } catch (error) {
      setFeedback({ tone: "error", message: error.message || "Não foi possível remover o item." })
    }
  }

  async function handleQuoteStatus(quoteId, status) {
    try {
      const updated = await updateCrmQuoteStatus(quoteId, status)
      const summary = await getCrmSummary()
      setFeedback({ tone: "success", message: `Status alterado para ${getQuoteStatusLabel(status).toLowerCase()}.` })
      setState((current) => ({
        ...current,
        summary,
        quotes: current.quotes.map((quote) => (quote._id === quoteId ? updated : quote)),
      }))
    } catch (error) {
      setFeedback({ tone: "error", message: error.message || "Não foi possível atualizar o status do orçamento." })
    }
  }

  if (state.loading) {
    return (
      <section className="surface section-card">
        <p className="eyebrow">CRM</p>
        <h1>Carregando orçamentos e propostas</h1>
        <p className="section-copy">Buscando clientes, catálogo comercial, histórico e resumo do CRM.</p>
      </section>
    )
  }

  return (
    <>
      <PageHero
        actions={
          <>
            <span className="mini-pill">{state.refreshing ? "Atualizando" : "Sincronizado"}</span>
            <button
              className="button"
              onClick={() => {
                setTab("quotes")
                resetQuoteForm()
              }}
              type="button"
            >
              Novo orçamento
            </button>
          </>
        }
        aside={
          <div className="crm-hero-aside">
            <CrmHeroSignal
              detail="Volume total já registrado no pipeline comercial."
              label="Pipeline"
              value={formatCountLabel(state.summary?.totals?.quotes || 0, "proposta")}
            />
            <CrmHeroSignal
              detail="Fechamento e compartilhamento continuam no mesmo fluxo."
              label="Fechamento"
              value="PDF + WhatsApp"
            />
          </div>
        }
        className="crm-page-hero"
        description="Organize clientes, serviços, propostas, PDF e compartilhamento em uma experiência comercial com leitura clara e pronta para vender."
        eyebrow="CRM de orçamentos"
        meta={
          <>
            <span className="mini-pill emphasis">Pipeline comercial</span>
            <span className="mini-pill">PDF + WhatsApp</span>
          </>
        }
        title="Clientes, propostas e acompanhamento comercial com cara de operação real"
      >

        {feedback.message ? <p className={`feedback ${feedback.tone || "info"}`}>{feedback.message}</p> : null}

        <div className="admin-tabs">
          {tabs.map((item) => (
            <button className={`tab-chip ${tab === item.value ? "active" : ""}`} key={item.value} onClick={() => setTab(item.value)} type="button">
              {item.label}
            </button>
          ))}
        </div>
      </PageHero>

      <section className="stats-grid">
        <SummaryMetric detail="Total de propostas registradas." label="Orçamentos" value={state.summary?.totals?.quotes || 0} />
        <SummaryMetric detail="Itens aceitos pelo cliente." label="Aprovados" value={state.summary?.totals?.approved || 0} />
        <SummaryMetric detail="Negociações recusadas." label="Recusados" value={state.summary?.totals?.rejected || 0} />
        <SummaryMetric detail="Base comercial ativa da organização." label="Clientes" value={state.summary?.totals?.clients || 0} />
      </section>

      {tab === "clients" ? (
        <>
          <section className="content-grid two-columns">
            <form className="surface section-card form-grid" onSubmit={handleClientSubmit}>
              <p className="eyebrow">{clientForm._id ? "Editar cliente" : "Novo cliente"}</p>
              <label className="field">
                <span>Nome</span>
                <input onChange={(event) => setClientForm((current) => ({ ...current, name: event.target.value }))} value={clientForm.name} />
              </label>
              <label className="field">
                <span>Email</span>
                <input onChange={(event) => setClientForm((current) => ({ ...current, email: event.target.value }))} value={clientForm.email} />
              </label>
              <label className="field">
                <span>Telefone</span>
                <input onChange={(event) => setClientForm((current) => ({ ...current, phone: event.target.value }))} value={clientForm.phone} />
              </label>
              <label className="field">
                <span>Empresa</span>
                <input onChange={(event) => setClientForm((current) => ({ ...current, company: event.target.value }))} value={clientForm.company} />
              </label>
              <label className="field field-full">
                <span>Observações</span>
                <textarea onChange={(event) => setClientForm((current) => ({ ...current, notes: event.target.value }))} value={clientForm.notes} />
              </label>

              <div className="inline-actions">
                <button className="button" type="submit">
                  {clientForm._id ? "Salvar cliente" : "Criar cliente"}
                </button>
                {clientForm._id ? (
                  <button className="button secondary" onClick={resetClientForm} type="button">
                    Cancelar
                  </button>
                ) : null}
              </div>
            </form>

            <section className="surface section-card">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">Base de clientes</p>
                  <h2>Pesquisar por nome</h2>
                </div>
                <span className="mini-pill">{formatCountLabel(state.clientsPagination?.total || state.clients.length, "cliente")}</span>
              </div>

              <div className="admin-filter-grid">
                <label className="field">
                  <span>Busca</span>
                  <input
                    onChange={(event) => {
                      setPages((current) => ({ ...current, clients: 1 }))
                      setFilters((current) => ({ ...current, clientSearch: event.target.value }))
                    }}
                    placeholder="Nome, email ou empresa"
                    value={filters.clientSearch}
                  />
                </label>
                <label className="field">
                  <span>Ordenar</span>
                  <select
                    onChange={(event) => {
                      const [sortBy, sortDirection] = event.target.value.split(":")
                      setPages((current) => ({ ...current, clients: 1 }))
                      setSorts((current) => ({ ...current, clients: { sortBy, sortDirection } }))
                    }}
                    value={`${sorts.clients.sortBy}:${sorts.clients.sortDirection}`}
                  >
                    <option value="createdAt:desc">Mais recentes</option>
                    <option value="createdAt:asc">Mais antigos</option>
                    <option value="name:asc">Nome A-Z</option>
                    <option value="company:asc">Empresa A-Z</option>
                  </select>
                </label>
              </div>

              {state.clients.length === 0 ? (
                <p className="empty-state">Nenhum cliente cadastrado para esse filtro.</p>
              ) : (
                <div className="card-stack">
                  {state.clients.map((client) => (
                    <article className="surface nested-card compact-card" key={client._id}>
                      <div className="task-card-header">
                        <h3>{client.name}</h3>
                        <span className="mini-pill">{client.company || "Pessoa física"}</span>
                      </div>
                      <p className="section-copy">{client.email}</p>
                      <div className="pill-row">
                        <span className="mini-pill">{client.phone}</span>
                        {client.linkedUsername ? <span className="mini-pill">Conta: {client.linkedUsername}</span> : null}
                      </div>
                      {client.notes ? <p className="section-copy">{truncateText(client.notes, 128)}</p> : null}
                      <div className="inline-actions">
                        <button className="button secondary small" onClick={() => setClientForm(client)} type="button">
                          Editar
                        </button>
                        <button className="button ghost small" onClick={() => setSelectedHistoryClientId(client._id)} type="button">
                          Histórico
                        </button>
                        <button className="button danger small" onClick={() => void handleDeleteClient(client._id)} type="button">
                          Excluir
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}

              <PaginationControls pagination={state.clientsPagination} onPageChange={(page) => setPages((current) => ({ ...current, clients: page }))} />
            </section>
          </section>

          {state.clientHistory ? (
            <section className="surface section-card">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">Histórico por cliente</p>
                  <h2>{state.clientHistory.client?.name}</h2>
                </div>
                <div className="inline-actions">
                  <button
                    className="button secondary small"
                    onClick={() => {
                      setTab("quotes")
                      resetQuoteForm(state.clientHistory.client?._id || "")
                    }}
                    type="button"
                  >
                    Novo orçamento para este cliente
                  </button>
                  <button className="button ghost small" onClick={() => setSelectedHistoryClientId("")} type="button">
                    Fechar
                  </button>
                </div>
              </div>

              {state.clientHistory.items?.length ? (
                <div className="card-stack">
                  {state.clientHistory.items.map((quote) => (
                    <article className="surface nested-card compact-card" key={quote._id}>
                      <div className="task-card-header">
                        <h3>{quote.quoteNumber}</h3>
                        <QuoteStatusBadge status={quote.status} />
                      </div>
                  <p className="section-copy">{formatCurrency(quote.total)} em {formatCountLabel(quote.items.length, "item", "itens")}</p>
                      <div className="pill-row">
                        <span className="mini-pill">{formatDateTime(quote.createdAt)}</span>
                        <span className="mini-pill">{quote.clientSnapshot?.email}</span>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <EmptyState message="Esse cliente ainda não possui orçamentos registrados." />
              )}
            </section>
          ) : null}
        </>
      ) : null}

      {tab === "products" ? (
        <section className="content-grid two-columns">
          <form className="surface section-card form-grid" onSubmit={handleProductSubmit}>
            <p className="eyebrow">{productForm._id ? "Editar item" : "Novo produto ou serviço"}</p>
            <label className="field">
              <span>Nome</span>
              <input onChange={(event) => setProductForm((current) => ({ ...current, name: event.target.value }))} value={productForm.name} />
            </label>
            <label className="field">
              <span>Preço unitário</span>
              <input onChange={(event) => setProductForm((current) => ({ ...current, unitPrice: event.target.value }))} type="number" value={productForm.unitPrice} />
            </label>
            <label className="field field-full">
              <span>Descrição</span>
              <textarea onChange={(event) => setProductForm((current) => ({ ...current, description: event.target.value }))} value={productForm.description} />
            </label>

            <div className="inline-actions">
              <button className="button" type="submit">
                {productForm._id ? "Salvar item" : "Criar item"}
              </button>
              {productForm._id ? (
                <button className="button secondary" onClick={resetProductForm} type="button">
                  Cancelar
                </button>
              ) : null}
            </div>
          </form>

          <section className="surface section-card">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">Catálogo comercial</p>
                  <h2>Produtos e serviços</h2>
                </div>
                <span className="mini-pill">{formatCountLabel(state.productsPagination?.total || state.products.length, "item", "itens")}</span>
              </div>

              <div className="admin-filter-grid">
                <label className="field">
                  <span>Busca</span>
                  <input
                    onChange={(event) => {
                      setPages((current) => ({ ...current, products: 1 }))
                      setFilters((current) => ({ ...current, productSearch: event.target.value }))
                    }}
                    placeholder="Nome ou descrição"
                    value={filters.productSearch}
                  />
                </label>
                <label className="field">
                  <span>Ordenar</span>
                  <select
                    onChange={(event) => {
                      const [sortBy, sortDirection] = event.target.value.split(":")
                      setPages((current) => ({ ...current, products: 1 }))
                      setSorts((current) => ({ ...current, products: { sortBy, sortDirection } }))
                    }}
                    value={`${sorts.products.sortBy}:${sorts.products.sortDirection}`}
                  >
                    <option value="createdAt:desc">Mais recentes</option>
                    <option value="name:asc">Nome A-Z</option>
                    <option value="price:desc">Maior preço</option>
                    <option value="price:asc">Menor preço</option>
                  </select>
                </label>
              </div>

            {state.products.length === 0 ? (
              <EmptyState message="Nenhum item cadastrado ainda." />
            ) : (
              <div className="card-stack">
                {state.products.map((product) => (
                  <article className="surface nested-card compact-card" key={product._id}>
                    <div className="task-card-header">
                      <h3>{product.name}</h3>
                      <span className="mini-pill">{formatCurrency(product.unitPrice)}</span>
                    </div>
                    <p className="section-copy">{truncateText(product.description || "Sem descrição adicional.", 136)}</p>
                    <div className="inline-actions">
                      <button className="button secondary small" onClick={() => setProductForm({ ...product, unitPrice: product.unitPrice })} type="button">
                        Editar
                      </button>
                      <button className="button danger small" onClick={() => void handleDeleteProduct(product._id)} type="button">
                        Excluir
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
            <PaginationControls pagination={state.productsPagination} onPageChange={(page) => setPages((current) => ({ ...current, products: page }))} />
          </section>
        </section>
      ) : null}

      {tab === "quotes" ? (
        <>
          <section className="content-grid two-columns">
            <form className="surface section-card form-grid" onSubmit={handleQuoteSubmit}>
              <p className="eyebrow">{quoteForm._id ? "Editar orçamento" : "Novo orçamento"}</p>
              <div className="inline-actions">
                {quoteTemplates.map((template) => (
                  <button className="button ghost small" key={template.id} onClick={() => applyQuoteTemplate(template.id)} type="button">
                    {template.label}
                  </button>
                ))}
              </div>
              <label className="field">
                <span>Cliente</span>
                <select onChange={(event) => setQuoteForm((current) => ({ ...current, clientId: event.target.value }))} value={quoteForm.clientId}>
                  <option value="">Selecione um cliente</option>
                  {clientOptions.map((client) => (
                    <option key={client._id} value={client._id}>
                      {client.name} - {client.email}
                    </option>
                  ))}
                </select>
              </label>

              <label className="field field-full">
                <span>Observações adicionais</span>
                <textarea onChange={(event) => setQuoteForm((current) => ({ ...current, notes: event.target.value }))} value={quoteForm.notes} />
              </label>

              <div className="card-stack">
                {quoteForm.items.map((item, index) => (
                  <article className="surface nested-card compact-card" key={`quote-item-${index}`}>
                    <div className="task-card-header">
                      <h3>Item {index + 1}</h3>
                      {quoteForm.items.length > 1 ? (
                        <button className="button ghost small" onClick={() => removeQuoteItem(index)} type="button">
                          Remover
                        </button>
                      ) : null}
                    </div>

                    <label className="field">
                      <span>Produto ou serviço</span>
                      <select onChange={(event) => handleProductSelection(index, event.target.value)} value={item.productId}>
                        <option value="">Selecionar item existente</option>
                        {productOptions.map((product) => (
                          <option key={product._id} value={product._id}>
                            {product.name}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="field">
                      <span>Nome do item</span>
                      <input onChange={(event) => updateQuoteItem(index, "name", event.target.value)} value={item.name} />
                    </label>
                    <label className="field">
                      <span>Quantidade</span>
                      <input min="1" onChange={(event) => updateQuoteItem(index, "quantity", event.target.value)} type="number" value={item.quantity} />
                    </label>
                    <label className="field">
                      <span>Preço unitário</span>
                      <input onChange={(event) => updateQuoteItem(index, "unitPrice", event.target.value)} type="number" value={item.unitPrice} />
                    </label>
                    <label className="field field-full">
                      <span>Descrição</span>
                      <textarea onChange={(event) => updateQuoteItem(index, "description", event.target.value)} value={item.description} />
                    </label>
                  </article>
                ))}
              </div>

              <div className="inline-actions">
                <button className="button secondary small" onClick={addQuoteItem} type="button">
                  Adicionar item
                </button>
                <span className="mini-pill">Total estimado: {formatCurrency(draftTotal)}</span>
              </div>

              <div className="inline-actions">
                <button className="button" disabled={!quoteForm.clientId} type="submit">
                  {quoteForm._id ? "Salvar orçamento" : "Criar orçamento"}
                </button>
                {quoteForm._id ? (
                  <button className="button secondary" onClick={() => resetQuoteForm(quoteForm.clientId)} type="button">
                    Cancelar
                  </button>
                ) : null}
              </div>

              <div className="crm-form-tips">
                <div className="mini-pill emphasis">Template rápido</div>
                <p className="section-copy compact">Use um template para acelerar o rascunho e depois refine itens, valores e observações do cliente.</p>
              </div>
            </form>

            <section className="surface section-card">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">Pipeline de propostas</p>
                  <h2>Lista de orçamentos</h2>
                </div>
                <span className="mini-pill">{formatCountLabel(state.quotesPagination?.total || state.quotes.length, "proposta")}</span>
              </div>

              <div className="admin-filter-grid">
                <label className="field">
                  <span>Buscar</span>
                  <input
                    onChange={(event) => {
                      setPages((current) => ({ ...current, quotes: 1 }))
                      setFilters((current) => ({ ...current, quoteSearch: event.target.value }))
                    }}
                    placeholder="Cliente, número ou item"
                    value={filters.quoteSearch}
                  />
                </label>
                <label className="field">
                  <span>Status</span>
                  <select
                    onChange={(event) => {
                      setPages((current) => ({ ...current, quotes: 1 }))
                      setFilters((current) => ({ ...current, quoteStatus: event.target.value }))
                    }}
                    value={filters.quoteStatus}
                  >
                    <option value="all">Todos</option>
                    {Object.entries(quoteStatusLabels).map(([status, label]) => (
                      <option key={status} value={status}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field">
                  <span>Ordenar</span>
                  <select
                    onChange={(event) => {
                      const [sortBy, sortDirection] = event.target.value.split(":")
                      setPages((current) => ({ ...current, quotes: 1 }))
                      setSorts((current) => ({ ...current, quotes: { sortBy, sortDirection } }))
                    }}
                    value={`${sorts.quotes.sortBy}:${sorts.quotes.sortDirection}`}
                  >
                    <option value="createdAt:desc">Mais recentes</option>
                    <option value="client:asc">Cliente A-Z</option>
                    <option value="total:desc">Maior valor</option>
                    <option value="total:asc">Menor valor</option>
                    <option value="status:asc">Status</option>
                  </select>
                </label>
              </div>

              {state.quotes.length === 0 ? (
                <EmptyState message="Nenhum orçamento cadastrado para esse filtro." />
              ) : (
                <div className="card-stack">
                  {state.quotes.map((quote) => {
                    const whatsappUrl = buildQuoteWhatsAppUrl(quote)

                    return (
                      <article className="surface nested-card compact-card" key={quote._id}>
                        <div className="task-card-header">
                          <div>
                            <h3>{quote.quoteNumber}</h3>
                            <p className="section-copy compact">
                              {quote.clientSnapshot?.name} - {quote.clientSnapshot?.company || "Cliente"}
                            </p>
                          </div>
                          <QuoteStatusBadge status={quote.status} />
                        </div>

                        <div className="pill-row">
                          <span className="mini-pill">{formatCurrency(quote.total)}</span>
                          <span className="mini-pill">{formatCountLabel(quote.items.length, "item", "itens")}</span>
                          <span className="mini-pill">{formatDateTime(quote.createdAt)}</span>
                        </div>

                        <p className="section-copy">{truncateText(quote.notes || "Sem observações adicionais.", 132)}</p>

                        <div className="inline-actions">
                          <button className="button secondary small" onClick={() => hydrateQuoteForm(quote)} type="button">
                            Editar
                          </button>
                          <a className="button ghost small" href={buildPublicQuotePdfUrl(quote.publicToken)} rel="noreferrer" target="_blank">
                            PDF
                          </a>
                          {whatsappUrl ? (
                            <a className="button ghost small" href={whatsappUrl} rel="noreferrer" target="_blank">
                              WhatsApp
                            </a>
                          ) : null}
                          {quote.status !== "approved" ? (
                            <button className="button secondary small" onClick={() => void handleQuoteStatus(quote._id, "approved")} type="button">
                              Aprovar
                            </button>
                          ) : null}
                          {quote.status !== "rejected" ? (
                            <button className="button danger small" onClick={() => void handleQuoteStatus(quote._id, "rejected")} type="button">
                              Recusar
                            </button>
                          ) : null}
                        </div>
                      </article>
                    )
                  })}
                </div>
              )}

              <PaginationControls pagination={state.quotesPagination} onPageChange={(page) => setPages((current) => ({ ...current, quotes: page }))} />
            </section>
          </section>

          <section className="surface section-card">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Últimos orçamentos</p>
                <h2>Movimento recente do CRM</h2>
              </div>
            </div>

            {state.summary?.recentQuotes?.length ? (
              <div className="card-stack">
                {state.summary.recentQuotes.slice(0, 4).map((quote) => (
                  <article className="surface nested-card compact-card" key={quote._id}>
                    <div className="task-card-header">
                      <h3>{quote.quoteNumber}</h3>
                      <QuoteStatusBadge status={quote.status} />
                    </div>
                    <p className="section-copy">
                      {quote.clientSnapshot?.name} - {formatCurrency(quote.total)}
                    </p>
                  </article>
                ))}
              </div>
            ) : (
              <EmptyState message="Crie o primeiro orçamento para iniciar o histórico comercial." />
            )}
          </section>
        </>
      ) : null}
    </>
  )
}

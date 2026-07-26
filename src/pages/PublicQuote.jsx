import { useEffect, useState } from "react"
import { Link, useParams } from "react-router"
import QuoteStatusBadge from "../components/QuoteStatusBadge"
import EmptyState from "../components/ui/EmptyState"
import IconSymbol from "../components/IconSymbol"
import { getPublicCrmQuoteByToken } from "../services/crmApi"
import { formatCurrency, formatDateTime } from "../utils/formatters"

export default function PublicQuote() {
  const { publicToken = "" } = useParams()
  const [state, setState] = useState({ loading: true, quote: null, error: "" })

  useEffect(() => {
    let active = true

    async function loadQuote() {
      try {
        const quote = await getPublicCrmQuoteByToken(publicToken)
        if (!active) {
          return
        }

        setState({ loading: false, quote, error: "" })
      } catch (error) {
        if (!active) {
          return
        }

        setState({ loading: false, quote: null, error: error.message || "Proposta indisponivel." })
      }
    }

    void loadQuote()

    return () => {
      active = false
    }
  }, [publicToken])

  if (state.loading) {
    return (
      <section className="surface section-card">
        <p className="eyebrow">Proposta</p>
        <h1>Carregando proposta comercial</h1>
      </section>
    )
  }

  if (!state.quote) {
    return (
      <section className="surface section-card">
        <EmptyState message={state.error || "Nao foi possivel localizar a proposta."} />
        <div className="inline-actions">
          <Link className="button secondary" to="/">
            Voltar ao CRM
          </Link>
        </div>
      </section>
    )
  }

  const { quote } = state

  return (
    <section className="surface section-card quote-public-card">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Proposta publica</p>
          <h1>{quote.quoteNumber}</h1>
        </div>
        <QuoteStatusBadge status={quote.status} />
      </div>

      <div className="content-grid two-columns">
        <article className="surface nested-card compact-card">
          <p className="eyebrow">Cliente</p>
          <h2>{quote.clientSnapshot?.name}</h2>
          <p className="section-copy">{quote.clientSnapshot?.company || "Cliente"}</p>
          <div className="card-stack compact">
            <span className="mini-pill">{quote.clientSnapshot?.email}</span>
            <span className="mini-pill">{quote.clientSnapshot?.phone}</span>
            <span className="mini-pill">{formatDateTime(quote.createdAt)}</span>
          </div>
        </article>

        <article className="surface nested-card compact-card">
          <p className="eyebrow">Resumo</p>
          <h2>{formatCurrency(quote.total)}</h2>
          <p className="section-copy">{quote.notes || "Escopo enviado para avaliacao."}</p>
          <div className="inline-actions">
            <button className="button secondary" onClick={() => window.print()} type="button">
              <IconSymbol className="icon-sm" name="pdf" />
              Imprimir
            </button>
            <Link className="button ghost" to="/">
              Voltar ao CRM
            </Link>
          </div>
        </article>
      </div>

      <section className="surface nested-card section-card">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Itens</p>
            <h2>Escopo da proposta</h2>
          </div>
        </div>

        <div className="card-stack">
          {quote.items.map((item, index) => (
            <article className="surface nested-card compact-card" key={`${item.name}-${index}`}>
              <div className="task-card-header">
                <h3>{item.name}</h3>
                <span className="mini-pill">{formatCurrency((Number(item.quantity) || 1) * Number(item.unitPrice || 0))}</span>
              </div>
              <p className="section-copy">{item.description || "Escopo sob medida para a entrega."}</p>
              <div className="pill-row">
                <span className="mini-pill">Quantidade: {item.quantity}</span>
                <span className="mini-pill">Unitario: {formatCurrency(item.unitPrice)}</span>
              </div>
            </article>
          ))}
        </div>
      </section>
    </section>
  )
}

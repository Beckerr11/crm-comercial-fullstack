import { cloneElement, useEffect, useId, useRef } from "react";
import { FiFileText, FiLayers, FiSearch, FiX } from "react-icons/fi";
export const money = (cents) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    cents / 100,
  );
export const date = (value) =>
  new Date(value).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
export const statuses = {
  draft: "Rascunho",
  sent: "Enviada",
  approved: "Aprovada",
  rejected: "Recusada",
};
export { parseMoney } from "./money.js";
export const moneyInput = (cents) => (cents / 100).toFixed(2).replace(".", ",");
export async function request(path, options = {}) {
  const response = await fetch(`/api${path}`, {
    credentials: "same-origin",
    ...options,
    headers: { "Content-Type": "application/json", ...options.headers },
  });
  const data = await response
    .json()
    .catch(() => ({ error: "O servidor não respondeu. Tente novamente." }));
  if (!response.ok) {
    const error = new Error(data.error);
    error.status = response.status;
    throw error;
  }
  return data;
}
export function Brand() {
  return (
    <span className="brand">
      <span className="brand-icon">
        <FiLayers />
      </span>
      folio<span className="brand-dot">.</span>
    </span>
  );
}
export function Badge({ status }) {
  return (
    <span className={`badge ${status}`} data-testid="proposal-status">
      <i />
      {statuses[status]}
    </span>
  );
}
export function Empty({ title, children }) {
  return (
    <div className="empty">
      <FiFileText />
      <h3>{title}</h3>
      <p>{children}</p>
    </div>
  );
}
export function Modal({ title, children, onClose, wide = false }) {
  const ref = useRef(null);
  const titleId = useId();
  useEffect(() => {
    const dialog = ref.current;
    const previousFocus = document.activeElement;
    dialog.showModal();
    return () => {
      dialog.close();
      previousFocus?.focus({ preventScroll: true });
    };
  }, []);
  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      className={wide ? "modal wide" : "modal"}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      <div className="modal-head">
        <h2 id={titleId}>{title}</h2>
        <button
          className="icon-button"
          aria-label="Fechar diálogo"
          onClick={onClose}
        >
          <FiX />
        </button>
      </div>
      {children}
    </dialog>
  );
}
export function Field({ label, children }) {
  const id = useId();
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {cloneElement(children, { id })}
    </div>
  );
}
export function Search({ value, onChange, placeholder }) {
  return (
    <label className="search">
      <FiSearch />
      <input
        aria-label={placeholder}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}
export function QuoteDocument({ q, publicView = false }) {
  return (
    <div className="quote-document">
      <div className="document-meta">
        <span>
          {q.number} · REVISÃO {q.revision}
        </span>
        <Badge status={q.status} />
      </div>
      <div className="document-client">
        <span className="eyebrow">PREPARADA PARA</span>
        <h2>{q.client.company || q.client.name}</h2>
        <p>{q.client.name}</p>
      </div>
      <div className="document-items">
        {q.items.map((i, index) => (
          <article key={index}>
            <div>
              <h3>{i.name}</h3>
              {i.description && <p>{i.description}</p>}
              <span>
                {i.quantity} × {money(i.unitPriceCents)}
              </span>
            </div>
            <strong>{money(i.quantity * i.unitPriceCents)}</strong>
          </article>
        ))}
      </div>
      <div className="quote-total">
        <span>Investimento total</span>
        <strong data-testid={publicView ? "public-total" : "detail-total"}>
          {money(q.totalCents)}
        </strong>
      </div>
      {q.notes && (
        <div className="document-notes">
          <h3>Condições e observações</h3>
          <p>{q.notes}</p>
        </div>
      )}
    </div>
  );
}

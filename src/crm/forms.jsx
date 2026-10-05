import { useState } from "react";
import { FiCheck, FiPlus } from "react-icons/fi";
import { Empty, Field, money, moneyInput, parseMoney } from "./ui";
export function EntityForm({ kind, item, busy, onSubmit }) {
  const [error, setError] = useState("");
  const client = kind === "client";
  function submit(event) {
    event.preventDefault();
    setError("");
    try {
      const data = Object.fromEntries(new FormData(event.currentTarget));
      if (!client) {
        data.unitPriceCents = parseMoney(data.price);
        delete data.price;
      }
      onSubmit(data);
    } catch (err) {
      setError(err.message);
    }
  }
  return (
    <form className="form-stack" onSubmit={submit}>
      <Field label={client ? "Nome do cliente" : "Nome do serviço"}>
        <input
          name="name"
          defaultValue={item?.name || ""}
          required
          maxLength={120}
        />
      </Field>
      {client ? (
        <>
          <Field label="Empresa">
            <input
              name="company"
              defaultValue={item?.company || ""}
              maxLength={120}
            />
          </Field>
          <div className="form-grid">
            <Field label="E-mail">
              <input
                name="email"
                type="email"
                defaultValue={item?.email || ""}
                maxLength={200}
              />
            </Field>
            <Field label="Telefone">
              <input
                name="phone"
                defaultValue={item?.phone || ""}
                maxLength={40}
              />
            </Field>
          </div>
          <Field label="Observações internas">
            <textarea
              name="notes"
              defaultValue={item?.notes || ""}
              maxLength={2000}
            />
          </Field>
        </>
      ) : (
        <>
          <Field label="Valor unitário (R$)">
            <input
              name="price"
              inputMode="decimal"
              required
              defaultValue={moneyInput(item?.unitPriceCents || 0)}
            />
          </Field>
          <Field label="Descrição">
            <textarea
              name="description"
              defaultValue={item?.description || ""}
              maxLength={2000}
            />
          </Field>
        </>
      )}
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <button className="button primary" disabled={busy}>
        {busy ? "Salvando…" : client ? "Salvar cliente" : "Salvar serviço"}{" "}
        <FiCheck />
      </button>
    </form>
  );
}
const newItem = () => ({
  key: crypto.randomUUID(),
  name: "",
  description: "",
  productId: "",
  quantity: 1,
  price: "0,00",
});
export function QuoteForm({ w, item, busy, onSubmit }) {
  const [items, setItems] = useState(() =>
    item
      ? item.items.map((i) => ({
          ...i,
          key: crypto.randomUUID(),
          price: moneyInput(i.unitPriceCents),
          productId: w.products.some((p) => p.id === i.productId)
            ? i.productId
            : "",
        }))
      : [newItem()],
  );
  const [error, setError] = useState("");
  function change(key, updates) {
    setItems((current) =>
      current.map((i) => (i.key === key ? { ...i, ...updates } : i)),
    );
  }
  let total = 0;
  try {
    total = items.reduce(
      (sum, i) => sum + parseMoney(i.price) * Number(i.quantity),
      0,
    );
  } catch {
    /* incomplete typing */
  }
  function submit(event) {
    event.preventDefault();
    setError("");
    try {
      const fields = new FormData(event.currentTarget);
      onSubmit({
        clientId: fields.get("clientId"),
        notes: fields.get("notes"),
        items: items.map((i) => ({
          name: i.name,
          description: i.description,
          productId: i.productId,
          quantity: Number(i.quantity),
          unitPriceCents: parseMoney(i.price),
        })),
      });
    } catch (err) {
      setError(err.message);
    }
  }
  if (!w.clients.length)
    return (
      <Empty title="Primeiro, adicione um cliente">
        Feche este diálogo e cadastre um cliente para iniciar uma proposta.
      </Empty>
    );
  return (
    <form className="form-stack" onSubmit={submit}>
      <Field label="Cliente">
        <select name="clientId" required defaultValue={item?.client.id || ""}>
          <option value="" disabled>
            Escolha para quem você vai criar
          </option>
          {w.clients.map((c) => (
            <option value={c.id} key={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </Field>
      <div className="form-section-title">
        <h3>O que vamos entregar?</h3>
        <span>{items.length}/30 itens</span>
      </div>
      {items.map((i, index) => (
        <fieldset className="quote-item" key={i.key}>
          <legend>Item {index + 1}</legend>
          <Field label={`Serviço do catálogo ${index + 1}`}>
            <select
              value={i.productId}
              onChange={(event) => {
                const p = w.products.find((p) => p.id === event.target.value);
                change(
                  i.key,
                  p
                    ? {
                        productId: p.id,
                        name: p.name,
                        description: p.description,
                        price: moneyInput(p.unitPriceCents),
                      }
                    : { productId: "" },
                );
              }}
            >
              <option value="">Item personalizado</option>
              {w.products.map((p) => (
                <option value={p.id} key={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label={`Nome do item ${index + 1}`}>
            <input
              required
              value={i.name}
              maxLength={120}
              onChange={(e) => change(i.key, { name: e.target.value })}
            />
          </Field>
          <div className="form-grid">
            <Field label={`Valor unitário ${index + 1}`}>
              <input
                required
                inputMode="decimal"
                value={i.price}
                onChange={(e) => change(i.key, { price: e.target.value })}
              />
            </Field>
            <Field label={`Quantidade ${index + 1}`}>
              <input
                type="number"
                required
                min={1}
                max={9999}
                step={1}
                value={i.quantity}
                onChange={(e) => change(i.key, { quantity: e.target.value })}
              />
            </Field>
          </div>
          <Field label={`Descrição do item ${index + 1}`}>
            <textarea
              maxLength={2000}
              value={i.description}
              onChange={(e) => change(i.key, { description: e.target.value })}
            />
          </Field>
          {items.length > 1 && (
            <button
              type="button"
              className="text-button danger"
              onClick={() => setItems(items.filter((row) => row.key !== i.key))}
            >
              Remover item
            </button>
          )}
        </fieldset>
      ))}
      <button
        className="button ghost"
        type="button"
        disabled={items.length >= 30}
        onClick={() => setItems([...items, newItem()])}
      >
        <FiPlus /> Adicionar item
      </button>
      <Field label="Condições e observações">
        <textarea
          name="notes"
          maxLength={2000}
          defaultValue={item?.notes || ""}
          placeholder="Prazos, condições de pagamento e detalhes do escopo."
        />
      </Field>
      <div className="quote-total">
        <span>Investimento total</span>
        <strong data-testid="quote-total">{money(total)}</strong>
      </div>
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      <button className="button primary" disabled={busy}>
        {busy ? "Salvando…" : "Salvar rascunho"} <FiCheck />
      </button>
    </form>
  );
}

import { randomUUID } from "node:crypto";
export class DomainError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}
const fail = (message, status = 400) => {
  throw new DomainError(message, status);
};
const text = (value, label, max = 200) => {
  if (typeof value !== "string" || !value.trim() || value.trim().length > max)
    fail(`${label} inválido.`);
  return value.trim();
};
const optional = (value, max = 2000) =>
  value == null || value === "" ? "" : text(value, "Texto", max);
const cents = (value) => {
  if (!Number.isSafeInteger(value) || value < 0 || value > 1000000000)
    fail("Valor inválido: informe centavos inteiros positivos.");
  return value;
};
function limited(items, limit) {
  if (items.length >= limit) fail("Limite deste workspace atingido.", 409);
}
function event(q, label) {
  q.history.push({ id: randomUUID(), label, at: new Date().toISOString() });
  q.updatedAt = new Date().toISOString();
}
function quoteById(w, id) {
  return (
    w.quotes.find((q) => q.id === id) || fail("Proposta não encontrada.", 404)
  );
}
function contact(payload) {
  const email = optional(payload.email, 200).toLowerCase();
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    fail("E-mail inválido.");
  return {
    name: text(payload.name, "Nome", 120),
    company: optional(payload.company, 120),
    email,
    phone: optional(payload.phone, 40),
    notes: optional(payload.notes),
  };
}
export function addClient(w, payload) {
  limited(w.clients, 100);
  const client = {
    id: randomUUID(),
    ...contact(payload),
    createdAt: new Date().toISOString(),
  };
  w.clients.push(client);
  return client;
}
export function updateClient(w, id, payload) {
  const client =
    w.clients.find((c) => c.id === id) || fail("Cliente não encontrado.", 404);
  Object.assign(client, contact(payload));
  return client;
}
export function addProduct(w, payload) {
  limited(w.products, 100);
  const p = {
    id: randomUUID(),
    name: text(payload.name, "Nome", 120),
    description: optional(payload.description),
    unitPriceCents: cents(payload.unitPriceCents),
  };
  w.products.push(p);
  return p;
}
export function updateProduct(w, id, payload) {
  const p =
    w.products.find((p) => p.id === id) || fail("Serviço não encontrado.", 404);
  Object.assign(p, {
    name: text(payload.name, "Nome", 120),
    description: optional(payload.description),
    unitPriceCents: cents(payload.unitPriceCents),
  });
  return p;
}
export function removeEntity(w, collection, id) {
  if (!["clients", "products"].includes(collection)) fail("Coleção inválida.");
  if (collection === "clients" && w.quotes.some((q) => q.client.id === id))
    fail("Cliente vinculado a propostas. Preserve o histórico.", 409);
  const index = w[collection].findIndex((p) => p.id === id);
  if (index < 0) fail("Registro não encontrado.", 404);
  w[collection].splice(index, 1);
}
function content(w, payload) {
  const client =
    w.clients.find((c) => c.id === payload.clientId) ||
    fail("Cliente não encontrado neste workspace.", 404);
  if (
    !Array.isArray(payload.items) ||
    !payload.items.length ||
    payload.items.length > 30
  )
    fail("Informe de 1 a 30 itens.");
  const items = payload.items.map((item) => {
    if (
      !item ||
      !Number.isInteger(item.quantity) ||
      item.quantity < 1 ||
      item.quantity > 9999
    )
      fail("Quantidade inválida.");
    if (item.productId && !w.products.some((p) => p.id === item.productId))
      fail("Serviço não encontrado neste workspace.", 404);
    return {
      productId: item.productId || "",
      name: text(item.name, "Nome do item", 120),
      description: optional(item.description),
      quantity: item.quantity,
      unitPriceCents: cents(item.unitPriceCents),
    };
  });
  return {
    client: { ...client },
    items,
    totalCents: items.reduce(
      (sum, i) => sum + i.quantity * i.unitPriceCents,
      0,
    ),
    notes: optional(payload.notes),
  };
}
export function createQuote(w, payload) {
  limited(w.quotes, 200);
  const q = {
    id: randomUUID(),
    number: `PROP-${String(++w.sequence).padStart(4, "0")}`,
    revision: 1,
    status: "draft",
    ...content(w, payload),
    share: null,
    revisions: [],
    history: [],
    createdAt: new Date().toISOString(),
  };
  event(q, "Rascunho criado");
  w.quotes.unshift(q);
  return q;
}
export function updateQuote(w, id, payload) {
  const q = quoteById(w, id);
  if (q.status !== "draft")
    fail("Crie uma nova revisão para editar uma proposta enviada.", 409);
  Object.assign(q, content(w, payload));
  event(q, "Rascunho atualizado");
  return q;
}
export function transitionQuote(w, id, status) {
  const q = quoteById(w, id);
  if (
    !(q.status === "draft" && status === "sent") &&
    !(q.status === "sent" && ["approved", "rejected"].includes(status))
  )
    fail("Transição de status inválida.", 409);
  q.status = status;
  event(
    q,
    {
      sent: "Proposta enviada",
      approved: "Aprovada pela equipe",
      rejected: "Recusada pela equipe",
    }[status],
  );
  return q;
}
export function reviseQuote(w, id) {
  const q = quoteById(w, id);
  if (q.status === "draft") fail("Esta proposta já está em rascunho.", 409);
  if (q.revisions.length >= 20) fail("Limite de revisões atingido.", 409);
  const { revision, status, items, client, totalCents, notes, updatedAt } = q;
  q.revisions.push(
    structuredClone({
      revision,
      status,
      items,
      client,
      totalCents,
      notes,
      updatedAt,
    }),
  );
  q.revision++;
  q.status = "draft";
  q.share = null;
  event(q, `Revisão ${q.revision} criada`);
  return q;
}
export function shareQuote(w, id, hash, expiresAt) {
  const q = quoteById(w, id);
  if (q.status !== "sent") fail("Envie a proposta antes de compartilhar.", 409);
  q.share = {
    hash,
    expiresAt: new Date(expiresAt).toISOString(),
    revision: q.revision,
  };
  event(q, "Link de revisão criado");
  return q;
}
export function revokeShare(w, id) {
  const q = quoteById(w, id);
  q.share = null;
  event(q, "Link público revogado");
  return q;
}
function sharedQuote(w, hash) {
  const q =
    w.quotes.find((q) => q.share?.hash === hash) ||
    fail("Proposta indisponível ou link revogado.", 404);
  if (new Date(q.share.expiresAt).getTime() <= Date.now())
    fail("Este link expirou.", 410);
  if (q.share.revision !== q.revision || q.status === "draft")
    fail("Revisão indisponível.", 410);
  return q;
}
export function publicQuote(w, hash) {
  const q = sharedQuote(w, hash);
  return {
    number: q.number,
    revision: q.revision,
    status: q.status,
    client: { name: q.client.name, company: q.client.company },
    items: q.items.map(({ name, description, quantity, unitPriceCents }) => ({
      name,
      description,
      quantity,
      unitPriceCents,
    })),
    notes: q.notes,
    totalCents: q.totalCents,
    createdAt: q.createdAt,
    expiresAt: q.share.expiresAt,
  };
}
export function decideQuote(w, hash, status) {
  if (!["approved", "rejected"].includes(status)) fail("Decisão inválida.");
  const q = sharedQuote(w, hash);
  if (q.status === status) return q;
  if (q.status !== "sent") fail("Esta revisão já possui uma decisão.", 409);
  q.status = status;
  event(
    q,
    status === "approved" ? "Aprovada pelo cliente" : "Recusada pelo cliente",
  );
  return q;
}
export function seedWorkspace(id, name = "Estúdio de demonstração") {
  const w = {
    _id: id,
    name,
    version: 0,
    sequence: 0,
    clients: [],
    products: [],
    quotes: [],
  };
  const names = [
    ["Marina Costa", "Ateliê Aurora", "marina@example.com"],
    ["Rafael Lima", "Norte Arquitetura", "rafael@example.com"],
    ["Camila Rocha", "Clínica Horizonte", "camila@example.com"],
  ];
  names.forEach(([name, company, email]) =>
    addClient(w, { name, company, email }),
  );
  addProduct(w, {
    name: "Design e desenvolvimento web",
    description: "Interface responsiva, desenvolvimento e publicação.",
    unitPriceCents: 480000,
  });
  addProduct(w, {
    name: "Manutenção mensal",
    description: "Acompanhamento e melhorias contínuas.",
    unitPriceCents: 85000,
  });
  addProduct(w, {
    name: "Identidade visual",
    description: "Direção de arte e sistema visual.",
    unitPriceCents: 220000,
  });
  for (let i = 0; i < 3; i++) {
    const p = w.products[i];
    const q = createQuote(w, {
      clientId: w.clients[i].id,
      notes: "Dados fictícios para explorar o fluxo comercial.",
      items: [
        {
          productId: p.id,
          name: p.name,
          description: p.description,
          quantity: 1,
          unitPriceCents: p.unitPriceCents,
        },
      ],
    });
    transitionQuote(w, q.id, "sent");
    if (i !== 1) transitionQuote(w, q.id, i === 0 ? "approved" : "rejected");
  }
  return w;
}

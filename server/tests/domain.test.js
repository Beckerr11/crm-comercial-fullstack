import test from "node:test";
import assert from "node:assert/strict";
import * as domain from "../domain.js";

function fixture() {
  assert.equal(
    typeof domain.seedWorkspace,
    "function",
    "workspace domain is implemented",
  );
  const w = domain.seedWorkspace("w-test");
  return {
    w,
    input: {
      clientId: w.clients[0].id,
      notes: "Entrega em duas etapas",
      items: [
        {
          productId: w.products[0].id,
          name: "Interface",
          quantity: 3,
          unitPriceCents: 1999,
        },
      ],
    },
  };
}
test("quote totals use integer cents and freeze client snapshot", () => {
  const { w, input } = fixture();
  const q = domain.createQuote(w, input);
  assert.equal(q.totalCents, 5997);
  const oldName = q.client.name;
  w.clients[0].name = "Nome alterado";
  w.products[0].unitPriceCents = 900000;
  assert.equal(q.client.name, oldName);
  assert.equal(q.items[0].unitPriceCents, 1999);
});
test("rejects invalid money, quantity and a client outside workspace", () => {
  const { w, input } = fixture();
  for (const item of [
    { quantity: 0, unitPriceCents: 1 },
    { quantity: 1, unitPriceCents: -1 },
    { quantity: 1, unitPriceCents: 1.2 },
  ]) {
    assert.throws(
      () =>
        domain.createQuote(w, { ...input, items: [{ name: "Item", ...item }] }),
      /inválid|inteir|quantidade|valor/i,
    );
  }
  assert.throws(
    () => domain.createQuote(w, { ...input, clientId: "other" }),
    /Cliente/,
  );
});
test("sent quote cannot be overwritten and revision invalidates sharing", () => {
  const { w, input } = fixture();
  const q = domain.createQuote(w, input);
  domain.transitionQuote(w, q.id, "sent");
  domain.shareQuote(w, q.id, "token-hash", new Date(Date.now() + 10000));
  assert.throws(() => domain.updateQuote(w, q.id, input), /revisão/);
  domain.reviseQuote(w, q.id);
  assert.equal(q.revision, 2);
  assert.equal(q.status, "draft");
  assert.equal(q.share, null);
  assert.equal(q.revisions[0].totalCents, 5997);
});
test("public decision is idempotent and rejects contradictory acceptance", () => {
  const { w, input } = fixture();
  const q = domain.createQuote(w, input);
  domain.transitionQuote(w, q.id, "sent");
  domain.shareQuote(w, q.id, "abc", new Date(Date.now() + 10000));
  domain.decideQuote(w, "abc", "approved");
  const count = q.history.length;
  domain.decideQuote(w, "abc", "approved");
  assert.equal(q.history.length, count);
  assert.throws(() => domain.decideQuote(w, "abc", "rejected"), /decisão/);
});
test("expired and revoked public tokens cannot read or change proposals", () => {
  const { w, input } = fixture();
  const q = domain.createQuote(w, input);
  domain.transitionQuote(w, q.id, "sent");
  domain.shareQuote(w, q.id, "expired", new Date(Date.now() - 1));
  assert.throws(
    () => domain.publicQuote(w, "expired"),
    (error) => error.status === 410,
  );
  domain.shareQuote(w, q.id, "active", new Date(Date.now() + 10000));
  domain.revokeShare(w, q.id);
  assert.throws(() => domain.publicQuote(w, "active"), /disponível/);
});
test("cannot delete referenced client but removed catalog does not change snapshot", () => {
  const { w, input } = fixture();
  const q = domain.createQuote(w, input);
  assert.throws(
    () => domain.removeEntity(w, "clients", input.clientId),
    /propostas/,
  );
  domain.removeEntity(w, "products", input.items[0].productId);
  assert.equal(q.totalCents, 5997);
});
test("public DTO excludes internal history, sharing hashes and contact details", () => {
  const { w, input } = fixture();
  const q = domain.createQuote(w, input);
  domain.transitionQuote(w, q.id, "sent");
  domain.shareQuote(w, q.id, "abc", new Date(Date.now() + 10000));
  const pub = domain.publicQuote(w, "abc");
  assert.equal(pub.client.email, undefined);
  assert.equal(pub.share, undefined);
  assert.equal(pub.history, undefined);
  assert.equal(pub.totalCents, 5997);
});

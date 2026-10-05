import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { MongoMemoryServer } from "mongodb-memory-server";
import { MongoClient } from "mongodb";
import * as api from "../app.js";
import { mutateWorkspace } from "../store.js";
let mongo, connection, db;
before(async () => {
  mongo = await MongoMemoryServer.create({ binary: { version: "8.2.6" } });
  connection = await new MongoClient(mongo.getUri()).connect();
  db = connection.db("crm_test");
});
after(async () => {
  await connection?.close();
  await mongo?.stop();
});
async function fixture() {
  assert.equal(typeof api.createApp, "function", "HTTP API is implemented");
  const app = await api.createApp(db, {
    origin: "http://localhost:5173",
    secure: false,
  });
  const agent = request.agent(app);
  const session = await agent.post("/api/demo").send({});
  assert.equal(session.status, 201);
  return {
    app,
    agent,
    csrf: session.body.csrf,
    w: (await agent.get("/api/workspace")).body,
  };
}
function command(f, method, path, body = {}) {
  return f.agent[method](path)
    .set("x-csrf-token", f.csrf)
    .set("x-workspace-version", String(f.w.version))
    .send(body);
}
test("session guards API and CSRF rejects unauthorized writes", async () => {
  const f = await fixture();
  assert.equal((await request(f.app).get("/api/workspace")).status, 401);
  assert.equal(
    (await f.agent.post("/api/clients").send({ name: "Intruso" })).status,
    403,
  );
  assert.equal(
    (
      await f.agent
        .post("/api/clients")
        .set("x-csrf-token", f.csrf)
        .set("Origin", "https://evil.example")
        .send({ name: "Intruso" })
    ).status,
    403,
  );
});
test("workspaces cannot change each other and records survive application recreation", async () => {
  const a = await fixture(),
    b = await fixture();
  const created = await command(a, "post", "/api/clients", {
    name: "Cliente persistente",
    email: "persist@example.com",
  });
  assert.equal(created.status, 201);
  assert.equal(
    (
      await command(b, "put", `/api/clients/${created.body.item.id}`, {
        name: "Outro",
      })
    ).status,
    404,
  );
  const reopened = await api.createApp(db, { secure: false });
  const persisted = await db.collection("workspaces").findOne({ _id: a.w._id });
  assert.equal(persisted.clients.at(-1).name, "Cliente persistente");
  assert.equal((await request(reopened).get("/health")).status, 200);
});
test("aggregate storage limit rejects a change without losing prior data", async () => {
  const f = await fixture();
  await assert.rejects(
    mutateWorkspace(
      db,
      f.w._id,
      (draft) => {
        draft.large = "x".repeat(8 * 1024 * 1024);
      },
      f.w.version,
    ),
    (err) => err.status === 413,
  );
  const current = (await f.agent.get("/api/workspace")).body;
  assert.equal(current.version, f.w.version);
  assert.equal(current.clients.length, 3);
});
test("shared proposal works without creator cookie and acceptance is idempotent", async () => {
  const f = await fixture();
  const created = await command(f, "post", "/api/quotes", {
    clientId: f.w.clients[0].id,
    items: [{ name: "Projeto", quantity: 3, unitPriceCents: 1999 }],
  });
  assert.equal(created.status, 201);
  f.w = created.body.workspace;
  const id = created.body.item.id;
  const sent = await command(f, "post", `/api/quotes/${id}/send`);
  f.w = sent.body.workspace;
  assert.equal(sent.status, 200);
  const shared = await command(f, "post", `/api/quotes/${id}/share`, {
    days: 7,
  });
  assert.equal(shared.status, 200);
  f.w = shared.body.workspace;
  const publicPath = `/api/public/${shared.body.token}`;
  assert.equal((await request(f.app).get(publicPath)).body.totalCents, 5997);
  const accepted = await request(f.app)
    .post(`${publicPath}/decision`)
    .send({ status: "approved" });
  assert.equal(accepted.status, 200);
  const decidedVersion = (await f.agent.get("/api/workspace")).body.version;
  assert.equal(
    (
      await request(f.app)
        .post(`${publicPath}/decision`)
        .send({ status: "approved" })
    ).status,
    200,
  );
  assert.equal(
    (
      await request(f.app)
        .post(`${publicPath}/decision`)
        .send({ status: "rejected" })
    ).status,
    409,
  );
  f.w = (await f.agent.get("/api/workspace")).body;
  assert.equal(
    f.w.version,
    decidedVersion,
    "replaying a decision must not invalidate an unrelated pending edit",
  );
  assert.equal(
    f.w.quotes[0].history.filter((e) => e.label === "Aprovada pelo cliente")
      .length,
    1,
  );
  assert.equal(
    (await command(f, "post", `/api/quotes/${id}/revise`)).status,
    200,
  );
  assert.equal((await request(f.app).get(publicPath)).status, 404);
});
test("stale writes cannot overwrite a newer change", async () => {
  const f = await fixture();
  assert.equal(
    (await command(f, "post", "/api/clients", { name: "Primeiro" })).status,
    201,
  );
  assert.equal(
    (await command(f, "post", "/api/clients", { name: "Segundo" })).status,
    409,
  );
});
test("real accounts login with hashed password and expired session is rejected", async () => {
  const f = await fixture(),
    email = `user-${Date.now()}@example.com`;
  const agent = request.agent(f.app);
  assert.equal(
    (
      await agent
        .post("/api/auth/register")
        .send({ name: "Douglas", email, password: "UmaSenhaLonga123!" })
    ).status,
    201,
  );
  assert.equal(
    (
      await request(f.app)
        .post("/api/auth/login")
        .send({ email, password: "errada" })
    ).status,
    401,
  );
  const user = await db.collection("users").findOne({ email });
  assert.notEqual(user.passwordHash, "UmaSenhaLonga123!");
  assert.equal(
    (
      await agent
        .post("/api/auth/login")
        .send({ email, password: "UmaSenhaLonga123!" })
    ).status,
    200,
  );
  await db
    .collection("sessions")
    .updateMany(
      { workspaceId: user.workspaceId },
      { $set: { expiresAt: new Date(0) } },
    );
  assert.equal((await agent.get("/api/workspace")).status, 401);
});

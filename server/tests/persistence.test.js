import test from "node:test";
import assert from "node:assert/strict";
import { mkdir, mkdtemp, rm } from "node:fs/promises";
import path from "node:path";
import { MongoMemoryServer } from "mongodb-memory-server";
import { MongoClient } from "mongodb";
import request from "supertest";
import { createApp } from "../app.js";
test("account, session and client survive an actual MongoDB process restart", async (t) => {
  const parent = path.resolve("work/test-databases");
  await mkdir(parent, { recursive: true });
  const dbPath = await mkdtemp(path.join(parent, "persist-"));
  let mongo, connection;
  t.after(async () => {
    await connection?.close();
    await mongo?.stop({ doCleanup: false });
    assert.equal(path.dirname(dbPath), parent);
    await rm(dbPath, { recursive: true, force: true });
  });
  const start = async () => {
    mongo = await MongoMemoryServer.create({
      binary: { version: "8.2.6" },
      instance: { dbPath, storageEngine: "wiredTiger" },
    });
    connection = await new MongoClient(mongo.getUri()).connect();
    return createApp(connection.db("persistence_test"));
  };
  const first = await start();
  const registered = await request(first).post("/api/auth/register").send({
    name: "Teste persistência",
    email: "persistent@example.com",
    password: "SenhaDeTeste12345!",
  });
  assert.equal(registered.status, 201);
  const cookie = registered.headers["set-cookie"][0].split(";")[0];
  const w = (await request(first).get("/api/workspace").set("Cookie", cookie))
    .body;
  assert.equal(
    (
      await request(first)
        .post("/api/clients")
        .set("Cookie", cookie)
        .set("x-csrf-token", registered.body.csrf)
        .set("x-workspace-version", String(w.version))
        .send({ name: "Persistência real" })
    ).status,
    201,
  );
  await connection.close();
  await mongo.stop({ doCleanup: false });
  const second = await start();
  const reopened = await request(second)
    .get("/api/workspace")
    .set("Cookie", cookie);
  assert.equal(reopened.status, 200);
  assert.equal(reopened.body.clients[0].name, "Persistência real");
  assert.equal(
    (
      await request(second).post("/api/auth/login").send({
        email: "persistent@example.com",
        password: "SenhaDeTeste12345!",
      })
    ).status,
    200,
  );
});

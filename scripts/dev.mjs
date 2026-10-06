import { MongoMemoryServer } from "mongodb-memory-server";
import { MongoClient } from "mongodb";
import { createApp } from "../server/app.js";
import { createServer } from "vite";
import { mkdir } from "node:fs/promises";
import path from "node:path";
let mongo;
const dbPath = path.resolve("work/data");
await mkdir(dbPath, { recursive: true });
const uri =
  process.env.MONGODB_URI ||
  (mongo = await MongoMemoryServer.create({
    binary: { version: "8.2.6" },
    instance: { dbPath, storageEngine: "wiredTiger", port: 27119 },
  })).getUri();
const connection = await new MongoClient(uri).connect();
const app = await createApp(connection.db("crm_comercial"), {
  origin: "http://localhost:5173",
  secure: false,
});
const api = app.listen(4310, "127.0.0.1");
const vite = await createServer({
  server: {
    host: "127.0.0.1",
    port: 5173,
    strictPort: true,
    proxy: {
      "/api": "http://127.0.0.1:4310",
      "/health": "http://127.0.0.1:4310",
    },
  },
});
await vite.listen();
console.log("CRM: http://localhost:5173 | MongoDB persistente: work/data");
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, async () => {
    await vite.close();
    await new Promise((resolve) => api.close(resolve));
    await connection.close();
    await mongo?.stop({ doCleanup: false });
    process.exit(0);
  });

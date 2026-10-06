import { MongoClient } from "mongodb";
import { createApp } from "./app.js";
import path from "node:path";
import express from "express";
if (!process.env.MONGODB_URI)
  throw new Error("Configure MONGODB_URI para iniciar o servidor.");
if (
  process.env.NODE_ENV === "production" &&
  !process.env.APP_ORIGIN?.startsWith("https://")
)
  throw new Error("Configure APP_ORIGIN com a origem HTTPS pública.");
const connection = await new MongoClient(process.env.MONGODB_URI).connect();
const app = await createApp(
  connection.db(process.env.MONGODB_DATABASE || "crm_comercial"),
  {
    origin: process.env.APP_ORIGIN || "http://localhost:5173",
    secure: process.env.NODE_ENV === "production",
  },
);
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.resolve("dist")));
  app.get("/{*path}", (_req, res) =>
    res.sendFile(path.resolve("dist/index.html")),
  );
}
const port = Number(process.env.PORT || 4310);
const host = process.env.HOST || "0.0.0.0";
const server = app.listen(port, host, () =>
  console.log(`CRM API disponível na porta ${port}`),
);
for (const signal of ["SIGTERM", "SIGINT"])
  process.on(signal, () =>
    server.close(async () => {
      await connection.close();
      process.exit(0);
    }),
  );

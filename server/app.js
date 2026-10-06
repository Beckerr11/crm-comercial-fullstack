import express from "express";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import {
  createHash,
  randomBytes,
  randomUUID,
  scrypt,
  timingSafeEqual,
} from "node:crypto";
import { promisify } from "node:util";
import * as domain from "./domain.js";
import {
  initializeDatabase,
  readWorkspace,
  mutateWorkspace,
  workspaceView,
} from "./store.js";
const deriveKey = promisify(scrypt);
const hash = (value) => createHash("sha256").update(value).digest("hex");
const token = () => randomBytes(32).toString("hex");
const cookieName = "crm.sid";
const registration = z
  .object({
    name: z.string().trim().min(2).max(120),
    email: z
      .email()
      .max(200)
      .transform((v) => v.toLowerCase()),
    password: z.string().min(12).max(128),
  })
  .strict();
const login = registration
  .pick({ email: true })
  .extend({ password: z.string().min(1).max(128) })
  .strict();
const error = (message, status) => {
  throw new domain.DomainError(message, status);
};

export async function createApp(
  db,
  { origin = "http://localhost:5173", secure = false } = {},
) {
  db = db.client.db(db.databaseName, { writeConcern: { w: 1, j: true } });
  await initializeDatabase(db);
  const app = express();
  app.disable("x-powered-by");
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", "data:"],
          connectSrc: ["'self'"],
          fontSrc: ["'self'"],
          upgradeInsecureRequests: secure ? [] : null,
        },
      },
    }),
  );
  app.use(express.json({ limit: "128kb" }));
  app.use(cookieParser());
  app.use("/api", (_req, res, next) => {
    res.set("Cache-Control", "no-store");
    next();
  });
  app.use(
    "/api",
    rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 500,
      standardHeaders: "draft-8",
      legacyHeaders: false,
      message: { error: "Muitas solicitações. Aguarde alguns minutos." },
    }),
  );
  app.use("/api", (req, _res, next) => {
    if (
      !["GET", "HEAD", "OPTIONS"].includes(req.method) &&
      req.headers.origin &&
      req.headers.origin !== origin
    )
      return next(new domain.DomainError("Origem não autorizada.", 403));
    next();
  });
  app.get("/health", async (_req, res) => {
    await db.command({ ping: 1 });
    res.json({ ok: true, service: "crm-comercial" });
  });
  const authLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    limit: 30,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: { error: "Limite de sessões atingido. Tente mais tarde." },
  });
  async function issueSession(req, res, workspaceId, demo) {
    if (req.cookies[cookieName])
      await db
        .collection("sessions")
        .deleteOne({ _id: hash(req.cookies[cookieName]) });
    const raw = token(),
      csrf = token();
    const expiresAt = new Date(Date.now() + (demo ? 24 : 168) * 60 * 60 * 1000);
    await db
      .collection("sessions")
      .insertOne({ _id: hash(raw), workspaceId, csrf, expiresAt });
    res.cookie(cookieName, raw, {
      httpOnly: true,
      secure,
      sameSite: "lax",
      path: "/",
      expires: expiresAt,
    });
    return { csrf, demo, expiresAt };
  }
  app.post("/api/demo", authLimiter, async (req, res) => {
    const w = domain.seedWorkspace(randomUUID());
    w.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await db.collection("workspaces").insertOne(w);
    res.status(201).json(await issueSession(req, res, w._id, true));
  });
  app.post("/api/auth/register", authLimiter, async (req, res) => {
    const input = registration.parse(req.body);
    const salt = randomBytes(16).toString("hex");
    const passwordHash = (await deriveKey(input.password, salt, 64)).toString(
      "hex",
    );
    const w = {
      _id: randomUUID(),
      name: `${input.name} · Workspace`,
      version: 0,
      sequence: 0,
      clients: [],
      products: [],
      quotes: [],
    };
    await db.collection("users").insertOne({
      _id: randomUUID(),
      email: input.email,
      name: input.name,
      salt,
      passwordHash,
      workspaceId: w._id,
    });
    try {
      await db.collection("workspaces").insertOne(w);
    } catch (err) {
      await db
        .collection("users")
        .deleteOne({ email: input.email, workspaceId: w._id });
      throw err;
    }
    res.status(201).json(await issueSession(req, res, w._id, false));
  });
  app.post("/api/auth/login", authLimiter, async (req, res) => {
    const input = login.parse(req.body);
    const u = await db.collection("users").findOne({ email: input.email });
    const candidate = await deriveKey(
      input.password,
      u?.salt || "dummy-salt-for-timing",
      64,
    );
    if (!u || !timingSafeEqual(candidate, Buffer.from(u.passwordHash, "hex")))
      error("E-mail ou senha incorretos.", 401);
    await readWorkspace(db, u.workspaceId);
    res.json(await issueSession(req, res, u.workspaceId, false));
  });
  app.use("/api", async (req, _res, next) => {
    if (req.path.startsWith("/public/")) return next();
    const raw = req.cookies[cookieName];
    const session =
      typeof raw === "string" &&
      (await db
        .collection("sessions")
        .findOne({ _id: hash(raw), expiresAt: { $gt: new Date() } }));
    if (!session)
      return next(
        new domain.DomainError("Sua sessão terminou. Entre novamente.", 401),
      );
    req.crmSession = session;
    await readWorkspace(db, session.workspaceId);
    if (!["GET", "HEAD"].includes(req.method)) {
      const supplied = req.headers["x-csrf-token"];
      if (
        typeof supplied !== "string" ||
        supplied.length !== session.csrf.length ||
        !timingSafeEqual(Buffer.from(supplied), Buffer.from(session.csrf))
      )
        return next(
          new domain.DomainError(
            "Solicitação não autorizada. Atualize a sessão.",
            403,
          ),
        );
    }
    next();
  });
  app.get("/api/session", async (req, res) => {
    const w = await readWorkspace(db, req.crmSession.workspaceId);
    res.json({
      csrf: req.crmSession.csrf,
      name: w.name,
      demo: Boolean(w.expiresAt),
      expiresAt: req.crmSession.expiresAt,
    });
  });
  app.post("/api/logout", async (req, res) => {
    await db.collection("sessions").deleteOne({ _id: req.crmSession._id });
    res.clearCookie(cookieName, { path: "/", secure, sameSite: "lax" });
    res.json({ ok: true });
  });
  app.get("/api/workspace", async (req, res) =>
    res.json(
      workspaceView(await readWorkspace(db, req.crmSession.workspaceId)),
    ),
  );
  async function command(req, res, operation, status = 200, extras = {}) {
    const value = req.headers["x-workspace-version"];
    if (typeof value !== "string" || !/^\d+$/.test(value))
      error("Atualize os dados antes de salvar.", 409);
    const result = await mutateWorkspace(
      db,
      req.crmSession.workspaceId,
      operation,
      Number(value),
    );
    res.status(status).json({
      workspace: workspaceView(result.workspace),
      item: result.item ? { ...result.item, share: undefined } : null,
      ...extras,
    });
  }
  app.post("/api/reset", async (req, res) => {
    const w = await readWorkspace(db, req.crmSession.workspaceId);
    if (!w.expiresAt)
      error("Restauração disponível apenas para a demonstração.", 403);
    await command(req, res, (draft) => {
      const seeded = domain.seedWorkspace(draft._id);
      Object.assign(draft, seeded, {
        version: draft.version,
        expiresAt: draft.expiresAt,
      });
    });
  });
  for (const [collection, add, update] of [
    ["clients", domain.addClient, domain.updateClient],
    ["products", domain.addProduct, domain.updateProduct],
  ]) {
    app.post(`/api/${collection}`, (req, res) =>
      command(req, res, (w) => add(w, req.body), 201),
    );
    app.put(`/api/${collection}/:id`, (req, res) =>
      command(req, res, (w) => update(w, req.params.id, req.body)),
    );
    app.delete(`/api/${collection}/:id`, (req, res) =>
      command(req, res, (w) =>
        domain.removeEntity(w, collection, req.params.id),
      ),
    );
  }
  app.post("/api/quotes", (req, res) =>
    command(req, res, (w) => domain.createQuote(w, req.body), 201),
  );
  app.put("/api/quotes/:id", (req, res) =>
    command(req, res, (w) => domain.updateQuote(w, req.params.id, req.body)),
  );
  app.post("/api/quotes/:id/send", (req, res) =>
    command(req, res, (w) => domain.transitionQuote(w, req.params.id, "sent")),
  );
  app.post("/api/quotes/:id/decision", (req, res) =>
    command(req, res, (w) =>
      domain.transitionQuote(w, req.params.id, req.body.status),
    ),
  );
  app.post("/api/quotes/:id/revise", (req, res) =>
    command(req, res, (w) => domain.reviseQuote(w, req.params.id)),
  );
  app.post("/api/quotes/:id/revoke", (req, res) =>
    command(req, res, (w) => domain.revokeShare(w, req.params.id)),
  );
  app.post("/api/quotes/:id/share", (req, res) => {
    const days = z
        .number()
        .int()
        .min(1)
        .max(30)
        .parse(req.body.days ?? 7),
      raw = token();
    return command(
      req,
      res,
      (w) =>
        domain.shareQuote(
          w,
          req.params.id,
          hash(raw),
          new Date(Date.now() + days * 86400000),
        ),
      200,
      { token: raw },
    );
  });
  async function publicWorkspace(raw) {
    if (!/^[a-f0-9]{64}$/.test(raw)) error("Link indisponível.", 404);
    const w = await db
      .collection("workspaces")
      .findOne({ "quotes.share.hash": hash(raw) });
    if (!w) error("Proposta indisponível ou link revogado.", 404);
    return readWorkspace(db, w._id);
  }
  app.get("/api/public/:token", async (req, res) =>
    res.json(
      domain.publicQuote(
        await publicWorkspace(req.params.token),
        hash(req.params.token),
      ),
    ),
  );
  app.post("/api/public/:token/decision", async (req, res) => {
    const w = await publicWorkspace(req.params.token);
    const result = await mutateWorkspace(db, w._id, (draft) =>
      domain.decideQuote(draft, hash(req.params.token), req.body.status),
    );
    res.json(domain.publicQuote(result.workspace, hash(req.params.token)));
  });
  app.use("/api", (_req, res) =>
    res.status(404).json({ error: "Rota não encontrada." }),
  );
  app.use((err, _req, res, _next) => {
    const status =
      err instanceof z.ZodError
        ? 400
        : err.code === 11000
          ? 409
          : err.status || 500;
    res.status(status).json({
      error:
        err instanceof z.ZodError
          ? "Revise os campos informados."
          : err.code === 11000
            ? "Este e-mail já está cadastrado."
            : status < 500
              ? err.message
              : "Não foi possível concluir a operação. Tente novamente.",
    });
  });
  return app;
}

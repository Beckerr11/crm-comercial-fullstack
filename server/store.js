import { DomainError } from "./domain.js";
import { BSON } from "mongodb";
import { isDeepStrictEqual } from "node:util";
export async function initializeDatabase(db) {
  await db
    .collection("workspaces")
    .createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
  await db
    .collection("sessions")
    .createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
  await db.collection("users").createIndex({ email: 1 }, { unique: true });
  await db.collection("workspaces").createIndex({ "quotes.share.hash": 1 });
}
export async function readWorkspace(db, id) {
  const w = await db.collection("workspaces").findOne({ _id: id });
  if (!w || (w.expiresAt && w.expiresAt <= new Date()))
    throw new DomainError(
      "Workspace expirado. Inicie outra demonstração.",
      401,
    );
  return w;
}
export async function mutateWorkspace(db, id, operation, expectedVersion) {
  for (let attempt = 0; attempt < 5; attempt++) {
    const w = await readWorkspace(db, id);
    if (expectedVersion !== undefined && w.version !== expectedVersion)
      throw new DomainError(
        "Os dados mudaram. Atualize a página antes de tentar novamente.",
        409,
      );
    const draft = structuredClone(w);
    const item = operation(draft);
    if (isDeepStrictEqual(w, draft)) return { workspace: w, item };
    draft.version = w.version + 1;
    if (BSON.calculateObjectSize(draft) > 8 * 1024 * 1024)
      throw new DomainError(
        "Limite de armazenamento do workspace atingido. Reduza o conteúdo antes de salvar.",
        413,
      );
    const result = await db
      .collection("workspaces")
      .replaceOne({ _id: id, version: w.version }, draft);
    if (result.modifiedCount) return { workspace: draft, item };
  }
  throw new DomainError("Alteração concorrente. Tente novamente.", 409);
}
export function workspaceView(w) {
  return {
    _id: w._id,
    name: w.name,
    demo: Boolean(w.expiresAt),
    expiresAt: w.expiresAt,
    version: w.version,
    clients: w.clients,
    products: w.products,
    quotes: w.quotes.map((q) => ({
      ...q,
      share: q.share
        ? { expiresAt: q.share.expiresAt, revision: q.share.revision }
        : null,
    })),
  };
}

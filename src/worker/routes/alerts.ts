import { Hono } from "hono";
import type {
  GeneratorCategoryAlert,
  StorageLimitAlert,
} from "@shared/types";
import { HttpError } from "../middleware/error";
import { idParam } from "../schemas/common";

const alerts = new Hono<{ Bindings: Env }>();

const nowIso = (): string => new Date().toISOString();

alerts.get("/category", async (c) => {
  const unack = c.req.query("unack") === "1";
  const generatorId = c.req.query("generator_id");

  const filters: string[] = [];
  const binds: (string | number)[] = [];
  if (unack) filters.push("acknowledged = 0");
  if (generatorId) {
    filters.push("generator_id = ?");
    binds.push(Number(generatorId));
  }
  const where = filters.length ? `WHERE ${filters.join(" AND ")}` : "";

  const { results } = await c.env.DB.prepare(
    `SELECT * FROM generator_category_alert ${where} ORDER BY created_at DESC`
  )
    .bind(...binds)
    .all<GeneratorCategoryAlert>();
  return c.json(results ?? []);
});

alerts.post("/category/:id/acknowledge", async (c) => {
  const { id } = idParam.parse(c.req.param());
  const now = nowIso();
  const updated = await c.env.DB.prepare(
    `UPDATE generator_category_alert
     SET acknowledged = 1, acknowledged_at = ?
     WHERE id = ?
     RETURNING *`
  )
    .bind(now, id)
    .first<GeneratorCategoryAlert>();
  if (!updated) throw new HttpError(404, "Alerta no encontrada");
  return c.json(updated);
});

alerts.get("/storage", async (c) => {
  const open = c.req.query("open") === "1";
  const generatorId = c.req.query("generator_id");

  const filters: string[] = [];
  const binds: (string | number)[] = [];
  if (open) filters.push("resolved = 0");
  if (generatorId) {
    filters.push("generator_id = ?");
    binds.push(Number(generatorId));
  }
  const where = filters.length ? `WHERE ${filters.join(" AND ")}` : "";

  const { results } = await c.env.DB.prepare(
    `SELECT * FROM storage_limit_alert ${where} ORDER BY deadline_date ASC`
  )
    .bind(...binds)
    .all<StorageLimitAlert>();
  return c.json(results ?? []);
});

alerts.post("/storage/:id/resolve", async (c) => {
  const { id } = idParam.parse(c.req.param());
  const now = nowIso();
  const updated = await c.env.DB.prepare(
    `UPDATE storage_limit_alert
     SET resolved = 1, resolved_at = ?
     WHERE id = ?
     RETURNING *`
  )
    .bind(now, id)
    .first<StorageLimitAlert>();
  if (!updated) throw new HttpError(404, "Alerta no encontrada");
  return c.json(updated);
});

export default alerts;

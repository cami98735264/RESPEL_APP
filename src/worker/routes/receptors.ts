import { Hono } from "hono";
import type { AuthorizedReceptor } from "@shared/types";
import { HttpError } from "../middleware/error";
import { idParam } from "../schemas/common";
import {
  createReceptorSchema,
  updateReceptorSchema,
} from "../schemas/receptor";

const receptors = new Hono<{ Bindings: Env }>();

const nowIso = (): string => new Date().toISOString();

receptors.get("/", async (c) => {
  const activeOnly = c.req.query("active") === "1";
  const sql = activeOnly
    ? "SELECT * FROM authorized_receptor WHERE is_active = 1 ORDER BY legal_name"
    : "SELECT * FROM authorized_receptor ORDER BY legal_name";
  const { results } = await c.env.DB.prepare(sql).all<AuthorizedReceptor>();
  return c.json(results ?? []);
});

receptors.get("/:id", async (c) => {
  const { id } = idParam.parse(c.req.param());
  const row = await c.env.DB.prepare(
    "SELECT * FROM authorized_receptor WHERE id = ?"
  )
    .bind(id)
    .first<AuthorizedReceptor>();
  if (!row) throw new HttpError(404, "Receptor not found");
  return c.json(row);
});

receptors.post("/", async (c) => {
  const body = createReceptorSchema.parse(await c.req.json());
  const now = nowIso();
  const inserted = await c.env.DB.prepare(
    `INSERT INTO authorized_receptor
      (legal_name, nit, license_number, license_expiry, allowed_activities,
       address, contact_phone, contact_email, authority_id, is_active,
       created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     RETURNING *`
  )
    .bind(
      body.legal_name,
      body.nit,
      body.license_number,
      body.license_expiry ?? null,
      body.allowed_activities ?? null,
      body.address ?? null,
      body.contact_phone ?? null,
      body.contact_email ?? null,
      body.authority_id,
      body.is_active ?? 1,
      now,
      now
    )
    .first<AuthorizedReceptor>();
  return c.json(inserted, 201);
});

receptors.patch("/:id", async (c) => {
  const { id } = idParam.parse(c.req.param());
  const body = updateReceptorSchema.parse(await c.req.json());
  const fields = Object.entries(body).filter(([, v]) => v !== undefined);
  if (fields.length === 0) throw new HttpError(400, "No fields to update");
  const now = nowIso();
  const setSql = fields.map(([k]) => `${k} = ?`).join(", ");
  const values = fields.map(([, v]) => v as string | number | null);
  const updated = await c.env.DB.prepare(
    `UPDATE authorized_receptor SET ${setSql}, updated_at = ? WHERE id = ? RETURNING *`
  )
    .bind(...values, now, id)
    .first<AuthorizedReceptor>();
  if (!updated) throw new HttpError(404, "Receptor not found");
  return c.json(updated);
});

receptors.delete("/:id", async (c) => {
  const { id } = idParam.parse(c.req.param());
  const result = await c.env.DB.prepare(
    "DELETE FROM authorized_receptor WHERE id = ?"
  )
    .bind(id)
    .run();
  if (result.meta.changes === 0) {
    throw new HttpError(404, "Receptor not found");
  }
  return c.body(null, 204);
});

export default receptors;

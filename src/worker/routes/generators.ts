import { Hono } from "hono";
import type { Generator } from "@shared/types";
import { HttpError } from "../middleware/error";
import { idParam } from "../schemas/common";
import {
  createGeneratorSchema,
  updateGeneratorSchema,
} from "../schemas/generator";

const generators = new Hono<{ Bindings: Env }>();

const nowIso = (): string => new Date().toISOString();

generators.get("/", async (c) => {
  const { results } = await c.env.DB.prepare(
    "SELECT * FROM generator ORDER BY id"
  ).all<Generator>();
  return c.json(results ?? []);
});

generators.get("/default", async (c) => {
  const id = Number(c.env.DEFAULT_GENERATOR_ID);
  if (!Number.isFinite(id) || id <= 0) {
    throw new HttpError(500, "DEFAULT_GENERATOR_ID no esta configurado");
  }
  const row = await c.env.DB.prepare("SELECT * FROM generator WHERE id = ?")
    .bind(id)
    .first<Generator>();
  if (!row) throw new HttpError(404, "Generador por defecto no encontrado");
  return c.json(row);
});

generators.get("/:id", async (c) => {
  const { id } = idParam.parse(c.req.param());
  const row = await c.env.DB.prepare("SELECT * FROM generator WHERE id = ?")
    .bind(id)
    .first<Generator>();
  if (!row) throw new HttpError(404, "Generador no encontrado");
  return c.json(row);
});

generators.post("/", async (c) => {
  const body = createGeneratorSchema.parse(await c.req.json());
  const now = nowIso();
  const inserted = await c.env.DB.prepare(
    `INSERT INTO generator
      (legal_name, nit, address, municipality, department,
       contact_phone, contact_email, authority_id,
       registration_code, registered_at, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     RETURNING *`
  )
    .bind(
      body.legal_name,
      body.nit,
      body.address,
      body.municipality,
      body.department,
      body.contact_phone ?? null,
      body.contact_email ?? null,
      body.authority_id,
      body.registration_code ?? null,
      body.registered_at ?? null,
      now,
      now
    )
    .first<Generator>();
  return c.json(inserted, 201);
});

generators.patch("/:id", async (c) => {
  const { id } = idParam.parse(c.req.param());
  const body = updateGeneratorSchema.parse(await c.req.json());
  const fields = Object.entries(body).filter(([, v]) => v !== undefined);
  if (fields.length === 0) {
    throw new HttpError(400, "No hay campos para actualizar");
  }
  const now = nowIso();
  const setSql = fields.map(([k]) => `${k} = ?`).join(", ");
  const values = fields.map(([, v]) => v as string | number | null);
  const updated = await c.env.DB.prepare(
    `UPDATE generator SET ${setSql}, updated_at = ? WHERE id = ? RETURNING *`
  )
    .bind(...values, now, id)
    .first<Generator>();
  if (!updated) throw new HttpError(404, "Generador no encontrado");
  return c.json(updated);
});

generators.delete("/:id", async (c) => {
  const { id } = idParam.parse(c.req.param());
  const result = await c.env.DB.prepare(
    "DELETE FROM generator WHERE id = ?"
  )
    .bind(id)
    .run();
  if (result.meta.changes === 0) {
    throw new HttpError(404, "Generador no encontrado");
  }
  return c.body(null, 204);
});

export default generators;

import { Hono } from "hono";
import type { Waste, WasteWithHazard } from "@shared/types";
import { HttpError } from "../middleware/error";
import { idParam } from "../schemas/common";
import { createWasteSchema, updateWasteSchema } from "../schemas/waste";

const wastes = new Hono<{ Bindings: Env }>();

const nowIso = (): string => new Date().toISOString();

wastes.get("/", async (c) => {
  const generatorId = c.req.query("generator_id");
  const inStockOnly = c.req.query("in_stock") === "1";

  const filters: string[] = [];
  const binds: (string | number)[] = [];
  if (generatorId) {
    filters.push("w.generator_id = ?");
    binds.push(Number(generatorId));
  }
  if (inStockOnly) {
    filters.push("w.current_stock_kg > 0");
  }
  const where = filters.length ? `WHERE ${filters.join(" AND ")}` : "";

  const sql = `
    SELECT w.*, hc.code AS hazard_code, hc.name_es AS hazard_name
    FROM waste w
    JOIN hazard_characteristic hc ON hc.id = w.hazard_characteristic_id
    ${where}
    ORDER BY w.name
  `;
  const { results } = await c.env.DB.prepare(sql)
    .bind(...binds)
    .all<WasteWithHazard>();
  return c.json(results ?? []);
});

wastes.get("/:id", async (c) => {
  const { id } = idParam.parse(c.req.param());
  const row = await c.env.DB.prepare(
    `SELECT w.*, hc.code AS hazard_code, hc.name_es AS hazard_name
     FROM waste w
     JOIN hazard_characteristic hc ON hc.id = w.hazard_characteristic_id
     WHERE w.id = ?`
  )
    .bind(id)
    .first<WasteWithHazard>();
  if (!row) throw new HttpError(404, "Residuo no encontrado");
  return c.json(row);
});

wastes.post("/", async (c) => {
  const body = createWasteSchema.parse(await c.req.json());
  const now = nowIso();
  const inserted = await c.env.DB.prepare(
    `INSERT INTO waste
      (generator_id, name, hazard_characteristic_id, waste_type_id,
       current_stock_kg, notes, created_at, updated_at)
     VALUES (?, ?, ?, ?, 0, ?, ?, ?)
     RETURNING *`
  )
    .bind(
      body.generator_id,
      body.name,
      body.hazard_characteristic_id,
      body.waste_type_id ?? null,
      body.notes ?? null,
      now,
      now
    )
    .first<Waste>();
  return c.json(inserted, 201);
});

wastes.patch("/:id", async (c) => {
  const { id } = idParam.parse(c.req.param());
  const body = updateWasteSchema.parse(await c.req.json());
  const fields = Object.entries(body).filter(([, v]) => v !== undefined);
  if (fields.length === 0)
    throw new HttpError(400, "No hay campos para actualizar");
  const now = nowIso();
  const setSql = fields.map(([k]) => `${k} = ?`).join(", ");
  const values = fields.map(([, v]) => v as string | number | null);
  const updated = await c.env.DB.prepare(
    `UPDATE waste SET ${setSql}, updated_at = ? WHERE id = ? RETURNING *`
  )
    .bind(...values, now, id)
    .first<Waste>();
  if (!updated) throw new HttpError(404, "Residuo no encontrado");
  return c.json(updated);
});

wastes.delete("/:id", async (c) => {
  const { id } = idParam.parse(c.req.param());
  const inUse = await c.env.DB.prepare(
    `SELECT
       (SELECT COUNT(*) FROM waste_entry WHERE waste_id = ?) AS entries,
       (SELECT COUNT(*) FROM waste_exit  WHERE waste_id = ?) AS exits`
  )
    .bind(id, id)
    .first<{ entries: number; exits: number }>();
  if ((inUse?.entries ?? 0) + (inUse?.exits ?? 0) > 0) {
    throw new HttpError(
      422,
      "No se puede eliminar un residuo con entradas o salidas existentes",
      "waste_in_use"
    );
  }
  const result = await c.env.DB.prepare("DELETE FROM waste WHERE id = ?")
    .bind(id)
    .run();
  if (result.meta.changes === 0) throw new HttpError(404, "Residuo no encontrado");
  return c.body(null, 204);
});

export default wastes;

import { Hono } from "hono";
import type { WasteExit } from "@shared/types";
import { insertWasteExit } from "../services/stock";
import {
  createWasteExitSchema,
  listWasteExitsQuerySchema,
} from "../schemas/wasteExit";

const wasteExits = new Hono<{ Bindings: Env }>();

wasteExits.get("/", async (c) => {
  const q = listWasteExitsQuerySchema.parse(
    Object.fromEntries(new URL(c.req.url).searchParams)
  );

  const filters: string[] = [];
  const binds: (string | number)[] = [];
  if (q.generator_id) {
    filters.push("generator_id = ?");
    binds.push(q.generator_id);
  }
  if (q.waste_id) {
    filters.push("waste_id = ?");
    binds.push(q.waste_id);
  }
  if (q.receptor_id) {
    filters.push("receptor_id = ?");
    binds.push(q.receptor_id);
  }
  if (q.from) {
    filters.push("dispatched_at >= ?");
    binds.push(q.from);
  }
  if (q.to) {
    filters.push("dispatched_at <= ?");
    binds.push(q.to);
  }
  const where = filters.length ? `WHERE ${filters.join(" AND ")}` : "";
  const limit = q.limit ?? 100;

  const { results } = await c.env.DB.prepare(
    `SELECT * FROM waste_exit ${where} ORDER BY dispatched_at DESC LIMIT ?`
  )
    .bind(...binds, limit)
    .all<WasteExit>();
  return c.json(results ?? []);
});

wasteExits.post("/", async (c) => {
  const body = createWasteExitSchema.parse(await c.req.json());
  const result = await insertWasteExit(c.env.DB, body);
  return c.json(result, 201);
});

export default wasteExits;

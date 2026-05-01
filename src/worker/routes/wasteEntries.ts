import { Hono } from "hono";
import type { WasteEntry } from "@shared/types";
import { insertWasteEntry } from "../services/stock";
import {
  createWasteEntrySchema,
  listWasteEntriesQuerySchema,
} from "../schemas/wasteEntry";

const wasteEntries = new Hono<{ Bindings: Env }>();

wasteEntries.get("/", async (c) => {
  const q = listWasteEntriesQuerySchema.parse(
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
  if (q.from) {
    filters.push("recorded_at >= ?");
    binds.push(q.from);
  }
  if (q.to) {
    filters.push("recorded_at <= ?");
    binds.push(q.to);
  }
  const where = filters.length ? `WHERE ${filters.join(" AND ")}` : "";
  const limit = q.limit ?? 100;

  const { results } = await c.env.DB.prepare(
    `SELECT * FROM waste_entry ${where} ORDER BY recorded_at DESC LIMIT ?`
  )
    .bind(...binds, limit)
    .all<WasteEntry>();
  return c.json(results ?? []);
});

wasteEntries.post("/", async (c) => {
  const body = createWasteEntrySchema.parse(await c.req.json());
  const result = await insertWasteEntry(c.env.DB, body);
  return c.json(result, 201);
});

export default wasteEntries;

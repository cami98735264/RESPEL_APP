import { Hono } from "hono";
import type {
  GeneratorCategory,
  HazardCharacteristic,
  WasteType,
  EnvironmentalAuthority,
} from "@shared/types";

const lookups = new Hono<{ Bindings: Env }>();

lookups.get("/hazard-characteristics", async (c) => {
  const { results } = await c.env.DB.prepare(
    "SELECT id, code, name_es, description_es, created_at FROM hazard_characteristic ORDER BY id"
  ).all<HazardCharacteristic>();
  return c.json(results ?? []);
});

lookups.get("/generator-categories", async (c) => {
  const { results } = await c.env.DB.prepare(
    `SELECT id, code, name_es, min_kg_month, max_kg_month, registration_months
     FROM generator_category ORDER BY id`
  ).all<GeneratorCategory>();
  return c.json(results ?? []);
});

lookups.get("/waste-types", async (c) => {
  const { results } = await c.env.DB.prepare(
    "SELECT id, annex_code, description_es, source_annex, created_at FROM waste_type ORDER BY annex_code"
  ).all<WasteType>();
  return c.json(results ?? []);
});

lookups.get("/authorities", async (c) => {
  const { results } = await c.env.DB.prepare(
    "SELECT id, name, jurisdiction, created_at FROM environmental_authority ORDER BY name"
  ).all<EnvironmentalAuthority>();
  return c.json(results ?? []);
});

export default lookups;

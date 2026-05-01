import { z } from "zod";
import {
  hazardCodeSchema,
  idSchema,
  isoDateTime,
  positiveWeight,
} from "./common";

export const createWasteEntrySchema = z.object({
  generator_id: idSchema,
  name: z.string().min(1).max(200),
  hazard_code: hazardCodeSchema,
  weight_kg: positiveWeight,
  recorded_at: isoDateTime.optional(),
  sensor_reading_ref: z.string().nullable().optional(),
  source_description: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export const listWasteEntriesQuerySchema = z.object({
  generator_id: z.coerce.number().int().positive().optional(),
  waste_id: z.coerce.number().int().positive().optional(),
  from: isoDateTime.optional(),
  to: isoDateTime.optional(),
  limit: z.coerce.number().int().positive().max(500).optional(),
});

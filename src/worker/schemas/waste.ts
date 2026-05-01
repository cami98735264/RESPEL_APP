import { z } from "zod";
import { idSchema } from "./common";

export const createWasteSchema = z.object({
  generator_id: idSchema,
  name: z.string().min(1).max(200),
  hazard_characteristic_id: idSchema,
  waste_type_id: idSchema.nullable().optional(),
  notes: z.string().nullable().optional(),
});

export const updateWasteSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  hazard_characteristic_id: idSchema.optional(),
  waste_type_id: idSchema.nullable().optional(),
  notes: z.string().nullable().optional(),
});

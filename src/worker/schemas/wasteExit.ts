import { z } from "zod";
import { idSchema, isoDateTime, positiveWeight } from "./common";

export const createWasteExitSchema = z.object({
  waste_id: idSchema,
  generator_id: idSchema,
  receptor_id: idSchema,
  weight_kg: positiveWeight,
  dispatched_at: isoDateTime.optional(),
  manifesto_number: z.string().nullable().optional(),
  disposal_method: z.string().nullable().optional(),
  receptor_certificate_ref: z.string().nullable().optional(),
  certificate_issued_at: isoDateTime.nullable().optional(),
  notes: z.string().nullable().optional(),
});

export const listWasteExitsQuerySchema = z.object({
  generator_id: z.coerce.number().int().positive().optional(),
  waste_id: z.coerce.number().int().positive().optional(),
  receptor_id: z.coerce.number().int().positive().optional(),
  from: isoDateTime.optional(),
  to: isoDateTime.optional(),
  limit: z.coerce.number().int().positive().max(500).optional(),
});

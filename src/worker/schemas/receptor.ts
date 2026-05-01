import { z } from "zod";
import { boolFlag, idSchema, isoDate } from "./common";

export const createReceptorSchema = z.object({
  legal_name: z.string().min(1).max(200),
  nit: z.string().min(1).max(50),
  license_number: z.string().min(1),
  license_expiry: isoDate.nullable().optional(),
  allowed_activities: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  contact_phone: z.string().nullable().optional(),
  contact_email: z.string().email().nullable().optional(),
  authority_id: idSchema,
  is_active: boolFlag.optional(),
});

export const updateReceptorSchema = createReceptorSchema.partial();

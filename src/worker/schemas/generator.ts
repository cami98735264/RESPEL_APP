import { z } from "zod";
import { idSchema, isoDateTime } from "./common";

export const createGeneratorSchema = z.object({
  legal_name: z.string().min(1).max(200),
  nit: z.string().min(1).max(50),
  address: z.string().min(1),
  municipality: z.string().min(1),
  department: z.string().min(1),
  contact_phone: z.string().nullable().optional(),
  contact_email: z.string().email().nullable().optional(),
  authority_id: idSchema,
  registration_code: z.string().nullable().optional(),
  registered_at: isoDateTime.nullable().optional(),
});

export const updateGeneratorSchema = createGeneratorSchema.partial();

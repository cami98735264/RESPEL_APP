import { z } from "zod";
import { HAZARD_CODES, REPORT_PERIODS } from "@shared/types";

export const idParam = z.object({
  id: z.coerce.number().int().positive(),
});

export const idSchema = z.number().int().positive();
export const optionalIdSchema = z.number().int().positive().optional();

export const isoDateTime = z
  .string()
  .refine((v) => !Number.isNaN(Date.parse(v)), {
    message: "Fecha y hora ISO 8601 invalida",
  });

export const isoDate = z
  .string()
  .regex(
    /^\d{4}-\d{2}-\d{2}/,
    "Se esperaba formato AAAA-MM-DD o prefijo ISO 8601"
  );

export const hazardCodeSchema = z.enum(HAZARD_CODES);
export const reportPeriodSchema = z.enum(REPORT_PERIODS);

export const positiveWeight = z.number().positive().finite();

export const boolFlag = z.union([
  z.literal(0),
  z.literal(1),
  z.boolean().transform((b) => (b ? 1 : 0) as 0 | 1),
]);

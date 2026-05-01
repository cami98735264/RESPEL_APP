import { z } from "zod";
import { reportPeriodSchema } from "./common";

export const reportQuerySchema = z
  .object({
    generator_id: z.coerce.number().int().positive().optional(),
    period: reportPeriodSchema,
    year: z.coerce.number().int().min(2000).max(2100),
    month: z.coerce.number().int().min(1).max(12).optional(),
    day: z.coerce.number().int().min(1).max(31).optional(),
    quarter: z.coerce.number().int().min(1).max(4).optional(),
    half: z.coerce.number().int().min(1).max(2).optional(),
  })
  .superRefine((q, ctx) => {
    if (q.period === "daily" && (q.month == null || q.day == null)) {
      ctx.addIssue({
        code: "custom",
        message: "daily period requires month and day",
      });
    }
    if (q.period === "quarterly" && q.quarter == null) {
      ctx.addIssue({ code: "custom", message: "quarterly period requires quarter" });
    }
    if (q.period === "semiannual" && q.half == null) {
      ctx.addIssue({ code: "custom", message: "semiannual period requires half" });
    }
  });

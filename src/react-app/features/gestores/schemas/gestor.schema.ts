import { z } from "zod";

const optionalString = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v && v.length > 0 ? v : null));

const optionalEmail = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v && v.length > 0 ? v : null))
  .refine(
    (v) => v === null || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
    { message: "Correo electronico invalido" },
  );

const optionalIsoDate = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v && v.length > 0 ? v : null))
  .refine(
    (v) => v === null || /^\d{4}-\d{2}-\d{2}$/.test(v),
    { message: "Use el formato AAAA-MM-DD" },
  );

export const gestorFormSchema = z.object({
  legal_name: z
    .string({ error: "La razon social es requerida" })
    .trim()
    .min(1, "La razon social es requerida")
    .max(200, "Maximo 200 caracteres"),
  nit: z
    .string({ error: "El NIT es requerido" })
    .trim()
    .min(1, "El NIT es requerido")
    .max(50, "Maximo 50 caracteres"),
  license_number: z
    .string({ error: "El numero de licencia es requerido" })
    .trim()
    .min(1, "El numero de licencia es requerido"),
  license_expiry: optionalIsoDate,
  allowed_activities: optionalString,
  address: optionalString,
  contact_phone: optionalString,
  contact_email: optionalEmail,
});

export type GestorFormValues = z.input<typeof gestorFormSchema>;
export type GestorFormSubmit = z.output<typeof gestorFormSchema>;

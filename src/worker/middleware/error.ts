import type { ErrorHandler } from "hono";
import { ZodError } from "zod";

export class HttpError extends Error {
  constructor(public status: number, message: string, public code?: string) {
    super(message);
  }
}

export const errorHandler: ErrorHandler<{ Bindings: Env }> = (err, c) => {
  if (err instanceof HttpError) {
    return c.json(
      { error: err.message, code: err.code ?? null },
      err.status as Parameters<typeof c.json>[1]
    );
  }

  if (err instanceof ZodError) {
    return c.json(
      { error: "Validation failed", issues: err.issues },
      400
    );
  }

  const msg = err.message ?? "";
  if (msg.includes("CHECK constraint failed")) {
    return c.json({ error: msg, code: "check_constraint" }, 422);
  }
  if (msg.includes("FOREIGN KEY constraint failed")) {
    return c.json({ error: msg, code: "fk_constraint" }, 422);
  }
  if (msg.includes("UNIQUE constraint failed")) {
    return c.json({ error: msg, code: "unique_constraint" }, 409);
  }

  console.error("[worker error]", err);
  return c.json({ error: "Internal Server Error" }, 500);
};

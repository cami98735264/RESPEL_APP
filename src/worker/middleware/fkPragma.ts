import { createMiddleware } from "hono/factory";

export const fkPragma = createMiddleware<{ Bindings: Env }>(async (c, next) => {
  await c.env.DB.exec("PRAGMA foreign_keys = ON");
  await next();
});

import { Hono } from "hono";
import { fkPragma } from "./middleware/fkPragma";
import { errorHandler } from "./middleware/error";
import health from "./routes/health";
import lookups from "./routes/lookups";
import generators from "./routes/generators";
import receptors from "./routes/receptors";
import wastes from "./routes/wastes";
import wasteEntries from "./routes/wasteEntries";
import wasteExits from "./routes/wasteExits";
import alerts from "./routes/alerts";
import reports from "./routes/reports";
import { checkStorageLimits } from "./services/storageSweep";

const app = new Hono<{ Bindings: Env }>();

app.use("/api/*", fkPragma);
app.onError(errorHandler);

app.route("/api/health", health);
app.route("/api/lookups", lookups);
app.route("/api/generators", generators);
app.route("/api/receptors", receptors);
app.route("/api/wastes", wastes);
app.route("/api/waste-entries", wasteEntries);
app.route("/api/waste-exits", wasteExits);
app.route("/api/alerts", alerts);
app.route("/api/reports", reports);

export default {
  fetch: app.fetch,
  async scheduled(_controller: ScheduledController, env: Env, ctx: ExecutionContext) {
    ctx.waitUntil(
      (async () => {
        await env.DB.exec("PRAGMA foreign_keys = ON");
        const created = await checkStorageLimits(env.DB);
        console.log(`[scheduled] storage sweep created ${created} alert(s)`);
      })()
    );
  },
} satisfies ExportedHandler<Env>;

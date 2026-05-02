import "@shared/i18n/zod-spanish";
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
import realtime from "./routes/realtime";
import { checkStorageLimits } from "./services/storageSweep";
import { buildEvent, notify } from "./services/notify";
import { processWhatsAppAlertBatch, type WhatsAppRuntimeEnv } from "./services/whatsapp";

export { NotificationHub } from "./durable/NotificationHub";

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
app.route("/api/realtime", realtime);

export default {
  fetch: app.fetch,
  async queue(batch: MessageBatch<unknown>, env: Env & WhatsAppRuntimeEnv) {
    await processWhatsAppAlertBatch(
      batch as MessageBatch<{ alertId: number }>,
      env
    );
  },
  async scheduled(_controller: ScheduledController, env: Env, ctx: ExecutionContext) {
    ctx.waitUntil(
      (async () => {
        await env.DB.exec("PRAGMA foreign_keys = ON");
        const created = await checkStorageLimits(env.DB);
        console.log(`[scheduled] storage sweep created ${created.length} alert(s)`);
        for (const alert of created) {
          await notify(
            env,
            buildEvent({
              kind: "alert.storage.created",
              generator_id: alert.generator_id,
              payload: alert,
            })
          );
        }
      })()
    );
  },
} satisfies ExportedHandler<Env>;

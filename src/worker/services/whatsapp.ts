import type { ProjectedCategoryAlert } from "@shared/types";

export interface WhatsAppRuntimeEnv {
  WHATSAPP_ALERTS_ENABLED?: string;
  ALERT_WHATSAPP_TO?: string;
  TWILIO_WHATSAPP_TO?: string;
  TWILIO_ACCOUNT_SID?: string;
  TWILIO_AUTH_TOKEN?: string;
  TWILIO_WHATSAPP_FROM?: string;
  WHATSAPP_ALERTS_QUEUE?: Queue<WhatsAppAlertMessage>;
}

export interface WhatsAppAlertMessage {
  alertId: number;
}

interface AlertDetails extends ProjectedCategoryAlert {
  generator_name: string;
  current_category_name: string | null;
  projected_category_name: string;
}

const nowIso = (): string => new Date().toISOString();

function isEnabled(env: WhatsAppRuntimeEnv): boolean {
  if (env.WHATSAPP_ALERTS_ENABLED === "1") return true;
  return hasTwilioConfig(env);
}

function hasTwilioConfig(env: WhatsAppRuntimeEnv): boolean {
  return Boolean(
    (env.ALERT_WHATSAPP_TO || env.TWILIO_WHATSAPP_TO) &&
      env.TWILIO_ACCOUNT_SID &&
      env.TWILIO_AUTH_TOKEN &&
      env.TWILIO_WHATSAPP_FROM
  );
}

function describeTwilioConfig(env: WhatsAppRuntimeEnv): string {
  return [
    `enabled=${env.WHATSAPP_ALERTS_ENABLED ?? "<unset>"}`,
    `toVar=${env.ALERT_WHATSAPP_TO ? "1" : "0"}`,
    `toSecret=${env.TWILIO_WHATSAPP_TO ? "1" : "0"}`,
    `sid=${env.TWILIO_ACCOUNT_SID ? "1" : "0"}`,
    `token=${env.TWILIO_AUTH_TOKEN ? "1" : "0"}`,
    `from=${env.TWILIO_WHATSAPP_FROM ? "1" : "0"}`,
    `queue=${env.WHATSAPP_ALERTS_QUEUE ? "1" : "0"}`,
  ].join(" ");
}

function buildAlertMessage(alert: AlertDetails): string {
  const previousName = alert.current_category_name ?? "Sin categoria";
  return [
    "Alerta RESPEL preventiva.",
    `El generador ${alert.generator_name} proyecta cambio de ${previousName} a ${alert.projected_category_name}.`,
    `Mes evaluado: ${alert.trigger_month.substring(0, 7)}.`,
    `Acumulado del mes: ${alert.month_total_kg} kg.`,
    `Promedio proyectado: ${alert.projected_rolling_avg_kg} kg/mes.`,
    `Exceso sobre el umbral: ${alert.exceeded_by_kg} kg/mes.`,
  ].join(" ");
}

export async function enqueueProjectedCategoryWhatsAppAlert(
  env: Env & WhatsAppRuntimeEnv,
  alert: ProjectedCategoryAlert
): Promise<void> {
  if (!isEnabled(env)) return;
  if (!env.WHATSAPP_ALERTS_QUEUE) {
    console.warn("[whatsapp] queue binding missing; skipping enqueue");
    return;
  }
  await env.WHATSAPP_ALERTS_QUEUE.send({ alertId: alert.id });
}

export async function deliverProjectedCategoryWhatsAppAlert(
  env: Env & WhatsAppRuntimeEnv,
  alertId: number
): Promise<void> {
  const attemptedAt = nowIso();
  const alert = await loadAlert(env.DB, alertId);
  if (!alert) return;
  if (alert.whatsapp_status === "sent") return;

  if (!isEnabled(env)) {
    await markAlertStatus(env.DB, alert.id, "skipped", {
      attemptedAt,
      error: "WHATSAPP_ALERTS_ENABLED != 1",
    });
    return;
  }

  if (!hasTwilioConfig(env)) {
    await markAlertStatus(env.DB, alert.id, "skipped", {
      attemptedAt,
      error: `Twilio WhatsApp no configurado: ${describeTwilioConfig(env)}`,
    });
    return;
  }

  try {
    const result = await sendTwilioWhatsApp(env, buildAlertMessage(alert));
    await markAlertStatus(env.DB, alert.id, "sent", {
      providerId: result.sid,
      attemptedAt,
      sentAt: nowIso(),
      error: null,
    });
  } catch (error) {
    const detail =
      error instanceof Error ? error.message : "Error desconocido al enviar WhatsApp";
    await markAlertStatus(env.DB, alert.id, "failed", {
      attemptedAt,
      error: detail,
    });
    throw error;
  }
}

async function markAlertStatus(
  db: D1Database,
  alertId: number,
  status: ProjectedCategoryAlert["whatsapp_status"],
  fields?: {
    providerId?: string | null;
    error?: string | null;
    attemptedAt?: string | null;
    sentAt?: string | null;
  }
): Promise<void> {
  await db
    .prepare(
      `UPDATE projected_category_alert
       SET whatsapp_status = ?,
           whatsapp_provider_id = ?,
           whatsapp_last_error = ?,
           whatsapp_attempted_at = ?,
           whatsapp_sent_at = ?
       WHERE id = ?`
    )
    .bind(
      status,
      fields?.providerId ?? null,
      fields?.error ?? null,
      fields?.attemptedAt ?? null,
      fields?.sentAt ?? null,
      alertId
    )
    .run();
}

async function loadAlert(
  db: D1Database,
  alertId: number
): Promise<AlertDetails | null> {
  return (
    (await db
      .prepare(
        `SELECT
            a.*,
            g.legal_name AS generator_name,
            curr.name_es AS current_category_name,
            proj.name_es AS projected_category_name
         FROM projected_category_alert a
         JOIN generator g ON g.id = a.generator_id
         LEFT JOIN generator_category curr ON curr.id = a.current_category_id
         JOIN generator_category proj ON proj.id = a.projected_category_id
         WHERE a.id = ?`
      )
      .bind(alertId)
      .first<AlertDetails>()) ?? null
  );
}

async function sendTwilioWhatsApp(
  env: WhatsAppRuntimeEnv,
  message: string
): Promise<{ sid: string }> {
  const sid = env.TWILIO_ACCOUNT_SID as string;
  const token = env.TWILIO_AUTH_TOKEN as string;
  const from = env.TWILIO_WHATSAPP_FROM as string;
  const to = (env.ALERT_WHATSAPP_TO || env.TWILIO_WHATSAPP_TO) as string;

  const body = new URLSearchParams();
  body.set("From", from.startsWith("whatsapp:") ? from : `whatsapp:${from}`);
  body.set("To", to.startsWith("whatsapp:") ? to : `whatsapp:${to}`);
  body.set("Body", message);

  const auth = btoa(`${sid}:${token}`);
  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
    {
      method: "POST",
      headers: {
        authorization: `Basic ${auth}`,
        "content-type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    }
  );

  const text = await response.text();
  if (!response.ok) {
    throw new Error(`Twilio ${response.status}: ${text}`);
  }

  return JSON.parse(text) as { sid: string };
}

export async function processWhatsAppAlertBatch(
  batch: MessageBatch<WhatsAppAlertMessage>,
  env: Env & WhatsAppRuntimeEnv
): Promise<void> {
  for (const message of batch.messages) {
    try {
      await deliverProjectedCategoryWhatsAppAlert(env, message.body.alertId);
      message.ack();
    } catch (error) {
      const detail =
        error instanceof Error ? error.message : "Error desconocido al enviar WhatsApp";
      await markAlertStatus(env.DB, message.body.alertId, "failed", {
        attemptedAt: nowIso(),
        error: detail,
      });
      throw error;
    }
  }
}

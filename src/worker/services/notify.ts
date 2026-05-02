import type { RealtimeEvent } from "@shared/types";

export function makeEventId(): string {
  return crypto.randomUUID();
}

export async function notify(env: Env, event: RealtimeEvent): Promise<void> {
  try {
    const id = env.NOTIFICATION_HUB.idFromName("global");
    const stub = env.NOTIFICATION_HUB.get(id);
    await stub.fetch("https://notification-hub.internal/broadcast", {
      method: "POST",
      body: JSON.stringify(event),
      headers: { "content-type": "application/json" },
    });
  } catch (err) {
    console.error("[notify] broadcast failed", err);
  }
}

export function buildEvent<E extends RealtimeEvent>(
  partial: Omit<E, "id" | "ts">
): E {
  return {
    ...partial,
    id: makeEventId(),
    ts: new Date().toISOString(),
  } as E;
}

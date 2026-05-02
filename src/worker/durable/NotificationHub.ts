import { DurableObject } from "cloudflare:workers";
import type { RealtimeEvent } from "@shared/types";

const MAX_EVENTS = 100;
const EVENT_PREFIX = "event:";

export class NotificationHub extends DurableObject<Env> {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    if (path === "/ws") {
      const upgrade = request.headers.get("Upgrade");
      if (upgrade !== "websocket") {
        return new Response("Expected websocket upgrade", { status: 426 });
      }
      const pair = new WebSocketPair();
      const client = pair[0];
      const server = pair[1];
      this.ctx.acceptWebSocket(server);
      return new Response(null, { status: 101, webSocket: client });
    }

    if (path === "/broadcast" && request.method === "POST") {
      const event = (await request.json()) as RealtimeEvent;
      await this.broadcast(event);
      return new Response(null, { status: 204 });
    }

    if (path === "/snapshot" && request.method === "GET") {
      const events = await this.snapshot();
      return Response.json({ events });
    }

    return new Response("Not found", { status: 404 });
  }

  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): Promise<void> {
    if (typeof message !== "string") return;
    try {
      const parsed = JSON.parse(message) as { type?: string };
      if (parsed.type === "ping") {
        ws.send(JSON.stringify({ type: "pong" }));
      }
    } catch {
      /* ignore non-JSON */
    }
  }

  async webSocketClose(ws: WebSocket, code: number): Promise<void> {
    try {
      ws.close(code, "client closed");
    } catch {
      /* already closed */
    }
  }

  async webSocketError(): Promise<void> {
    /* no-op */
  }

  private async broadcast(event: RealtimeEvent): Promise<void> {
    const key = `${EVENT_PREFIX}${event.ts}:${event.id}`;
    await this.ctx.storage.put(key, event);
    await this.trim();

    const payload = JSON.stringify(event);
    for (const ws of this.ctx.getWebSockets()) {
      try {
        ws.send(payload);
      } catch {
        /* dropped socket; cleanup happens via webSocketClose */
      }
    }
  }

  private async snapshot(): Promise<RealtimeEvent[]> {
    const map = await this.ctx.storage.list<RealtimeEvent>({
      prefix: EVENT_PREFIX,
      limit: MAX_EVENTS,
      reverse: true,
    });
    return [...map.values()].reverse();
  }

  private async trim(): Promise<void> {
    const map = await this.ctx.storage.list<RealtimeEvent>({
      prefix: EVENT_PREFIX,
      reverse: false,
    });
    const keys = [...map.keys()];
    if (keys.length <= MAX_EVENTS) return;
    const excess = keys.slice(0, keys.length - MAX_EVENTS);
    await this.ctx.storage.delete(excess);
  }
}

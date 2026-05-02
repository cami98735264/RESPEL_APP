import type { RealtimeEvent, RealtimeSnapshot } from "@shared/types";

export type RealtimeHandler = (event: RealtimeEvent, meta: { replay: boolean }) => void;

const RECONNECT_DELAYS = [1000, 2000, 4000, 8000, 16000, 30000];
const HEARTBEAT_MS = 25_000;

class RealtimeClient {
  private ws: WebSocket | null = null;
  private handlers = new Set<RealtimeHandler>();
  private reconnectAttempt = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private explicitlyClosed = false;
  private connecting = false;
  private snapshotLoaded = false;
  private seenIds = new Set<string>();

  subscribe(handler: RealtimeHandler): () => void {
    this.handlers.add(handler);
    return () => {
      this.handlers.delete(handler);
    };
  }

  async connect(): Promise<void> {
    if (this.connecting || this.ws?.readyState === WebSocket.OPEN) return;
    this.connecting = true;
    this.explicitlyClosed = false;

    try {
      if (!this.snapshotLoaded) {
        await this.loadSnapshot();
        this.snapshotLoaded = true;
      }
    } catch (err) {
      console.warn("[realtime] snapshot fetch failed", err);
    }

    const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
    const url = `${proto}//${window.location.host}/api/realtime/ws`;
    const ws = new WebSocket(url);
    this.ws = ws;

    ws.addEventListener("open", () => {
      this.reconnectAttempt = 0;
      this.connecting = false;
      this.startHeartbeat();
    });

    ws.addEventListener("message", (ev) => {
      let parsed: unknown;
      try {
        parsed = JSON.parse(ev.data as string);
      } catch {
        return;
      }
      if (!parsed || typeof parsed !== "object") return;
      const obj = parsed as { type?: string };
      if (obj.type === "pong") return;
      const event = parsed as RealtimeEvent;
      if (!event.id || !event.kind) return;
      if (this.seenIds.has(event.id)) return;
      this.seenIds.add(event.id);
      this.dispatch(event, false);
    });

    ws.addEventListener("close", () => {
      this.stopHeartbeat();
      this.ws = null;
      this.connecting = false;
      if (!this.explicitlyClosed) this.scheduleReconnect();
    });

    ws.addEventListener("error", () => {
      try {
        ws.close();
      } catch {
        /* already closed */
      }
    });
  }

  disconnect(): void {
    this.explicitlyClosed = true;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.stopHeartbeat();
    if (this.ws) {
      try {
        this.ws.close();
      } catch {
        /* already closed */
      }
      this.ws = null;
    }
  }

  private async loadSnapshot(): Promise<void> {
    const res = await fetch("/api/realtime/snapshot");
    if (!res.ok) return;
    const body = (await res.json()) as RealtimeSnapshot;
    for (const event of body.events ?? []) {
      if (this.seenIds.has(event.id)) continue;
      this.seenIds.add(event.id);
      this.dispatch(event, true);
    }
  }

  private dispatch(event: RealtimeEvent, replay: boolean): void {
    for (const handler of this.handlers) {
      try {
        handler(event, { replay });
      } catch (err) {
        console.error("[realtime] handler error", err);
      }
    }
  }

  private scheduleReconnect(): void {
    const delay = RECONNECT_DELAYS[Math.min(this.reconnectAttempt, RECONNECT_DELAYS.length - 1)];
    this.reconnectAttempt += 1;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      void this.connect();
    }, delay);
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        try {
          this.ws.send(JSON.stringify({ type: "ping" }));
        } catch {
          /* will close on next tick */
        }
      }
    }, HEARTBEAT_MS);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }
}

export const realtimeClient = new RealtimeClient();

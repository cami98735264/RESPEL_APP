import type { RealtimeEvent } from "@shared/types";

export type NotificationTone = "info" | "success" | "warning" | "error";

export interface FormattedEvent {
  id: string;
  ts: string;
  kind: RealtimeEvent["kind"];
  title: string;
  body: string;
  tone: NotificationTone;
  href?: string;
}

const fmtKg = (n: number): string =>
  `${n.toLocaleString("es-CO", { maximumFractionDigits: 3 })} kg`;

const fmtDate = (iso: string): string => {
  try {
    return new Date(iso).toLocaleDateString("es-CO", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
};

export function formatEvent(event: RealtimeEvent): FormattedEvent {
  switch (event.kind) {
    case "alert.category.created": {
      const a = event.payload;
      return {
        id: event.id,
        ts: event.ts,
        kind: event.kind,
        title: "Nueva alerta de categoría",
        body: `Promedio mensual ${fmtKg(a.rolling_avg_kg)} — categoría actualizada para el mes ${a.trigger_month}.`,
        tone: "warning",
        href: `/alertas?tipo=categoria&id=${a.id}`,
      };
    }
    case "alert.category.projected.created": {
      const a = event.payload;
      return {
        id: event.id,
        ts: event.ts,
        kind: event.kind,
        title: "Nueva alerta preventiva de categoría",
        body: `Promedio proyectado ${fmtKg(a.projected_rolling_avg_kg)} y exceso de ${fmtKg(a.exceeded_by_kg)} sobre el umbral.`,
        tone: "warning",
        href: `/alertas?tipo=categoria-proyectada&id=${a.id}`,
      };
    }
    case "alert.storage.created": {
      const a = event.payload;
      return {
        id: event.id,
        ts: event.ts,
        kind: event.kind,
        title: "Residuo próximo a vencer almacenamiento",
        body: `Residuo #${a.waste_id} debe disponerse antes del ${fmtDate(a.deadline_date)}.`,
        tone: "error",
        href: `/alertas?tipo=almacenamiento&id=${a.id}`,
      };
    }
    case "alert.category.acknowledged":
      return {
        id: event.id,
        ts: event.ts,
        kind: event.kind,
        title: "Alerta de categoría atendida",
        body: `La alerta #${event.payload.alert_id} fue marcada como atendida.`,
        tone: "success",
        href: "/alertas?tipo=categoria",
      };
    case "alert.category.projected.acknowledged":
      return {
        id: event.id,
        ts: event.ts,
        kind: event.kind,
        title: "Alerta preventiva atendida",
        body: `La alerta #${event.payload.alert_id} fue marcada como atendida.`,
        tone: "success",
        href: "/alertas?tipo=categoria-proyectada",
      };
    case "alert.storage.resolved":
      return {
        id: event.id,
        ts: event.ts,
        kind: event.kind,
        title: "Alerta de almacenamiento resuelta",
        body: `La alerta #${event.payload.alert_id} fue marcada como resuelta.`,
        tone: "success",
        href: "/alertas?tipo=almacenamiento",
      };
    case "entry.created":
      return {
        id: event.id,
        ts: event.ts,
        kind: event.kind,
        title: "Nueva entrada registrada",
        body: `${event.payload.waste_name} — ${fmtKg(event.payload.weight_kg)}.`,
        tone: "info",
        href: "/residuos",
      };
    case "exit.created":
      return {
        id: event.id,
        ts: event.ts,
        kind: event.kind,
        title: "Nueva salida registrada",
        body: `Residuo #${event.payload.waste_id} despachado — ${fmtKg(event.payload.weight_kg)}.`,
        tone: "info",
        href: "/residuos",
      };
  }
}

export function relativeTime(iso: string, now: Date = new Date()): string {
  try {
    const past = new Date(iso).getTime();
    const diffMs = now.getTime() - past;
    if (diffMs < 0) return "ahora";
    const sec = Math.floor(diffMs / 1000);
    if (sec < 60) return "hace unos segundos";
    const min = Math.floor(sec / 60);
    if (min < 60) return `hace ${min} min`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `hace ${hr} h`;
    const day = Math.floor(hr / 24);
    if (day < 7) return `hace ${day} d`;
    return fmtDate(iso);
  } catch {
    return iso;
  }
}

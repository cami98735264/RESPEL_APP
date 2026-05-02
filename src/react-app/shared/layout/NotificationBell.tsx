import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  Info,
  PackagePlus,
  Truck,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/ui/popover";
import { useNotifications } from "@/shared/realtime";
import {
  relativeTime,
  type FormattedEvent,
  type NotificationTone,
} from "@/shared/realtime/notification-format";
import { cn } from "@/lib/utils";

const TONE_STYLES: Record<NotificationTone, { icon: string; bg: string }> = {
  info: { icon: "text-blue-600", bg: "bg-blue-50" },
  success: { icon: "text-emerald-600", bg: "bg-emerald-50" },
  warning: { icon: "text-amber-600", bg: "bg-amber-50" },
  error: { icon: "text-rose-600", bg: "bg-rose-50" },
};

function iconFor(item: FormattedEvent) {
  switch (item.kind) {
    case "alert.category.created":
      return AlertTriangle;
    case "alert.storage.created":
      return AlertTriangle;
    case "alert.category.acknowledged":
    case "alert.storage.resolved":
      return CheckCircle2;
    case "entry.created":
      return PackagePlus;
    case "exit.created":
      return Truck;
    default:
      return Info;
  }
}

export function NotificationBell() {
  const { items, unreadCount, markAllRead } = useNotifications();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const visible = items.slice(0, 20);

  const handleItemClick = (item: FormattedEvent) => {
    setOpen(false);
    markAllRead();
    if (item.href) navigate(item.href);
  };

  const handleViewAll = () => {
    setOpen(false);
    markAllRead();
    navigate("/alertas");
  };

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) markAllRead();
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Notificaciones"
          className="relative inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition hover:bg-foreground/5 hover:text-foreground focus:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 inline-flex min-w-[18px] items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-semibold leading-[18px] text-white">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[22rem] p-0">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-foreground">Notificaciones</p>
            <p className="text-xs text-muted-foreground">
              {items.length === 0
                ? "Sin actividad reciente"
                : `${items.length} evento${items.length === 1 ? "" : "s"} reciente${items.length === 1 ? "" : "s"}`}
            </p>
          </div>
          {items.length > 0 && (
            <button
              type="button"
              onClick={markAllRead}
              className="text-xs font-medium text-primary hover:underline"
            >
              Marcar como leídas
            </button>
          )}
        </div>
        <ul className="max-h-80 overflow-y-auto divide-y divide-border">
          {visible.length === 0 ? (
            <li className="px-4 py-8 text-center text-sm text-muted-foreground">
              Aquí aparecerán las alertas y eventos en tiempo real.
            </li>
          ) : (
            visible.map((item) => {
              const Icon = iconFor(item);
              const tone = TONE_STYLES[item.tone];
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => handleItemClick(item)}
                    className="flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-foreground/5"
                  >
                    <span
                      className={cn(
                        "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                        tone.bg,
                      )}
                    >
                      <Icon className={cn("h-4 w-4", tone.icon)} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium text-foreground">
                        {item.title}
                      </span>
                      <span className="mt-0.5 block text-xs text-muted-foreground">
                        {item.body}
                      </span>
                      <span className="mt-1 block text-[11px] text-muted-foreground/80">
                        {relativeTime(item.ts)}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })
          )}
        </ul>
        <div className="border-t border-border px-4 py-2 text-right">
          <button
            type="button"
            onClick={handleViewAll}
            className="text-xs font-medium text-primary hover:underline"
          >
            Ver todas las alertas →
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

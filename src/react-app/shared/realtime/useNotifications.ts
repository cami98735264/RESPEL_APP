import { useCallback, useMemo, useState, useEffect } from "react";
import { useRealtimeContext } from "./RealtimeProvider";
import { formatEvent, type FormattedEvent } from "./notification-format";

const STORAGE_KEY = "respel:notifications:lastReadTs";

function readLastReadTs(): string | null {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function writeLastReadTs(ts: string): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, ts);
  } catch {
    /* localStorage unavailable; ignore */
  }
}

export interface UseNotificationsResult {
  items: FormattedEvent[];
  unreadCount: number;
  markAllRead: () => void;
}

export function useNotifications(): UseNotificationsResult {
  const { events } = useRealtimeContext();
  const [lastReadTs, setLastReadTs] = useState<string | null>(() => readLastReadTs());

  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setLastReadTs(e.newValue);
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  const items = useMemo(() => events.map(formatEvent), [events]);

  const unreadCount = useMemo(() => {
    if (!lastReadTs) return items.length;
    return items.filter((it) => it.ts > lastReadTs).length;
  }, [items, lastReadTs]);

  const markAllRead = useCallback(() => {
    const ts = items[0]?.ts ?? new Date().toISOString();
    writeLastReadTs(ts);
    setLastReadTs(ts);
  }, [items]);

  return { items, unreadCount, markAllRead };
}

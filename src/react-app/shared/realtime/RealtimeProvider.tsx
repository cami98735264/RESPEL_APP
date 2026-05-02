import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import type { RealtimeEvent } from "@shared/types";
import { realtimeClient } from "./realtime-client";

interface RealtimeContextValue {
  events: RealtimeEvent[];
}

const RealtimeContext = createContext<RealtimeContextValue | null>(null);

const MAX_BUFFER = 200;

export function RealtimeProvider({ children }: { children: ReactNode }) {
  const [events, setEvents] = useState<RealtimeEvent[]>([]);

  useEffect(() => {
    const unsubscribe = realtimeClient.subscribe((event) => {
      setEvents((prev) => {
        if (prev.some((e) => e.id === event.id)) return prev;
        const next = [event, ...prev];
        return next.length > MAX_BUFFER ? next.slice(0, MAX_BUFFER) : next;
      });
    });
    void realtimeClient.connect();
    return () => {
      unsubscribe();
    };
  }, []);

  const value = useMemo(() => ({ events }), [events]);
  return <RealtimeContext.Provider value={value}>{children}</RealtimeContext.Provider>;
}

export function useRealtimeContext(): RealtimeContextValue {
  const ctx = useContext(RealtimeContext);
  if (!ctx) throw new Error("useRealtimeContext must be used inside <RealtimeProvider>");
  return ctx;
}

export function useRealtime(
  handler: (event: RealtimeEvent, meta: { replay: boolean }) => void,
  deps: ReadonlyArray<unknown> = []
): void {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    return realtimeClient.subscribe((event, meta) => handlerRef.current(event, meta));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

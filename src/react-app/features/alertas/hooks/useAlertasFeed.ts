import { useCallback, useEffect, useState } from "react";
import type {
  GeneratorCategoryAlert,
  ProjectedCategoryAlert,
  StorageLimitAlert,
} from "@shared/types";
import { useRealtime } from "@/shared/realtime";
import { alertasService } from "../services/alertas.service";

export interface UseAlertasFeedResult {
  category: GeneratorCategoryAlert[];
  projectedCategory: ProjectedCategoryAlert[];
  storage: StorageLimitAlert[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  acknowledgeCategory: (id: number) => Promise<void>;
  acknowledgeProjectedCategory: (id: number) => Promise<void>;
  resolveStorage: (id: number) => Promise<void>;
}

export function useAlertasFeed(): UseAlertasFeedResult {
  const [category, setCategory] = useState<GeneratorCategoryAlert[]>([]);
  const [projectedCategory, setProjectedCategory] = useState<ProjectedCategoryAlert[]>([]);
  const [storage, setStorage] = useState<StorageLimitAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [cat, projected, sto] = await Promise.all([
        alertasService.listCategory(),
        alertasService.listProjectedCategory(),
        alertasService.listStorage(),
      ]);
      setCategory(cat);
      setProjectedCategory(projected);
      setStorage(sto);
    } catch {
      setError("No se pudieron cargar las alertas.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useRealtime((event) => {
    switch (event.kind) {
      case "alert.category.created":
        setCategory((prev) =>
          prev.some((a) => a.id === event.payload.id)
            ? prev
            : [event.payload, ...prev]
        );
        break;
      case "alert.storage.created":
        setStorage((prev) =>
          prev.some((a) => a.id === event.payload.id)
            ? prev
            : [event.payload, ...prev]
        );
        break;
      case "alert.category.projected.created":
        setProjectedCategory((prev) =>
          prev.some((a) => a.id === event.payload.id)
            ? prev
            : [event.payload, ...prev]
        );
        break;
      case "alert.category.acknowledged":
        setCategory((prev) =>
          prev.map((a) =>
            a.id === event.payload.alert_id
              ? { ...a, acknowledged: 1, acknowledged_at: event.ts }
              : a
          )
        );
        break;
      case "alert.category.projected.acknowledged":
        setProjectedCategory((prev) =>
          prev.map((a) =>
            a.id === event.payload.alert_id
              ? { ...a, acknowledged: 1, acknowledged_at: event.ts }
              : a
          )
        );
        break;
      case "alert.storage.resolved":
        setStorage((prev) =>
          prev.map((a) =>
            a.id === event.payload.alert_id
              ? { ...a, resolved: 1, resolved_at: event.ts }
              : a
          )
        );
        break;
    }
  }, []);

  const acknowledgeCategory = useCallback(async (id: number) => {
    const updated = await alertasService.acknowledgeCategory(id);
    setCategory((prev) => prev.map((a) => (a.id === id ? updated : a)));
  }, []);

  const acknowledgeProjectedCategory = useCallback(async (id: number) => {
    const updated = await alertasService.acknowledgeProjectedCategory(id);
    setProjectedCategory((prev) =>
      prev.map((a) => (a.id === id ? updated : a))
    );
  }, []);

  const resolveStorage = useCallback(async (id: number) => {
    const updated = await alertasService.resolveStorage(id);
    setStorage((prev) => prev.map((a) => (a.id === id ? updated : a)));
  }, []);

  return {
    category,
    projectedCategory,
    storage,
    loading,
    error,
    refresh,
    acknowledgeCategory,
    acknowledgeProjectedCategory,
    resolveStorage,
  };
}

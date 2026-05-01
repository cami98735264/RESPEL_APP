import { useCallback, useEffect, useState } from "react";
import type { AuthorizedReceptor } from "@shared/types";
import { gestoresService } from "../services/gestores.service";

export function useGestores() {
  const [gestores, setGestores] = useState<AuthorizedReceptor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setLoading(true);
    setError(null);
    return gestoresService
      .list()
      .then(setGestores)
      .catch(() => setError("No se pudieron cargar los gestores"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { gestores, loading, error, refresh };
}

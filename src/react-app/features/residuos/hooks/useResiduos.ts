import { useCallback, useEffect, useState } from 'react';
import { wastesService } from '../services/residuos.service';
import type { WasteWithHazard } from '@shared/types';

export function useResiduos(params?: { generatorId?: number; inStockOnly?: boolean }) {
  const [residuos, setResiduos] = useState<WasteWithHazard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const generatorId = params?.generatorId;
  const inStockOnly = params?.inStockOnly;

  const refresh = useCallback(() => {
    setLoading(true);
    setError(null);
    return wastesService
      .list({ generatorId, inStockOnly })
      .then(setResiduos)
      .catch(() => setError('Error al cargar los residuos'))
      .finally(() => setLoading(false));
  }, [generatorId, inStockOnly]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { residuos, loading, error, refresh };
}

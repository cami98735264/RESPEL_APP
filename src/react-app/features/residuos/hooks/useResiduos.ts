import { useEffect, useState } from 'react';
import { residuosService } from '../services/residuos.service';
import type { Residuo } from '../types';

export function useResiduos() {
  const [residuos, setResiduos] = useState<Residuo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    residuosService
      .getAll()
      .then(setResiduos)
      .catch(() => setError('Error al cargar los residuos'))
      .finally(() => setLoading(false));
  }, []);

  return { residuos, loading, error };
}

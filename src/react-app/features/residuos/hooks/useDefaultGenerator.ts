import { useEffect, useState } from 'react';
import { generatorsService } from '../services/residuos.service';
import type { Generator } from '@shared/types';

export function useDefaultGenerator() {
  const [generator, setGenerator] = useState<Generator | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    generatorsService
      .getDefault()
      .then((g) => {
        if (alive) setGenerator(g);
      })
      .catch(() => {
        if (alive) setError('No se pudo cargar el generador por defecto');
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  return { generator, loading, error };
}

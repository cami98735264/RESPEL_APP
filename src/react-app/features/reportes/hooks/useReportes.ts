import { useState } from 'react';
import { reportesService } from '../services/reportes.service';

export function useReportes() {
  const [loading, setLoading] = useState(false);

  async function descargarExcel(desde: string, hasta: string) {
    setLoading(true);
    try {
      await reportesService.generarExcel({ desde, hasta });
    } finally {
      setLoading(false);
    }
  }

  return { loading, descargarExcel };
}

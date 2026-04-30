import { api } from '../../../shared/lib/api';

export const reportesService = {
  generarExcel: (params: { desde: string; hasta: string }) =>
    api.post<Blob>('/reportes/excel', params),
};

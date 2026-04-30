import { api } from '../../../shared/lib/api';
import type { Residuo, CreateResiduoDto } from '../types';

export const residuosService = {
  getAll: () => api.get<Residuo[]>('/residuos'),
  getById: (id: string) => api.get<Residuo>(`/residuos/${id}`),
  create: (dto: CreateResiduoDto) => api.post<Residuo>('/residuos', dto),
  delete: (id: string) => api.delete<void>(`/residuos/${id}`),
};

import { api } from '@/shared/lib/api';
import type {
  AuthorizedReceptor,
  CreateWasteEntryDto,
  CreateWasteEntryResponse,
  CreateWasteExitDto,
  Generator,
  GeneratorCategoryAlert,
  HazardCharacteristic,
  StorageLimitAlert,
  Waste,
  WasteEntry,
  WasteExit,
  WasteWithHazard,
} from '@shared/types';

export const generatorsService = {
  getDefault: () => api.get<Generator>('/generators/default'),
  getById: (id: number) => api.get<Generator>(`/generators/${id}`),
};

export const lookupsService = {
  getHazardCharacteristics: () =>
    api.get<HazardCharacteristic[]>('/lookups/hazard-characteristics'),
};

export const wastesService = {
  list: (params?: { generatorId?: number; inStockOnly?: boolean }) => {
    const query = new URLSearchParams();
    if (params?.generatorId != null)
      query.set('generator_id', String(params.generatorId));
    if (params?.inStockOnly) query.set('in_stock', '1');
    const qs = query.toString();
    return api.get<WasteWithHazard[]>(`/wastes${qs ? `?${qs}` : ''}`);
  },
  getById: (id: number) => api.get<WasteWithHazard>(`/wastes/${id}`),
};

export const wasteEntriesService = {
  list: (params?: { generatorId?: number; from?: string; to?: string; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.generatorId != null)
      query.set('generator_id', String(params.generatorId));
    if (params?.from) query.set('from', params.from);
    if (params?.to) query.set('to', params.to);
    if (params?.limit != null) query.set('limit', String(params.limit));
    const qs = query.toString();
    return api.get<WasteEntry[]>(`/waste-entries${qs ? `?${qs}` : ''}`);
  },
  create: (dto: CreateWasteEntryDto) =>
    api.post<CreateWasteEntryResponse>('/waste-entries', dto),
};

export const wasteExitsService = {
  list: (params?: { generatorId?: number; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.generatorId != null)
      query.set('generator_id', String(params.generatorId));
    if (params?.limit != null) query.set('limit', String(params.limit));
    const qs = query.toString();
    return api.get<WasteExit[]>(`/waste-exits${qs ? `?${qs}` : ''}`);
  },
  create: (dto: CreateWasteExitDto) =>
    api.post<{ exit: WasteExit; waste: Waste }>('/waste-exits', dto),
};

export const receptorsService = {
  list: (params?: { activeOnly?: boolean }) => {
    const query = new URLSearchParams();
    if (params?.activeOnly) query.set('active', '1');
    const qs = query.toString();
    return api.get<AuthorizedReceptor[]>(`/receptors${qs ? `?${qs}` : ''}`);
  },
};

export const alertsService = {
  listCategory: (params?: { unack?: boolean; generatorId?: number }) => {
    const query = new URLSearchParams();
    if (params?.unack) query.set('unack', '1');
    if (params?.generatorId != null)
      query.set('generator_id', String(params.generatorId));
    const qs = query.toString();
    return api.get<GeneratorCategoryAlert[]>(
      `/alerts/category${qs ? `?${qs}` : ''}`,
    );
  },
  listStorage: (params?: { open?: boolean; generatorId?: number }) => {
    const query = new URLSearchParams();
    if (params?.open) query.set('open', '1');
    if (params?.generatorId != null)
      query.set('generator_id', String(params.generatorId));
    const qs = query.toString();
    return api.get<StorageLimitAlert[]>(
      `/alerts/storage${qs ? `?${qs}` : ''}`,
    );
  },
};

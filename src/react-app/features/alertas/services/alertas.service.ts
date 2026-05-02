import { api } from "@/shared/lib/api";
import type {
  GeneratorCategoryAlert,
  StorageLimitAlert,
} from "@shared/types";

export const alertasService = {
  listCategory: (params?: { unack?: boolean; generatorId?: number }) => {
    const query = new URLSearchParams();
    if (params?.unack) query.set("unack", "1");
    if (params?.generatorId != null)
      query.set("generator_id", String(params.generatorId));
    const qs = query.toString();
    return api.get<GeneratorCategoryAlert[]>(
      `/alerts/category${qs ? `?${qs}` : ""}`
    );
  },
  listStorage: (params?: { open?: boolean; generatorId?: number }) => {
    const query = new URLSearchParams();
    if (params?.open) query.set("open", "1");
    if (params?.generatorId != null)
      query.set("generator_id", String(params.generatorId));
    const qs = query.toString();
    return api.get<StorageLimitAlert[]>(
      `/alerts/storage${qs ? `?${qs}` : ""}`
    );
  },
  acknowledgeCategory: (id: number) =>
    api.post<GeneratorCategoryAlert>(
      `/alerts/category/${id}/acknowledge`,
      {}
    ),
  resolveStorage: (id: number) =>
    api.post<StorageLimitAlert>(`/alerts/storage/${id}/resolve`, {}),
};

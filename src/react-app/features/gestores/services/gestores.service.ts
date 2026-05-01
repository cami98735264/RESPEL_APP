import { api } from "@/shared/lib/api";
import type {
  AuthorizedReceptor,
  CreateReceptorDto,
  UpdateReceptorDto,
} from "@shared/types";

export const gestoresService = {
  list: (params?: { activeOnly?: boolean }) => {
    const query = new URLSearchParams();
    if (params?.activeOnly) query.set("active", "1");
    const qs = query.toString();
    return api.get<AuthorizedReceptor[]>(`/receptors${qs ? `?${qs}` : ""}`);
  },
  get: (id: number) => api.get<AuthorizedReceptor>(`/receptors/${id}`),
  create: (dto: CreateReceptorDto) =>
    api.post<AuthorizedReceptor>("/receptors", dto),
  update: (id: number, dto: UpdateReceptorDto) =>
    api.patch<AuthorizedReceptor>(`/receptors/${id}`, dto),
  setActive: (id: number, active: boolean) =>
    api.patch<AuthorizedReceptor>(`/receptors/${id}`, {
      is_active: active ? 1 : 0,
    }),
};

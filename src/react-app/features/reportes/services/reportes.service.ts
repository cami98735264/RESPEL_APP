import { api } from '@/shared/lib/api';
import type {
  EntryDetailReportRow,
  ExitDetailReportRow,
  ReportPeriod,
} from '@shared/types';

export interface ReportParams {
  generator_id?: number;
  period: ReportPeriod;
  year: number;
  month?: number;
  day?: number;
  quarter?: number;
  half?: number;
}

function toQuery(params: ReportParams): string {
  const q = new URLSearchParams();
  q.set('period', params.period);
  q.set('year', String(params.year));
  if (params.generator_id != null) q.set('generator_id', String(params.generator_id));
  if (params.month != null) q.set('month', String(params.month));
  if (params.day != null) q.set('day', String(params.day));
  if (params.quarter != null) q.set('quarter', String(params.quarter));
  if (params.half != null) q.set('half', String(params.half));
  return q.toString();
}

export const reportesService = {
  listEntries: (params: ReportParams) =>
    api.get<EntryDetailReportRow[]>(`/reports/entries?${toQuery(params)}`),
  listExits: (params: ReportParams) =>
    api.get<ExitDetailReportRow[]>(`/reports/exits?${toQuery(params)}`),
};

import { useCallback, useState } from 'react';
import { ApiError } from '@/shared/lib/api';
import type {
  EntryDetailReportRow,
  ExitDetailReportRow,
  ReportPeriod,
} from '@shared/types';
import { reportesService, type ReportParams } from '../services/reportes.service';
import {
  buildFilename,
  exportEntriesXlsx,
  exportExitsXlsx,
} from '../lib/exportExcel';

export type ReportType = 'entries' | 'exits';

export interface ReportFilters {
  type: ReportType;
  period: ReportPeriod;
  year: number;
  month: number;
  day: number;
  quarter: number;
  half: number;
}

const todayDefaults = (): ReportFilters => {
  const d = new Date();
  return {
    type: 'entries',
    period: 'daily',
    year: d.getFullYear(),
    month: d.getMonth() + 1,
    day: d.getDate(),
    quarter: Math.floor(d.getMonth() / 3) + 1,
    half: d.getMonth() < 6 ? 1 : 2,
  };
};

function toParams(f: ReportFilters): ReportParams {
  const base: ReportParams = { period: f.period, year: f.year };
  switch (f.period) {
    case 'daily':
      base.month = f.month;
      base.day = f.day;
      break;
    case 'quarterly':
      base.quarter = f.quarter;
      break;
    case 'semiannual':
      base.half = f.half;
      break;
    case 'annual':
      break;
  }
  return base;
}

export function useReportes() {
  const [filters, setFilters] = useState<ReportFilters>(todayDefaults);
  const [entries, setEntries] = useState<EntryDetailReportRow[]>([]);
  const [exits, setExits] = useState<ExitDetailReportRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasFetched, setHasFetched] = useState(false);

  const updateFilter = useCallback(
    <K extends keyof ReportFilters>(key: K, value: ReportFilters[K]) => {
      setFilters((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const fetchReport = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = toParams(filters);
      if (filters.type === 'entries') {
        const rows = await reportesService.listEntries(params);
        setEntries(rows);
        setExits([]);
      } else {
        const rows = await reportesService.listExits(params);
        setExits(rows);
        setEntries([]);
      }
      setHasFetched(true);
    } catch (err) {
      const msg =
        err instanceof ApiError ? err.message : 'No se pudo generar el reporte';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const exportXlsx = useCallback(async () => {
    setExporting(true);
    try {
      const filename = buildFilename({
        type: filters.type,
        period: filters.period,
        year: filters.year,
        month: filters.month,
        day: filters.day,
        quarter: filters.quarter,
        half: filters.half,
      });
      if (filters.type === 'entries') {
        await exportEntriesXlsx(entries, filename);
      } else {
        await exportExitsXlsx(exits, filename);
      }
    } finally {
      setExporting(false);
    }
  }, [filters, entries, exits]);

  return {
    filters,
    updateFilter,
    entries,
    exits,
    loading,
    exporting,
    error,
    hasFetched,
    fetchReport,
    exportXlsx,
  };
}

import { Download, FileSpreadsheet, FileText } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select';
import { Card, CardHeader, CardTitle } from '@/shared/ui/card';
import { Banner } from '@/shared/ui/banner';
import { HazardBadge } from '@/shared/ui/hazard-badge';
import { PageHeader } from '@/shared/layout/PageHeader';
import { useReportes, type ReportType } from '../hooks/useReportes';
import type { ReportPeriod } from '@shared/types';
import { cn } from '@/lib/utils';

const TYPES: { value: ReportType; label: string }[] = [
  { value: 'entries', label: 'Entradas' },
  { value: 'exits', label: 'Salidas' },
];

const PERIODS: { value: ReportPeriod; label: string }[] = [
  { value: 'daily', label: 'Diario' },
  { value: 'quarterly', label: 'Trimestral' },
  { value: 'semiannual', label: 'Semestral' },
  { value: 'annual', label: 'Anual' },
];

const NUM = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 2 });

export default function ReportesPage() {
  const {
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
  } = useReportes();

  const rows = filters.type === 'entries' ? entries : exits;

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Cumplimiento"
        title="Reportes"
        description="Genere informes consolidados de entradas y salidas, exportables a Excel para auditorias y radicados ante la autoridad ambiental."
      />

      {/* Filters */}
      <Card>
        <CardHeader className="flex-row items-center justify-between gap-4">
          <div>
            <CardTitle>Configuracion del reporte</CardTitle>
            <p className="text-xs text-muted-foreground">
              Seleccione tipo, periodo y rango temporal
            </p>
          </div>
          <div className="inline-flex rounded-md border border-border bg-muted/40 p-1">
            {TYPES.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => updateFilter('type', t.value)}
                className={cn(
                  'rounded px-4 py-1.5 text-sm font-medium transition',
                  filters.type === t.value
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        </CardHeader>

        <div className="grid grid-cols-1 gap-4 px-6 py-5 sm:grid-cols-2 lg:grid-cols-5">
          <div className="space-y-1.5">
            <Label>Periodo</Label>
            <Select
              value={filters.period}
              onValueChange={(v) =>
                updateFilter('period', v as ReportPeriod)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PERIODS.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="year">Anio</Label>
            <Input
              id="year"
              type="number"
              min="2000"
              max="2100"
              value={filters.year}
              className="font-mono tabular-figures"
              onChange={(e) => updateFilter('year', Number(e.target.value))}
            />
          </div>

          {filters.period === 'daily' && (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="month">Mes</Label>
                <Input
                  id="month"
                  type="number"
                  min="1"
                  max="12"
                  value={filters.month}
                  className="font-mono tabular-figures"
                  onChange={(e) =>
                    updateFilter('month', Number(e.target.value))
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="day">Dia</Label>
                <Input
                  id="day"
                  type="number"
                  min="1"
                  max="31"
                  value={filters.day}
                  className="font-mono tabular-figures"
                  onChange={(e) =>
                    updateFilter('day', Number(e.target.value))
                  }
                />
              </div>
            </>
          )}

          {filters.period === 'quarterly' && (
            <div className="space-y-1.5">
              <Label>Trimestre</Label>
              <Select
                value={String(filters.quarter)}
                onValueChange={(v) => updateFilter('quarter', Number(v))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Q1 (Ene-Mar)</SelectItem>
                  <SelectItem value="2">Q2 (Abr-Jun)</SelectItem>
                  <SelectItem value="3">Q3 (Jul-Sep)</SelectItem>
                  <SelectItem value="4">Q4 (Oct-Dic)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {filters.period === 'semiannual' && (
            <div className="space-y-1.5">
              <Label>Semestre</Label>
              <Select
                value={String(filters.half)}
                onValueChange={(v) => updateFilter('half', Number(v))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">H1 (Ene-Jun)</SelectItem>
                  <SelectItem value="2">H2 (Jul-Dic)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex items-end">
            <Button onClick={fetchReport} disabled={loading} className="w-full">
              <FileText className="h-4 w-4" />
              {loading ? 'Generando...' : 'Generar Reporte'}
            </Button>
          </div>
        </div>

        {error && (
          <div className="px-6 pb-5">
            <Banner tone="error">{error}</Banner>
          </div>
        )}
      </Card>

      {/* Results */}
      {hasFetched && !error && (
        <Card className="overflow-hidden">
          <CardHeader className="flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
                <FileSpreadsheet className="h-4 w-4" />
              </span>
              <div>
                <CardTitle>
                  {rows.length} registro(s)
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  Vista previa de los primeros 50
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={exportXlsx}
              disabled={exporting || rows.length === 0}
            >
              <Download className="h-4 w-4" />
              {exporting ? 'Exportando...' : 'Exportar a Excel'}
            </Button>
          </CardHeader>
          {rows.length === 0 ? (
            <p className="px-6 py-12 text-center text-sm text-muted-foreground">
              No hay datos para los filtros seleccionados.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border/60 bg-muted/40 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  {filters.type === 'entries' ? (
                    <tr>
                      <th className="px-6 py-3">Fecha</th>
                      <th className="px-6 py-3">Generador</th>
                      <th className="px-6 py-3">Residuo</th>
                      <th className="px-6 py-3">Caracteristica</th>
                      <th className="px-6 py-3 text-right">Peso (kg)</th>
                    </tr>
                  ) : (
                    <tr>
                      <th className="px-6 py-3">Fecha</th>
                      <th className="px-6 py-3">Residuo</th>
                      <th className="px-6 py-3">Caracteristica</th>
                      <th className="px-6 py-3">Gestor</th>
                      <th className="px-6 py-3">Manifiesto</th>
                      <th className="px-6 py-3 text-right">Peso (kg)</th>
                    </tr>
                  )}
                </thead>
                <tbody>
                  {filters.type === 'entries'
                    ? entries.slice(0, 50).map((r) => (
                        <tr
                          key={r.entry_id}
                          className="border-b border-border/40 last:border-0 hover:bg-muted/30"
                        >
                          <td className="px-6 py-3 font-mono text-xs tabular-figures text-muted-foreground">
                            {r.recorded_at.replace('T', ' ').slice(0, 19)}
                          </td>
                          <td className="px-6 py-3 text-foreground">
                            {r.generator_name}
                          </td>
                          <td className="px-6 py-3 text-foreground">
                            {r.waste_name}
                          </td>
                          <td className="px-6 py-3">
                            <HazardBadge
                              code={r.hazard_code}
                              name={r.hazard_name}
                            />
                          </td>
                          <td className="px-6 py-3 text-right font-mono tabular-figures text-foreground">
                            {NUM.format(r.weight_kg)}
                          </td>
                        </tr>
                      ))
                    : exits.slice(0, 50).map((r) => (
                        <tr
                          key={r.exit_id}
                          className="border-b border-border/40 last:border-0 hover:bg-muted/30"
                        >
                          <td className="px-6 py-3 font-mono text-xs tabular-figures text-muted-foreground">
                            {r.dispatched_at.replace('T', ' ').slice(0, 19)}
                          </td>
                          <td className="px-6 py-3 text-foreground">
                            {r.waste_name}
                          </td>
                          <td className="px-6 py-3">
                            <HazardBadge
                              code={r.hazard_code}
                              name={r.hazard_name}
                            />
                          </td>
                          <td className="px-6 py-3 text-foreground">
                            {r.receptor_name}
                          </td>
                          <td className="px-6 py-3 font-mono text-xs tabular-figures text-muted-foreground">
                            {r.manifesto_number ?? '—'}
                          </td>
                          <td className="px-6 py-3 text-right font-mono tabular-figures text-foreground">
                            {NUM.format(r.weight_kg)}
                          </td>
                        </tr>
                      ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}

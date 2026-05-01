import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Boxes, Clock, PackagePlus, Scale } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Card, CardHeader, CardTitle } from "@/shared/ui/card";
import { StatCard } from "@/shared/ui/stat-card";
import { HazardBadge } from "@/shared/ui/hazard-badge";
import { EmptyState } from "@/shared/ui/empty-state";
import { Banner } from "@/shared/ui/banner";
import { PageHeader } from "@/shared/layout/PageHeader";
import { useGenerator } from "@/shared/layout/GeneratorContext";
import { useResiduos } from "../hooks/useResiduos";

const NUM = new Intl.NumberFormat("es-CO", { maximumFractionDigits: 2 });

function daysUntilDeadline(firstEntryAt: string | null): number | null {
  if (!firstEntryAt) return null;
  const first = new Date(firstEntryAt).getTime();
  const deadline = first + 365 * 24 * 60 * 60 * 1000;
  const diffMs = deadline - Date.now();
  return Math.ceil(diffMs / (24 * 60 * 60 * 1000));
}

export default function ResiduosPage() {
  const { generator } = useGenerator();
  const { residuos, loading, error } = useResiduos({
    generatorId: generator?.id,
  });

  const totalKg = useMemo(
    () => residuos.reduce((s, r) => s + r.current_stock_kg, 0),
    [residuos],
  );
  const nearDeadline = useMemo(
    () =>
      residuos.filter((r) => {
        const d = daysUntilDeadline(r.first_entry_at);
        return d !== null && d <= 30;
      }).length,
    [residuos],
  );

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Inventario"
        title="Residuos en Stock"
        description={
          generator?.legal_name
            ? `Stock vigente para ${generator.legal_name}`
            : "Inventario consolidado del generador activo"
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Stock total"
          value={
            <>
              {NUM.format(totalKg)}{" "}
              <span className="font-mono text-base font-medium text-muted-foreground">
                kg
              </span>
            </>
          }
          hint="Suma de todos los residuos"
          icon={Scale}
          tone="primary"
        />
        <StatCard
          label="Residuos catalogados"
          value={residuos.length}
          hint="Master records"
          icon={Boxes}
        />
        <StatCard
          label="Proximos al limite"
          value={nearDeadline}
          hint="≤ 30 dias para limite legal"
          icon={Clock}
          tone={nearDeadline > 0 ? "warning" : "default"}
        />
      </div>

      {error && <Banner tone="error">{error}</Banner>}

      {loading && (
        <Card>
          <p className="px-6 py-12 text-center text-sm text-muted-foreground">
            Cargando inventario...
          </p>
        </Card>
      )}

      {!loading && !error && residuos.length === 0 && (
        <EmptyState
          icon={Boxes}
          title="Sin residuos en stock"
          description="Aun no se ha registrado ninguna entrada para este generador."
          action={
            <Button asChild>
              <Link to="/entrada">
                <PackagePlus className="h-4 w-4" />
                Registrar primera entrada
              </Link>
            </Button>
          }
        />
      )}

      {!loading && !error && residuos.length > 0 && (
        <Card className="overflow-hidden">
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle>Inventario detallado</CardTitle>
              <p className="text-xs text-muted-foreground">
                {residuos.length} residuo(s) · ordenados por nombre
              </p>
            </div>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border/60 bg-muted/40 text-left text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                <tr>
                  <th className="px-6 py-3">Nombre</th>
                  <th className="px-6 py-3">Caracteristica</th>
                  <th className="px-6 py-3 text-right">Stock</th>
                  <th className="px-6 py-3 text-right">Vence en</th>
                </tr>
              </thead>
              <tbody>
                {residuos.map((r) => (
                  <tr
                    key={r.id}
                    className="border-b border-border/40 last:border-0 hover:bg-muted/30"
                  >
                    <td className="px-6 py-3.5">
                      <p className="font-medium text-foreground">{r.name}</p>
                      {r.first_entry_at && (
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          Desde{" "}
                          {new Date(r.first_entry_at).toLocaleDateString(
                            "es-CO",
                          )}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-3.5">
                      <HazardBadge code={r.hazard_code} name={r.hazard_name} />
                    </td>
                    <td className="px-6 py-3.5 text-right font-mono tabular-figures text-foreground">
                      {NUM.format(r.current_stock_kg)}
                      <span className="text-muted-foreground"> kg</span>
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <DeadlineCell firstEntryAt={r.first_entry_at} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

function DeadlineCell({ firstEntryAt }: { firstEntryAt: string | null }) {
  const days = daysUntilDeadline(firstEntryAt);
  if (days === null)
    return <span className="text-muted-foreground/60">—</span>;
  if (days < 0)
    return (
      <span className="inline-flex items-center rounded-full bg-destructive/10 px-2 py-0.5 text-xs font-semibold text-destructive">
        Vencido {Math.abs(days)}d
      </span>
    );
  if (days <= 30)
    return (
      <span className="inline-flex items-center rounded-full bg-warning/15 px-2 py-0.5 text-xs font-semibold text-[hsl(38_80%_28%)]">
        {days} dias
      </span>
    );
  return (
    <span className="text-sm text-muted-foreground tabular-figures">
      {days} dias
    </span>
  );
}

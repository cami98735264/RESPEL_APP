import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Boxes,
  Layers,
  AlertTriangle,
  Scale,
  ArrowDownLeft,
  ArrowUpRight,
  PackagePlus,
  Truck,
  ArrowRight,
} from "lucide-react";
import { PageHeader } from "@/shared/layout/PageHeader";
import { useGenerator } from "@/shared/layout/GeneratorContext";
import { Card, CardHeader, CardTitle } from "@/shared/ui/card";
import { StatCard } from "@/shared/ui/stat-card";
import { HazardBadge } from "@/shared/ui/hazard-badge";
import { Button } from "@/shared/ui/button";
import { EmptyState } from "@/shared/ui/empty-state";
import {
  alertsService,
  wasteEntriesService,
  wasteExitsService,
  wastesService,
} from "@/features/residuos/services/residuos.service";
import type {
  StorageLimitAlert,
  WasteEntry,
  WasteExit,
  WasteWithHazard,
} from "@shared/types";

const CATEGORY_LABEL: Record<number, string> = {
  1: "Pequeno",
  2: "Mediano",
  3: "Grande",
};

const NUM = new Intl.NumberFormat("es-CO", { maximumFractionDigits: 2 });
const DATE = new Intl.DateTimeFormat("es-CO", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

function formatDate(iso: string) {
  return DATE.format(new Date(iso));
}

export default function DashboardPage() {
  const { generator } = useGenerator();
  const [wastes, setWastes] = useState<WasteWithHazard[]>([]);
  const [entries, setEntries] = useState<WasteEntry[]>([]);
  const [exits, setExits] = useState<WasteExit[]>([]);
  const [storageAlerts, setStorageAlerts] = useState<StorageLimitAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!generator) return;
    let alive = true;
    setLoading(true);
    Promise.all([
      wastesService.list({ generatorId: generator.id }),
      wasteEntriesService.list({ generatorId: generator.id, limit: 5 }),
      wasteExitsService.list({ generatorId: generator.id, limit: 5 }),
      alertsService.listStorage({ open: true, generatorId: generator.id }),
    ])
      .then(([w, e, x, s]) => {
        if (!alive) return;
        setWastes(w);
        setEntries(e);
        setExits(x);
        setStorageAlerts(s);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [generator]);

  const wasteById = useMemo(() => {
    const map = new Map<number, WasteWithHazard>();
    wastes.forEach((w) => map.set(w.id, w));
    return map;
  }, [wastes]);

  const totalStock = useMemo(
    () => wastes.reduce((s, w) => s + w.current_stock_kg, 0),
    [wastes],
  );

  const activeWastes = useMemo(
    () => wastes.filter((w) => w.current_stock_kg > 0).length,
    [wastes],
  );

  const hazardBreakdown = useMemo(() => {
    const map = new Map<string, { code: string; name: string; total: number }>();
    wastes.forEach((w) => {
      if (w.current_stock_kg <= 0) return;
      const cur = map.get(w.hazard_code) ?? {
        code: w.hazard_code,
        name: w.hazard_name,
        total: 0,
      };
      cur.total += w.current_stock_kg;
      map.set(w.hazard_code, cur);
    });
    const arr = Array.from(map.values()).sort((a, b) => b.total - a.total);
    const max = Math.max(...arr.map((r) => r.total), 0.0001);
    return { rows: arr, max };
  }, [wastes]);

  return (
    <div className="space-y-8">
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
        <PageHeader
          eyebrow="Resumen del generador"
          title="Estado actual"
          description={
            generator
              ? `${generator.legal_name} - NIT ${generator.nit}`
              : "Indicadores en vivo, ultima actividad y alertas operativas."
          }
          actions={
            <>
              <Button asChild variant="outline">
                <Link to="/entrada">
                  <PackagePlus className="h-4 w-4" />
                  Nueva entrada
                </Link>
              </Button>
              <Button asChild>
                <Link to="/salida">
                  <Truck className="h-4 w-4" />
                  Registrar salida
                </Link>
              </Button>
            </>
          }
        />
      </div>

      {/* Stat strip */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 delay-75">
          <StatCard
            label="Stock total"
            value={
              <>
                {NUM.format(totalStock)}{" "}
                <span className="font-mono text-base font-medium text-muted-foreground">
                  kg
                </span>
              </>
            }
            hint={loading ? "Calculando..." : `${wastes.length} residuos en catalogo`}
            icon={Scale}
            tone="primary"
          />
        </div>
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 delay-100">
          <StatCard
            label="Categoria actual"
            value={
              generator?.current_category_id
                ? CATEGORY_LABEL[generator.current_category_id] ?? "—"
                : "—"
            }
            hint="Decreto 4741/2005, Art. 28"
            icon={Layers}
          />
        </div>
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 delay-150">
          <StatCard
            label="Residuos activos"
            value={activeWastes}
            hint="Con stock disponible"
            icon={Boxes}
          />
        </div>
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 delay-200">
          <StatCard
            label="Alertas vigentes"
            value={storageAlerts.length}
            hint="Limite de almacenamiento (12m)"
            icon={AlertTriangle}
            tone={storageAlerts.length > 0 ? "warning" : "default"}
          />
        </div>
      </div>

      {/* Two-column body */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* Hazard breakdown */}
        <Card className="lg:col-span-3 animate-in fade-in slide-in-from-bottom-2 duration-500 delay-200">
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle>Composicion del stock</CardTitle>
              <p className="text-xs text-muted-foreground">
                Distribucion por caracteristica de peligrosidad
              </p>
            </div>
            <Link
              to="/residuos"
              className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
            >
              Ver inventario
              <ArrowRight className="h-3 w-3" />
            </Link>
          </CardHeader>
          <div className="px-6 py-5">
            {hazardBreakdown.rows.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                {loading ? "Cargando..." : "Sin stock para mostrar."}
              </p>
            ) : (
              <ul className="space-y-3.5">
                {hazardBreakdown.rows.map((r) => {
                  const pct = (r.total / hazardBreakdown.max) * 100;
                  return (
                    <li key={r.code}>
                      <div className="mb-1.5 flex items-center justify-between gap-3">
                        <HazardBadge code={r.code} name={r.name} />
                        <span className="font-mono text-sm tabular-figures text-foreground">
                          {NUM.format(r.total)}{" "}
                          <span className="text-muted-foreground">kg</span>
                        </span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary transition-[width] duration-700 ease-out"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </Card>

        {/* Recent activity */}
        <Card className="lg:col-span-2 animate-in fade-in slide-in-from-bottom-2 duration-500 delay-300">
          <CardHeader>
            <CardTitle>Movimientos recientes</CardTitle>
            <p className="text-xs text-muted-foreground">
              Ultimas entradas y salidas registradas
            </p>
          </CardHeader>
          <div className="divide-y divide-border/60">
            {entries.length === 0 && exits.length === 0 ? (
              <p className="px-6 py-10 text-center text-sm text-muted-foreground">
                {loading ? "Cargando..." : "Sin movimientos registrados."}
              </p>
            ) : (
              [...entries.map((e) => ({ kind: "in" as const, id: `e-${e.id}`, at: e.recorded_at, weight: e.weight_kg, waste_id: e.waste_id })),
                ...exits.map((x) => ({ kind: "out" as const, id: `x-${x.id}`, at: x.dispatched_at, weight: x.weight_kg, waste_id: x.waste_id }))]
                .sort((a, b) => (a.at < b.at ? 1 : -1))
                .slice(0, 7)
                .map((m) => {
                  const waste = wasteById.get(m.waste_id);
                  return (
                    <div
                      key={m.id}
                      className="flex items-start gap-3 px-6 py-3"
                    >
                      <span
                        className={
                          "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full " +
                          (m.kind === "in"
                            ? "bg-success/10 text-success"
                            : "bg-accent/10 text-accent")
                        }
                      >
                        {m.kind === "in" ? (
                          <ArrowDownLeft className="h-3.5 w-3.5" />
                        ) : (
                          <ArrowUpRight className="h-3.5 w-3.5" />
                        )}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">
                          {waste?.name ?? `Residuo #${m.waste_id}`}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {m.kind === "in" ? "Entrada" : "Salida"} ·{" "}
                          {formatDate(m.at)}
                        </p>
                      </div>
                      <p className="font-mono text-sm tabular-figures text-foreground">
                        {m.kind === "out" ? "-" : "+"}
                        {NUM.format(m.weight)}{" "}
                        <span className="text-muted-foreground">kg</span>
                      </p>
                    </div>
                  );
                })
            )}
          </div>
        </Card>
      </div>

      {/* Storage alerts list */}
      {storageAlerts.length > 0 && (
        <Card className="animate-in fade-in slide-in-from-bottom-2 duration-500 delay-300">
          <CardHeader>
            <CardTitle>Limites de almacenamiento proximos a vencer</CardTitle>
            <p className="text-xs text-muted-foreground">
              Residuos a 30 dias o menos del limite legal de 12 meses.
            </p>
          </CardHeader>
          <ul className="divide-y divide-border/60">
            {storageAlerts.slice(0, 5).map((a) => {
              const waste = wasteById.get(a.waste_id);
              const days = Math.ceil(
                (new Date(a.deadline_date).getTime() - Date.now()) /
                  (24 * 60 * 60 * 1000),
              );
              return (
                <li
                  key={a.id}
                  className="flex items-center justify-between gap-3 px-6 py-3 text-sm"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-foreground">
                      {waste?.name ?? `Residuo #${a.waste_id}`}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Limite el{" "}
                      {new Date(a.deadline_date).toLocaleDateString("es-CO")}
                    </p>
                  </div>
                  <span
                    className={
                      "rounded-full px-2.5 py-0.5 text-xs font-medium " +
                      (days < 0
                        ? "bg-destructive/10 text-destructive"
                        : "bg-[hsl(var(--warning)/0.12)] text-[hsl(38_80%_30%)]")
                    }
                  >
                    {days < 0 ? `Vencido ${Math.abs(days)}d` : `${days} dias`}
                  </span>
                </li>
              );
            })}
          </ul>
        </Card>
      )}

      {!loading && wastes.length === 0 && (
        <EmptyState
          icon={PackagePlus}
          title="Comience el control de residuos"
          description="Aun no hay residuos registrados para este generador."
          action={
            <Button asChild>
              <Link to="/entrada">Registrar primera entrada</Link>
            </Button>
          }
        />
      )}
    </div>
  );
}

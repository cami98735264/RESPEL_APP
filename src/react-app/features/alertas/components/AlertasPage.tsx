import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  AlertTriangle,
  Bell,
  CalendarClock,
  CheckCircle2,
  Clock,
  Eye,
  Layers,
  MessageSquareWarning,
  RefreshCcw,
  Scale,
} from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Card, CardHeader, CardTitle } from "@/shared/ui/card";
import { Badge } from "@/shared/ui/badge";
import { Banner } from "@/shared/ui/banner";
import { EmptyState } from "@/shared/ui/empty-state";
import { StatCard } from "@/shared/ui/stat-card";
import { PageHeader } from "@/shared/layout/PageHeader";
import { cn } from "@/lib/utils";
import { useAlertasFeed } from "../hooks/useAlertasFeed";
import {
  AlertDetailDrawer,
  type SelectedAlert,
} from "./AlertDetailDrawer";

const DATE = new Intl.DateTimeFormat("es-CO", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});
const NUM = new Intl.NumberFormat("es-CO", { maximumFractionDigits: 2 });

const formatDate = (iso: string | null) => {
  if (!iso) return "—";
  try {
    return DATE.format(new Date(iso));
  } catch {
    return iso;
  }
};

type Tab = "categoria" | "categoria-proyectada" | "almacenamiento";

export default function AlertasPage() {
  const {
    category,
    projectedCategory,
    storage,
    loading,
    error,
    refresh,
    acknowledgeCategory,
    acknowledgeProjectedCategory,
    resolveStorage,
  } = useAlertasFeed();
  const [searchParams, setSearchParams] = useSearchParams();
  const tipo = searchParams.get("tipo");
  const initialTab: Tab =
    tipo === "almacenamiento"
      ? "almacenamiento"
      : tipo === "categoria-proyectada"
        ? "categoria-proyectada"
        : "categoria";
  const [tab, setTab] = useState<Tab>(initialTab);
  const [selected, setSelected] = useState<SelectedAlert | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    const idStr = searchParams.get("id");
    if (!idStr) return;
    const id = Number(idStr);
    if (Number.isNaN(id)) return;
    if (tab === "categoria") {
      const found = category.find((a) => a.id === id);
      if (found) {
        setSelected({ type: "category", alert: found });
        setDrawerOpen(true);
      }
    } else if (tab === "categoria-proyectada") {
      const found = projectedCategory.find((a) => a.id === id);
      if (found) {
        setSelected({ type: "projected-category", alert: found });
        setDrawerOpen(true);
      }
    } else {
      const found = storage.find((a) => a.id === id);
      if (found) {
        setSelected({ type: "storage", alert: found });
        setDrawerOpen(true);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, tab, category.length, projectedCategory.length, storage.length]);

  const stats = useMemo(() => {
    const unack = category.filter((a) => a.acknowledged === 0).length;
    const projected = projectedCategory.filter((a) => a.acknowledged === 0).length;
    const open = storage.filter((a) => a.resolved === 0).length;
    return {
      unack,
      projected,
      open,
      total: unack + projected + open,
    };
  }, [category, projectedCategory, storage]);

  const switchTab = (next: Tab) => {
    setTab(next);
    const params = new URLSearchParams(searchParams);
    params.set("tipo", next);
    params.delete("id");
    setSearchParams(params, { replace: true });
  };

  const openDetail = (sel: SelectedAlert) => {
    setSelected(sel);
    setDrawerOpen(true);
  };

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Monitoreo · Alertas"
        title="Alertas"
        description="Eventos del sistema que requieren atención. Las alertas se actualizan en tiempo real conforme se generan entradas y se ejecuta el barrido diario de almacenamiento."
        actions={
          <Button
            variant="outline"
            onClick={() => void refresh()}
            disabled={loading}
            className="gap-2"
          >
            <RefreshCcw className={cn("h-4 w-4", loading && "animate-spin")} />
            Actualizar
          </Button>
        }
      />

      {error && <Banner tone="error">{error}</Banner>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Pendientes totales"
          value={stats.total}
          icon={Bell}
          tone={stats.total > 0 ? "warning" : "default"}
          hint="Sin atender o resolver"
        />
        <StatCard
          label="Categoría sin atender"
          value={stats.unack}
          icon={Layers}
          tone={stats.unack > 0 ? "primary" : "default"}
          hint={`${category.length} en historial`}
        />
        <StatCard
          label="Preventivas abiertas"
          value={stats.projected}
          icon={MessageSquareWarning}
          tone={stats.projected > 0 ? "warning" : "default"}
          hint={`${projectedCategory.length} en historial`}
        />
        <StatCard
          label="Almacenamiento abierto"
          value={stats.open}
          icon={CalendarClock}
          tone={stats.open > 0 ? "warning" : "default"}
          hint={`${storage.length} en historial`}
        />
      </div>

      <div className="flex items-center gap-2 border-b border-border">
        <TabButton
          active={tab === "categoria"}
          onClick={() => switchTab("categoria")}
        >
          <Layers className="mr-1.5 h-4 w-4" />
          Categoría
          {stats.unack > 0 && (
            <Badge
              variant="default"
              className="ml-2 h-5 min-w-[20px] justify-center bg-amber-600 px-1.5 text-[10px]"
            >
              {stats.unack}
            </Badge>
          )}
        </TabButton>
        <TabButton
          active={tab === "categoria-proyectada"}
          onClick={() => switchTab("categoria-proyectada")}
        >
          <MessageSquareWarning className="mr-1.5 h-4 w-4" />
          Preventivas
          {stats.projected > 0 && (
            <Badge
              variant="default"
              className="ml-2 h-5 min-w-[20px] justify-center bg-orange-600 px-1.5 text-[10px]"
            >
              {stats.projected}
            </Badge>
          )}
        </TabButton>
        <TabButton
          active={tab === "almacenamiento"}
          onClick={() => switchTab("almacenamiento")}
        >
          <CalendarClock className="mr-1.5 h-4 w-4" />
          Almacenamiento
          {stats.open > 0 && (
            <Badge
              variant="default"
              className="ml-2 h-5 min-w-[20px] justify-center bg-rose-600 px-1.5 text-[10px]"
            >
              {stats.open}
            </Badge>
          )}
        </TabButton>
      </div>

      {loading ? (
        <Card>
          <div className="px-6 py-12 text-center text-sm text-muted-foreground">
            Cargando alertas...
          </div>
        </Card>
      ) : tab === "categoria" ? (
        category.length === 0 ? (
          <EmptyState
            icon={CheckCircle2}
            title="Sin alertas de categoría"
            description="Todo en orden. Las alertas se crean automáticamente al recalcular la categoría del generador."
          />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Cambios de categoría</CardTitle>
              <p className="text-xs text-muted-foreground">
                {category.length} alerta{category.length === 1 ? "" : "s"} en historial
              </p>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  <tr>
                    <th className="px-6 py-3 text-left">Mes</th>
                    <th className="px-6 py-3 text-left">Categoría</th>
                    <th className="px-6 py-3 text-left">Promedio móvil</th>
                    <th className="px-6 py-3 text-left">Generada</th>
                    <th className="px-6 py-3 text-left">Estado</th>
                    <th className="px-6 py-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {category.map((a) => (
                    <tr
                      key={a.id}
                      className={
                        a.acknowledged === 0
                          ? "transition-colors hover:bg-muted/30"
                          : "bg-muted/10 text-muted-foreground"
                      }
                    >
                      <td className="px-6 py-3 font-mono text-xs tabular-figures text-foreground">
                        {a.trigger_month}
                      </td>
                      <td className="px-6 py-3 text-foreground">
                        {a.previous_category_id ?? "—"} → {a.new_category_id}
                      </td>
                      <td className="px-6 py-3 font-mono text-xs tabular-figures text-foreground">
                        <span className="inline-flex items-center gap-1">
                          <Scale className="h-3 w-3 text-muted-foreground" />
                          {NUM.format(a.rolling_avg_kg)} kg
                        </span>
                      </td>
                      <td className="px-6 py-3 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDate(a.created_at)}
                        </span>
                      </td>
                      <td className="px-6 py-3">
                        {a.acknowledged === 1 ? (
                          <Badge
                            variant="outline"
                            className="border-emerald-500/40 text-emerald-700"
                          >
                            <CheckCircle2 className="mr-1 h-3 w-3" />
                            Atendida
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="border-amber-500/40 text-amber-700"
                          >
                            <AlertTriangle className="mr-1 h-3 w-3" />
                            Pendiente
                          </Badge>
                        )}
                      </td>
                      <td className="px-6 py-3 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            openDetail({ type: "category", alert: a })
                          }
                          className="gap-1.5"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          Ver detalle
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )
      ) : tab === "categoria-proyectada" ? (
        projectedCategory.length === 0 ? (
          <EmptyState
            icon={CheckCircle2}
            title="Sin alertas preventivas"
            description="No hay proyecciones activas de cambio de categoría."
          />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Alertas preventivas de categoría</CardTitle>
              <p className="text-xs text-muted-foreground">
                {projectedCategory.length} alerta{projectedCategory.length === 1 ? "" : "s"} en historial
              </p>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  <tr>
                    <th className="px-6 py-3 text-left">Mes</th>
                    <th className="px-6 py-3 text-left">Proyección</th>
                    <th className="px-6 py-3 text-left">Acumulado</th>
                    <th className="px-6 py-3 text-left">Exceso</th>
                    <th className="px-6 py-3 text-left">WhatsApp</th>
                    <th className="px-6 py-3 text-left">Estado</th>
                    <th className="px-6 py-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {projectedCategory.map((a) => (
                    <tr
                      key={a.id}
                      className={
                        a.acknowledged === 0
                          ? "transition-colors hover:bg-muted/30"
                          : "bg-muted/10 text-muted-foreground"
                      }
                    >
                      <td className="px-6 py-3 font-mono text-xs tabular-figures text-foreground">
                        {a.trigger_month}
                      </td>
                      <td className="px-6 py-3 text-foreground">
                        {a.current_category_id ?? "—"} → {a.projected_category_id}
                      </td>
                      <td className="px-6 py-3 font-mono text-xs tabular-figures text-foreground">
                        {NUM.format(a.month_total_kg)} kg
                      </td>
                      <td className="px-6 py-3 font-mono text-xs tabular-figures text-foreground">
                        <span className="inline-flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3 text-orange-600" />
                          {NUM.format(a.exceeded_by_kg)} kg/mes
                        </span>
                      </td>
                      <td className="px-6 py-3 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <MessageSquareWarning className="h-3 w-3" />
                          {a.whatsapp_status}
                        </span>
                      </td>
                      <td className="px-6 py-3">
                        {a.acknowledged === 1 ? (
                          <Badge
                            variant="outline"
                            className="border-emerald-500/40 text-emerald-700"
                          >
                            <CheckCircle2 className="mr-1 h-3 w-3" />
                            Atendida
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="border-orange-500/40 text-orange-700"
                          >
                            <AlertTriangle className="mr-1 h-3 w-3" />
                            Preventiva
                          </Badge>
                        )}
                      </td>
                      <td className="px-6 py-3 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            openDetail({ type: "projected-category", alert: a })
                          }
                          className="gap-1.5"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          Ver detalle
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )
      ) : storage.length === 0 ? (
        <EmptyState
          icon={CheckCircle2}
          title="Sin alertas de almacenamiento"
          description="Ningún residuo está próximo a cumplir el límite de 365 días."
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Plazos de almacenamiento</CardTitle>
            <p className="text-xs text-muted-foreground">
              {storage.length} alerta{storage.length === 1 ? "" : "s"} en historial
            </p>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                <tr>
                  <th className="px-6 py-3 text-left">Residuo</th>
                  <th className="px-6 py-3 text-left">Primera entrada</th>
                  <th className="px-6 py-3 text-left">Vencimiento</th>
                  <th className="px-6 py-3 text-left">Generada</th>
                  <th className="px-6 py-3 text-left">Estado</th>
                  <th className="px-6 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {storage.map((a) => (
                  <tr
                    key={a.id}
                    className={
                      a.resolved === 0
                        ? "transition-colors hover:bg-muted/30"
                        : "bg-muted/10 text-muted-foreground"
                    }
                  >
                    <td className="px-6 py-3 font-mono text-xs tabular-figures text-foreground">
                      #{a.waste_id}
                    </td>
                    <td className="px-6 py-3 text-xs text-muted-foreground">
                      {formatDate(a.first_entry_at)}
                    </td>
                    <td className="px-6 py-3 text-xs text-foreground">
                      <span className="inline-flex items-center gap-1">
                        <CalendarClock className="h-3 w-3 text-rose-600" />
                        {formatDate(a.deadline_date)}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-xs text-muted-foreground">
                      {formatDate(a.alerted_at)}
                    </td>
                    <td className="px-6 py-3">
                      {a.resolved === 1 ? (
                        <Badge
                          variant="outline"
                          className="border-emerald-500/40 text-emerald-700"
                        >
                          <CheckCircle2 className="mr-1 h-3 w-3" />
                          Resuelta
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="border-rose-500/40 text-rose-700"
                        >
                          <AlertTriangle className="mr-1 h-3 w-3" />
                          Abierta
                        </Badge>
                      )}
                    </td>
                    <td className="px-6 py-3 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          openDetail({ type: "storage", alert: a })
                        }
                        className="gap-1.5"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        Ver detalle
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <AlertDetailDrawer
        open={drawerOpen}
        onOpenChange={(open) => {
          setDrawerOpen(open);
          if (!open) setSelected(null);
        }}
        selected={selected}
        onAcknowledgeCategory={acknowledgeCategory}
        onAcknowledgeProjectedCategory={acknowledgeProjectedCategory}
        onResolveStorage={resolveStorage}
      />
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center border-b-2 px-4 py-2.5 text-sm font-medium transition",
        active
          ? "border-primary text-foreground"
          : "border-transparent text-muted-foreground hover:text-foreground"
      )}
    >
      {children}
    </button>
  );
}

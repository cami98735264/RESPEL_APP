import { useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Hash,
  Layers,
  MessageSquare,
  Scale,
} from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Banner } from "@/shared/ui/banner";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/shared/ui/sheet";
import { ApiError } from "@/shared/lib/api";
import type {
  GeneratorCategoryAlert,
  ProjectedCategoryAlert,
  StorageLimitAlert,
} from "@shared/types";

const DATE = new Intl.DateTimeFormat("es-CO", {
  year: "numeric",
  month: "short",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

const NUM = new Intl.NumberFormat("es-CO", { maximumFractionDigits: 2 });

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  try {
    return DATE.format(new Date(iso));
  } catch {
    return iso;
  }
}

export type SelectedAlert =
  | { type: "category"; alert: GeneratorCategoryAlert }
  | { type: "projected-category"; alert: ProjectedCategoryAlert }
  | { type: "storage"; alert: StorageLimitAlert };

interface AlertDetailDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selected: SelectedAlert | null;
  onAcknowledgeCategory: (id: number) => Promise<void>;
  onAcknowledgeProjectedCategory: (id: number) => Promise<void>;
  onResolveStorage: (id: number) => Promise<void>;
}

export function AlertDetailDrawer({
  open,
  onOpenChange,
  selected,
  onAcknowledgeCategory,
  onAcknowledgeProjectedCategory,
  onResolveStorage,
}: AlertDetailDrawerProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!selected) return null;

  const closed =
    selected.type === "storage"
      ? selected.alert.resolved === 1
      : selected.alert.acknowledged === 1;

  const handleAction = async () => {
    setBusy(true);
    setError(null);
    try {
      if (selected.type === "category") {
        await onAcknowledgeCategory(selected.alert.id);
      } else if (selected.type === "projected-category") {
        await onAcknowledgeProjectedCategory(selected.alert.id);
      } else {
        await onResolveStorage(selected.alert.id);
      }
      onOpenChange(false);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "No se pudo actualizar la alerta."
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full max-w-md">
        <SheetHeader>
          <div className="flex items-center gap-2">
            {closed ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-amber-600" />
            )}
            <SheetTitle>{titleFor(selected.type)}</SheetTitle>
          </div>
          <SheetDescription>{descriptionFor(selected.type)}</SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {error && (
            <Banner tone="error" onDismiss={() => setError(null)}>
              {error}
            </Banner>
          )}

          <dl className="mt-2 space-y-4">
            <DetailRow icon={Hash} label="ID alerta" value={`#${selected.alert.id}`} />
            <DetailRow
              icon={Hash}
              label="Generador"
              value={`#${selected.alert.generator_id}`}
            />
            {selected.type === "category" && (
              <>
                <DetailRow
                  icon={Layers}
                  label="Categoría previa"
                  value={
                    selected.alert.previous_category_id != null
                      ? `#${selected.alert.previous_category_id}`
                      : "Sin categoría"
                  }
                />
                <DetailRow
                  icon={Layers}
                  label="Categoría nueva"
                  value={`#${selected.alert.new_category_id}`}
                />
                <DetailRow
                  icon={Clock}
                  label="Mes desencadenante"
                  value={selected.alert.trigger_month}
                />
                <DetailRow
                  icon={Scale}
                  label="Promedio móvil"
                  value={`${NUM.format(selected.alert.rolling_avg_kg)} kg/mes`}
                />
                <DetailRow
                  icon={Clock}
                  label="Creada"
                  value={formatDate(selected.alert.created_at)}
                />
                <DetailRow
                  icon={CheckCircle2}
                  label="Atendida"
                  value={formatDate(selected.alert.acknowledged_at)}
                />
              </>
            )}
            {selected.type === "projected-category" && (
              <>
                <DetailRow
                  icon={Layers}
                  label="Categoría actual"
                  value={
                    selected.alert.current_category_id != null
                      ? `#${selected.alert.current_category_id}`
                      : "Sin categoría"
                  }
                />
                <DetailRow
                  icon={Layers}
                  label="Categoría proyectada"
                  value={`#${selected.alert.projected_category_id}`}
                />
                <DetailRow
                  icon={Clock}
                  label="Mes evaluado"
                  value={selected.alert.trigger_month}
                />
                <DetailRow
                  icon={Scale}
                  label="Acumulado del mes"
                  value={`${NUM.format(selected.alert.month_total_kg)} kg`}
                />
                <DetailRow
                  icon={Scale}
                  label="Promedio proyectado"
                  value={`${NUM.format(selected.alert.projected_rolling_avg_kg)} kg/mes`}
                />
                <DetailRow
                  icon={Scale}
                  label="Umbral de categoría"
                  value={`${NUM.format(selected.alert.threshold_kg)} kg/mes`}
                />
                <DetailRow
                  icon={AlertTriangle}
                  label="Exceso calculado"
                  value={`${NUM.format(selected.alert.exceeded_by_kg)} kg/mes`}
                />
                <DetailRow
                  icon={MessageSquare}
                  label="Estado WhatsApp"
                  value={selected.alert.whatsapp_status}
                />
                <DetailRow
                  icon={Clock}
                  label="Enviado por WhatsApp"
                  value={formatDate(selected.alert.whatsapp_sent_at)}
                />
                <DetailRow
                  icon={Clock}
                  label="Atendida"
                  value={formatDate(selected.alert.acknowledged_at)}
                />
              </>
            )}
            {selected.type === "storage" && (
              <>
                <DetailRow
                  icon={Hash}
                  label="Residuo"
                  value={`#${selected.alert.waste_id}`}
                />
                <DetailRow
                  icon={Clock}
                  label="Primera entrada"
                  value={formatDate(selected.alert.first_entry_at)}
                />
                <DetailRow
                  icon={Clock}
                  label="Fecha límite"
                  value={formatDate(selected.alert.deadline_date)}
                />
                <DetailRow
                  icon={Clock}
                  label="Generada"
                  value={formatDate(selected.alert.alerted_at)}
                />
                <DetailRow
                  icon={CheckCircle2}
                  label="Resuelta"
                  value={formatDate(selected.alert.resolved_at)}
                />
              </>
            )}
          </dl>
        </div>

        <SheetFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={busy}
          >
            Cerrar
          </Button>
          {!closed && (
            <Button onClick={handleAction} disabled={busy} className="ml-auto">
              {busy ? "Guardando..." : actionLabelFor(selected.type)}
            </Button>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function titleFor(type: SelectedAlert["type"]): string {
  switch (type) {
    case "category":
      return "Alerta de cambio de categoría";
    case "projected-category":
      return "Alerta preventiva de categoría";
    case "storage":
      return "Alerta de almacenamiento";
  }
}

function descriptionFor(type: SelectedAlert["type"]): string {
  switch (type) {
    case "category":
      return "El promedio mensual del generador cruzó un umbral de categoría.";
    case "projected-category":
      return "El sistema detectó que el acumulado del mes puede provocar un cambio de categoría.";
    case "storage":
      return "Un residuo está próximo a cumplir 365 días en almacenamiento.";
  }
}

function actionLabelFor(type: SelectedAlert["type"]): string {
  switch (type) {
    case "category":
    case "projected-category":
      return "Marcar como atendida";
    case "storage":
      return "Marcar como resuelta";
  }
}

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-muted/50 text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
      </span>
      <div className="min-w-0 flex-1">
        <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          {label}
        </dt>
        <dd className="mt-0.5 text-sm text-foreground">{value}</dd>
      </div>
    </div>
  );
}

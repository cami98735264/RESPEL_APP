import { useState } from "react";
import { AlertTriangle, CheckCircle2, Clock, Hash, Layers, Scale } from "lucide-react";
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
  | { type: "storage"; alert: StorageLimitAlert };

interface AlertDetailDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selected: SelectedAlert | null;
  onAcknowledgeCategory: (id: number) => Promise<void>;
  onResolveStorage: (id: number) => Promise<void>;
}

export function AlertDetailDrawer({
  open,
  onOpenChange,
  selected,
  onAcknowledgeCategory,
  onResolveStorage,
}: AlertDetailDrawerProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!selected) return null;

  const handleAction = async () => {
    setBusy(true);
    setError(null);
    try {
      if (selected.type === "category") {
        await onAcknowledgeCategory(selected.alert.id);
      } else {
        await onResolveStorage(selected.alert.id);
      }
      onOpenChange(false);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "No se pudo actualizar la alerta."
      );
    } finally {
      setBusy(false);
    }
  };

  const isCategory = selected.type === "category";
  const alert = selected.alert;
  const closed = isCategory
    ? (alert as GeneratorCategoryAlert).acknowledged === 1
    : (alert as StorageLimitAlert).resolved === 1;

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
            <SheetTitle>
              {isCategory
                ? "Alerta de cambio de categoría"
                : "Alerta de almacenamiento"}
            </SheetTitle>
          </div>
          <SheetDescription>
            {isCategory
              ? "El promedio mensual del generador cruzó un umbral de categoría."
              : "Un residuo está próximo a cumplir 365 días en almacenamiento."}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {error && (
            <Banner tone="error" onDismiss={() => setError(null)}>
              {error}
            </Banner>
          )}

          <dl className="mt-2 space-y-4">
            <DetailRow icon={Hash} label="ID alerta" value={`#${alert.id}`} />
            <DetailRow
              icon={Hash}
              label="Generador"
              value={`#${alert.generator_id}`}
            />
            {isCategory ? (
              <>
                <DetailRow
                  icon={Layers}
                  label="Categoría previa"
                  value={
                    (alert as GeneratorCategoryAlert).previous_category_id !=
                    null
                      ? `#${(alert as GeneratorCategoryAlert).previous_category_id}`
                      : "Sin categoría"
                  }
                />
                <DetailRow
                  icon={Layers}
                  label="Categoría nueva"
                  value={`#${(alert as GeneratorCategoryAlert).new_category_id}`}
                />
                <DetailRow
                  icon={Clock}
                  label="Mes desencadenante"
                  value={(alert as GeneratorCategoryAlert).trigger_month}
                />
                <DetailRow
                  icon={Scale}
                  label="Promedio móvil"
                  value={`${NUM.format((alert as GeneratorCategoryAlert).rolling_avg_kg)} kg/mes`}
                />
                <DetailRow
                  icon={Clock}
                  label="Creada"
                  value={formatDate(alert.created_at)}
                />
                <DetailRow
                  icon={CheckCircle2}
                  label="Atendida"
                  value={formatDate(
                    (alert as GeneratorCategoryAlert).acknowledged_at
                  )}
                />
              </>
            ) : (
              <>
                <DetailRow
                  icon={Hash}
                  label="Residuo"
                  value={`#${(alert as StorageLimitAlert).waste_id}`}
                />
                <DetailRow
                  icon={Clock}
                  label="Primera entrada"
                  value={formatDate(
                    (alert as StorageLimitAlert).first_entry_at
                  )}
                />
                <DetailRow
                  icon={Clock}
                  label="Fecha límite"
                  value={formatDate(
                    (alert as StorageLimitAlert).deadline_date
                  )}
                />
                <DetailRow
                  icon={Clock}
                  label="Generada"
                  value={formatDate(
                    (alert as StorageLimitAlert).alerted_at
                  )}
                />
                <DetailRow
                  icon={CheckCircle2}
                  label="Resuelta"
                  value={formatDate(
                    (alert as StorageLimitAlert).resolved_at
                  )}
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
              {busy
                ? "Guardando..."
                : isCategory
                  ? "Marcar como atendida"
                  : "Marcar como resuelta"}
            </Button>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
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

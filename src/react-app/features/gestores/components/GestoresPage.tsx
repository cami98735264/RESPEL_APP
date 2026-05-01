import { useMemo, useState } from "react";
import {
  AlertCircle,
  CalendarClock,
  CheckCircle2,
  Pencil,
  Plus,
  PowerOff,
  ShieldCheck,
  UserPlus,
  Users,
} from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Card, CardHeader, CardTitle } from "@/shared/ui/card";
import { Badge } from "@/shared/ui/badge";
import { Banner } from "@/shared/ui/banner";
import { EmptyState } from "@/shared/ui/empty-state";
import { StatCard } from "@/shared/ui/stat-card";
import { PageHeader } from "@/shared/layout/PageHeader";
import { ApiError } from "@/shared/lib/api";
import type { AuthorizedReceptor } from "@shared/types";
import { useGestores } from "../hooks/useGestores";
import { gestoresService } from "../services/gestores.service";
import { GestorFormDrawer } from "./GestorFormDrawer";

const DATE = new Intl.DateTimeFormat("es-CO", {
  year: "numeric",
  month: "short",
  day: "2-digit",
});

function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const target = new Date(dateStr);
  if (Number.isNaN(target.getTime())) return null;
  const now = new Date();
  const ms = target.getTime() - now.getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

export default function GestoresPage() {
  const { gestores, loading, error, refresh } = useGestores();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<AuthorizedReceptor | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionOk, setActionOk] = useState<string | null>(null);

  const stats = useMemo(() => {
    const total = gestores.length;
    const activos = gestores.filter((g) => g.is_active === 1).length;
    const porVencer = gestores.filter((g) => {
      const d = daysUntil(g.license_expiry);
      return d !== null && d <= 30 && d >= 0;
    }).length;
    return { total, activos, porVencer };
  }, [gestores]);

  function handleNuevo() {
    setEditing(null);
    setDrawerOpen(true);
  }

  function handleEditar(gestor: AuthorizedReceptor) {
    setEditing(gestor);
    setDrawerOpen(true);
  }

  async function handleToggleActive(gestor: AuthorizedReceptor) {
    setActionError(null);
    setActionOk(null);
    const turningOff = gestor.is_active === 1;
    if (turningOff) {
      const ok = window.confirm(
        `Esta seguro de desactivar al gestor "${gestor.legal_name}"? No aparecera en nuevas salidas, pero se conservara el historial.`,
      );
      if (!ok) return;
    }
    try {
      await gestoresService.setActive(gestor.id, !turningOff);
      setActionOk(
        turningOff
          ? `Gestor "${gestor.legal_name}" desactivado.`
          : `Gestor "${gestor.legal_name}" reactivado.`,
      );
      await refresh();
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : "No se pudo actualizar el estado del gestor";
      setActionError(msg);
    }
  }

  function handleSaved() {
    setActionError(null);
    setActionOk(
      editing ? "Cambios guardados correctamente." : "Gestor registrado correctamente.",
    );
    void refresh();
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Configuracion · Gestores"
        title="Gestores Autorizados"
        description="Administre los receptores autorizados para la disposicion final de residuos peligrosos. Los gestores inactivos se conservan para trazabilidad historica."
        actions={
          <Button onClick={handleNuevo} className="gap-2">
            <Plus className="h-4 w-4" />
            Nuevo gestor
          </Button>
        }
      />

      {error && <Banner tone="error">{error}</Banner>}
      {actionError && (
        <Banner tone="error" onDismiss={() => setActionError(null)}>
          {actionError}
        </Banner>
      )}
      {actionOk && (
        <Banner tone="success" onDismiss={() => setActionOk(null)}>
          {actionOk}
        </Banner>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Gestores registrados"
          value={stats.total}
          icon={Users}
          tone="default"
        />
        <StatCard
          label="Activos"
          value={stats.activos}
          icon={ShieldCheck}
          tone="primary"
          hint={
            stats.total > 0
              ? `${stats.total - stats.activos} inactivos`
              : "Aun no hay gestores"
          }
        />
        <StatCard
          label="Licencias por vencer"
          value={stats.porVencer}
          icon={CalendarClock}
          tone={stats.porVencer > 0 ? "warning" : "default"}
          hint="En los proximos 30 dias"
        />
      </div>

      {loading ? (
        <Card>
          <div className="px-6 py-12 text-center text-sm text-muted-foreground">
            Cargando gestores...
          </div>
        </Card>
      ) : gestores.length === 0 ? (
        <EmptyState
          icon={UserPlus}
          title="Aun no hay gestores registrados"
          description="Registre el primer receptor autorizado para poder despachar residuos."
          action={
            <Button onClick={handleNuevo} className="gap-2">
              <Plus className="h-4 w-4" />
              Registrar primer gestor
            </Button>
          }
        />
      ) : (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Listado</CardTitle>
              <p className="text-xs text-muted-foreground">
                {gestores.length} gestor{gestores.length === 1 ? "" : "es"} en total
              </p>
            </div>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                <tr>
                  <th className="px-6 py-3 text-left">Razon social</th>
                  <th className="px-6 py-3 text-left">NIT</th>
                  <th className="px-6 py-3 text-left">Licencia</th>
                  <th className="px-6 py-3 text-left">Vencimiento</th>
                  <th className="px-6 py-3 text-left">Estado</th>
                  <th className="px-6 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {gestores.map((g) => {
                  const days = daysUntil(g.license_expiry);
                  const expiringSoon =
                    days !== null && days <= 30 && days >= 0;
                  const expired = days !== null && days < 0;
                  return (
                    <tr
                      key={g.id}
                      className={
                        g.is_active === 1
                          ? "transition-colors hover:bg-muted/30"
                          : "bg-muted/10 text-muted-foreground"
                      }
                    >
                      <td className="px-6 py-3 font-medium text-foreground">
                        {g.legal_name}
                        {g.contact_email && (
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {g.contact_email}
                          </p>
                        )}
                      </td>
                      <td className="px-6 py-3 font-mono text-xs tabular-figures text-foreground">
                        {g.nit}
                      </td>
                      <td className="px-6 py-3 font-mono text-xs tabular-figures text-foreground">
                        {g.license_number}
                      </td>
                      <td className="px-6 py-3 font-mono text-xs tabular-figures">
                        {g.license_expiry ? (
                          <span
                            className={
                              expired
                                ? "text-destructive"
                                : expiringSoon
                                  ? "text-warning"
                                  : "text-foreground"
                            }
                          >
                            {DATE.format(new Date(g.license_expiry))}
                            {expired && (
                              <span className="ml-1 text-[10px] uppercase tracking-wider">
                                · Vencida
                              </span>
                            )}
                            {expiringSoon && !expired && (
                              <span className="ml-1 text-[10px] uppercase tracking-wider">
                                · {days} d
                              </span>
                            )}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-6 py-3">
                        {g.is_active === 1 ? (
                          <Badge variant="outline" className="border-success/40 text-success">
                            <CheckCircle2 className="mr-1 h-3 w-3" />
                            Activo
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-muted-foreground">
                            <AlertCircle className="mr-1 h-3 w-3" />
                            Inactivo
                          </Badge>
                        )}
                      </td>
                      <td className="px-6 py-3">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditar(g)}
                            aria-label={`Editar gestor ${g.legal_name}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleToggleActive(g)}
                            aria-label={
                              g.is_active === 1
                                ? `Desactivar gestor ${g.legal_name}`
                                : `Reactivar gestor ${g.legal_name}`
                            }
                          >
                            {g.is_active === 1 ? (
                              <PowerOff className="h-4 w-4 text-destructive" />
                            ) : (
                              <ShieldCheck className="h-4 w-4 text-success" />
                            )}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <GestorFormDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        gestor={editing}
        onSaved={handleSaved}
      />
    </div>
  );
}

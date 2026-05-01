import { useLocation } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { type ReactNode } from "react";

const ROUTE_LABELS: Record<string, string> = {
  dashboard: "Resumen",
  entrada: "Registrar Entrada",
  salida: "Registrar Salida",
  residuos: "Residuos en Stock",
  gestores: "Gestores Autorizados",
  reportes: "Reportes",
};

interface TopbarProps {
  actions?: ReactNode;
  leading?: ReactNode;
}

export function Topbar({ actions, leading }: TopbarProps) {
  const { pathname } = useLocation();
  const segment = pathname.replace(/^\//, "").split("/")[0] || "dashboard";
  const label = ROUTE_LABELS[segment] ?? segment;

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between gap-4 border-b border-border bg-background/80 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/65 md:px-8">
      <div className="flex items-center gap-3">
        {leading}
        <div className="flex items-center gap-2 text-sm">
          <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            RESPEL
          </span>
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/60" />
          <span className="font-medium text-foreground">{label}</span>
        </div>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </header>
  );
}

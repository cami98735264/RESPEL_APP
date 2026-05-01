import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  PackagePlus,
  Truck,
  Boxes,
  FileBarChart2,
  Leaf,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useGenerator } from "./GeneratorContext";

const NAV_ITEMS = [
  { to: "/dashboard", label: "Resumen", icon: LayoutDashboard },
  { to: "/entrada", label: "Entrada", icon: PackagePlus },
  { to: "/salida", label: "Salida", icon: Truck },
  { to: "/residuos", label: "Stock", icon: Boxes },
  { to: "/reportes", label: "Reportes", icon: FileBarChart2 },
];

const CATEGORY_LABEL: Record<number, string> = {
  1: "Pequeno",
  2: "Mediano",
  3: "Grande",
};

export function Sidebar() {
  const { generator } = useGenerator();
  return (
    <aside
      className={cn(
        "hidden md:flex",
        "w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground",
        "relative isolate",
      )}
    >
      <div className="absolute inset-0 -z-10 opacity-[0.04]">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.45) 1px, transparent 0)",
            backgroundSize: "16px 16px",
          }}
        />
      </div>

      <div className="flex items-center gap-3 px-6 pt-7 pb-6">
        <span className="flex h-9 w-9 items-center justify-center rounded-md bg-[hsl(var(--sidebar-active))] text-sidebar-foreground">
          <Leaf className="h-4 w-4" strokeWidth={2.25} />
        </span>
        <div className="leading-tight">
          <p className="font-display text-xl font-semibold tracking-tight">
            RESPEL
          </p>
          <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-[hsl(var(--sidebar-muted))]">
            Sistema de Gestion
          </p>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-3">
        <p className="px-3 pb-2 pt-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-[hsl(var(--sidebar-muted))]">
          Operacion
        </p>
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                "group relative flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                "before:absolute before:left-0 before:top-1.5 before:h-[calc(100%-12px)] before:w-[2px] before:rounded-full before:bg-transparent before:transition-colors",
                isActive
                  ? "bg-[hsl(var(--sidebar-active))] text-sidebar-foreground before:bg-[hsl(var(--accent))]"
                  : "text-[hsl(var(--sidebar-muted))] hover:bg-[hsl(var(--sidebar-active)/0.5)] hover:text-sidebar-foreground",
              )
            }
          >
            <Icon className="h-4 w-4" strokeWidth={2} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-[hsl(var(--sidebar-border))] px-5 py-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[hsl(var(--sidebar-muted))]">
          Generador activo
        </p>
        <p className="mt-2 truncate font-display text-sm font-medium text-sidebar-foreground">
          {generator?.legal_name ?? "Cargando..."}
        </p>
        {generator && (
          <p className="mt-0.5 truncate text-[11px] text-[hsl(var(--sidebar-muted))]">
            NIT {generator.nit}
          </p>
        )}
        <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-[hsl(var(--sidebar-border))] bg-[hsl(var(--sidebar-active)/0.6)] px-2.5 py-1 text-[11px]">
          <span className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--accent))]" />
          <span className="font-medium text-sidebar-foreground">
            {generator?.current_category_id
              ? `Generador ${CATEGORY_LABEL[generator.current_category_id] ?? "—"}`
              : "Sin categoria"}
          </span>
        </div>
      </div>
    </aside>
  );
}

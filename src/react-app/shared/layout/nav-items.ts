import {
  Boxes,
  FileBarChart2,
  LayoutDashboard,
  PackagePlus,
  Truck,
  Users,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { to: "/dashboard", label: "Resumen", icon: LayoutDashboard },
  { to: "/entrada", label: "Entrada", icon: PackagePlus },
  { to: "/salida", label: "Salida", icon: Truck },
  { to: "/residuos", label: "Stock", icon: Boxes },
  { to: "/gestores", label: "Gestores", icon: Users },
  { to: "/reportes", label: "Reportes", icon: FileBarChart2 },
];

export const CATEGORY_LABEL: Record<number, string> = {
  1: "Pequeno",
  2: "Mediano",
  3: "Grande",
};

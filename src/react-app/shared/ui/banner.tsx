import * as React from "react";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Info,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type BannerTone = "success" | "error" | "warning" | "info";

const toneStyles: Record<
  BannerTone,
  { wrap: string; icon: string; defaultIcon: React.ComponentType<{ className?: string }> }
> = {
  success: {
    wrap: "border-[hsl(var(--success)/0.35)] bg-[hsl(var(--success)/0.08)] text-[hsl(var(--success))]",
    icon: "text-[hsl(var(--success))]",
    defaultIcon: CheckCircle2,
  },
  error: {
    wrap: "border-destructive/35 bg-destructive/8 text-destructive",
    icon: "text-destructive",
    defaultIcon: XCircle,
  },
  warning: {
    wrap: "border-[hsl(var(--warning)/0.35)] bg-[hsl(var(--warning)/0.10)] text-[hsl(38_70%_28%)]",
    icon: "text-[hsl(var(--warning))]",
    defaultIcon: AlertTriangle,
  },
  info: {
    wrap: "border-primary/30 bg-primary/[0.05] text-primary",
    icon: "text-primary",
    defaultIcon: Info,
  },
};

interface BannerProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  tone?: BannerTone;
  title?: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  onDismiss?: () => void;
}

export function Banner({
  tone = "info",
  title,
  icon,
  onDismiss,
  className,
  children,
  ...props
}: BannerProps) {
  const styles = toneStyles[tone];
  const Icon = icon ?? styles.defaultIcon;
  return (
    <div
      role="status"
      className={cn(
        "flex items-start gap-3 rounded-lg border px-4 py-3 text-sm",
        styles.wrap,
        className,
      )}
      {...props}
    >
      <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", styles.icon)} />
      <div className="flex-1 leading-relaxed">
        {title && <p className="font-semibold">{title}</p>}
        {children && (
          <div className={cn(title ? "mt-1 text-foreground/80" : undefined)}>
            {children}
          </div>
        )}
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className={cn(
            "ml-2 rounded-md p-1 opacity-70 transition hover:bg-foreground/5 hover:opacity-100",
            styles.icon,
          )}
          aria-label="Cerrar"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

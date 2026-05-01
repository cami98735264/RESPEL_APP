import * as React from "react";
import { cn } from "@/lib/utils";
import type { HazardCode } from "@shared/types";

const HAZARD_TINT: Record<HazardCode, { bg: string; fg: string }> = {
  CO: { bg: "hsl(28 75% 92%)", fg: "hsl(22 65% 32%)" },
  RE: { bg: "hsl(280 38% 92%)", fg: "hsl(280 35% 32%)" },
  EX: { bg: "hsl(8 70% 92%)", fg: "hsl(0 65% 35%)" },
  TO: { bg: "hsl(168 30% 90%)", fg: "hsl(168 60% 19%)" },
  IN: { bg: "hsl(205 50% 92%)", fg: "hsl(208 55% 30%)" },
  IF: { bg: "hsl(38 70% 90%)", fg: "hsl(28 65% 28%)" },
  RA: { bg: "hsl(50 80% 90%)", fg: "hsl(40 70% 28%)" },
};

interface HazardBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  code: HazardCode | string;
  name?: string;
  showName?: boolean;
}

export function HazardBadge({
  code,
  name,
  showName = true,
  className,
  style,
  ...props
}: HazardBadgeProps) {
  const tint = HAZARD_TINT[code as HazardCode] ?? {
    bg: "hsl(42 18% 90%)",
    fg: "hsl(165 24% 18%)",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
        className,
      )}
      style={{ backgroundColor: tint.bg, color: tint.fg, ...style }}
      {...props}
    >
      <span className="font-semibold tracking-wider">{code}</span>
      {showName && name && (
        <span className="opacity-80">{name}</span>
      )}
    </span>
  );
}

export function getHazardTint(code: string) {
  return (
    HAZARD_TINT[code as HazardCode] ?? {
      bg: "hsl(42 18% 90%)",
      fg: "hsl(165 24% 18%)",
    }
  );
}

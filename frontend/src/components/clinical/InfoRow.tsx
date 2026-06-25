import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

type InfoRowVariant = "default" | "critical" | "warning" | "mono";

interface InfoRowProps {
  label: string;
  value: string | number | ReactNode;
  variant?: InfoRowVariant;
  className?: string;
}

/** Value text styling per variant (the label styling is constant). */
const VALUE_VARIANTS: Record<InfoRowVariant, string> = {
  default: "font-body text-base font-medium text-gray-900",
  critical: "font-body text-base font-bold text-critical-700",
  warning: "font-body text-base font-semibold text-warning-600",
  mono: "font-mono text-base font-medium text-gray-900",
};

/**
 * InfoRow — a label/value pair used inside SectionCard.
 * Stacks vertically on mobile and switches to a 40/60 two-column row on
 * desktop (md+). The last row in a group drops its bottom border.
 */
export function InfoRow({
  label,
  value,
  variant = "default",
  className,
}: InfoRowProps) {
  return (
    <div
      className={cn(
        "border-b border-gray-100 py-3 last:border-b-0 md:flex md:items-center md:py-2",
        className,
      )}
    >
      <div className="w-full md:w-2/5">
        <span className="font-body text-sm font-medium text-gray-600">
          {label}
        </span>
      </div>
      <div className="mt-1 w-full md:mt-0 md:w-3/5">
        <span className={VALUE_VARIANTS[variant]}>{value}</span>
      </div>
    </div>
  );
}

import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

type SectionCardVariant = "default" | "critical" | "warning";

interface SectionCardProps {
  /** The section heading (required). */
  title: string;
  /** Optional icon shown 8px before the title. */
  icon?: ReactNode;
  /** Visual variant. Defaults to "default". */
  variant?: SectionCardVariant;
  /** Card content (required). */
  children: ReactNode;
  /** Additional Tailwind classes appended to the container. */
  className?: string;
}

/** Container + border + background per variant. */
const CONTAINER_VARIANTS: Record<SectionCardVariant, string> = {
  default: "bg-white border border-gray-200",
  critical: "bg-critical-50 border-2 border-critical-500",
  warning: "bg-warning-50 border-2 border-warning-500",
};

/** Title color per variant. */
const TITLE_VARIANTS: Record<SectionCardVariant, string> = {
  default: "text-gray-800",
  critical: "text-critical-700",
  warning: "text-warning-600",
};

/**
 * SectionCard — reusable container for every section in clinical views.
 * Purely presentational, so no "use client" directive is needed.
 */
export function SectionCard({
  title,
  icon,
  variant = "default",
  children,
  className,
}: SectionCardProps) {
  return (
    <section
      className={cn(
        "rounded-xl p-4 shadow-sm md:p-6",
        CONTAINER_VARIANTS[variant],
        className,
      )}
    >
      <h2
        className={cn(
          "mb-4 inline-flex items-center gap-2 font-heading text-lg font-semibold md:text-xl",
          TITLE_VARIANTS[variant],
        )}
      >
        {icon ? (
          <span className="inline-flex items-center">{icon}</span>
        ) : null}
        {title}
      </h2>
      {children}
    </section>
  );
}

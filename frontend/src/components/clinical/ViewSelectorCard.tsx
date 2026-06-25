import Link from "next/link";
import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

type ViewSelectorVariant = "surgery" | "emergency" | "prescribing";

interface ViewSelectorCardProps {
  icon: ReactNode;
  /** Optional Tailwind text-color class for the icon; defaults to the variant color. */
  iconColor?: string;
  title: string;
  description: string;
  href?: string;
  isActive?: boolean;
  variant?: ViewSelectorVariant;
}

/** Icon container background + icon color per variant. */
const VARIANT_STYLES: Record<
  ViewSelectorVariant,
  { iconBg: string; iconText: string }
> = {
  surgery: { iconBg: "bg-brand-100", iconText: "text-brand-700" },
  emergency: { iconBg: "bg-critical-100", iconText: "text-critical-700" },
  prescribing: { iconBg: "bg-warning-100", iconText: "text-warning-600" },
};

/**
 * ViewSelectorCard — a clickable card for one clinical view on the hub page.
 * Active cards link to `href`; inactive cards render a non-interactive div
 * with a "Coming Soon" badge.
 */
export function ViewSelectorCard({
  icon,
  iconColor,
  title,
  description,
  href,
  isActive = false,
  variant = "surgery",
}: ViewSelectorCardProps) {
  const styles = VARIANT_STYLES[variant];

  const cardBody = (
    <div
      className={cn(
        "relative rounded-2xl border border-gray-200 bg-white p-8 shadow-sm transition-all duration-200",
        isActive
          ? "cursor-pointer hover:scale-105 hover:border-brand-500 hover:shadow-md"
          : "cursor-not-allowed opacity-70 grayscale",
      )}
    >
      {!isActive && (
        <span className="absolute right-4 top-4 rounded-full bg-gray-200 px-3 py-1 text-xs font-semibold text-gray-700">
          Coming Soon
        </span>
      )}

      {/* Icon container — color inherited by the lucide icon via currentColor */}
      <div
        className={cn(
          "flex h-16 w-16 items-center justify-center rounded-full",
          styles.iconBg,
          iconColor ?? styles.iconText,
        )}
      >
        {icon}
      </div>

      <h2 className="mb-2 mt-4 font-heading text-xl font-bold text-gray-900">
        {title}
      </h2>
      <p className="font-body text-sm leading-relaxed text-gray-600">
        {description}
      </p>
    </div>
  );

  if (isActive && href) {
    return (
      <Link href={href} className="block">
        {cardBody}
      </Link>
    );
  }

  return cardBody;
}

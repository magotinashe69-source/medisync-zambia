import { cn } from "@/lib/cn";

type Variant = "primary" | "accent" | "gray" | "success" | "warning" | "danger";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-primary-50 text-primary-700 ring-primary-600/20",
  accent: "bg-accent-50 text-accent-700 ring-accent-600/20",
  gray: "bg-slate-100 text-slate-700 ring-slate-500/20",
  success: "bg-green-50 text-green-700 ring-green-600/20",
  warning: "bg-amber-50 text-amber-800 ring-amber-600/20",
  danger: "bg-red-50 text-red-700 ring-red-600/20",
};

export default function Badge({
  variant = "gray",
  className,
  children,
}: {
  variant?: Variant;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
        VARIANTS[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}

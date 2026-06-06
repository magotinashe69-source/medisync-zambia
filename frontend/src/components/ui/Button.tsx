import Spinner from "./Spinner";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "danger" | "ghost";
type Size = "sm" | "md" | "lg";

const BASE =
  "inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed select-none";

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800 focus-visible:ring-primary-500 shadow-sm",
  secondary:
    "bg-white text-primary-700 border border-primary-200 hover:bg-primary-50 active:bg-primary-100 focus-visible:ring-primary-500",
  danger:
    "bg-red-600 text-white hover:bg-red-700 active:bg-red-800 focus-visible:ring-red-500 shadow-sm",
  ghost:
    "bg-transparent text-slate-700 hover:bg-slate-100 active:bg-slate-200 focus-visible:ring-slate-400",
};

const SIZES: Record<Size, string> = {
  sm: "min-h-[44px] px-4 text-sm gap-1.5",
  md: "min-h-[48px] px-5 text-sm sm:text-base gap-2",
  lg: "min-h-[52px] px-6 text-base gap-2",
};

export function buttonClasses(opts?: {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  className?: string;
}) {
  const { variant = "primary", size = "md", fullWidth = false, className } = opts ?? {};
  return cn(BASE, VARIANTS[variant], SIZES[size], fullWidth && "w-full", className);
}

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  loading?: boolean;
};

export default function Button({
  variant,
  size,
  fullWidth,
  loading = false,
  disabled,
  className,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={buttonClasses({ variant, size, fullWidth, className })}
      disabled={disabled || loading}
      {...rest}
    >
      {loading && <Spinner size="sm" className="-ml-1" />}
      {children}
    </button>
  );
}

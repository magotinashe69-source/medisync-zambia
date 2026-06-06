import { cn } from "@/lib/cn";

export default function Card({
  className,
  children,
  ...rest
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "bg-white rounded-xl border border-slate-200 shadow-sm p-4 sm:p-6",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

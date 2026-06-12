import { useId } from "react";
import { cn } from "@/lib/cn";

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
  hint?: string;
  error?: string;
};

export default function Textarea({
  label,
  hint,
  error,
  id,
  className,
  rows = 3,
  ...rest
}: TextareaProps) {
  const generated = useId();
  const textareaId = id ?? generated;
  const describedBy = error ? `${textareaId}-error` : hint ? `${textareaId}-hint` : undefined;

  return (
    <div>
      {label && (
        <label htmlFor={textareaId} className="block text-sm font-medium text-slate-700 mb-1.5">
          {label}
        </label>
      )}
      <textarea
        id={textareaId}
        rows={rows}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={cn(
          "w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm sm:text-base text-slate-900 placeholder:text-slate-400 transition-colors focus:outline-none focus:ring-2",
          error
            ? "border-red-400 focus:ring-red-500"
            : "border-slate-300 focus:border-primary-500 focus:ring-primary-500",
          className,
        )}
        {...rest}
      />
      {error ? (
        <p id={`${textareaId}-error`} className="mt-1 text-xs text-red-600">{error}</p>
      ) : hint ? (
        <p id={`${textareaId}-hint`} className="mt-1 text-xs text-slate-500">{hint}</p>
      ) : null}
    </div>
  );
}

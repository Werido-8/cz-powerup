import type { LucideIcon } from "lucide-react";
import { Check } from "lucide-react";
import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function AppFormField({
  label,
  icon: Icon,
  required,
  children,
  className,
  error,
}: {
  label: string;
  icon?: LucideIcon;
  required?: boolean;
  children: ReactNode;
  className?: string;
  error?: string | null;
}) {
  return (
    <div className={cn("mb-5 last:mb-0", className)}>
      <div className="mb-2 flex items-center gap-2">
        {Icon && (
          <Icon
            className="h-4 w-4 shrink-0 text-[var(--form-label-icon)]"
            strokeWidth={1.8}
            aria-hidden
          />
        )}
        <span
          className="font-semibold text-[var(--form-label-color)]"
          style={{
            fontSize: "var(--form-label-size)",
            lineHeight: "var(--form-label-line-height)",
          }}
        >
          {label}
          {required && (
            <span className="ml-0.5 text-[12px] text-[var(--form-required)]" aria-hidden>
              *
            </span>
          )}
        </span>
      </div>
      {children}
      {error && (
        <p className="mt-1.5 text-[12px] text-[var(--form-required)]" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export function AppFormInput({
  className,
  error,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { error?: boolean }) {
  return (
    <input
      className={cn(
        "app-form-control w-full outline-none placeholder:text-[var(--form-control-disabled-text)]",
        error && "app-form-control--error",
        className,
      )}
      {...props}
    />
  );
}

export function AppFormTextarea({
  className,
  error,
  value,
  maxLength,
  showCount = true,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & {
  error?: boolean;
  showCount?: boolean;
}) {
  const length = String(value ?? "").length;
  const limit = maxLength;

  return (
    <div className="relative">
      <textarea
        className={cn(
          "app-form-textarea w-full outline-none placeholder:text-[var(--form-control-disabled-text)]",
          error && "app-form-control--error",
          className,
        )}
        value={value}
        maxLength={maxLength}
        {...props}
      />
      {showCount && limit !== undefined && (
        <span className="pointer-events-none absolute bottom-2 right-3 text-[12px] text-[var(--form-counter)]">
          {length} / {limit}
        </span>
      )}
    </div>
  );
}

export interface AppFormSegmentOption {
  value: string;
  label: string;
}

export function AppFormSegment({
  options,
  value,
  onChange,
  disabled,
  className,
}: {
  options: AppFormSegmentOption[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex w-full max-w-full flex-wrap overflow-hidden rounded-[8px] border border-[var(--form-control-border)] bg-white",
        className,
      )}
      role="radiogroup"
    >
      {options.map((option, index) => {
        const active = option.value === value;
        const isLast = index === options.length - 1;

        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={disabled}
            onClick={() => onChange(option.value)}
            className={cn(
              "flex min-h-[var(--form-control-height)] min-w-0 flex-1 basis-[25%] items-center justify-center gap-1.5 px-3 text-[13px] transition-colors",
              "disabled:cursor-not-allowed disabled:opacity-60",
              !isLast && "border-r border-[#e5ebee]",
              active
                ? "bg-[rgba(52,155,172,0.08)] text-[#228c9e] shadow-[inset_0_0_0_1px_rgba(52,155,172,0.6)]"
                : "text-[#546975] hover:bg-[#f5f7f8]",
            )}
          >
            <span
              className={cn(
                "grid h-5 w-5 shrink-0 place-items-center rounded-full transition-colors",
                active ? "bg-primary text-white" : "bg-transparent",
              )}
              aria-hidden
            >
              {active && <Check className="h-3 w-3" strokeWidth={2.5} />}
            </span>
            <span className="truncate">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}

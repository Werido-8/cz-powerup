import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { kbRadius } from "@/lib/knowledge/tokens";

export interface KbSegmentOption {
  value: string;
  label: string;
}

export function KbSegmentControl({
  options,
  value,
  onChange,
  className,
}: {
  options: KbSegmentOption[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "inline-flex h-9 rounded-[8px] border border-kb-border bg-card p-0.5",
        className,
      )}
      role="tablist"
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(option.value)}
            className={cn(
              "h-8 rounded-[7px] px-4 text-[12.5px] font-medium transition-all duration-150",
              active
                ? "bg-card text-primary shadow-[0_1px_3px_rgba(16,42,51,0.08)] ring-1 ring-kb-border"
                : "text-kb-muted hover:text-kb-body",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { kbSpacing } from "@/lib/knowledge/tokens";

export function KbPageHeader({
  label,
  title,
  description,
  action,
  className,
}: {
  label?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-4 flex flex-wrap items-end justify-between gap-3", className)}>
      <div className="min-w-0">
        {label && (
          <p className="text-[12px] font-semibold text-primary">{label}</p>
        )}
        <h2
          className={cn(
            "font-semibold text-kb-heading",
            label ? "mt-1 text-[22px]" : "text-[22px]",
          )}
        >
          {title}
        </h2>
        {description && (
          <p className="mt-1.5 max-w-[760px] text-[13px] leading-relaxed text-kb-muted">
            {description}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}

export function KbPageContent({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mx-auto w-full max-w-none", kbSpacing.pageY, className)}>
      {children}
    </div>
  );
}

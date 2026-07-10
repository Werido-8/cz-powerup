import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function KnowledgeWorkspacePageHeader({
  title,
  description,
  badge,
  action,
  className,
}: {
  title: string;
  description?: string;
  badge?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("shrink-0 border-b border-[#E8F0F2] bg-white px-5 py-4", className)}>
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-[18px] font-semibold tracking-tight text-[#002140]">{title}</h1>
            {badge && (
              <span className="inline-flex h-6 items-center rounded-full border border-[#D4E8EC] bg-[#F4FAFB] px-2.5 text-[11px] font-medium text-[#4E5969]">
                {badge}
              </span>
            )}
          </div>
          {description && (
            <p className="mt-1 max-w-[640px] text-[13px] leading-relaxed text-[#4E5969]">
              {description}
            </p>
          )}
        </div>
        {action}
      </div>
    </header>
  );
}

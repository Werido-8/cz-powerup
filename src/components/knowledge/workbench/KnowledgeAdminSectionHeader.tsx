import type { ReactNode } from "react";
import { KbStatStrip, type KbStatItem } from "@/components/knowledge/ui";
import { cn } from "@/lib/utils";

export function KnowledgeAdminSectionHeader({
  title,
  description,
  action,
  stats,
  className,
}: {
  title: string;
  description: string;
  action?: ReactNode;
  stats?: KbStatItem[];
  className?: string;
}) {
  return (
    <header
      className={cn(
        "shrink-0 border-b border-[#E8F0F2] bg-white shadow-[0_1px_4px_rgba(52,155,172,0.05)]",
        className,
      )}
    >
      <div className="flex min-h-[88px] items-center justify-between gap-4 px-5 py-4">
        <div className="min-w-0">
          <h1 className="text-[22px] font-semibold tracking-tight text-[#002140]">{title}</h1>
          <p className="mt-1 max-w-[640px] text-[13px] leading-relaxed text-[#4E5969]">
            {description}
          </p>
        </div>
        {action}
      </div>
      {stats && stats.length > 0 && (
        <div className="px-5 pb-4">
          <KbStatStrip items={stats} variant="flat" className="mb-0" />
        </div>
      )}
    </header>
  );
}

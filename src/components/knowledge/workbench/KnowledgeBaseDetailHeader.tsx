import { Clock, Library, UserRound } from "lucide-react";
import type { ReactNode } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { KnowledgeBase } from "@/lib/knowledge/types";
import { cn } from "@/lib/utils";
import { KnowledgeBaseBreadcrumb } from "./KnowledgeBaseBreadcrumb";
import { KnowledgeDetailBannerShell } from "./KnowledgeDetailBannerShell";

function scopeLabel(base: KnowledgeBase) {
  if (base.scope === "personal") return "个人知识库";
  if (base.scope === "public") return "公共制度";
  return "专业知识库";
}

function KnowledgeBannerCapsule({
  children,
  tone = "primary",
}: {
  children: ReactNode;
  tone?: "primary" | "neutral";
}) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center rounded-full border px-2.5 text-[11px] font-medium",
        tone === "primary"
          ? "border-[#C5E6EE] bg-[#F0FAFB] text-[#1498A8]"
          : "border-[#E6F0F2] bg-white text-[#4E5969]",
      )}
    >
      {children}
    </span>
  );
}

export function KnowledgeBaseDetailHeader({
  base,
  fileCount,
  onSelectBase,
  action,
}: {
  base: KnowledgeBase;
  fileCount: number;
  onSelectBase: (baseId: string) => void;
  action?: ReactNode;
}) {
  const updatedLabel = base.updatedAt ?? "-";
  const ownerLabel = base.ownerName ?? "-";

  return (
    <KnowledgeDetailBannerShell>
      <KnowledgeBaseBreadcrumb base={base} onSelectBase={onSelectBase} className="mb-3" />

      <div className="flex min-w-0 items-start justify-between gap-4">
        <div className="flex min-w-0 flex-1 items-start gap-3.5">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-[10px] bg-primary-soft text-primary">
            <Library className="h-5 w-5 stroke-[1.8]" />
          </div>

          <div className="min-w-0 flex-1 pt-0.5">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
              <h1 className="text-[22px] font-semibold leading-tight tracking-tight text-[#002140]">
                {base.name}
              </h1>
              <KnowledgeBannerCapsule tone="primary">{fileCount} 个文件</KnowledgeBannerCapsule>
              <KnowledgeBannerCapsule tone="neutral">{scopeLabel(base)}</KnowledgeBannerCapsule>
            </div>

            <div className="mt-2 flex min-w-0 items-center">
              {base.description ? (
                <TooltipProvider delayDuration={200}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <p className="min-w-0 max-w-[min(100%,420px)] shrink-0 truncate text-[14px] leading-relaxed text-[#4E5969]">
                        {base.description}
                      </p>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-sm text-[12px] leading-relaxed">
                      {base.description}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ) : null}

              <div
                className={cn(
                  "flex shrink-0 flex-wrap items-center gap-x-5 gap-y-1 text-[12px] text-[#4E5969]",
                  base.description && "ml-10 lg:ml-16 xl:ml-24",
                )}
              >
                <div className="inline-flex items-center gap-1.5 whitespace-nowrap">
                  <Clock className="h-3.5 w-3.5 shrink-0 stroke-[1.8] text-[#8A96A3]" />
                  <span>最后更新：{updatedLabel}</span>
                </div>
                <div className="inline-flex items-center gap-1.5 whitespace-nowrap">
                  <UserRound className="h-3.5 w-3.5 shrink-0 stroke-[1.8] text-[#8A96A3]" />
                  <span>创建人：{ownerLabel}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {action && <div className="shrink-0 self-start">{action}</div>}
      </div>
    </KnowledgeDetailBannerShell>
  );
}

import { Clock, Library } from "lucide-react";
import type { ReactNode } from "react";
import kbHeaderBackground from "@/assets/image.png";
import { StatIconFrame, Tag } from "@/components/learning/ui";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { KnowledgeBase } from "@/lib/knowledge/types";
import { KnowledgeBaseBreadcrumb } from "./KnowledgeBaseBreadcrumb";

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
    <section className="relative overflow-hidden border-b border-divider">
      <img
        src={kbHeaderBackground}
        alt=""
        aria-hidden
        className="pointer-events-none absolute inset-0 h-full w-full object-cover object-[right_center] select-none"
        draggable={false}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 w-[min(72%,680px)] bg-gradient-to-r from-white/88 via-white/45 to-transparent"
      />

      <div className="relative z-[1] px-5 py-4">
        <KnowledgeBaseBreadcrumb base={base} onSelectBase={onSelectBase} className="mb-3" />

        <div className="flex min-w-0 items-start justify-between gap-3">
          <div className="flex min-w-0 flex-1 items-start gap-3.5">
            <StatIconFrame icon={<Library className="stroke-[1.8]" />} />

            <div className="min-w-0 flex-1 pt-0.5">
              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                <h1 className="text-[20px] font-semibold tracking-tight text-foreground">
                  {base.name}
                </h1>
                <Tag variant="primary" className="h-6 px-2.5 text-[11px]">
                  {fileCount} 个文件
                </Tag>
              </div>

              <div className="mt-1.5 flex flex-wrap items-center gap-x-5 gap-y-1">
                {base.description && (
                  <TooltipProvider delayDuration={200}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <p className="w-[65%] shrink-0 truncate text-[13px] text-muted-foreground">
                          {base.description}
                        </p>
                      </TooltipTrigger>
                      <TooltipContent side="bottom" className="max-w-sm text-[12px] leading-relaxed">
                        {base.description}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}

                <div className="flex shrink-0 items-center gap-2.5 text-[11.5px] text-muted-foreground">
                  <span className="inline-flex items-center gap-1 whitespace-nowrap">
                    <Clock className="h-3 w-3 shrink-0 stroke-[1.8]" />
                    最后更新：{updatedLabel}
                  </span>
                  <span className="h-3 w-px bg-border" aria-hidden />
                  <span className="whitespace-nowrap">创建人：{ownerLabel}</span>
                </div>
              </div>
            </div>
          </div>
          {action}
        </div>
      </div>
    </section>
  );
}

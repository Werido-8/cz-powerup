import { ArrowRight } from "lucide-react";
import { KbEmptyState } from "@/components/knowledge/ui";
import type { CompareTask, DiffItem } from "@/lib/file-compare/types";
import { cn } from "@/lib/utils";
import { DiffTypeTag } from "./DiffTypeIndicators";

/** 概览右栏：任务变化摘要 + 可进入双栏核验的差异条目 */
export function ChangeSummaryPanel({
  task,
  diffs,
  activeDiffId,
  onOpenDiff,
}: {
  task: CompareTask;
  diffs: DiffItem[];
  activeDiffId?: string;
  onOpenDiff: (diff: DiffItem) => void;
}) {
  return (
    <section className="flex h-full min-h-0 min-w-0 flex-col">
      <header className="flex h-[22px] shrink-0 items-center justify-between gap-2">
        <h3 className="text-[13px] font-semibold text-kb-heading">章节差异</h3>
        <span className="text-[11.5px] tabular-nums text-kb-muted">{diffs.length} 处</span>
      </header>

      <div className="mt-2.5 shrink-0 rounded-[6px] border border-[#EDF3F5] bg-[#FAFCFC] px-3.5 py-2.5">
        <p className="text-[13px] font-semibold leading-snug text-kb-heading">{task.summaryTitle}</p>
        <p className="mt-1 line-clamp-3 text-[12.5px] leading-[1.7] text-kb-muted">
          {task.summaryBody}
        </p>
        <p className="mt-1.5 text-[11px] text-kb-muted/80">智能归纳，仅供快速浏览</p>
      </div>

      <div className="scrollbar-thin mt-1 min-h-0 flex-1 overflow-y-auto pr-1">
        {diffs.length === 0 ? (
          <KbEmptyState title="当前筛选下没有差异" description="请调整章节或差异类型筛选条件。" />
        ) : (
          <ul className="divide-y divide-[#F0F5F6]">
            {diffs.map((diff) => {
              const selected = diff.id === activeDiffId;
              const basePage = diff.basePage ? `基准第 ${diff.basePage} 页` : "基准无页码";
              const targetPage = diff.targetPage ? `更新第 ${diff.targetPage} 页` : "更新无页码";
              return (
                <li key={diff.id}>
                  <button
                    type="button"
                    data-summary-item={diff.id}
                    onClick={() => onOpenDiff(diff)}
                    className={cn(
                      "group flex w-full items-start gap-3 rounded-[8px] px-2 py-2.5 text-left transition-colors",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25",
                      selected ? "bg-primary-soft" : "hover:bg-kb-surface-hover",
                    )}
                  >
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <DiffTypeTag type={diff.type} />
                        <span
                          className={cn(
                            "min-w-0 flex-1 truncate text-[13.5px] font-medium",
                            selected ? "text-primary" : "text-kb-heading",
                          )}
                          title={diff.summaryTitle ?? diff.title}
                        >
                          {diff.summaryTitle ?? diff.title}
                        </span>
                      </span>
                      <span className="mt-1 block line-clamp-2 text-[12.5px] leading-[1.6] text-kb-muted">
                        {diff.description}
                      </span>
                      <span className="mt-1.5 flex items-center justify-between gap-2">
                        <span className="min-w-0 truncate text-[11.5px] tabular-nums text-kb-muted">
                          {diff.clause} · {basePage} · {targetPage}
                        </span>
                        <span
                          className={cn(
                            "inline-flex shrink-0 items-center gap-0.5 text-[12px] font-medium",
                            selected
                              ? "text-primary"
                              : "text-primary/80 opacity-0 transition-opacity group-hover:opacity-100",
                          )}
                        >
                          查看对照
                          <ArrowRight className="h-3 w-3 stroke-[2]" aria-hidden />
                        </span>
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}

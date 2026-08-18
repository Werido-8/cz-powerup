import { KbEmptyState } from "@/components/knowledge/ui";
import type { CompareTask, DiffItem } from "@/lib/file-compare/types";
import { DiffSeqBadge } from "./DiffTypeIndicators";

/** 中间列：变化摘要卡片 + 可点击进入双栏阅读的差异条目 */
export function ChangeSummaryPanel({
  task,
  diffs,
  onOpenDiff,
}: {
  task: CompareTask;
  diffs: DiffItem[];
  onOpenDiff: (diff: DiffItem) => void;
}) {
  return (
    <section className="flex h-full min-h-0 min-w-0 flex-col">
      <header className="flex h-[22px] shrink-0 items-center justify-between gap-2">
        <h3 className="text-[13px] font-semibold text-kb-heading">变化摘要</h3>
        <span className="text-[11.5px] text-kb-muted">系统归纳 · 示例数据</span>
      </header>

      <div className="mt-2.5 shrink-0 rounded-[8px] border border-[#DCEBED] bg-[#F3FAFB] px-4 py-3">
        <p className="text-[13px] font-semibold leading-snug text-kb-heading">
          {task.summaryTitle}
        </p>
        <p className="mt-1.5 text-[12px] leading-[1.7] text-kb-muted">{task.summaryBody}</p>
      </div>

      <div className="scrollbar-thin mt-1 min-h-0 flex-1 overflow-y-auto pr-1">
        {diffs.length === 0 ? (
          <KbEmptyState title="当前筛选下没有差异" description="请调整章节或差异类型筛选条件。" />
        ) : (
          <ul className="divide-y divide-[#F0F5F6]">
            {diffs.map((diff, index) => (
              <li key={diff.id}>
                <button
                  type="button"
                  data-summary-item={diff.id}
                  onClick={() => onOpenDiff(diff)}
                  className="flex w-full items-start gap-3 rounded-[8px] px-2 py-3 text-left transition-colors hover:bg-kb-surface-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25"
                >
                  <DiffSeqBadge type={diff.type} index={index + 1} className="mt-0.5" />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline gap-3">
                      <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-kb-heading">
                        {diff.summaryTitle ?? diff.title}
                      </span>
                      <span className="shrink-0 text-[11.5px] tabular-nums text-kb-muted">
                        第 {diff.basePage} 页 · {diff.clause}
                      </span>
                    </span>
                    <span className="mt-1 block text-[12px] leading-[1.65] text-kb-muted">
                      {diff.description}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

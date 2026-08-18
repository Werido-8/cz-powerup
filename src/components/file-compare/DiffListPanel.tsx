import { ArrowLeft, ArrowRight, Search, X } from "lucide-react";
import { useEffect, useRef } from "react";
import { KbButton, KbEmptyState } from "@/components/knowledge/ui";
import { DIFF_TYPE_META } from "@/lib/file-compare/meta";
import { DIFF_TYPE_ORDER } from "@/lib/file-compare/data";
import type { DiffItem, DiffType } from "@/lib/file-compare/types";
import { cn } from "@/lib/utils";
import { DiffTypeDot, DiffTypePill } from "./DiffTypeIndicators";

/** 参考稿的筛选项：全部 / 新增 / 删除 / 修改；「移动」仅在被选中时出现 */
const PRIMARY_FILTERS: DiffType[] = ["added", "removed", "modified"];

export function DiffListPanel({
  diffs,
  keyword,
  onKeywordChange,
  activeType,
  onTypeChange,
  counts,
  totalCount,
  documentDiffTotal,
  activeDiffId,
  onSelectDiff,
  onPrev,
  onNext,
}: {
  /** 已按关键词与类型筛选后的差异 */
  diffs: DiffItem[];
  keyword: string;
  onKeywordChange: (value: string) => void;
  activeType?: DiffType;
  onTypeChange: (type?: DiffType) => void;
  counts: Record<DiffType, number>;
  /** 「全部」胶囊的数量：忽略类型筛选后的差异数 */
  totalCount: number;
  /** 文档中的差异总数，用于「第 N/M 处」文案 */
  documentDiffTotal: number;
  activeDiffId?: string;
  onSelectDiff: (diff: DiffItem) => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  const listRef = useRef<HTMLUListElement | null>(null);

  useEffect(() => {
    if (!activeDiffId || !listRef.current) return;
    const item = listRef.current.querySelector<HTMLElement>(`[data-diff-id="${activeDiffId}"]`);
    item?.scrollIntoView({ block: "nearest" });
  }, [activeDiffId]);

  const visibleFilters = DIFF_TYPE_ORDER.filter(
    (type) => PRIMARY_FILTERS.includes(type) || activeType === type,
  );

  return (
    <aside className="flex w-[342px] shrink-0 flex-col border-r border-kb-border">
      <div className="shrink-0 px-3.5 pb-2.5 pt-3.5">
        <div className="flex h-9 items-center gap-2 rounded-[7px] border border-kb-border bg-white px-3 transition-colors focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/15">
          <Search className="h-3.5 w-3.5 shrink-0 text-kb-muted" aria-hidden />
          <input
            value={keyword}
            onChange={(event) => onKeywordChange(event.target.value)}
            placeholder="搜索差异内容"
            aria-label="搜索差异内容"
            className="min-w-0 flex-1 border-0 bg-transparent text-[12.5px] outline-none placeholder:text-muted-foreground/70"
          />
          {keyword && (
            <button
              type="button"
              aria-label="清空差异搜索"
              onClick={() => onKeywordChange("")}
              className="grid h-5 w-5 shrink-0 place-items-center rounded-full text-kb-muted transition-colors hover:bg-muted hover:text-foreground"
            >
              <X className="h-3 w-3 stroke-[2.2]" />
            </button>
          )}
        </div>

        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
          <DiffTypePill
            label="全部"
            count={totalCount}
            active={!activeType}
            onClick={() => onTypeChange(undefined)}
          />
          {visibleFilters.map((type) => (
            <DiffTypePill
              key={type}
              label={DIFF_TYPE_META[type].label}
              count={counts[type]}
              tone={type}
              active={activeType === type}
              onClick={() => onTypeChange(activeType === type ? undefined : type)}
            />
          ))}
        </div>
      </div>

      <h3 className="shrink-0 px-3.5 pb-1 pt-1.5 text-[12.5px] font-semibold text-kb-heading">
        差异清单
      </h3>

      <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto px-2.5 pb-2">
        {diffs.length === 0 ? (
          <KbEmptyState title="没有匹配的差异" description="请调整关键词或差异类型后重试。" />
        ) : (
          <ul ref={listRef} className="space-y-0.5">
            {diffs.map((diff) => {
              const active = diff.id === activeDiffId;
              return (
                <li key={diff.id}>
                  <button
                    type="button"
                    data-diff-id={diff.id}
                    aria-current={active ? "true" : undefined}
                    onClick={() => onSelectDiff(diff)}
                    className={cn(
                      "flex w-full items-start gap-2 rounded-[7px] border px-2.5 py-2 text-left transition-colors",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25",
                      active
                        ? "border-primary/30 bg-[#EFF8FA]"
                        : "border-transparent hover:bg-kb-surface-hover",
                    )}
                  >
                    <DiffTypeDot type={diff.type} className="mt-[3px]" />
                    <span className="min-w-0 flex-1">
                      <span
                        className={cn(
                          "block truncate text-[12.5px]",
                          active ? "font-semibold text-primary" : "font-medium text-kb-heading",
                        )}
                      >
                        {diff.title}
                      </span>
                      <span className="mt-0.5 block truncate text-[11px] tabular-nums text-kb-muted">
                        {diff.clause} · 第 {diff.basePage} 页
                        {active ? ` · 第 ${diff.seq}/${documentDiffTotal} 处` : ""}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="flex shrink-0 items-center justify-center gap-2.5 border-t border-kb-border px-3.5 py-2.5">
        <KbButton variant="outline" onClick={onPrev} disabled={diffs.length === 0}>
          <ArrowLeft className="h-3.5 w-3.5 stroke-[1.9]" aria-hidden />
          上一处
        </KbButton>
        <KbButton variant="primary" onClick={onNext} disabled={diffs.length === 0}>
          下一处
          <ArrowRight className="h-3.5 w-3.5 stroke-[1.9]" aria-hidden />
        </KbButton>
      </div>
    </aside>
  );
}

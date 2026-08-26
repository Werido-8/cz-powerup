import { DIFF_TYPE_META } from "@/lib/file-compare/meta";
import type { DiffType } from "@/lib/file-compare/types";
import { cn } from "@/lib/utils";

export interface DiffStatCardsProps {
  total: number;
  affectedChapters: number;
  counts: Record<DiffType, number>;
  primaryChapter: string;
  activeType?: DiffType;
  onSelectType: (type?: DiffType) => void;
}

const TYPE_ORDER: DiffType[] = ["added", "modified", "removed"];

/** 文档式变化摘要：总量主导，类型与影响范围作为辅助阅读线索。 */
export function DiffStatCards({
  total,
  affectedChapters,
  counts,
  primaryChapter,
  activeType,
  onSelectType,
}: DiffStatCardsProps) {
  const changeLevel = total <= 10 ? "较低" : total <= 30 ? "中等" : "较高";

  return (
    <section className="shrink-0 border-b border-kb-border bg-white px-5 py-3.5">
      <div className="grid gap-3 lg:grid-cols-[minmax(260px,0.82fr)_minmax(500px,1.18fr)] lg:items-center">
        <div className="min-w-0">
          <h2 className="text-[13px] font-semibold text-kb-heading">版本变化概览</h2>
          <button
            type="button"
            aria-pressed={!activeType}
            onClick={() => onSelectType(undefined)}
            className={cn(
              "mt-1 text-left text-[15px] leading-6 text-kb-heading transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25",
              !activeType && "text-primary",
            )}
          >
            本次版本共识别{" "}
            <strong className="mx-0.5 text-[26px] font-semibold leading-none tabular-nums">
              {total}
            </strong>{" "}
            项内容变化
          </button>
        </div>

        <div className="min-w-0 lg:border-l lg:border-[#E5EDEF] lg:pl-5">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            {TYPE_ORDER.map((type) => {
              const meta = DIFF_TYPE_META[type];
              const active = activeType === type;
              return (
                <button
                  key={type}
                  type="button"
                  aria-pressed={active}
                  onClick={() => onSelectType(active ? undefined : type)}
                  className={cn(
                    "group inline-flex items-baseline gap-1.5 rounded-[4px] text-[12px] text-kb-muted transition-colors hover:text-kb-heading focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25",
                    active && "text-kb-heading",
                  )}
                >
                  <span>{meta.label}</span>
                  <strong className={cn("text-[17px] font-semibold tabular-nums", meta.valueText)}>
                    {counts[type]}
                  </strong>
                  <span>项</span>
                </button>
              );
            })}
            <span className="h-4 w-px bg-[#DDE7E9]" aria-hidden />
            <span className="text-[12px] text-kb-muted">
              影响{" "}
              <strong className="mx-0.5 text-[17px] font-semibold tabular-nums text-kb-heading">
                {affectedChapters}
              </strong>{" "}
              个章节
            </span>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1 text-[12px] text-kb-muted">
            <span>
              变化程度：<strong className="font-medium text-kb-heading">{changeLevel}</strong>
            </span>
            <span>
              主要集中：<strong className="font-medium text-kb-heading">{primaryChapter}</strong>
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

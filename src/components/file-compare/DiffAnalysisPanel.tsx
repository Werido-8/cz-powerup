import { DiffDonutChart } from "./DiffDonutChart";
import { DIFF_TYPE_ORDER } from "@/lib/file-compare/data";
import { DIFF_TYPE_META } from "@/lib/file-compare/meta";
import type { ChapterDensityItem, DiffType } from "@/lib/file-compare/types";
import { cn } from "@/lib/utils";

/** 右侧列：差异分布环形图 + 章节变化密度 */
export function DiffAnalysisPanel({
  total,
  counts,
  density,
  activeType,
  onSelectType,
  onSelectChapter,
}: {
  total: number;
  counts: Record<DiffType, number>;
  density: ChapterDensityItem[];
  activeType?: DiffType;
  onSelectType: (type?: DiffType) => void;
  onSelectChapter: (chapterId: string) => void;
}) {
  const segments = DIFF_TYPE_ORDER.filter((type) => counts[type] > 0).map((type) => ({
    key: type,
    value: counts[type],
    color: DIFF_TYPE_META[type].chartColor,
  }));
  const maxDensity = Math.max(1, ...density.map((item) => item.count));

  return (
    <section className="flex h-full min-h-0 min-w-0 flex-col">
      <header className="flex h-[22px] shrink-0 items-center justify-between gap-2">
        <h3 className="text-[13px] font-semibold text-kb-heading">差异分布</h3>
        <span className="text-[11.5px] text-kb-muted">按类型</span>
      </header>

      <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto">
        <div className="mt-4 flex shrink-0 items-center justify-center gap-7">
          <DiffDonutChart
            segments={segments}
            total={total}
            label={`差异分布，共 ${total} 处`}
            size={132}
            thickness={24}
          />

          <ul className="min-w-0 space-y-3">
            {DIFF_TYPE_ORDER.map((type) => {
              const meta = DIFF_TYPE_META[type];
              const active = activeType === type;
              return (
                <li key={type}>
                  <button
                    type="button"
                    aria-pressed={active}
                    onClick={() => onSelectType(active ? undefined : type)}
                    className={cn(
                      "flex h-[22px] w-full items-center gap-2.5 rounded-[5px] px-1.5 text-left text-[12.5px] transition-colors",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25",
                      active
                        ? "bg-primary-soft text-primary"
                        : "text-kb-body hover:bg-kb-surface-hover",
                    )}
                  >
                    <span
                      className="h-2 w-2 shrink-0 rounded-[2px]"
                      style={{ backgroundColor: meta.chartColor }}
                      aria-hidden
                    />
                    <span className="truncate">{meta.label}</span>
                    <span className="tabular-nums">{counts[type]}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="mt-5 shrink-0 border-t border-[#EDF3F5] pt-4">
          <h4 className="text-[13px] font-semibold text-kb-heading">章节变化密度</h4>
          <ul className="mt-4 space-y-[18px]">
            {density.map((item) => (
              <li key={item.chapterId}>
                <button
                  type="button"
                  onClick={() => onSelectChapter(item.chapterId)}
                  className="group w-full text-left focus-visible:outline-none"
                >
                  <span className="flex items-baseline justify-between gap-2">
                    <span className="min-w-0 truncate text-[12.5px] text-kb-body group-hover:text-primary">
                      {item.label}
                    </span>
                    <span className="shrink-0 text-[12px] tabular-nums text-kb-muted">
                      {item.count}
                    </span>
                  </span>
                  <span className="mt-2 block h-[6px] w-full overflow-hidden rounded-full bg-[#EDF3F5]">
                    <span
                      className="block h-full rounded-full bg-primary transition-[width] duration-300"
                      style={{ width: `${Math.round((item.count / maxDensity) * 100)}%` }}
                    />
                  </span>
                </button>
              </li>
            ))}
            {density.length === 0 && (
              <li className="py-2 text-[12px] text-kb-muted">当前筛选下没有章节变化</li>
            )}
          </ul>
        </div>
      </div>
    </section>
  );
}

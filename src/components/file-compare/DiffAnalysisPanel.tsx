import { useEffect, useRef } from "react";
import { ChevronRight } from "lucide-react";
import { getCompareViewCache } from "@/lib/file-compare/view-cache";
import type { ChapterDensityItem } from "@/lib/file-compare/types";
import { cn } from "@/lib/utils";

const BAR_TONES = [
  "bg-primary/55",
  "bg-primary/45",
  "bg-primary/38",
  "bg-primary/30",
  "bg-primary/22",
];

/** 章节影响排行，点击章节直接进入对应对照位置。 */
export function DiffAnalysisPanel({
  density,
  selectedChapterId,
  onSelectChapter,
  collapsed,
  onCollapsedChange,
}: {
  density: ChapterDensityItem[];
  selectedChapterId?: string;
  onSelectChapter: (chapterId: string) => void;
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
}) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const cache = getCompareViewCache();
  const maxDensity = Math.max(1, ...density.map((item) => item.count));

  useEffect(() => {
    const node = scrollRef.current;
    if (node) node.scrollTop = cache.densityScroll;
    return () => {
      if (node) cache.densityScroll = node.scrollTop;
    };
  }, [cache]);

  if (collapsed) {
    return (
      <section className="flex h-full min-h-0 w-10 flex-col items-center border-l border-[#EDF3F5] py-2">
        <button
          type="button"
          aria-label="展开章节差异数量"
          onClick={() => onCollapsedChange?.(false)}
          className="grid h-8 w-8 place-items-center rounded-[6px] text-kb-muted hover:bg-kb-surface-hover hover:text-primary"
        >
          <ChevronRight className="h-4 w-4 rotate-180 stroke-[1.8]" />
        </button>
        <span
          className="mt-3 text-[12px] font-medium tracking-widest text-kb-muted"
          style={{ writingMode: "vertical-rl" }}
        >
          章节差异数量
        </span>
      </section>
    );
  }

  return (
    <section className="flex h-full min-h-0 min-w-0 flex-col">
      <header className="flex h-[22px] shrink-0 items-center justify-between gap-2">
        <div>
          <h3 className="text-[13px] font-semibold text-kb-heading">章节影响分析</h3>
          <p className="mt-1 text-[11.5px] text-kb-muted">按差异数量排序，点击进入对照阅读</p>
        </div>
        {onCollapsedChange && (
          <button
            type="button"
            aria-label="收起章节差异数量"
            onClick={() => onCollapsedChange(true)}
            className="grid h-6 w-6 place-items-center rounded-[5px] text-kb-muted hover:bg-kb-surface-hover hover:text-primary"
          >
            <ChevronRight className="h-3.5 w-3.5 stroke-[1.8]" />
          </button>
        )}
      </header>

      <div ref={scrollRef} className="scrollbar-thin mt-4 min-h-0 flex-1 overflow-y-auto pr-1">
        <ul className="space-y-2.5">
          {density.map((item, index) => {
            const active = selectedChapterId === item.chapterId;
            return (
              <li key={item.chapterId}>
                <button
                  type="button"
                  onClick={() => onSelectChapter(item.chapterId)}
                  title={item.label}
                  className={cn(
                    "group w-full rounded-[6px] px-1.5 py-1 text-left transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25",
                    active && "bg-primary-soft",
                  )}
                >
                  <span className="flex items-baseline justify-between gap-2">
                    <span
                      className={cn(
                        "min-w-0 truncate text-[12.5px]",
                        active
                          ? "font-medium text-primary"
                          : "text-kb-body group-hover:text-primary",
                      )}
                    >
                      {item.label}
                    </span>
                    <span
                      className={cn(
                        "shrink-0 text-[12px] font-semibold tabular-nums",
                        active ? "text-primary" : "text-kb-heading",
                      )}
                    >
                      {item.count} 处
                    </span>
                  </span>
                  <span className="mt-1.5 block h-[5px] w-full overflow-hidden rounded-full bg-[#EDF3F5]">
                    <span
                      className={cn(
                        "block h-full rounded-full transition-[width] duration-300",
                        BAR_TONES[index] ?? BAR_TONES[4],
                      )}
                      style={{ width: `${Math.round((item.count / maxDensity) * 100)}%` }}
                    />
                  </span>
                </button>
              </li>
            );
          })}
          {density.length === 0 && (
            <li className="py-2 text-[12px] text-kb-muted">当前筛选下没有章节变化</li>
          )}
        </ul>
      </div>
    </section>
  );
}

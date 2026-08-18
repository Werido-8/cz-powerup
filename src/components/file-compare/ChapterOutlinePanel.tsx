import { Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import {
  COMPARE_CHAPTERS,
  COMPARE_CHAPTER_COUNT,
  countByChapter,
  countBySection,
} from "@/lib/file-compare/data";
import type { ChapterNode, DiffItem } from "@/lib/file-compare/types";
import { cn } from "@/lib/utils";

export const ALL_CHAPTERS = "all";

function matchChapter(node: ChapterNode, keyword: string) {
  const text = `${node.no} ${node.title}`.toLowerCase();
  return text.includes(keyword);
}

/** 左侧章节目录：搜索过滤 + 选中过滤中间变化列表 */
export function ChapterOutlinePanel({
  diffs,
  totalCount,
  selectedChapterId,
  onSelectChapter,
}: {
  /** 已按类型筛选后的差异，用于目录右侧计数 */
  diffs: DiffItem[];
  totalCount: number;
  selectedChapterId: string;
  onSelectChapter: (chapterId: string) => void;
}) {
  const [keyword, setKeyword] = useState("");
  const [expanded, setExpanded] = useState<string[]>(["ch3"]);

  const visibleChapters = useMemo(() => {
    const trimmed = keyword.trim().toLowerCase();
    if (!trimmed) return COMPARE_CHAPTERS;
    return COMPARE_CHAPTERS.map((chapter) => {
      if (matchChapter(chapter, trimmed)) return chapter;
      const children = chapter.children?.filter((child) => matchChapter(child, trimmed));
      return children && children.length > 0 ? { ...chapter, children } : null;
    }).filter((chapter): chapter is ChapterNode => chapter !== null);
  }, [keyword]);

  const searching = keyword.trim().length > 0;

  const isExpanded = (chapterId: string) =>
    searching || expanded.includes(chapterId) || selectedChapterId === chapterId;

  const handleSelect = (node: ChapterNode, topLevel: boolean) => {
    onSelectChapter(node.id);
    if (topLevel) {
      setExpanded((prev) => (prev.includes(node.id) ? prev : [...prev, node.id]));
    }
  };

  return (
    <section className="flex h-full min-h-0 min-w-0 flex-col">
      <header className="flex h-[22px] shrink-0 items-center justify-between gap-2">
        <h3 className="text-[13px] font-semibold text-kb-heading">章节目录</h3>
        <span className="text-[11.5px] tabular-nums text-kb-muted">
          {COMPARE_CHAPTER_COUNT} 个章节
        </span>
      </header>

      <div className="mt-2.5 flex h-8 shrink-0 items-center gap-1.5 rounded-[7px] border border-kb-border bg-white px-2.5 transition-colors focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/15">
        <Search className="h-3.5 w-3.5 shrink-0 text-kb-muted" aria-hidden />
        <input
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
          placeholder="搜索章节"
          aria-label="搜索章节"
          className="min-w-0 flex-1 border-0 bg-transparent text-[12.5px] outline-none placeholder:text-muted-foreground/70"
        />
        {keyword && (
          <button
            type="button"
            aria-label="清空章节搜索"
            onClick={() => setKeyword("")}
            className="grid h-5 w-5 shrink-0 place-items-center rounded-full text-kb-muted transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="h-3 w-3 stroke-[2.2]" />
          </button>
        )}
      </div>

      <div className="scrollbar-thin mt-2 min-h-0 flex-1 overflow-y-auto pr-0.5">
        <OutlineRow
          label="全文概览"
          count={totalCount}
          active={selectedChapterId === ALL_CHAPTERS}
          onClick={() => onSelectChapter(ALL_CHAPTERS)}
        />
        {visibleChapters.map((chapter) => (
          <div key={chapter.id}>
            <OutlineRow
              label={`${chapter.no} ${chapter.title}`}
              count={countByChapter(diffs, chapter.id)}
              active={selectedChapterId === chapter.id}
              onClick={() => handleSelect(chapter, true)}
            />
            {isExpanded(chapter.id) &&
              chapter.children?.map((child) => (
                <OutlineRow
                  key={child.id}
                  label={`${child.no} ${child.title}`}
                  count={countBySection(diffs, child.id)}
                  active={selectedChapterId === child.id}
                  nested
                  onClick={() => handleSelect(child, false)}
                />
              ))}
          </div>
        ))}
        {visibleChapters.length === 0 && (
          <p className="px-2 py-6 text-center text-[12px] text-kb-muted">未找到匹配的章节</p>
        )}
      </div>
    </section>
  );
}

function OutlineRow({
  label,
  count,
  active,
  nested,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  nested?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      data-outline-item=""
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "flex h-[30px] w-full items-center justify-between gap-2 rounded-[6px] pr-2.5 text-left transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25",
        nested ? "pl-6" : "pl-2.5",
        active
          ? "bg-primary-soft font-medium text-primary"
          : "text-kb-body hover:bg-kb-surface-hover",
      )}
    >
      <span className={cn("min-w-0 truncate text-[12.5px]", nested && !active && "text-kb-muted")}>
        {label}
      </span>
      <span
        className={cn(
          "shrink-0 text-[11.5px] tabular-nums",
          active ? "text-primary" : count > 0 ? "text-kb-body" : "text-kb-muted/60",
        )}
      >
        {count}
      </span>
    </button>
  );
}

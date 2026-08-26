import { ArrowLeft, ArrowRight, ChevronDown } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { KbButton, KbEmptyState } from "@/components/knowledge/ui";
import { DIFF_TYPE_META } from "@/lib/file-compare/meta";
import { getDiffMatchState } from "@/lib/file-compare/matching";
import type { DiffItem, DiffType } from "@/lib/file-compare/types";
import { cn } from "@/lib/utils";
import { DiffTypeDot } from "./DiffTypeIndicators";

const NAV_ORDER: DiffType[] = ["added", "modified", "removed", "moved"];

/** 按差异类型分组的阅读导航，章节结构不参与左右文档的强绑定。 */
export function DiffListPanel({
  diffs,
  documentDiffTotal,
  activeDiffId,
  onSelectDiff,
  onPrev,
  onNext,
}: {
  diffs: DiffItem[];
  documentDiffTotal: number;
  activeDiffId?: string;
  onSelectDiff: (diff: DiffItem) => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  const listRef = useRef<HTMLDivElement | null>(null);
  const [expanded, setExpanded] = useState<Record<DiffType, boolean>>({
    added: true,
    modified: true,
    removed: true,
    moved: true,
  });

  const groups = useMemo(
    () =>
      NAV_ORDER.map((type) => ({ type, items: diffs.filter((diff) => diff.type === type) })).filter(
        (group) => group.items.length > 0,
      ),
    [diffs],
  );

  useEffect(() => {
    if (!activeDiffId || !listRef.current) return;
    listRef.current
      .querySelector<HTMLElement>(`[data-diff-id="${activeDiffId}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [activeDiffId]);

  return (
    <aside className="flex w-[clamp(286px,19vw,332px)] shrink-0 flex-col border-r border-kb-border bg-[#FCFDFD]">
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-kb-border px-3.5">
        <div>
          <h2 className="text-[13px] font-semibold text-kb-heading">差异导航</h2>
          <p className="mt-0.5 text-[11px] text-kb-muted">按差异类型定位正文</p>
        </div>
        <span className="rounded-[5px] bg-[#EFF5F6] px-2 py-1 text-[11.5px] font-medium tabular-nums text-kb-body">
          全部 {documentDiffTotal}
        </span>
      </header>

      <div ref={listRef} className="scrollbar-thin min-h-0 flex-1 overflow-y-auto px-2.5 py-2.5">
        {groups.length === 0 ? (
          <KbEmptyState title="没有匹配的差异" description="请调整搜索或差异类型后重试。" />
        ) : (
          <div className="space-y-1.5">
            {groups.map(({ type, items }) => {
              const meta = DIFF_TYPE_META[type];
              const open = expanded[type];
              return (
                <section key={type}>
                  <button
                    type="button"
                    aria-expanded={open}
                    onClick={() => setExpanded((state) => ({ ...state, [type]: !state[type] }))}
                    className="flex h-8 w-full items-center gap-2 rounded-[6px] px-2 text-left hover:bg-[#F2F7F8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25"
                  >
                    <DiffTypeDot type={type} />
                    <span className="text-[12.5px] font-semibold text-kb-heading">
                      {meta.label}
                    </span>
                    <span className="text-[11.5px] tabular-nums text-kb-muted">{items.length}</span>
                    <ChevronDown
                      className={cn(
                        "ml-auto h-3.5 w-3.5 text-kb-muted transition-transform",
                        !open && "-rotate-90",
                      )}
                      aria-hidden
                    />
                  </button>

                  {open && (
                    <ul className="mt-0.5 space-y-0.5">
                      {items.map((diff) => {
                        const active = diff.id === activeDiffId;
                        const match = getDiffMatchState(diff);
                        return (
                          <li key={diff.id}>
                            <button
                              type="button"
                              data-diff-id={diff.id}
                              aria-current={active ? "true" : undefined}
                              onClick={() => onSelectDiff(diff)}
                              className={cn(
                                "group flex w-full items-start gap-2 rounded-[6px] border py-2 pl-5 pr-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25",
                                active
                                  ? "border-primary/30 bg-[#EAF6F8]"
                                  : "border-transparent hover:bg-[#F5FAFB]",
                              )}
                            >
                              <span
                                className="mt-[5px] h-1.5 w-1.5 shrink-0 rounded-full"
                                style={{ backgroundColor: meta.chartColor }}
                                aria-hidden
                              />
                              <span className="min-w-0 flex-1">
                                <span
                                  className={cn(
                                    "block truncate text-[12px]",
                                    active
                                      ? "font-semibold text-primary"
                                      : "font-medium text-kb-heading",
                                  )}
                                >
                                  {diff.clause} {diff.title}
                                </span>
                                <span className="mt-0.5 flex items-center gap-1.5 text-[10.5px] tabular-nums text-kb-muted">
                                  <span>
                                    第 {diff.type === "removed" ? diff.basePage : diff.targetPage}{" "}
                                    页
                                  </span>
                                  {match.kind !== "auto" && (
                                    <span
                                      className={cn(
                                        "rounded-[3px] px-1 py-0.5",
                                        match.kind === "semantic"
                                          ? "bg-[#F2EEFC] text-[#6B5AB8]"
                                          : "bg-[#FFF3E2] text-[#A86B15]",
                                      )}
                                    >
                                      {match.kind === "semantic" ? "语义匹配" : "未匹配"}
                                    </span>
                                  )}
                                  {active && (
                                    <span className="ml-auto">
                                      {diff.seq}/{documentDiffTotal}
                                    </span>
                                  )}
                                </span>
                              </span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </section>
              );
            })}
          </div>
        )}
      </div>

      <div className="grid shrink-0 grid-cols-2 gap-2 border-t border-kb-border p-2.5">
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

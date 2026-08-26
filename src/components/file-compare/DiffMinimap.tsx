import { DOCUMENT_ANCHOR_ORDER } from "@/lib/file-compare/data";
import { DIFF_TYPE_META } from "@/lib/file-compare/meta";
import type { DiffItem } from "@/lib/file-compare/types";
import { cn } from "@/lib/utils";

/** 文档区右侧的差异位置缩略条：按段落在文档中的位置排布，可点击跳转 */
export function DiffMinimap({
  diffs,
  activeDiffId,
  onSelect,
}: {
  diffs: DiffItem[];
  activeDiffId?: string;
  onSelect: (diff: DiffItem) => void;
}) {
  const anchorTotal = Math.max(1, DOCUMENT_ANCHOR_ORDER.length - 1);

  return (
    <div
      className="relative w-[11px] shrink-0 border-l border-kb-border bg-[#FAFCFC]"
      role="navigation"
      aria-label="差异位置缩略条"
    >
      {diffs.map((diff) => {
        const anchorIndex = Math.max(0, DOCUMENT_ANCHOR_ORDER.indexOf(diff.anchor));
        const active = diff.id === activeDiffId;
        return (
          <button
            key={diff.id}
            type="button"
            title={`${DIFF_TYPE_META[diff.type].label} ${diff.title}`}
            aria-label={`跳转到第 ${diff.seq} 处差异：${diff.title}`}
            onClick={() => onSelect(diff)}
            style={{
              top: `calc(${(anchorIndex / anchorTotal) * 100}% - 3px)`,
              backgroundColor: DIFF_TYPE_META[diff.type].chartColor,
            }}
            className={cn(
              "absolute left-[2px] right-[2px] h-[6px] rounded-[1px] transition-[outline] focus-visible:outline-none",
              active && "outline outline-2 outline-offset-[1px] outline-primary",
            )}
          />
        );
      })}
    </div>
  );
}

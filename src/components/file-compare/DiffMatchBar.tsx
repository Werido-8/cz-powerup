import { DIFF_TYPE_META } from "@/lib/file-compare/meta";
import type { DiffType } from "@/lib/file-compare/types";

/** 双栏之间的关联轨道：竖线 + 横线圆点，颜色随当前差异类型变化。 */
export function DiffConnectionRail({
  diff,
}: {
  diff?: { type: DiffType; title: string } | null;
}) {
  const color = diff ? DIFF_TYPE_META[diff.type].chartColor : "#B8C7CC";
  return (
    <div
      className="relative w-7 shrink-0 border-x border-kb-border bg-[#F8FBFB]"
      aria-label={diff ? `当前关联差异：${diff.title}` : "差异关联轨道"}
    >
      <span
        className="absolute left-1/2 top-[42%] h-12 w-px -translate-x-1/2 bg-[#DCE7E9]"
        aria-hidden
      />
      <span
        className="absolute left-0 right-0 top-[calc(42%+23px)] h-px"
        style={{ backgroundColor: color }}
        aria-hidden
      />
      <span
        className="absolute left-1/2 top-[calc(42%+19px)] h-2 w-2 -translate-x-1/2 rounded-full border-2 border-white shadow-sm"
        style={{ backgroundColor: color }}
        aria-hidden
      />
    </div>
  );
}

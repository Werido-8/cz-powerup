import { FileDiff } from "lucide-react";
import { DIFF_TYPE_META } from "@/lib/file-compare/meta";
import { DIFF_TYPE_ORDER } from "@/lib/file-compare/data";
import type { DiffType } from "@/lib/file-compare/types";
import { cn } from "@/lib/utils";

export interface DiffStatCardsProps {
  total: number;
  affectedChapters: number;
  counts: Record<DiffType, number>;
  /** 当前生效的类型筛选，undefined 表示全部 */
  activeType?: DiffType;
  onSelectType: (type?: DiffType) => void;
}

const CARD_SHELL =
  "flex h-[76px] items-center gap-3 rounded-[8px] border bg-white px-4 text-left transition-colors " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25";

export function DiffStatCards({
  total,
  affectedChapters,
  counts,
  activeType,
  onSelectType,
}: DiffStatCardsProps) {
  return (
    <div className="grid shrink-0 grid-cols-[1.34fr_1fr_1fr_1fr_1fr] gap-3">
      <button
        type="button"
        aria-pressed={!activeType}
        onClick={() => onSelectType(undefined)}
        title={activeType ? "查看全部差异" : undefined}
        className={cn(CARD_SHELL, "border-kb-border hover:border-primary/35")}
      >
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[8px] bg-primary text-white">
          <FileDiff className="h-[18px] w-[18px] stroke-[1.8]" aria-hidden />
        </span>
        <span className="min-w-0">
          <span className="block text-[11.5px] font-medium text-kb-muted">共识别差异</span>
          <span className="mt-0.5 flex items-baseline gap-1 whitespace-nowrap">
            <span className="text-[22px] font-bold leading-none tabular-nums text-kb-heading">
              {total}
            </span>
            <span className="text-[12px] text-kb-body">处，涉及 {affectedChapters} 个章节</span>
          </span>
        </span>
      </button>

      {DIFF_TYPE_ORDER.map((type) => {
        const meta = DIFF_TYPE_META[type];
        const Icon = meta.icon;
        const active = activeType === type;
        return (
          <button
            key={type}
            type="button"
            aria-pressed={active}
            onClick={() => onSelectType(active ? undefined : type)}
            className={cn(
              CARD_SHELL,
              active
                ? "border-primary/45 shadow-[0_0_0_1px_rgba(52,155,172,0.18)]"
                : "border-kb-border hover:border-primary/35",
            )}
          >
            <span
              className={cn(
                "grid h-9 w-9 shrink-0 place-items-center",
                type === "added" || type === "removed" ? "rounded-full" : "rounded-[8px]",
                meta.cardIcon,
              )}
            >
              <Icon className="h-[18px] w-[18px] stroke-[1.9]" aria-hidden />
            </span>
            <span className="min-w-0">
              <span className="block text-[11.5px] font-medium text-kb-muted">{meta.label}</span>
              <span
                className={cn(
                  "mt-0.5 block text-[22px] font-bold leading-none tabular-nums",
                  meta.valueText,
                )}
              >
                {counts[type]}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

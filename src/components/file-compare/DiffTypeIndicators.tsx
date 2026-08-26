import { DIFF_TYPE_META } from "@/lib/file-compare/meta";
import type { DiffType } from "@/lib/file-compare/types";
import { cn } from "@/lib/utils";

/** 差异清单前的圆形类型图标 */
export function DiffTypeDot({ type, className }: { type: DiffType; className?: string }) {
  const meta = DIFF_TYPE_META[type];
  const Icon = meta.icon;
  return (
    <span
      className={cn(
        "grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full",
        meta.listIcon,
        className,
      )}
      aria-label={meta.label}
    >
      <Icon className="h-[11px] w-[11px] stroke-[2.2]" />
    </span>
  );
}

/** 中文差异类型标签，必须与颜色同时出现 */
export function DiffTypeTag({ type, className }: { type: DiffType; className?: string }) {
  const meta = DIFF_TYPE_META[type];
  const Icon = meta.icon;
  return (
    <span
      className={cn(
        "inline-flex h-[20px] shrink-0 items-center gap-1 rounded-[4px] px-1.5 text-[11px] font-medium",
        meta.listIcon,
        className,
      )}
    >
      <Icon className="h-3 w-3 stroke-[2.2]" aria-hidden />
      {meta.label}
    </span>
  );
}

/** 类型筛选胶囊（全部 / 新增 / 删除 / 修改） */
export function DiffTypePill({
  label,
  count,
  active,
  tone,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  tone?: DiffType;
  onClick: () => void;
}) {
  const activeClass = tone
    ? DIFF_TYPE_META[tone].pillActive
    : "border-primary/30 bg-primary-soft text-primary";
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "inline-flex h-[26px] items-center gap-1 rounded-[6px] border px-2.5 text-[12px] font-medium transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25",
        active
          ? activeClass
          : "border-transparent bg-[#F4F7F8] text-kb-muted hover:bg-[#EBF1F3] hover:text-kb-body",
      )}
    >
      {label}
      <span className="tabular-nums">{count}</span>
    </button>
  );
}

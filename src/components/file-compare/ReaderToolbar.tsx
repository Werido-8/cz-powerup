import { ArrowLeft, ArrowRight, Link2, Link2Off, Search, X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DIFF_TYPE_ORDER } from "@/lib/file-compare/data";
import { DIFF_TYPE_META } from "@/lib/file-compare/meta";
import type { DiffType } from "@/lib/file-compare/types";
import { cn } from "@/lib/utils";

export function ReaderToolbar({
  keyword,
  onKeywordChange,
  activeType,
  onTypeChange,
  syncScroll,
  onSyncScrollChange,
  position,
  total,
  onPrev,
  onNext,
}: {
  keyword: string;
  onKeywordChange: (value: string) => void;
  activeType?: DiffType;
  onTypeChange: (type?: DiffType) => void;
  syncScroll: boolean;
  onSyncScrollChange: (value: boolean) => void;
  position: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <div className="scrollbar-thin flex h-12 shrink-0 items-center gap-2 overflow-x-auto border-b border-kb-border px-3">
      <div className="flex h-8 w-[220px] shrink-0 items-center gap-2 rounded-[6px] border border-kb-border bg-white px-2.5 transition-colors focus-within:border-primary/60 focus-within:ring-1 focus-within:ring-primary/20">
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
            className="grid h-5 w-5 place-items-center rounded-[4px] text-kb-muted hover:bg-muted hover:text-foreground"
          >
            <X className="h-3 w-3 stroke-[2.2]" />
          </button>
        )}
      </div>

      <TogglePill
        active={syncScroll}
        onClick={() => onSyncScrollChange(!syncScroll)}
        icon={syncScroll ? Link2 : Link2Off}
      >
        同步滚动
      </TogglePill>

      <span className="ml-1 shrink-0 text-[11.5px] text-kb-muted">显示</span>
      <Select
        value={activeType ?? "all"}
        onValueChange={(value) => onTypeChange(value === "all" ? undefined : (value as DiffType))}
      >
        <SelectTrigger
          aria-label="显示差异类型"
          className="h-8 w-[104px] shrink-0 rounded-[6px] border-kb-border bg-white px-2.5 text-[12px] shadow-none"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all" className="text-[13px]">
            全部差异
          </SelectItem>
          {DIFF_TYPE_ORDER.map((type) => (
            <SelectItem key={type} value={type} className="text-[13px]">
              {DIFF_TYPE_META[type].label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="ml-auto flex shrink-0 items-center gap-1.5 pl-2">
        <span data-diff-counter="" className="mr-1 text-[12px] tabular-nums text-kb-muted">
          第 {position} / {total} 处
        </span>
        <StepButton label="上一处差异" icon={ArrowLeft} onClick={onPrev} disabled={total === 0} />
        <StepButton label="下一处差异" icon={ArrowRight} onClick={onNext} disabled={total === 0} />
      </div>
    </div>
  );
}

function TogglePill({
  active,
  icon: Icon,
  onClick,
  children,
}: {
  active: boolean;
  icon: typeof Link2;
  onClick: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-[6px] border px-2.5 text-[12px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25",
        active
          ? "border-primary/30 bg-primary-soft text-primary"
          : "border-kb-border bg-white text-kb-muted hover:text-kb-body",
      )}
    >
      <Icon className="h-3.5 w-3.5 stroke-[1.9]" aria-hidden />
      {children}
    </button>
  );
}

function StepButton({
  label,
  icon: Icon,
  onClick,
  disabled,
}: {
  label: string;
  icon: typeof ArrowLeft;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className="grid h-7 w-7 place-items-center rounded-[6px] border border-kb-border bg-white text-kb-muted transition-colors hover:border-primary/40 hover:text-primary disabled:cursor-not-allowed disabled:opacity-45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25"
    >
      <Icon className="h-3.5 w-3.5 stroke-[1.9]" />
    </button>
  );
}

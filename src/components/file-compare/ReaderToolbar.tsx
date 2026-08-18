import { ArrowLeft, ArrowRight, Link2, Link2Off } from "lucide-react";
import { KbSegmentControl } from "@/components/knowledge/ui";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { READER_ZOOM_OPTIONS, type ReaderLayout, type ReaderZoom } from "@/lib/file-compare/types";
import { cn } from "@/lib/utils";

const LAYOUT_OPTIONS = [
  { value: "dual", label: "双栏" },
  { value: "single", label: "单栏" },
];

export function ReaderToolbar({
  layout,
  onLayoutChange,
  syncScroll,
  onSyncScrollChange,
  zoom,
  onZoomChange,
  position,
  total,
  onPrev,
  onNext,
}: {
  layout: ReaderLayout;
  onLayoutChange: (layout: ReaderLayout) => void;
  syncScroll: boolean;
  onSyncScrollChange: (value: boolean) => void;
  zoom: ReaderZoom;
  onZoomChange: (zoom: ReaderZoom) => void;
  /** 当前差异在筛选结果中的序号，0 表示未选中 */
  position: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <div className="flex h-11 shrink-0 items-center gap-2 border-b border-kb-border px-3">
      <KbSegmentControl
        options={LAYOUT_OPTIONS}
        value={layout}
        onChange={(value) => onLayoutChange(value as ReaderLayout)}
        className="shrink-0"
      />

      <span className="mx-1 h-4 w-px shrink-0 bg-[#E4EDEF]" aria-hidden />

      <TogglePill
        active={syncScroll}
        onClick={() => onSyncScrollChange(!syncScroll)}
        icon={syncScroll ? Link2 : Link2Off}
      >
        同步滚动
      </TogglePill>

      <Select
        value={String(zoom)}
        onValueChange={(value) => onZoomChange(Number(value) as ReaderZoom)}
      >
        <SelectTrigger
          aria-label="正文缩放比例"
          className="ml-1 h-[26px] w-[76px] shrink-0 rounded-[6px] border-kb-border bg-white px-2.5 text-[12px] tabular-nums shadow-none"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {READER_ZOOM_OPTIONS.map((option) => (
            <SelectItem key={option} value={String(option)} className="text-[13px] tabular-nums">
              {option}%
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="ml-auto flex shrink-0 items-center gap-2">
        <span data-diff-counter="" className="text-[12px] tabular-nums text-kb-muted">
          第 {position} / {total} 处差异
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
  icon?: typeof Link2;
  onClick: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "inline-flex h-[26px] shrink-0 items-center gap-1.5 rounded-[6px] border px-2.5 text-[12px] font-medium transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25",
        active
          ? "border-primary/30 bg-primary-soft text-primary"
          : "border-transparent bg-[#F4F7F8] text-kb-muted hover:bg-[#EBF1F3] hover:text-kb-body",
      )}
    >
      {children}
      {Icon && <Icon className="h-3.5 w-3.5 stroke-[1.9]" aria-hidden />}
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
      className="grid h-[26px] w-[28px] place-items-center rounded-[6px] border border-kb-border bg-white text-kb-muted transition-colors hover:border-primary/40 hover:text-primary disabled:cursor-not-allowed disabled:opacity-45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25"
    >
      <Icon className="h-3.5 w-3.5 stroke-[1.9]" />
    </button>
  );
}

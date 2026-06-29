import { Link } from "@tanstack/react-router";
import { BookMarked, BookOpen, ChevronLeft, ChevronRight, Eye, List, RotateCcw } from "lucide-react";
import { useMemo } from "react";
import {
  buildReviewTimeline,
  entriesForDate,
  ENTRY_PHASE_LABEL,
  formatMonthTitle,
  formatReviewDayLabel,
  formatShortDate,
  formatWeekday,
  getEntryPhase,
  getMonthGrid,
  getWeekDays,
  toDateKey,
  type ReviewEntryPhase,
  type ReviewPlanRow,
  type ReviewTimelineDay,
  type ReviewTimelineEntry,
} from "@/lib/mock/spaced-review";
import { cn } from "@/lib/utils";
import { learningBtnRadius, listActionClass } from "./ui";

export type ReviewViewMode = "list" | "month" | "week" | "day";

const VIEW_OPTIONS: { key: ReviewViewMode; label: string }[] = [
  { key: "list", label: "列表" },
  { key: "month", label: "月" },
  { key: "week", label: "周" },
  { key: "day", label: "日" },
];

const WEEK_HEADERS = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];

const CHIP_COLORS = [
  "bg-sky-100 text-sky-900 border-sky-200",
  "bg-amber-100 text-amber-900 border-amber-200",
  "bg-violet-100 text-violet-900 border-violet-200",
  "bg-emerald-100 text-emerald-900 border-emerald-200",
  "bg-rose-100 text-rose-900 border-rose-200",
];

function chipColor(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash + id.charCodeAt(i)) % CHIP_COLORS.length;
  return CHIP_COLORS[hash];
}

function extractTime(at: string) {
  const m = at.match(/(\d{1,2}:\d{2})/);
  return m?.[1] ?? "";
}

function shiftCursor(mode: ReviewViewMode, cursor: Date, dir: -1 | 1) {
  const d = new Date(cursor);
  if (mode === "month") d.setMonth(d.getMonth() + dir);
  else if (mode === "week") d.setDate(d.getDate() + dir * 7);
  else d.setDate(d.getDate() + dir);
  return d;
}

export function ReviewPhaseTag({ phase }: { phase: ReviewEntryPhase }) {
  return (
    <span
      className={cn(
        "rounded-md px-2 py-0.5 text-[10.5px] font-medium",
        phase === "overdue" && "bg-destructive/15 text-destructive",
        phase === "due" && "bg-warning/15 text-warning-foreground",
        phase === "upcoming" && "bg-muted text-muted-foreground",
      )}
    >
      {ENTRY_PHASE_LABEL[phase]}
    </span>
  );
}

export function ReviewEntryActions({ row, phase }: { row: ReviewPlanRow; phase: ReviewEntryPhase }) {
  if (row.kind === "doc") {
    if (phase === "upcoming") {
      return (
        <>
          <Link to="/learn/doc/$id" params={{ id: row.sourceId }} className={listActionClass()}>
            <Eye className="h-3.5 w-3.5" />
            查看资料
          </Link>
          <Link to="/learn/doc/$id" params={{ id: row.sourceId }} className={listActionClass("soft")}>
            <BookOpen className="h-3.5 w-3.5" />
            提前阅读
          </Link>
        </>
      );
    }
    return (
      <Link
        to="/learn/doc/$id"
        params={{ id: row.sourceId }}
        className={listActionClass(phase === "overdue" ? "primary" : "outline")}
      >
        <BookOpen className="h-3.5 w-3.5" />
        {phase === "overdue" ? "立即阅读" : "阅读"}
      </Link>
    );
  }

  if (phase === "upcoming") {
    return (
      <>
        <Link to="/training/wrong" className={listActionClass()}>
          <Eye className="h-3.5 w-3.5" />
          查看错题
        </Link>
        <Link
          to="/training/session/$id"
          params={{ id: `复习-${row.sourceId}` }}
          search={{ mode: "review", filter: "", count: 1, limit: 0 }}
          className={listActionClass("soft")}
        >
          <RotateCcw className="h-3.5 w-3.5" />
          提前复习
        </Link>
      </>
    );
  }

  return (
    <Link
      to="/training/session/$id"
      params={{ id: `复习-${row.sourceId}` }}
      search={{ mode: "review", filter: "", count: 1, limit: 0 }}
      className={listActionClass(phase === "overdue" ? "primary" : "outline")}
    >
      <RotateCcw className="h-3.5 w-3.5" />
      {phase === "overdue" ? "立即复习" : "复习"}
    </Link>
  );
}

export function ReviewViewToolbar({
  mode,
  onModeChange,
  cursorDate,
  onCursorChange,
  onToday,
}: {
  mode: ReviewViewMode;
  onModeChange: (m: ReviewViewMode) => void;
  cursorDate: Date;
  onCursorChange: (d: Date) => void;
  onToday: () => void;
}) {
  const title =
    mode === "month"
      ? formatMonthTitle(cursorDate)
      : mode === "week"
        ? `${formatMonthTitle(cursorDate)} · 第 ${Math.ceil(cursorDate.getDate() / 7)} 周`
        : mode === "day"
          ? formatReviewDayLabel(cursorDate)
          : "今日待复习";

  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-0.5 rounded-lg border border-border bg-muted/30 p-0.5">
          {VIEW_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              type="button"
              onClick={() => onModeChange(opt.key)}
              className={cn(
                "px-2.5 py-1 text-[12px] font-medium transition-colors",
                learningBtnRadius,
                mode === opt.key
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {opt.key === "list" ? (
                <span className="inline-flex items-center gap-1">
                  <List className="h-3.5 w-3.5" />
                  {opt.label}
                </span>
              ) : (
                opt.label
              )}
            </button>
          ))}
        </div>
        {mode !== "list" && (
          <span className="text-[14px] font-semibold text-foreground">{title}</span>
        )}
      </div>

      {mode !== "list" && (
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onToday}
            className={cn(
              "border border-border bg-card px-2.5 py-1 text-[12px] font-medium text-foreground hover:bg-muted/40",
              learningBtnRadius,
            )}
          >
            今天
          </button>
          <button
            type="button"
            onClick={() => onCursorChange(shiftCursor(mode, cursorDate, -1))}
            className={cn(
              "grid h-8 w-8 place-items-center border border-border bg-card text-muted-foreground hover:bg-muted/40",
              learningBtnRadius,
            )}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onCursorChange(shiftCursor(mode, cursorDate, 1))}
            className={cn(
              "grid h-8 w-8 place-items-center border border-border bg-card text-muted-foreground hover:bg-muted/40",
              learningBtnRadius,
            )}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}

function CalendarEntryChip({
  entry,
  compact,
  onClick,
}: {
  entry: ReviewTimelineEntry;
  compact?: boolean;
  onClick?: () => void;
}) {
  const time = extractTime(entry.at);
  const phase = getEntryPhase(entry);
  const label = compact
    ? `${phase === "upcoming" ? "预期 " : ""}第${entry.round}轮 · ${entry.row.title.slice(0, 10)}${entry.row.title.length > 10 ? "…" : ""}`
    : `第 ${entry.round} 次 · ${entry.row.title}`;

  const inner = (
    <span
      className={cn(
        "block truncate rounded border px-1.5 py-0.5 text-left text-[10.5px] leading-snug",
        chipColor(entry.id),
        phase === "due" && "ring-1 ring-warning/40",
        phase === "overdue" && "ring-1 ring-destructive/40",
        phase === "upcoming" && "opacity-85",
      )}
    >
      {time && <span className="mr-1 font-medium tabular-nums">{time}</span>}
      {label}
    </span>
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className="w-full text-left">
        {inner}
      </button>
    );
  }
  return inner;
}

function DayEntryDetail({ entry }: { entry: ReviewTimelineEntry }) {
  const { row } = entry;
  const phase = getEntryPhase(entry);

  return (
    <div
      className={cn(
        "flex flex-col gap-2 border-t border-divider px-4 py-3 first:border-t-0 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-5",
        phase === "due" && "bg-warning-soft/15",
        phase === "overdue" && "bg-destructive/5",
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10.5px] font-medium",
              row.kind === "doc" ? "bg-primary-soft text-accent-foreground" : "bg-muted text-muted-foreground",
            )}
          >
            {row.kind === "doc" ? <BookOpen className="h-3 w-3" /> : <BookMarked className="h-3 w-3" />}
            {row.kindLabel}
          </span>
          <span className="text-[12px] font-medium text-primary">第 {entry.round} 次复习</span>
          <ReviewPhaseTag phase={phase} />
          <span className="text-[11.5px] tabular-nums text-muted-foreground">{entry.at}</span>
        </div>
        <p className="mt-1.5 text-[13.5px] font-medium leading-snug text-foreground">{row.title}</p>
        {phase === "upcoming" ? (
          <p className="mt-1 text-[12px] text-muted-foreground">尚未到计划复习时间，可按需提前复习</p>
        ) : (
          entry.nextDateKey && (
            <p className="mt-1 text-[12px] text-muted-foreground">
              下一次为第 {entry.nextRound} 次复习 · {formatShortDate(entry.nextDateKey)}
              {entry.nextAt && `（${entry.nextAt}）`}
            </p>
          )
        )}
      </div>
      <div className="flex shrink-0 flex-wrap gap-1.5 sm:justify-end">
        <ReviewEntryActions row={row} phase={phase} />
      </div>
    </div>
  );
}

export function ReviewMonthView({
  timeline,
  cursorDate,
  selectedDate,
  onSelectDate,
}: {
  timeline: ReviewTimelineDay[];
  cursorDate: Date;
  selectedDate: Date;
  onSelectDate: (d: Date) => void;
}) {
  const todayKey = toDateKey(new Date());
  const selectedKey = toDateKey(selectedDate);
  const cells = getMonthGrid(cursorDate.getFullYear(), cursorDate.getMonth());

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="grid grid-cols-7 border-b border-divider bg-muted/20">
        {WEEK_HEADERS.map((h) => (
          <div key={h} className="px-1 py-2 text-center text-[11px] font-medium text-muted-foreground">
            {h}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {cells.map((date) => {
          const key = toDateKey(date);
          const inMonth = date.getMonth() === cursorDate.getMonth();
          const entries = entriesForDate(timeline, key);
          const isToday = key === todayKey;
          const isSelected = key === selectedKey;

          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelectDate(date)}
              className={cn(
                "min-h-[88px] border-b border-r border-divider p-1.5 text-left transition-colors last:border-r-0 hover:bg-muted/20",
                !inMonth && "bg-muted/10",
                isSelected && "bg-primary-soft/30 ring-1 ring-inset ring-primary/25",
              )}
            >
              <div className="mb-1 flex justify-end">
                <span
                  className={cn(
                    "inline-flex h-6 min-w-6 items-center justify-center rounded-full px-1 text-[11px] font-medium tabular-nums",
                    isToday && "bg-destructive text-destructive-foreground",
                    !isToday && inMonth && "text-foreground",
                    !inMonth && "text-muted-foreground/60",
                  )}
                >
                  {date.getDate()}
                </span>
              </div>
              <div className="space-y-0.5">
                {entries.slice(0, 3).map((e) => (
                  <CalendarEntryChip key={e.id} entry={e} compact />
                ))}
                {entries.length > 3 && (
                  <span className="block px-1 text-[10px] text-muted-foreground">+{entries.length - 3} 项</span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function ReviewWeekView({
  timeline,
  cursorDate,
  selectedDate,
  onSelectDate,
  onOpenDay,
}: {
  timeline: ReviewTimelineDay[];
  cursorDate: Date;
  selectedDate: Date;
  onSelectDate: (d: Date) => void;
  onOpenDay?: (d: Date) => void;
}) {
  const days = getWeekDays(cursorDate);
  const todayKey = toDateKey(new Date());
  const selectedKey = toDateKey(selectedDate);

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="grid grid-cols-7 border-b border-divider">
        {days.map((date) => {
          const key = toDateKey(date);
          const isToday = key === todayKey;
          const isSelected = key === selectedKey;
          const entries = entriesForDate(timeline, key);

          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelectDate(date)}
              className={cn(
                "border-r border-divider px-2 py-2.5 text-left last:border-r-0 hover:bg-muted/20",
                isSelected && "bg-primary-soft/25",
              )}
            >
              <div className="text-[11px] text-muted-foreground">{WEEK_HEADERS[date.getDay()]}</div>
              <div
                className={cn(
                  "mt-0.5 inline-flex h-7 w-7 items-center justify-center rounded-full text-[13px] font-semibold tabular-nums",
                  isToday && "bg-destructive text-destructive-foreground",
                )}
              >
                {date.getDate()}
              </div>
              {entries.length > 0 && (
                <div className="mt-1 text-[10px] font-medium text-primary">{entries.length} 项</div>
              )}
            </button>
          );
        })}
      </div>
      <div className="grid min-h-[240px] grid-cols-7 divide-x divide-divider">
        {days.map((date) => {
          const key = toDateKey(date);
          const entries = entriesForDate(timeline, key);

          return (
            <div key={key} className="flex flex-col gap-1 p-1.5">
              {entries.length === 0 ? (
                <span className="px-1 py-4 text-center text-[10px] text-muted-foreground/60">—</span>
              ) : (
                entries.map((e) => (
                  <CalendarEntryChip
                    key={e.id}
                    entry={e}
                    compact
                    onClick={onOpenDay ? () => onOpenDay(date) : undefined}
                  />
                ))
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function ReviewDayView({
  timeline,
  cursorDate,
}: {
  timeline: ReviewTimelineDay[];
  cursorDate: Date;
}) {
  const key = toDateKey(cursorDate);
  const entries = entriesForDate(timeline, key);
  const day = timeline.find((d) => d.dateKey === key);
  const dueCount = entries.filter((e) => getEntryPhase(e) === "due" || getEntryPhase(e) === "overdue").length;
  const upcomingCount = entries.length - dueCount;

  if (!day || entries.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border px-4 py-12 text-center">
        <p className="text-[14px] font-medium text-foreground">{formatReviewDayLabel(cursorDate)}</p>
        <p className="mt-1 text-[12.5px] text-muted-foreground">暂无复习安排</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-[var(--shadow-card)]">
      <div className="border-b border-divider bg-muted/25 px-4 py-3 sm:px-5">
        <div className="text-[15px] font-semibold text-foreground">{formatReviewDayLabel(cursorDate)}</div>
        <div className="mt-0.5 text-[12px] text-muted-foreground">
          {formatWeekday(key)} · {entries.length} 项复习
          {dueCount > 0 && <span className="text-warning-foreground"> · {dueCount} 项待复习</span>}
          {upcomingCount > 0 && <span> · {upcomingCount} 项预期</span>}
        </div>
      </div>
      {entries.map((entry) => (
        <DayEntryDetail key={entry.id} entry={entry} />
      ))}
    </div>
  );
}

export function useReviewTimeline(plan: ReviewPlanRow[]) {
  return useMemo(() => buildReviewTimeline(plan), [plan]);
}

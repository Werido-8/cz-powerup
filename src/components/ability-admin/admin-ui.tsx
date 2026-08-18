import type { ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  AlertCircle,
  BarChart3,
  Check,
  ChevronDown,
  ClipboardList,
  Info,
  LockKeyhole,
  RefreshCw,
  SearchX,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { ExamFilterOption, ExamTaskStatus } from "@/lib/exam-admin/types";

export function AdminPageFrame({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn("mx-auto w-full max-w-[1600px] space-y-5", className)}>{children}</div>;
}

const EXAM_ADMIN_NAV = [
  { label: "考试任务", to: "/exam-admin", icon: ClipboardList },
  { label: "成绩分析", to: "/exam-admin/analysis", icon: BarChart3 },
] as const;

export function ExamAdminNav() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  return (
    <nav aria-label="考试管理" className="flex min-h-11 items-end gap-6 border-b border-kb-border">
      {EXAM_ADMIN_NAV.map((item) => {
        const active =
          item.to === "/exam-admin"
            ? pathname === "/exam-admin" || pathname === "/exam-admin/"
            : pathname === item.to || pathname.startsWith(`${item.to}/`);
        return (
          <Link
            key={item.to}
            to={item.to}
            className={cn(
              "relative inline-flex min-h-11 items-center gap-2 whitespace-nowrap text-[13.5px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
              active ? "text-primary" : "text-kb-muted hover:text-kb-heading",
            )}
            aria-current={active ? "page" : undefined}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
            {active && <span className="absolute inset-x-0 bottom-[-1px] h-0.5 bg-primary" />}
          </Link>
        );
      })}
    </nav>
  );
}

export function FilterBar({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <section
      aria-label="筛选条件"
      className={cn(
        "flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-kb-border py-3",
        className,
      )}
    >
      {children}
    </section>
  );
}

export function FilterField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="inline-flex min-w-0 items-center gap-2">
      <span className="shrink-0 text-[12px] font-medium text-kb-muted">{label}</span>
      {children}
    </label>
  );
}

export function MultiSelectFilter({
  label,
  options,
  value,
  onChange,
  className,
}: {
  label: string;
  options: ExamFilterOption[];
  value: string[];
  onChange: (value: string[]) => void;
  className?: string;
}) {
  const selectedNames = options
    .filter((option) => value.includes(option.id))
    .map((option) => option.name);
  const buttonLabel =
    selectedNames.length === 0
      ? `全部${label}`
      : selectedNames.length === 1
        ? selectedNames[0]
        : `已选 ${selectedNames.length} 项`;
  return (
    <div className={cn("inline-flex min-w-0 items-center gap-2", className)}>
      <span className="shrink-0 text-[12px] font-medium text-kb-muted">{label}</span>
      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="inline-flex h-9 min-w-[150px] items-center justify-between gap-3 rounded-md border border-kb-border bg-white px-3 text-[13px] text-kb-body outline-none transition-colors hover:border-primary/35 focus-visible:ring-2 focus-visible:ring-primary/20"
            aria-label={`${label}筛选，${buttonLabel}`}
          >
            <span className="truncate">{buttonLabel}</span>
            <ChevronDown className="h-3.5 w-3.5 shrink-0 text-kb-muted" />
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-60 p-2">
          <button
            type="button"
            onClick={() => onChange([])}
            className="mb-1 flex min-h-9 w-full items-center justify-between rounded-[7px] px-2.5 text-left text-[12.5px] text-kb-body hover:bg-kb-surface"
          >
            全部{label}
            {value.length === 0 && <Check className="h-3.5 w-3.5 text-primary" />}
          </button>
          <div className="max-h-64 overflow-y-auto">
            {options.map((option) => {
              const checked = value.includes(option.id);
              return (
                <label
                  key={option.id}
                  className="flex min-h-9 cursor-pointer items-center gap-2.5 rounded-[7px] px-2.5 text-[12.5px] text-kb-body hover:bg-kb-surface"
                >
                  <Checkbox
                    checked={checked}
                    onCheckedChange={() =>
                      onChange(
                        checked ? value.filter((id) => id !== option.id) : [...value, option.id],
                      )
                    }
                    aria-label={option.name}
                  />
                  <span>{option.name}</span>
                </label>
              );
            })}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

export function StatusTabs<T extends string>({
  items,
  value,
  onChange,
  ariaLabel,
}: {
  items: Array<{ value: T; label: string; count?: number }>;
  value: T;
  onChange: (value: T) => void;
  ariaLabel: string;
}) {
  return (
    <div className="flex min-h-10 gap-1 overflow-x-auto" role="tablist" aria-label={ariaLabel}>
      {items.map((item) => {
        const active = item.value === value;
        return (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(item.value)}
            className={cn(
              "inline-flex min-h-10 shrink-0 items-center gap-2 rounded-[8px] px-3 text-[12.5px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25",
              active
                ? "bg-primary text-white"
                : "border border-transparent text-kb-muted hover:border-kb-border hover:bg-white hover:text-kb-heading",
            )}
          >
            {item.label}
            {item.count != null && (
              <span
                className={cn(
                  "rounded px-1.5 py-0.5 text-[10.5px] tabular-nums",
                  active ? "bg-white/18 text-white" : "bg-kb-surface text-kb-muted",
                )}
              >
                {item.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

const TASK_STATUS_LABELS: Record<ExamTaskStatus, string> = {
  draft: "草稿",
  scheduled: "待开始",
  inProgress: "进行中",
  ended: "已结束",
};

const TASK_STATUS_STYLES: Record<ExamTaskStatus, string> = {
  draft: "bg-kb-surface text-kb-muted",
  scheduled: "bg-remind-soft text-remind-foreground",
  inProgress: "bg-primary-soft text-primary",
  ended: "bg-success-soft text-success",
};

export function ExamTaskStatusTag({ status }: { status: ExamTaskStatus }) {
  return (
    <span
      className={cn(
        "inline-flex min-h-6 items-center rounded-[6px] px-2 text-[11px] font-medium",
        TASK_STATUS_STYLES[status],
      )}
    >
      {TASK_STATUS_LABELS[status]}
    </span>
  );
}

export function ResultStatusTag({
  status,
}: {
  status: "notStarted" | "inProgress" | "submitted" | "expired";
}) {
  const labels = {
    notStarted: "未开始",
    inProgress: "进行中",
    submitted: "已提交",
    expired: "已过期",
  };
  const styles = {
    notStarted: "bg-kb-surface text-kb-muted",
    inProgress: "bg-primary-soft text-primary",
    submitted: "bg-success-soft text-success",
    expired: "bg-remind-soft text-remind-foreground",
  };
  return (
    <span className={cn("rounded-[6px] px-2 py-1 text-[10.5px] font-medium", styles[status])}>
      {labels[status]}
    </span>
  );
}

export function MetricCard({
  label,
  value,
  definition,
  comparison,
  note,
}: {
  label: string;
  value: string;
  definition: string;
  comparison?: ReactNode;
  note?: string;
}) {
  return (
    <article className="min-w-0 rounded-[12px] border border-kb-border bg-white px-4 py-4">
      <div className="flex items-center gap-1.5 text-[11.5px] font-medium text-kb-muted">
        {label}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              aria-label={`查看${label}口径`}
              className="grid h-6 w-6 place-items-center rounded text-kb-muted hover:bg-kb-surface hover:text-kb-heading focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25"
            >
              <Info className="h-3.5 w-3.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent className="max-w-[300px] leading-5">{definition}</TooltipContent>
        </Tooltip>
      </div>
      <div className="mt-2 text-[28px] font-semibold leading-none tracking-[-0.025em] text-kb-heading tabular-nums">
        {value}
      </div>
      <div className="mt-3 min-h-5 text-[11px] text-kb-muted">{comparison ?? note ?? " "}</div>
    </article>
  );
}

export function InlineProgress({ value, label }: { value: number | null; label: string }) {
  const width = value == null ? 0 : Math.max(0, Math.min(100, value));
  return (
    <div
      className="min-w-[128px]"
      aria-label={`${label} ${value == null ? "暂无数据" : `${Math.round(value)}%`}`}
    >
      <div className="flex items-center justify-between gap-3 text-[11.5px] text-kb-muted">
        <span>{label}</span>
        <strong className="font-semibold tabular-nums text-kb-heading">
          {value == null ? "—" : `${Math.round(value)}%`}
        </strong>
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-kb-surface">
        <div className="h-full rounded-full bg-primary" style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

export function DataTableShell({ children, footer }: { children: ReactNode; footer?: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-[8px] border border-kb-border bg-white">
      <div className="overflow-x-auto">{children}</div>
      {footer}
    </div>
  );
}

export type AsyncViewState = "loading" | "error" | "empty" | "forbidden";

export function AsyncState({
  state,
  title,
  description,
  actionLabel,
  onAction,
}: {
  state: AsyncViewState;
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  if (state === "loading") {
    return (
      <div className="space-y-4" aria-label="正在加载" aria-busy="true">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-28 rounded-[12px]" />
          ))}
        </div>
        <Skeleton className="h-12 rounded-[10px]" />
        <Skeleton className="h-72 rounded-[12px]" />
      </div>
    );
  }

  const Icon = state === "error" ? AlertCircle : state === "forbidden" ? LockKeyhole : SearchX;
  const fallbackTitle =
    state === "error" ? "内容加载失败" : state === "forbidden" ? "暂无查看权限" : "暂无数据";
  return (
    <div className="grid min-h-[280px] place-items-center rounded-[12px] border border-kb-border bg-white px-6 text-center">
      <div className="max-w-md">
        <span className="mx-auto grid h-11 w-11 place-items-center rounded-[10px] bg-kb-surface text-kb-muted">
          <Icon className="h-5 w-5" />
        </span>
        <h2 className="mt-3 text-[15px] font-semibold text-kb-heading">{title ?? fallbackTitle}</h2>
        {description && <p className="mt-1 text-[12.5px] leading-5 text-kb-muted">{description}</p>}
        {actionLabel && onAction && (
          <button
            type="button"
            onClick={onAction}
            className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-[8px] bg-primary px-4 text-[12.5px] font-semibold text-white hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          >
            {state === "error" && <RefreshCw className="h-3.5 w-3.5" />}
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  );
}

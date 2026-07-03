import { Link } from "@tanstack/react-router";
import { ChevronRight, History, Target } from "lucide-react";
import type { PracticeRecord } from "@/lib/mock/learning-hub";
import { StatCardDecor, StatIconFrame } from "@/components/learning/ui";
import { cn } from "@/lib/utils";

const cardBase =
  "relative overflow-hidden rounded-2xl border border-border bg-card text-left shadow-[var(--shadow-card)] transition-colors duration-200";

function truncateTitle(title: string, max = 16) {
  if (title.length <= max) return title;
  return `${title.slice(0, max)}…`;
}

function accuracyTone(accuracy: number) {
  if (accuracy >= 80) return "text-success";
  if (accuracy >= 60) return "text-foreground";
  return "text-warning-foreground";
}

function RecordRow({ record }: { record: PracticeRecord }) {
  return (
    <Link
      to="/training/result/$id"
      params={{ id: record.id }}
      className="group flex flex-1 items-center gap-3 px-4 py-3 transition-colors hover:bg-primary-soft/10"
    >
      <div className="min-w-0 flex-1">
        <div className="truncate text-[13px] font-medium text-foreground group-hover:text-primary">
          {record.title}
        </div>
        <div className="mt-0.5 text-[11px] text-muted-foreground">
          {record.source} · {record.completedAt}
        </div>
      </div>
      <span className={cn("shrink-0 text-[14px] font-semibold tabular-nums", accuracyTone(record.accuracy))}>
        {record.accuracy}%
      </span>
      <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/45 group-hover:text-primary/60" aria-hidden />
    </Link>
  );
}

export function TrainingRecentOverviewCard({
  records,
  className,
}: {
  records: PracticeRecord[];
  className?: string;
}) {
  const preview = records.slice(0, 2);
  const latest = preview[0];

  if (records.length === 0) {
    return (
      <div
        className={cn(
          cardBase,
          "border-primary/12 bg-primary-soft/25 p-4",
          className,
        )}
      >
        <StatCardDecor />
        <div className="relative flex items-start gap-3">
          <StatIconFrame icon={<History className="h-[18px] w-[18px]" />} size="sm" />
          <div className="min-w-0 flex-1">
            <div className="text-[11.5px] font-medium tracking-wide text-muted-foreground">最近练习</div>
            <div className="mt-1.5 text-[26px] font-bold tabular-nums leading-none text-foreground">0</div>
            <div className="mt-1 text-[11.5px] text-muted-foreground">暂无练习记录</div>
          </div>
          <Link
            to="/training/practice"
            className="inline-flex shrink-0 items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-[12px] font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Target className="h-3.5 w-3.5" />
            去练习
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        cardBase,
        "border-primary/12 bg-primary-soft/25 hover:border-primary/30",
        className,
      )}
    >
      <StatCardDecor />
      <div className="relative grid h-full sm:grid-cols-[minmax(0,220px)_1fr]">
        {/* 左侧：与个人沉淀 OverviewStatCard 同结构 */}
        <Link
          to="/training/records"
          className="group flex flex-col border-b border-divider p-4 transition-colors hover:bg-primary-soft/15 sm:border-b-0 sm:border-r"
        >
          <div className="flex items-start gap-3">
            <StatIconFrame icon={<History className="h-[18px] w-[18px]" />} size="sm" />
            <div className="min-w-0 flex-1">
              <div className="text-[11.5px] font-medium tracking-wide text-muted-foreground">最近练习</div>
              <div className="mt-1.5 text-[26px] font-bold tabular-nums leading-none tracking-tight text-primary">
                {records.length}
              </div>
              <div className="mt-1 text-[11.5px] text-muted-foreground">近期训练回看</div>
            </div>
          </div>
          {latest && (
            <div className="mt-3 flex items-center gap-2 border-t border-primary/15 pt-2.5">
              <span className="h-1 w-1 shrink-0 rounded-full bg-primary" aria-hidden />
              <span className="min-w-0 flex-1 truncate text-[11px] font-medium text-primary/90">
                最近：{truncateTitle(latest.title)} · {latest.accuracy}%
              </span>
              <ChevronRight
                className="h-3.5 w-3.5 shrink-0 text-primary/55 transition-transform group-hover:translate-x-0.5"
                aria-hidden
              />
            </div>
          )}
        </Link>

        {/* 右侧：逐条练习记录 */}
        <div className="flex min-h-0 flex-col divide-y divide-divider">
          {preview.map((record) => (
            <RecordRow key={record.id} record={record} />
          ))}
        </div>
      </div>
    </div>
  );
}

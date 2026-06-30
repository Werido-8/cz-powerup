import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import {
  ArrowLeft,
  ChevronRight,
  Clock,
  FileText,
  Flame,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import { DOCS } from "@/lib/mock/data";
import {
  DOC_READ_INSIGHTS_BY_ID,
  PLATFORM_READ_HEATMAP,
  TOP_READING_DOCS,
  type DocReadInsight,
} from "@/lib/mock/learning-hub";
import { cn } from "@/lib/utils";

const HEAT_BORDER = "border-[#DCEFF2]";
const HEAT_TEXT = "text-[#1F2D3D]";
const HEAT_MUTED = "text-[#6B7C8F]";
const HEAT_PRIMARY = "#349BAC";
const HEAT_GRID = "#EEF4F5";
const HEAT_TRACK = "#EEF4F5";

const heatCard = cn("rounded-2xl border bg-white", HEAT_BORDER);

const RANK_BADGE: Record<number, string> = {
  1: "bg-[#F5A623] text-white",
  2: "bg-[#7EC8E3] text-white",
  3: "bg-[#D4956A] text-white",
  4: "bg-[#E8EDF2] text-[#6B7C8F]",
  5: "bg-[#E8EDF2] text-[#6B7C8F]",
};

export type DocReadingHeatDashboardProps = {
  onBack: () => void;
  className?: string;
};

export function DocReadTrendBadge({ insight }: { insight: DocReadInsight }) {
  const up = insight.trendDelta > 0;
  const down = insight.trendDelta < 0;
  const Icon = up ? TrendingUp : down ? TrendingDown : null;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[11px] font-medium tabular-nums",
        up && "bg-[#E8F7F0] text-[#2E8B57]",
        down && "bg-[#FDEEEE] text-[#C45656]",
        !up && !down && "bg-[#F0F4F7] text-[#6B7C8F]",
      )}
    >
      {Icon && <Icon className="h-3 w-3" />}
      {up && `+${insight.trendDelta}%`}
      {down && `${insight.trendDelta}%`}
      {!up && !down && "持平"}
    </span>
  );
}

function CardHeader({ icon, title, extra }: { icon: ReactNode; title: string; extra?: ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b border-[#EEF4F5] px-5 py-4">
      <div className="flex items-center gap-2">
        <span className="text-primary">{icon}</span>
        <h4 className={cn("text-[14px] font-semibold", HEAT_TEXT)}>{title}</h4>
      </div>
      {extra}
    </div>
  );
}

function WeeklyTrendChart() {
  const days = PLATFORM_READ_HEATMAP.days.slice(-7);
  const avg = Math.round(days.reduce((s, d) => s + d.reads, 0) / days.length);
  const chartData = days.map((d) => ({ date: d.label, reads: d.reads }));

  return (
    <div className={heatCard}>
      <CardHeader
        icon={<TrendingUp className="h-4 w-4" />}
        title="近 7 日阅读趋势"
        extra={<TrendingUp className="h-4 w-4 text-[#C5DDE0]" aria-hidden />}
      />
      <div className="px-5 pt-3 pb-5">
        <p className={cn("mb-3 text-[12px]", HEAT_MUTED)}>
          日均 <span className={cn("font-semibold tabular-nums", HEAT_TEXT)}>{avg}</span> 人次
        </p>
        <div className="h-[200px] w-full overflow-visible">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 22, right: 12, left: 4, bottom: 0 }}>
              <defs>
                <linearGradient id="heatAreaFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={HEAT_PRIMARY} stopOpacity={0.22} />
                  <stop offset="100%" stopColor={HEAT_PRIMARY} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={HEAT_GRID} vertical={false} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: "#6B7C8F" }}
                axisLine={{ stroke: HEAT_GRID }}
                tickLine={false}
              />
              <YAxis
                domain={[0, 150]}
                ticks={[0, 50, 100, 150]}
                tick={{ fontSize: 11, fill: "#6B7C8F" }}
                axisLine={false}
                tickLine={false}
                width={36}
                tickMargin={4}
              />
              <Area
                type="monotone"
                dataKey="reads"
                stroke={HEAT_PRIMARY}
                strokeWidth={2}
                fill="url(#heatAreaFill)"
                dot={{ fill: HEAT_PRIMARY, stroke: "#fff", strokeWidth: 2, r: 4 }}
                activeDot={{ r: 5, fill: HEAT_PRIMARY, stroke: "#fff", strokeWidth: 2 }}
              >
                <LabelList
                  dataKey="reads"
                  position="top"
                  offset={10}
                  className="fill-[#1F2D3D] text-[11px] font-medium"
                />
              </Area>
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

const PEAK_SLOTS = [
  { slot: "午" as const, range: "12:00-18:00" },
  { slot: "晚" as const, range: "18:00-22:00" },
  { slot: "晨" as const, range: "06:00-12:00" },
  { slot: "夜" as const, range: "22:00-06:00" },
];

function PeakTimeCard() {
  const items = PEAK_SLOTS.map(({ slot, range }) => {
    const slotIndex = PLATFORM_READ_HEATMAP.timeSlots.indexOf(slot);
    const total = PLATFORM_READ_HEATMAP.hourlyGrid.reduce((sum, day) => sum + day[slotIndex], 0);
    return { slot, range, total };
  }).sort((a, b) => b.total - a.total);

  const maxTotal = items[0]?.total ?? 1;

  return (
    <div className={heatCard}>
      <CardHeader icon={<Clock className="h-4 w-4" />} title="阅读高峰时段" />
      <div className="space-y-3.5 px-5 py-5">
        {items.map(({ slot, range, total }) => {
          const width = Math.round((total / maxTotal) * 100);
          return (
            <div key={slot}>
              <div className="mb-1.5 flex items-center justify-between gap-2">
                <span className={cn("text-[12px]", HEAT_MUTED)}>
                  <span className={cn("font-medium", HEAT_TEXT)}>{slot}</span>{" "}
                  <span className="text-[11px]">{range}</span>
                </span>
                <span className={cn("shrink-0 text-[12px] font-semibold tabular-nums", HEAT_TEXT)}>{total}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full" style={{ backgroundColor: HEAT_TRACK }}>
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${width}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TopReadingList() {
  return (
    <div className={heatCard}>
      <CardHeader icon={<FileText className="h-4 w-4" />} title="阅读最多 TOP 5" />
      <ul className="divide-y divide-[#EEF4F5]">
        {TOP_READING_DOCS.map((item) => {
          const doc = DOCS.find((d) => d.id === item.docId);
          if (!doc) return null;

          return (
            <li key={item.docId}>
              <Link
                to="/learn/doc/$id"
                params={{ id: doc.id }}
                className="group flex items-center gap-3 px-5 py-4 transition-colors hover:bg-[#FAFDFE]"
              >
                <span
                  className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[12px] font-bold",
                    RANK_BADGE[item.rank] ?? RANK_BADGE[5],
                  )}
                >
                  {item.rank}
                </span>

                <div className="min-w-0 flex-1">
                  <div
                    className={cn(
                      "truncate text-[13px] font-semibold leading-snug group-hover:text-primary",
                      HEAT_TEXT,
                    )}
                    title={doc.title}
                  >
                    {doc.title}
                  </div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                    <span className="rounded-full bg-[#F0F4F7] px-2 py-0.5 text-[10.5px] text-[#6B7C8F]">
                      {doc.docType}
                    </span>
                    <span className="rounded-full bg-[#F0F4F7] px-2 py-0.5 text-[10.5px] text-[#6B7C8F]">
                      {doc.equipment}
                    </span>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2.5">
                  <span className={cn("text-[13px] font-semibold tabular-nums", HEAT_TEXT)}>
                    {item.readers7d}人
                  </span>
                  <DocReadTrendBadge insight={item} />
                  <ChevronRight className="h-4 w-4 text-[#C5DDE0] transition-colors group-hover:text-primary" />
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function DocReadingHeatDashboard({ onBack, className }: DocReadingHeatDashboardProps) {
  return (
    <div className={cn("space-y-5 bg-white px-6 py-5", className)}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className={cn("text-[20px] font-semibold tracking-tight", HEAT_TEXT)}>阅读热度</h2>
          <p className={cn("mt-1 text-[13px]", HEAT_MUTED)}>近 7 日资料阅读与关注度分析</p>
        </div>
        <button
          type="button"
          onClick={onBack}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-primary bg-white px-4 py-2 text-[13px] font-medium text-primary transition-colors hover:bg-primary-soft"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          返回列表
        </button>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.85fr)]">
        <TopReadingList />
        <div className="flex flex-col gap-5">
          <WeeklyTrendChart />
          <PeakTimeCard />
        </div>
      </div>
    </div>
  );
}

/** @deprecated 使用 DocReadingHeatDashboard */
export const DocReadingInsightsPanel = DocReadingHeatDashboard;

export function DocCardReadMeta({ docId, relatedCount }: { docId: string; relatedCount?: number }) {
  const insight = DOC_READ_INSIGHTS_BY_ID[docId];
  if (!insight) return null;

  const isHot = insight.rank <= 3;

  return (
    <div className="mt-3 space-y-2 border-t border-divider pt-3">
      <div className="flex flex-wrap items-center gap-2">
        {isHot && (
          <span className="inline-flex items-center gap-0.5 rounded-md bg-warning-soft px-1.5 py-0.5 text-[10.5px] font-medium text-warning-foreground">
            <Flame className="h-3 w-3" />
            热门 #{insight.rank}
          </span>
        )}
        <span className={cn("inline-flex items-center gap-1 text-[11px]", HEAT_MUTED)}>
          <Users className="h-3 w-3" />
          近 7 日 <span className={cn("font-medium tabular-nums", HEAT_TEXT)}>{insight.readers7d}</span> 人阅读
        </span>
        <DocReadTrendBadge insight={insight} />
        {/* {relatedCount != null && relatedCount > 0 && (
          <span className={cn("text-[11px]", HEAT_MUTED)}>· {relatedCount} 篇关联资料</span>
        )} */}
      </div>
    </div>
  );
}

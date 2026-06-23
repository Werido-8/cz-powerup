import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import { Flame, TrendingUp, TrendingDown, Award, Target, ListChecks, Repeat2, CalendarCheck, BookOpen, AlertCircle, Clock } from "lucide-react";
import { PageShell } from "@/components/workbench/PageShell";
import {
  RADAR,
  RADAR_PREV,
  TREND_7,
  TREND_30,
  TREND_ALL,
  WEAK_TOP5,
  ACHIEVEMENTS,
} from "@/lib/mock/data";

export const Route = createFileRoute("/training/growth")({
  component: GrowthPage,
  head: () => ({ meta: [{ title: "能力成长 · 题库训练" }] }),
});

type Range = "7" | "30" | "all";

function GrowthPage() {
  const [range, setRange] = useState<Range>("7");
  const [compare, setCompare] = useState(false);

  const data = useMemo(() => {
    if (range === "7") return TREND_7;
    if (range === "30") return TREND_30;
    return TREND_ALL;
  }, [range]);

  const avg = useMemo(() => Math.round(data.reduce((s, d) => s + d.rate, 0) / data.length), [data]);
  const delta = data[data.length - 1].rate - data[0].rate;

  const radarData = RADAR.map((r, i) => ({
    ...r,
    prev: RADAR_PREV[i].value,
  }));

  return (
    <PageShell>
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight">能力成长</h1>
          <p className="mt-1 text-[12.5px] text-muted-foreground">
            五维能力雷达 · 正确率趋势 · 薄弱知识点诊断
          </p>
        </div>
        <div className="inline-flex items-center gap-1 rounded-lg border border-border bg-card p-1 text-[12px]">
          {(
            [
              { k: "7", l: "近 7 天" },
              { k: "30", l: "近 30 天" },
              { k: "all", l: "全部" },
            ] as { k: Range; l: string }[]
          ).map((t) => (
            <button
              key={t.k}
              onClick={() => setRange(t.k)}
              className={`rounded-lg px-3 py-1.5 transition-colors ${
                range === t.k ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
              }`}
            >
              {t.l}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Tile
          l="周期均正确率"
          v={`${avg}%`}
          sub="较起始值"
          delta={delta}
          icon={<Target className="h-4 w-4" />}
          tone="from-[oklch(0.95_0.04_188)] to-transparent"
          iconTone="bg-[oklch(0.58_0.12_188)] text-white"
        />
        <Tile
          l="累计答题"
          v={range === "7" ? "48" : range === "30" ? "186" : "1,204"}
          sub="题"
          icon={<ListChecks className="h-4 w-4" />}
          tone="from-[oklch(0.95_0.05_260)] to-transparent"
          iconTone="bg-[oklch(0.55_0.14_260)] text-white"
        />
        <Tile
          l="错题转化率"
          v="72%"
          sub="错题→掌握"
          delta={4}
          icon={<Repeat2 className="h-4 w-4" />}
          tone="from-[oklch(0.95_0.05_50)] to-transparent"
          iconTone="bg-[oklch(0.68_0.15_50)] text-white"
        />
        <Tile
          l="连续学习"
          v="7 天"
          sub="本周"
          icon={<CalendarCheck className="h-4 w-4" />}
          tone="from-[oklch(0.94_0.06_150)] to-transparent"
          iconTone="bg-[oklch(0.58_0.13_150)] text-white"
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-lg border border-border bg-card p-5 shadow-[var(--shadow-card)]">
          <div className="mb-2 flex items-center justify-between">
            <div className="text-[13px] font-semibold">能力雷达</div>
            <label className="inline-flex cursor-pointer items-center gap-2 text-[11.5px] text-muted-foreground">
              <input
                type="checkbox"
                checked={compare}
                onChange={(e) => setCompare(e.target.checked)}
                className="accent-primary"
              />
              对比上周期
            </label>
          </div>
          <div className="h-72">
            <ResponsiveContainer>
              <RadarChart data={radarData}>
                <PolarGrid stroke="oklch(0.92 0.01 240)" />
                <PolarAngleAxis dataKey="dim" tick={{ fontSize: 11, fill: "oklch(0.5 0.02 240)" }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                {compare && (
                  <Radar
                    name="上周期"
                    dataKey="prev"
                    stroke="oklch(0.7 0.05 240)"
                    fill="oklch(0.7 0.05 240)"
                    fillOpacity={0.15}
                  />
                )}
                <Radar
                  name="当前"
                  dataKey="value"
                  stroke="oklch(0.58 0.12 188)"
                  fill="oklch(0.58 0.12 188)"
                  fillOpacity={0.35}
                />
                {compare && <Legend wrapperStyle={{ fontSize: 11 }} />}
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-5 shadow-[var(--shadow-card)]">
          <div className="mb-2 flex items-center justify-between">
            <div className="text-[13px] font-semibold">正确率趋势</div>
            <span
              className={`inline-flex items-center gap-1 text-[11.5px] ${
                delta >= 0 ? "text-success" : "text-destructive"
              }`}
            >
              {delta >= 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
              {delta >= 0 ? "+" : ""}
              {delta} pp
            </span>
          </div>
          <div className="h-72">
            <ResponsiveContainer>
              <LineChart data={data} margin={{ top: 12, right: 16, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0.01 240)" />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: "oklch(0.5 0.02 240)" }} />
                <YAxis domain={[50, 100]} tick={{ fontSize: 11, fill: "oklch(0.5 0.02 240)" }} />
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                <Line
                  type="monotone"
                  dataKey="rate"
                  stroke="oklch(0.58 0.12 188)"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: "oklch(0.58 0.12 188)" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        <div className="rounded-lg border border-border bg-card p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div className="text-[13px] font-semibold">薄弱知识点 Top 5</div>
            <Link to="/training/practice" className="text-[12px] text-primary hover:underline">
              批量配置专项练习 →
            </Link>
          </div>
          <div className="space-y-4">
            {WEAK_TOP5.map((w) => (
              <div key={w.name} className="flex items-center gap-4 rounded-lg bg-muted/40 px-4 py-3">
                <span className="flex-1 text-[13px] font-medium">{w.name}</span>
                <div className="h-2 w-40 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-warning" style={{ width: `${w.rate}%` }} />
                </div>
                <span className="w-10 text-right text-[11.5px] tabular-nums text-muted-foreground">
                  {w.rate}%
                </span>
                <Link
                  to="/training/session/$id"
                  params={{ id: `薄弱-${w.filter}` }}
                  search={{ mode: "practice", filter: w.filter, count: 10, limit: 0 }}
                  className="text-[12px] font-medium text-primary hover:underline"
                >
                  去专项练习
                </Link>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="relative flex flex-1 flex-col overflow-hidden rounded-lg border border-warning/30 bg-gradient-to-br from-warning-soft/60 via-warning-soft/30 to-transparent p-5">
            <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.08]" aria-hidden>
              <defs>
                <pattern id="growth-grid" width="22" height="22" patternUnits="userSpaceOnUse">
                  <path d="M22 0H0V22" fill="none" stroke="currentColor" strokeWidth="0.5" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#growth-grid)" />
            </svg>

            <div className="relative mb-3 flex items-center justify-between">
              <div className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-warning-foreground">
                <Flame className="h-4 w-4 text-warning" /> 今日复习建议
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-warning/15 px-2 py-0.5 text-[10.5px] font-medium text-warning-foreground">
                <Clock className="h-3 w-3" /> 约 15 分钟
              </span>
            </div>

            <p className="relative text-[12.5px] text-warning-foreground/90">
              系统已根据你的遗忘曲线整理今日待复习内容，建议尽快完成以巩固记忆。
            </p>

            <div className="relative mt-4 space-y-2.5">
              <div className="flex items-center gap-3 rounded-lg border border-warning/20 bg-card/70 px-3 py-2.5 backdrop-blur">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
                  <AlertCircle className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <div className="text-[12.5px] font-medium">错题待巩固</div>
                  <div className="text-[10.5px] text-muted-foreground">高频错误知识点</div>
                </div>
                <span className="text-[13px] font-semibold tabular-nums">3</span>
              </div>
              <div className="flex items-center gap-3 rounded-lg border border-warning/20 bg-card/70 px-3 py-2.5 backdrop-blur">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <BookOpen className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <div className="text-[12.5px] font-medium">待复习资料</div>
                  <div className="text-[10.5px] text-muted-foreground">已临近遗忘节点</div>
                </div>
                <span className="text-[13px] font-semibold tabular-nums">2</span>
              </div>
            </div>

            <div className="flex-1" />
            <Link
              to="/training/session/$id"
              params={{ id: "今日复习" }}
              search={{ mode: "review", filter: "", count: 5, limit: 0 }}
              className="relative mt-4 inline-flex w-full items-center justify-center rounded-lg bg-warning px-3 py-2.5 text-[12.5px] font-medium text-warning-foreground shadow-sm hover:opacity-90"
            >
              一键开始今日复习
            </Link>
          </div>
        </div>
      </div>
    </PageShell>
  );
}

function Tile({
  l,
  v,
  sub,
  delta,
  icon,
  tone,
  iconTone,
}: {
  l: string;
  v: string;
  sub: string;
  delta?: number;
  icon?: React.ReactNode;
  tone?: string;
  iconTone?: string;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-lg border border-border bg-gradient-to-br ${tone ?? ""} bg-card p-4 transition-shadow hover:shadow-[var(--shadow-card)]`}
    >
      <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.06]" aria-hidden>
        <defs>
          <pattern id={`tile-grid-${l}`} width="18" height="18" patternUnits="userSpaceOnUse">
            <path d="M18 0H0V18" fill="none" stroke="currentColor" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#tile-grid-${l})`} />
      </svg>
      <div className="relative flex items-center justify-between">
        <div className="text-[11px] text-muted-foreground">{l}</div>
        {icon && (
          <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${iconTone ?? "bg-muted text-foreground"}`}>
            {icon}
          </div>
        )}
      </div>
      <div className="relative mt-2 flex items-end justify-between">
        <div className="text-[22px] font-semibold tabular-nums">{v}</div>
        {delta != null && (
          <span
            className={`text-[11px] font-medium ${delta >= 0 ? "text-success" : "text-destructive"}`}
          >
            {delta >= 0 ? "+" : ""}
            {delta}
          </span>
        )}
      </div>
      <div className="relative mt-1 text-[10.5px] text-muted-foreground">{sub}</div>
    </div>
  );
}

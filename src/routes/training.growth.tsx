import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Flame,
  Target,
  TrendingUp,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { PageShell } from "@/components/workbench/PageShell";
import { PageHeader } from "@/components/learning/ui";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/training/growth")({
  component: GrowthFeedbackPage,
  head: () => ({
    meta: [
      { title: "成长反馈 · 训练中心" },
      { name: "description", content: "查看训练题量、正确率、连续训练和薄弱知识点趋势。" },
    ],
  }),
});

type RangeKey = "7d" | "30d" | "90d";

const RANGE_DATA = {
  "7d": {
    label: "近 7 天",
    answers: 48,
    accuracy: 76,
    streak: 7,
    weakCount: 4,
    answersDelta: 12,
    accuracyDelta: 3.2,
    trend: [
      { label: "6/27", answers: 5, accuracy: 68 },
      { label: "6/28", answers: 8, accuracy: 75 },
      { label: "6/29", answers: 4, accuracy: 72 },
      { label: "6/30", answers: 10, accuracy: 80 },
      { label: "7/1", answers: 6, accuracy: 71 },
      { label: "7/2", answers: 9, accuracy: 78 },
      { label: "7/3", answers: 6, accuracy: 83 },
    ],
  },
  "30d": {
    label: "近 30 天",
    answers: 186,
    accuracy: 74,
    streak: 7,
    weakCount: 4,
    answersDelta: 28,
    accuracyDelta: 4.6,
    trend: [
      { label: "第1周", answers: 36, accuracy: 68 },
      { label: "第2周", answers: 42, accuracy: 71 },
      { label: "第3周", answers: 50, accuracy: 74 },
      { label: "第4周", answers: 58, accuracy: 79 },
    ],
  },
  "90d": {
    label: "近 90 天",
    answers: 524,
    accuracy: 72,
    streak: 7,
    weakCount: 5,
    answersDelta: 63,
    accuracyDelta: 6.1,
    trend: [
      { label: "4月", answers: 148, accuracy: 66 },
      { label: "5月", answers: 168, accuracy: 71 },
      { label: "6月", answers: 208, accuracy: 77 },
    ],
  },
} as const;

const WEAK_POINTS = [
  {
    name: "差动保护动作判断",
    answers: 18,
    errorRate: 44,
    delta: -9,
    trend: "改善",
    reason: "区内、区外故障特征仍容易混淆",
    action: "完成 8 题短练习",
    filter: "差动保护",
  },
  {
    name: "AGC 死区与调节速率",
    answers: 24,
    errorRate: 38,
    delta: -6,
    trend: "改善",
    reason: "参数边界题正确率低于个人平均水平",
    action: "完成 12 题专项练习",
    filter: "AGC",
  },
  {
    name: "主变停役操作顺序",
    answers: 12,
    errorRate: 42,
    delta: 5,
    trend: "需关注",
    reason: "最近两次作答均在保护连接片核对步骤失分",
    action: "先回看资料再练习",
    filter: "主变停役",
  },
  {
    name: "AVC 无功调节边界",
    answers: 10,
    errorRate: 30,
    delta: -2,
    trend: "稳定",
    reason: "样本量较少，继续答题后再判断趋势",
    action: "补充 6 题练习样本",
    filter: "AVC",
  },
] as const;

function MetricCard({
  icon: Icon,
  label,
  value,
  suffix,
  detail,
  tone = "primary",
}: {
  icon: typeof Target;
  label: string;
  value: number;
  suffix?: string;
  detail: string;
  tone?: "primary" | "success" | "remind";
}) {
  const toneClass = {
    primary: "bg-primary-soft text-primary",
    success: "bg-success-soft text-success",
    remind: "bg-remind-soft text-remind-foreground",
  }[tone];

  return (
    <article className="rounded-[14px] border border-kb-border bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <span className="text-[11.5px] font-medium text-kb-muted">{label}</span>
        <span className={cn("grid h-8 w-8 place-items-center rounded-[8px]", toneClass)}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <div className="mt-2.5 flex items-baseline gap-1">
        <strong className="text-[28px] font-semibold leading-none tabular-nums text-kb-heading">
          {value}
        </strong>
        {suffix && <span className="text-[12px] text-kb-muted">{suffix}</span>}
      </div>
      <p className="mt-2 text-[11.5px] text-kb-muted">{detail}</p>
    </article>
  );
}

function GrowthFeedbackPage() {
  const [range, setRange] = useState<RangeKey>("30d");
  const current = RANGE_DATA[range];
  const chartData = useMemo(() => current.trend.map((item) => ({ ...item })), [current]);

  return (
    <PageShell>
      <nav aria-label="页面导航" className="mb-2 flex items-center gap-1 text-[12px]">
        <Link
          to="/training"
          className="inline-flex items-center gap-0.5 text-kb-muted hover:text-primary"
        >
          <ChevronLeft className="h-3.5 w-3.5" /> 训练中心
        </Link>
        <ChevronRight className="h-3 w-3 text-kb-muted/35" />
        <span className="text-kb-body">成长反馈</span>
      </nav>

      <PageHeader
        title="成长反馈"
        subtitle="基于实际练习与正式考试数据，查看题量、正确率和薄弱知识点变化。"
        size="md"
        action={
          <div
            className="inline-flex rounded-[9px] border border-kb-border bg-white p-1"
            role="group"
            aria-label="统计时间范围"
          >
            {(Object.keys(RANGE_DATA) as RangeKey[]).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setRange(key)}
                aria-pressed={range === key}
                className={cn(
                  "min-h-8 rounded-[6px] px-3 text-[12px] font-medium transition-colors",
                  range === key
                    ? "bg-primary text-white"
                    : "text-kb-muted hover:bg-kb-surface hover:text-kb-heading",
                )}
              >
                {RANGE_DATA[key].label}
              </button>
            ))}
          </div>
        }
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="训练指标概览">
        <MetricCard
          icon={Target}
          label="训练题量"
          value={current.answers}
          suffix="题"
          detail={`较上一周期多 ${current.answersDelta} 题`}
        />
        <MetricCard
          icon={CheckCircle2}
          label="平均正确率"
          value={current.accuracy}
          suffix="%"
          detail={`较上一周期提升 ${current.accuracyDelta}%`}
          tone="success"
        />
        <MetricCard
          icon={Flame}
          label="连续训练"
          value={current.streak}
          suffix="天"
          detail="截至今日连续存在有效训练"
          tone="remind"
        />
        <MetricCard
          icon={TrendingUp}
          label="薄弱知识点"
          value={current.weakCount}
          suffix="项"
          detail="达到最小题量后纳入判断"
        />
      </section>

      <section className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,.55fr)]">
        <article className="min-w-0 rounded-[14px] border border-kb-border bg-white p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-[14px] font-semibold text-kb-heading">训练趋势</h2>
              <p className="mt-1 text-[11.5px] text-kb-muted">趋势图展示当前范围内的正确率变化。</p>
            </div>
            <span className="inline-flex items-center gap-1.5 text-[11px] text-kb-muted">
              <CalendarDays className="h-3.5 w-3.5" /> {current.label}
            </span>
          </div>
          <div className="mt-4 h-[260px] w-full" aria-label={`${current.label}正确率趋势`}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 8, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="growthAccuracy" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#349bac" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#349bac" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4edef" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: "#758990" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  domain={[50, 100]}
                  tick={{ fontSize: 11, fill: "#758990" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{ borderRadius: 8, borderColor: "#dcebed", fontSize: 12 }}
                  formatter={(value, name) => [
                    name === "accuracy" ? `${value}%` : `${value} 题`,
                    name === "accuracy" ? "正确率" : "题量",
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="accuracy"
                  stroke="#349bac"
                  strokeWidth={2}
                  fill="url(#growthAccuracy)"
                  activeDot={{ r: 4 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </article>

        <aside className="rounded-[14px] border border-kb-border bg-white p-4">
          <h2 className="text-[14px] font-semibold text-kb-heading">本期变化</h2>
          <p className="mt-1 text-[11.5px] text-kb-muted">
            只描述客观变化，不输出岗位胜任或掌握结论。
          </p>
          <div className="mt-4 space-y-3">
            <div className="rounded-[10px] bg-success-soft/65 p-3">
              <div className="flex items-center gap-2 text-[12.5px] font-medium text-success">
                <ArrowUpRight className="h-4 w-4" /> 训练投入增加
              </div>
              <p className="mt-1.5 text-[11.5px] leading-5 text-kb-body">
                完成题量较上一周期增加 {current.answersDelta} 题，连续训练保持 {current.streak} 天。
              </p>
            </div>
            <div className="rounded-[10px] bg-primary-soft/60 p-3">
              <div className="flex items-center gap-2 text-[12.5px] font-medium text-primary">
                <TrendingUp className="h-4 w-4" /> 正确率稳步提升
              </div>
              <p className="mt-1.5 text-[11.5px] leading-5 text-kb-body">
                本期平均正确率为 {current.accuracy}%，较上一周期提升 {current.accuracyDelta}%。
              </p>
            </div>
            <div className="rounded-[10px] bg-remind-soft/70 p-3">
              <div className="flex items-center gap-2 text-[12.5px] font-medium text-remind-foreground">
                <ArrowDownRight className="h-4 w-4" /> 仍需针对性复习
              </div>
              <p className="mt-1.5 text-[11.5px] leading-5 text-kb-body">
                主变停役操作顺序最近错误率上升，建议先回看资料再开始短练习。
              </p>
            </div>
          </div>
        </aside>
      </section>

      <section className="mt-4 overflow-hidden rounded-[14px] border border-kb-border bg-white">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-kb-border px-4 py-3.5">
          <div>
            <h2 className="text-[14px] font-semibold text-kb-heading">薄弱知识点变化</h2>
            <p className="mt-1 text-[11.5px] text-kb-muted">
              错误率基于当前时间范围内的有效可判定作答。
            </p>
          </div>
          <Link
            to="/training/practice"
            className="inline-flex min-h-9 items-center gap-1.5 text-[12.5px] font-medium text-primary hover:text-primary/80"
          >
            自定义专项练习 <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] table-fixed text-left text-[12.5px]">
            <thead className="bg-kb-table-head text-[11px] text-kb-muted">
              <tr>
                <th className="w-[24%] px-4 py-3 font-medium">知识点</th>
                <th className="w-[10%] px-3 py-3 font-medium">有效作答</th>
                <th className="w-[12%] px-3 py-3 font-medium">错误率</th>
                <th className="w-[12%] px-3 py-3 font-medium">变化</th>
                <th className="w-[27%] px-3 py-3 font-medium">判断依据</th>
                <th className="w-[15%] px-4 py-3 text-right font-medium">建议行动</th>
              </tr>
            </thead>
            <tbody>
              {WEAK_POINTS.map((point) => (
                <tr
                  key={point.name}
                  className="border-t border-divider align-middle hover:bg-kb-surface/35"
                >
                  <td className="px-4 py-3.5 font-medium text-kb-heading">{point.name}</td>
                  <td className="px-3 py-3.5 tabular-nums text-kb-body">{point.answers} 题</td>
                  <td className="px-3 py-3.5 font-medium tabular-nums text-kb-heading">
                    {point.errorRate}%
                  </td>
                  <td className="px-3 py-3.5">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-[6px] px-2 py-1 text-[11px] font-medium",
                        point.delta > 0
                          ? "bg-destructive/10 text-destructive"
                          : "bg-success-soft text-success",
                      )}
                    >
                      {point.delta > 0 ? (
                        <ArrowUpRight className="h-3 w-3" />
                      ) : (
                        <ArrowDownRight className="h-3 w-3" />
                      )}
                      {point.delta > 0 ? "+" : ""}
                      {point.delta}% {point.trend}
                    </span>
                  </td>
                  <td className="px-3 py-3.5 leading-5 text-kb-muted">{point.reason}</td>
                  <td className="px-4 py-3.5 text-right">
                    <Link
                      to="/training/practice"
                      search={{ filters: point.filter }}
                      className="inline-flex min-h-9 items-center gap-1 rounded-[7px] px-3 text-[12px] font-medium text-primary hover:bg-primary-soft"
                    >
                      {point.action} <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </PageShell>
  );
}

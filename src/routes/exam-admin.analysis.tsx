import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  RotateCcw,
  Search,
  Users,
} from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  AdminPageFrame,
  AsyncState,
  DataTableShell,
  ExamAdminNav,
  FilterBar,
  FilterField,
  MetricCard,
  MultiSelectFilter,
} from "@/components/ability-admin/admin-ui";
import { PageHeader } from "@/components/learning/ui";
import { PageShell } from "@/components/workbench/PageShell";
import { formatCount, formatDelta, formatPercent, formatScore } from "@/lib/exam-admin/format";
import type {
  AnalyticsBreakdownItem,
  AnalyticsTrendPoint,
  ExamAnalyticsQuery,
} from "@/lib/exam-admin/types";
import { cn } from "@/lib/utils";
import { getExamAnalytics, getExamAnalyticsOptions } from "@/services/examAdmin";

export const Route = createFileRoute("/exam-admin/analysis")({
  component: ExamAnalysisPage,
  head: () => ({
    meta: [
      { title: "成绩分析 · 涉网运行能力智能提升平台" },
      {
        name: "description",
        content: "按时间、班组与专业查看考试完成情况、成绩变化和薄弱知识点。",
      },
    ],
  }),
});

const DEFAULT_QUERY: ExamAnalyticsQuery = {
  startDate: "2026-05-14",
  endDate: "2026-08-12",
  teamIds: [],
  specialtyIds: [],
};

type TrendMetric = "averageScore" | "passRate";

function ExamAnalysisPage() {
  const navigate = useNavigate();
  const [draftQuery, setDraftQuery] = useState<ExamAnalyticsQuery>(DEFAULT_QUERY);
  const [query, setQuery] = useState<ExamAnalyticsQuery>(DEFAULT_QUERY);
  const [trendMetric, setTrendMetric] = useState<TrendMetric>("averageScore");
  const optionsQuery = useQuery({
    queryKey: ["exam-admin", "analytics-options"],
    queryFn: getExamAnalyticsOptions,
  });
  const analyticsQuery = useQuery({
    queryKey: ["exam-admin", "analytics", query],
    queryFn: () => getExamAnalytics(query),
  });

  const applyDimension = (dimension: "team" | "specialty", id: string) => {
    const next = {
      ...query,
      teamIds: dimension === "team" ? [id] : query.teamIds,
      specialtyIds: dimension === "specialty" ? [id] : query.specialtyIds,
    };
    setDraftQuery(next);
    setQuery(next);
  };

  return (
    <PageShell>
      <AdminPageFrame>
        <PageHeader
          title="成绩分析"
          subtitle="查看培训覆盖、完成情况、群体差异与薄弱知识点。只在考试系列、量纲和人群可比时展示提升。"
          size="md"
          action={
            <Link
              to="/exam-admin"
              className="inline-flex min-h-10 items-center gap-2 rounded-[8px] border border-kb-border bg-white px-4 text-[13px] font-medium text-kb-body hover:bg-kb-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            >
              <ArrowLeft className="h-4 w-4" /> 返回考试任务
            </Link>
          }
        />

        <ExamAdminNav />

        <FilterBar>
          <FilterField label="开始日期">
            <input
              type="date"
              value={draftQuery.startDate}
              onChange={(event) =>
                setDraftQuery((current) => ({ ...current, startDate: event.target.value }))
              }
              className="h-9 rounded-md border border-kb-border bg-white px-3 text-[13px] text-kb-body outline-none focus:ring-2 focus:ring-primary/20"
            />
          </FilterField>
          <FilterField label="结束日期">
            <input
              type="date"
              value={draftQuery.endDate}
              onChange={(event) =>
                setDraftQuery((current) => ({ ...current, endDate: event.target.value }))
              }
              className="h-9 rounded-md border border-kb-border bg-white px-3 text-[13px] text-kb-body outline-none focus:ring-2 focus:ring-primary/20"
            />
          </FilterField>
          <MultiSelectFilter
            label="班组"
            options={optionsQuery.data?.teams ?? []}
            value={draftQuery.teamIds ?? []}
            onChange={(teamIds) => setDraftQuery((current) => ({ ...current, teamIds }))}
          />
          <MultiSelectFilter
            label="专业"
            options={optionsQuery.data?.specialties ?? []}
            value={draftQuery.specialtyIds ?? []}
            onChange={(specialtyIds) => setDraftQuery((current) => ({ ...current, specialtyIds }))}
          />
          <FilterField label="考试系列">
            <select
              value={draftQuery.examSeriesId ?? "all"}
              onChange={(event) =>
                setDraftQuery((current) => ({
                  ...current,
                  examSeriesId: event.target.value === "all" ? undefined : event.target.value,
                }))
              }
              className="h-9 min-w-[170px] rounded-md border border-kb-border bg-white px-3 text-[13px] text-kb-body outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="all">全部考试系列</option>
              {(optionsQuery.data?.examSeries ?? []).map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </select>
          </FilterField>
          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setDraftQuery(DEFAULT_QUERY);
                setQuery(DEFAULT_QUERY);
              }}
              className="inline-flex h-9 items-center gap-1.5 rounded-md border border-kb-border bg-white px-3 text-[12.5px] text-kb-muted hover:bg-kb-surface hover:text-kb-heading"
            >
              <RotateCcw className="h-3.5 w-3.5" /> 重置
            </button>
            <button
              type="button"
              onClick={() => setQuery(draftQuery)}
              disabled={
                !draftQuery.startDate ||
                !draftQuery.endDate ||
                draftQuery.startDate > draftQuery.endDate
              }
              className="inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-4 text-[12.5px] font-semibold text-white hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-45"
            >
              <Search className="h-3.5 w-3.5" /> 查询
            </button>
          </div>
        </FilterBar>

        {analyticsQuery.isPending ? (
          <AsyncState state="loading" />
        ) : analyticsQuery.isError ? (
          <AsyncState
            state="error"
            description="成绩聚合暂时无法加载，当前筛选条件已保留。"
            actionLabel="重新加载"
            onAction={() => analyticsQuery.refetch()}
          />
        ) : !analyticsQuery.data || analyticsQuery.data.summary.finishedExamCount === 0 ? (
          <AsyncState
            state="empty"
            title="当前筛选范围内暂无已结束考试"
            description="只有已结束且完成阅卷的考试会进入成绩分析。"
            actionLabel="返回考试任务"
            onAction={() => navigate({ to: "/exam-admin" })}
          />
        ) : (
          <AnalyticsContent
            data={analyticsQuery.data}
            trendMetric={trendMetric}
            onTrendMetricChange={setTrendMetric}
            onDimensionSelect={applyDimension}
          />
        )}
      </AdminPageFrame>
    </PageShell>
  );
}

function AnalyticsContent({
  data,
  trendMetric,
  onTrendMetricChange,
  onDimensionSelect,
}: {
  data: Awaited<ReturnType<typeof getExamAnalytics>>;
  trendMetric: TrendMetric;
  onTrendMetricChange: (metric: TrendMetric) => void;
  onDimensionSelect: (dimension: "team" | "specialty", id: string) => void;
}) {
  const { summary, comparison } = data;
  const comparisonUnavailable = (
    <span title={comparison.reason} className="text-kb-muted">
      暂无可比数据
    </span>
  );
  return (
    <div className="space-y-5">
      <section
        className="flex flex-wrap items-start justify-between gap-3 rounded-[10px] border border-primary/15 bg-primary-soft/35 px-4 py-3 text-[12px] text-kb-body"
        aria-label="统计口径"
      >
        <div className="flex items-start gap-2">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <span>{data.scopeNote}</span>
        </div>
        {data.excludedUnreviewedExamCount > 0 && (
          <span className="inline-flex items-center gap-1.5 text-remind-foreground">
            <AlertCircle className="h-3.5 w-3.5" />
            {data.excludedUnreviewedExamCount} 场未完成阅卷，暂未计入
          </span>
        )}
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="核心指标">
        <MetricCard
          label="已结束考试"
          value={`${formatCount(summary.finishedExamCount)} 场`}
          definition="当前筛选范围内已结束且已完成阅卷的有效考试场次。"
          note="仅计入有效考试"
        />
        <MetricCard
          label="完成率"
          value={formatPercent(summary.completionRate)}
          definition="已提交人数 ÷ 应参加人数。未提交人员仍保留在分母中。"
          note={`${formatCount(summary.submittedCount)} / ${formatCount(summary.assignedCount)} 人`}
        />
        <MetricCard
          label="平均分"
          value={formatScore(summary.averageScore)}
          definition="有效答卷标准化得分总和 ÷ 有效答卷数。不同满分的考试先统一为百分制。"
          comparison={
            comparison.kind === "comparable" ? (
              <span className="font-medium text-success">
                {comparison.label} {formatDelta(comparison.scoreDelta)}，可比样本{" "}
                {comparison.sampleCount} 人
              </span>
            ) : (
              comparisonUnavailable
            )
          }
        />
        <MetricCard
          label="通过率"
          value={formatPercent(summary.passRate)}
          definition="通过人数 ÷ 有效提交人数。未提交人员不进入通过率分母。"
          comparison={
            comparison.kind === "comparable" ? (
              <span className="font-medium text-success">
                {comparison.label} {formatDelta(comparison.passRateDelta, "percentagePoint")}
              </span>
            ) : (
              comparisonUnavailable
            )
          }
        />
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
        <article className="min-w-0 rounded-[12px] border border-kb-border bg-white p-4 sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-[16px] font-semibold text-kb-heading">考试表现趋势</h2>
              <p className="mt-1 text-[11.5px] text-kb-muted">
                平均分统一为百分制。趋势表示变化，未满足可比规则时不称为提升。
              </p>
            </div>
            <div
              className="flex rounded-[8px] bg-kb-surface p-1"
              role="tablist"
              aria-label="趋势指标"
            >
              {(
                [
                  ["averageScore", "平均分"],
                  ["passRate", "通过率"],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  role="tab"
                  aria-selected={trendMetric === value}
                  onClick={() => onTrendMetricChange(value)}
                  className={cn(
                    "min-h-8 rounded-[6px] px-3 text-[11.5px] font-medium transition-colors",
                    trendMetric === value
                      ? "bg-white text-primary shadow-[0_1px_3px_rgba(31,52,64,0.08)]"
                      : "text-kb-muted hover:text-kb-heading",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div
            className="mt-4 h-[260px] w-full"
            aria-label={`${trendMetric === "averageScore" ? "平均分" : "通过率"}趋势图`}
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.trend} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
                <CartesianGrid stroke="#E8EEF0" strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: "#667985" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fontSize: 11, fill: "#667985" }}
                  axisLine={false}
                  tickLine={false}
                  unit="%"
                />
                <RechartsTooltip content={<TrendTooltip metric={trendMetric} />} />
                <Line
                  type="monotone"
                  dataKey={trendMetric}
                  stroke="#349BAC"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: "#FFFFFF", stroke: "#349BAC", strokeWidth: 2 }}
                  activeDot={{ r: 5 }}
                  connectNulls={false}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 grid gap-2 border-t border-divider pt-3 sm:grid-cols-2 lg:grid-cols-3">
            {data.trend.slice(-3).map((point) => (
              <div key={point.examId} className="min-w-0 text-[11px] text-kb-muted">
                <div className="truncate font-medium text-kb-body" title={point.examName}>
                  {point.examName}
                </div>
                <div className="mt-1 tabular-nums">
                  平均分 {formatScore(point.averageScore)}，通过率 {formatPercent(point.passRate)}
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-[12px] border border-kb-border bg-white p-4 sm:p-5">
          <h2 className="text-[16px] font-semibold text-kb-heading">完成情况</h2>
          <p className="mt-1 text-[11.5px] text-kb-muted">未提交人员保留在应参加人数中。</p>
          <dl className="mt-6 space-y-5">
            <CompletionRow label="应参加" value={summary.assignedCount} />
            <CompletionRow label="已提交" value={summary.submittedCount} tone="primary" />
            <CompletionRow
              label="未提交"
              value={Math.max(0, summary.assignedCount - summary.submittedCount)}
              tone="warning"
            />
          </dl>
          <div className="mt-6 border-t border-divider pt-5">
            <div className="flex items-end justify-between gap-4">
              <span className="text-[12px] text-kb-muted">整体完成率</span>
              <strong className="text-[26px] font-semibold leading-none tabular-nums text-kb-heading">
                {formatPercent(summary.completionRate)}
              </strong>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-kb-surface">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${summary.completionRate ?? 0}%` }}
              />
            </div>
          </div>
        </article>
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <BreakdownTable
          title="班组表现"
          description="按完成率从低到高排列，点击班组可下钻全页。"
          items={data.teamBreakdown}
          onSelect={(id) => onDimensionSelect("team", id)}
        />
        <BreakdownTable
          title="专业表现"
          description="样本量与精确数值同时展示，不以柱高代替判断。"
          items={data.specialtyBreakdown}
          onSelect={(id) => onDimensionSelect("specialty", id)}
        />
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="text-[17px] font-semibold text-kb-heading">薄弱知识点</h2>
          <p className="mt-1 text-[11.5px] text-kb-muted">
            错误率必须结合答题人数与题目数判断。答题人数少于 10 人时标记为样本不足。
          </p>
        </div>
        <DataTableShell>
          <table className="w-full min-w-[980px] text-left text-[12.5px]">
            <thead className="bg-kb-table-head text-[11.5px] text-kb-muted">
              <tr>
                <th className="px-4 py-3 font-medium">知识点</th>
                <th className="px-3 py-3 font-medium">专业 / 专题</th>
                <th className="px-3 py-3 text-right font-medium">有效答题人数</th>
                <th className="px-3 py-3 text-right font-medium">题目数</th>
                <th className="px-3 py-3 text-right font-medium">错误率</th>
                <th className="px-3 py-3 text-right font-medium">较上期变化</th>
                <th className="px-4 py-3 text-right font-medium">关联考试</th>
              </tr>
            </thead>
            <tbody>
              {data.weaknesses.map((item) => (
                <tr key={item.id} className="border-t border-divider hover:bg-kb-surface/45">
                  <td className="px-4 py-3.5 font-medium text-kb-heading">
                    <div className="flex items-center gap-2">
                      {item.knowledgePoint}
                      {!item.sampleSufficient && (
                        <span className="rounded-[5px] bg-remind-soft px-2 py-1 text-[10px] font-medium text-remind-foreground">
                          样本不足
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-3.5 text-kb-body">
                    <div>{item.specialtyName}</div>
                    <div className="mt-0.5 text-[10.5px] text-kb-muted">{item.topicName}</div>
                  </td>
                  <td className="px-3 py-3.5 text-right tabular-nums text-kb-body">
                    {item.respondentCount}
                  </td>
                  <td className="px-3 py-3.5 text-right tabular-nums text-kb-body">
                    {item.questionCount}
                  </td>
                  <td className="px-3 py-3.5 text-right font-semibold tabular-nums text-kb-heading">
                    {formatPercent(item.errorRate)}
                  </td>
                  <td
                    className={cn(
                      "px-3 py-3.5 text-right tabular-nums",
                      (item.errorRateDelta ?? 0) > 0 ? "text-destructive" : "text-success",
                    )}
                  >
                    {item.errorRateDelta == null
                      ? "—"
                      : formatDelta(item.errorRateDelta, "percentagePoint")}
                  </td>
                  <td className="px-4 py-3.5 text-right tabular-nums text-kb-body">
                    {item.relatedExamCount} 场
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </DataTableShell>
      </section>
    </div>
  );
}

function CompletionRow({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: number;
  tone?: "default" | "primary" | "warning";
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="inline-flex items-center gap-2 text-[12.5px] text-kb-body">
        <span
          className={cn(
            "grid h-7 w-7 place-items-center rounded-[7px]",
            tone === "primary"
              ? "bg-primary-soft text-primary"
              : tone === "warning"
                ? "bg-remind-soft text-remind-foreground"
                : "bg-kb-surface text-kb-muted",
          )}
        >
          <Users className="h-3.5 w-3.5" />
        </span>
        {label}
      </dt>
      <dd className="text-[20px] font-semibold tabular-nums text-kb-heading">
        {formatCount(value)}
      </dd>
    </div>
  );
}

function BreakdownTable({
  title,
  description,
  items,
  onSelect,
}: {
  title: string;
  description: string;
  items: AnalyticsBreakdownItem[];
  onSelect: (id: string) => void;
}) {
  return (
    <article className="overflow-hidden rounded-[12px] border border-kb-border bg-white">
      <div className="px-4 py-4">
        <h2 className="text-[16px] font-semibold text-kb-heading">{title}</h2>
        <p className="mt-1 text-[11.5px] text-kb-muted">{description}</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[590px] text-left text-[12px]">
          <thead className="bg-kb-table-head text-[11px] text-kb-muted">
            <tr>
              <th className="px-4 py-2.5 font-medium">名称</th>
              <th className="px-2 py-2.5 text-right font-medium">样本</th>
              <th className="px-2 py-2.5 text-right font-medium">完成率</th>
              <th className="px-2 py-2.5 text-right font-medium">平均分</th>
              <th className="px-4 py-2.5 text-right font-medium">通过率</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-t border-divider hover:bg-kb-surface/45">
                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => onSelect(item.id)}
                    className="inline-flex min-h-8 items-center gap-1 font-medium text-kb-heading hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25"
                  >
                    {item.name} <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </td>
                <td className="px-2 py-3 text-right tabular-nums text-kb-body">
                  {item.sampleCount}
                </td>
                <td className="px-2 py-3 text-right font-medium tabular-nums text-kb-heading">
                  {formatPercent(item.completionRate)}
                </td>
                <td className="px-2 py-3 text-right tabular-nums text-kb-body">
                  {formatScore(item.averageScore)}
                </td>
                <td className="px-4 py-3 text-right tabular-nums text-kb-body">
                  {formatPercent(item.passRate)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </article>
  );
}

function TrendTooltip({
  active,
  payload,
  metric,
}: {
  active?: boolean;
  payload?: Array<{ payload: AnalyticsTrendPoint }>;
  metric: TrendMetric;
}) {
  if (!active || !payload?.[0]) return null;
  const point = payload[0].payload;
  return (
    <div className="max-w-[260px] rounded-[8px] border border-kb-border bg-white px-3 py-2 shadow-[0_8px_24px_rgba(31,64,72,0.14)]">
      <div className="text-[12px] font-semibold text-kb-heading">{point.examName}</div>
      <div className="mt-1 text-[11px] text-kb-muted">{point.endedAt}</div>
      <div className="mt-2 text-[12px] tabular-nums text-kb-body">
        {metric === "averageScore" ? "平均分" : "通过率"}：
        <strong className="ml-1 text-kb-heading">
          {metric === "averageScore"
            ? formatScore(point.averageScore)
            : formatPercent(point.passRate)}
        </strong>
      </div>
      <div className="mt-1 text-[10.5px] text-kb-muted">
        已提交 {point.submittedCount} / 应参加 {point.assignedCount}
      </div>
    </div>
  );
}

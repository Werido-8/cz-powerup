import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ChevronRight, FileSearch, Search } from "lucide-react";
import {
  AdminPageFrame,
  AsyncState,
  DataTableShell,
  ExamTaskStatusTag,
  FilterBar,
  FilterField,
  MetricCard,
  ResultStatusTag,
} from "@/components/ability-admin/admin-ui";
import { PageHeader, TableListPager, TABLE_PAGE_SIZE_DEFAULT } from "@/components/learning/ui";
import { PageShell } from "@/components/workbench/PageShell";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  formatCount,
  formatDateRange,
  formatPercent,
  formatScore,
  formatScoreMode,
} from "@/lib/exam-admin/format";
import type { ExamPersonResult } from "@/lib/exam-admin/types";
import { cn } from "@/lib/utils";
import { getExamDetail } from "@/services/examAdmin";

export const Route = createFileRoute("/exam-admin/exam/$examId")({
  component: ExamDetailPage,
  head: () => ({ meta: [{ title: "考试详情 · 涉网运行能力智能提升平台" }] }),
});

type DetailTab = "people" | "results" | "questions";
type PersonStatusFilter = "all" | ExamPersonResult["status"];

function ExamDetailPage() {
  const { examId } = Route.useParams();
  const navigate = useNavigate();
  const detailQuery = useQuery({
    queryKey: ["exam-admin", "exam-detail", examId],
    queryFn: () => getExamDetail(examId),
  });
  const [tab, setTab] = useState<DetailTab>("people");

  return (
    <PageShell>
      <AdminPageFrame>
        <nav aria-label="面包屑" className="flex items-center gap-1 text-[12px] text-kb-muted">
          <Link to="/exam-admin" className="hover:text-primary">
            考试任务
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-kb-body">考试详情</span>
        </nav>

        {detailQuery.isPending ? (
          <AsyncState state="loading" />
        ) : detailQuery.isError ? (
          <AsyncState
            state="error"
            description="单场考试详情暂时无法加载。"
            actionLabel="重新加载"
            onAction={() => detailQuery.refetch()}
          />
        ) : !detailQuery.data ? (
          <AsyncState
            state="empty"
            title="未找到该考试"
            description="考试可能已删除，或当前地址已经失效。"
            actionLabel="返回考试任务"
            onAction={() => navigate({ to: "/exam-admin" })}
          />
        ) : (
          <ExamDetailContent detail={detailQuery.data} tab={tab} onTabChange={setTab} />
        )}
      </AdminPageFrame>
    </PageShell>
  );
}

function ExamDetailContent({
  detail,
  tab,
  onTabChange,
}: {
  detail: NonNullable<Awaited<ReturnType<typeof getExamDetail>>>;
  tab: DetailTab;
  onTabChange: (tab: DetailTab) => void;
}) {
  const { task } = detail;
  const isScoreTracked = task.scoreMode === "fixed";
  return (
    <div className="space-y-5">
      <PageHeader
        title={task.name}
        subtitle={`${formatDateRange(task.startsAt, task.endsAt)}；${formatScoreMode(task.scoreMode, task.totalScore)}；${task.scope.teamNames.join("、") || "范围待设置"}；${task.scope.specialtyNames.join("、") || "专业待设置"}`}
        size="md"
        action={
          <Link
            to="/exam-admin"
            className="inline-flex min-h-10 items-center gap-2 rounded-[8px] border border-kb-border bg-white px-4 text-[13px] font-medium text-kb-body hover:bg-kb-surface"
          >
            <ArrowLeft className="h-4 w-4" /> 返回任务列表
          </Link>
        }
      />
      <div className="-mt-3 flex flex-wrap items-center gap-2">
        <ExamTaskStatusTag status={task.status} />
        <span className="rounded-[6px] bg-kb-surface px-2 py-1 text-[10.5px] text-kb-body">
          {task.goal}
        </span>
        <span className="rounded-[6px] bg-kb-surface px-2 py-1 text-[10.5px] text-kb-body">
          {task.category}
        </span>
      </div>

      <section
        className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5"
        aria-label="单场考试摘要"
      >
        <MetricCard
          label="应参加"
          value={`${formatCount(task.scope.assignedCount)} 人`}
          definition="考试任务下发范围内去重后的应参加人数。"
          note="人员范围来自下发记录"
        />
        <MetricCard
          label="已提交"
          value={`${formatCount(task.submittedCount)} 人`}
          definition="每位人员最新一次有效答卷为已提交状态的人数。"
          note={`未提交 ${Math.max(0, task.scope.assignedCount - task.submittedCount)} 人`}
        />
        <MetricCard
          label="完成率"
          value={formatPercent(task.completionRate)}
          definition="已提交人数 ÷ 应参加人数。"
          note={`${task.submittedCount} / ${task.scope.assignedCount} 人`}
        />
        {isScoreTracked ? (
          <>
            <MetricCard
              label="平均分"
              value={formatScore(task.averageScore)}
              definition="有效提交答卷的实际得分平均值。无有效答卷时显示无数据。"
              note={`有效答卷 ${task.submittedCount} 份`}
            />
            <MetricCard
              label="通过率"
              value={formatPercent(task.passRate)}
              definition="通过人数 ÷ 有效提交人数。未提交人员不进入分母。"
              note={`分母 ${task.submittedCount} 份有效答卷`}
            />
          </>
        ) : (
          <MetricCard
            label="计分规则"
            value={task.scoreMode === "variable" ? "按题计分" : "不设分数"}
            definition="未配置统一总分或及格线的考试，不计算平均分、通过率或成绩分布。"
            note="仅跟踪参与和提交情况"
          />
        )}
      </section>

      <nav
        className="flex min-h-12 gap-7 border-b border-kb-border"
        role="tablist"
        aria-label="考试详情内容"
      >
        {(
          [
            ["people", "人员完成情况"],
            ["results", "成绩结果"],
            ["questions", "题目分析"],
          ] as const
        ).map(([value, label]) => {
          const active = tab === value;
          return (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onTabChange(value)}
              className={cn(
                "relative min-h-12 text-[13.5px] font-medium transition-colors",
                active ? "text-primary" : "text-kb-muted hover:text-kb-heading",
              )}
            >
              {label}
              {active && <span className="absolute inset-x-0 bottom-[-1px] h-0.5 bg-primary" />}
            </button>
          );
        })}
      </nav>

      {tab === "people" && <PeoplePanel detail={detail} />}
      {tab === "results" && <ResultsPanel detail={detail} />}
      {tab === "questions" && <QuestionsPanel detail={detail} />}
    </div>
  );
}

function PeoplePanel({
  detail,
}: {
  detail: NonNullable<Awaited<ReturnType<typeof getExamDetail>>>;
}) {
  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState<PersonStatusFilter>("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(TABLE_PAGE_SIZE_DEFAULT);
  const filtered = useMemo(() => {
    const normalized = keyword.trim().toLowerCase();
    return detail.people.filter((person) => {
      if (status !== "all" && person.status !== status) return false;
      if (!normalized) return true;
      return [person.name, person.teamName, person.specialtyName, person.positionName]
        .join(" ")
        .toLowerCase()
        .includes(normalized);
    });
  }, [detail.people, keyword, status]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageRows = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  useEffect(() => setPage(1), [keyword, pageSize, status]);

  return (
    <section className="space-y-3">
      <FilterBar>
        <FilterField label="人员搜索">
          <div className="relative min-w-[280px] sm:w-[320px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-kb-muted" />
            <Input
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="搜索姓名、班组、专业或岗位"
              className="h-10 rounded-[8px] border-kb-border bg-white pl-9 text-[13px]"
            />
          </div>
        </FilterField>
        <FilterField label="完成状态">
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value as PersonStatusFilter)}
            className="h-10 min-w-[140px] rounded-[8px] border border-kb-border bg-white px-3 text-[13px] text-kb-body outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="all">全部状态</option>
            <option value="notStarted">未开始</option>
            <option value="inProgress">进行中</option>
            <option value="submitted">已提交</option>
            <option value="expired">已过期</option>
          </select>
        </FilterField>
        <span className="ml-auto self-end pb-2 text-[11.5px] text-kb-muted">
          共 {detail.peopleTotal} 人，当前筛选 {filtered.length} 人
        </span>
      </FilterBar>

      {pageRows.length === 0 ? (
        <AsyncState
          state="empty"
          title="没有符合条件的人员"
          description="请调整姓名或完成状态筛选。"
          actionLabel="清空筛选"
          onAction={() => {
            setKeyword("");
            setStatus("all");
          }}
        />
      ) : (
        <DataTableShell
          footer={
            <TableListPager
              page={safePage}
              totalPages={totalPages}
              totalItems={filtered.length}
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
            />
          }
        >
          <table className="w-full min-w-[1060px] text-left text-[12.5px]">
            <thead className="bg-kb-table-head text-[11.5px] text-kb-muted">
              <tr>
                <th className="px-4 py-3 font-medium">姓名</th>
                <th className="px-3 py-3 font-medium">班组</th>
                <th className="px-3 py-3 font-medium">专业 / 岗位</th>
                <th className="px-3 py-3 font-medium">状态</th>
                <th className="px-3 py-3 font-medium">提交时间</th>
                {detail.task.scoreMode === "fixed" && (
                  <>
                    <th className="px-3 py-3 text-right font-medium">得分</th>
                    <th className="px-3 py-3 text-center font-medium">结果</th>
                  </>
                )}
                <th className="px-4 py-3 text-right font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.map((person) => (
                <tr key={person.id} className="border-t border-divider hover:bg-kb-surface/45">
                  <td className="px-4 py-3.5 font-medium text-kb-heading">{person.name}</td>
                  <td className="px-3 py-3.5 text-kb-body">{person.teamName}</td>
                  <td className="px-3 py-3.5 text-kb-body">
                    <div>{person.specialtyName}</div>
                    <div className="mt-0.5 text-[10.5px] text-kb-muted">{person.positionName}</div>
                  </td>
                  <td className="px-3 py-3.5">
                    <ResultStatusTag status={person.status} />
                  </td>
                  <td className="px-3 py-3.5 tabular-nums text-kb-muted">
                    {person.submittedAt ?? "—"}
                  </td>
                  {detail.task.scoreMode === "fixed" && (
                    <>
                      <td className="px-3 py-3.5 text-right font-semibold tabular-nums text-kb-heading">
                        {formatScore(person.score)}
                      </td>
                      <td className="px-3 py-3.5 text-center">
                        {person.passed == null ? (
                          <span className="text-kb-muted">—</span>
                        ) : (
                          <span className={person.passed ? "text-success" : "text-destructive"}>
                            {person.passed ? "通过" : "未通过"}
                          </span>
                        )}
                      </td>
                    </>
                  )}
                  <td className="px-4 py-3.5 text-right">
                    {person.answerRoutePersonId ? (
                      <Link
                        to="/exam-admin/paper/$paperId/person/$personId"
                        params={{
                          paperId: detail.task.paperId,
                          personId: person.answerRoutePersonId,
                        }}
                        className="inline-flex min-h-9 items-center gap-1 rounded-[7px] px-2.5 text-[12px] font-medium text-primary hover:bg-primary-soft"
                      >
                        查看答卷 <ChevronRight className="h-3.5 w-3.5" />
                      </Link>
                    ) : (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span>
                            <button
                              type="button"
                              disabled
                              className="inline-flex min-h-9 cursor-not-allowed items-center gap-1 rounded-[7px] px-2.5 text-[12px] text-kb-muted opacity-55"
                            >
                              查看答卷 <ChevronRight className="h-3.5 w-3.5" />
                            </button>
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          {person.status === "submitted"
                            ? "当前明细接口未返回答卷标识"
                            : "人员尚未提交答卷"}
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </DataTableShell>
      )}
    </section>
  );
}

function ResultsPanel({
  detail,
}: {
  detail: NonNullable<Awaited<ReturnType<typeof getExamDetail>>>;
}) {
  if (detail.task.scoreMode !== "fixed") {
    return (
      <section className="rounded-[8px] border border-kb-border bg-white px-5 py-6">
        <h2 className="text-[16px] font-semibold text-kb-heading">答题结果</h2>
        <p className="mt-2 text-[12.5px] leading-5 text-kb-muted">
          该考试{detail.task.scoreMode === "variable" ? "按题计分且未设置统一总分" : "未设置分数"}
          ，因此不展示平均分、通过率和成绩分布。
        </p>
      </section>
    );
  }
  const maxCount = Math.max(...detail.scoreDistribution.map((item) => item.count), 1);
  return (
    <section className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(340px,.8fr)]">
      <article className="rounded-[12px] border border-kb-border bg-white p-5">
        <h2 className="text-[16px] font-semibold text-kb-heading">成绩分布</h2>
        <p className="mt-1 text-[11.5px] text-kb-muted">按有效提交答卷统计，人数为精确值。</p>
        <div className="mt-6 space-y-4">
          {detail.scoreDistribution.map((item) => (
            <div
              key={item.label}
              className="grid grid-cols-[64px_minmax(0,1fr)_56px] items-center gap-3"
            >
              <span className="text-[12px] tabular-nums text-kb-body">{item.label}</span>
              <div className="h-2 overflow-hidden rounded-full bg-kb-surface">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${(item.count / maxCount) * 100}%` }}
                />
              </div>
              <strong className="text-right text-[12px] tabular-nums text-kb-heading">
                {item.count} 人
              </strong>
            </div>
          ))}
        </div>
      </article>
      <article className="rounded-[12px] border border-kb-border bg-white p-5">
        <h2 className="text-[16px] font-semibold text-kb-heading">结果口径</h2>
        <dl className="mt-5 space-y-4 text-[12.5px]">
          <DefinitionRow label="有效答卷" value={`${detail.task.submittedCount} 份`} />
          <DefinitionRow label="平均分" value={formatScore(detail.task.averageScore)} />
          <DefinitionRow label="通过率" value={formatPercent(detail.task.passRate)} />
          <DefinitionRow
            label="未提交"
            value={`${Math.max(0, detail.task.scope.assignedCount - detail.task.submittedCount)} 人`}
          />
        </dl>
        <p className="mt-5 border-t border-divider pt-4 text-[11px] leading-5 text-kb-muted">
          通过率分母为有效提交人数；未提交人员只影响完成率，不会被当作零分答卷。
        </p>
      </article>
    </section>
  );
}

function QuestionsPanel({
  detail,
}: {
  detail: NonNullable<Awaited<ReturnType<typeof getExamDetail>>>;
}) {
  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-[17px] font-semibold text-kb-heading">题目与知识点表现</h2>
        <p className="mt-1 text-[11.5px] text-kb-muted">
          结合题目数与有效答题人数查看错误率，避免小样本误判。
        </p>
      </div>
      <DataTableShell>
        <table className="w-full min-w-[760px] text-left text-[12.5px]">
          <thead className="bg-kb-table-head text-[11.5px] text-kb-muted">
            <tr>
              <th className="px-4 py-3 font-medium">知识点</th>
              <th className="px-3 py-3 text-right font-medium">题目数</th>
              <th className="px-3 py-3 text-right font-medium">有效答题人数</th>
              <th className="px-3 py-3 text-right font-medium">错误率</th>
              <th className="px-4 py-3 text-right font-medium">判断</th>
            </tr>
          </thead>
          <tbody>
            {detail.questionPerformance.map((item) => (
              <tr key={item.id} className="border-t border-divider hover:bg-kb-surface/45">
                <td className="px-4 py-3.5 font-medium text-kb-heading">{item.knowledgePoint}</td>
                <td className="px-3 py-3.5 text-right tabular-nums text-kb-body">
                  {item.questionCount}
                </td>
                <td className="px-3 py-3.5 text-right tabular-nums text-kb-body">
                  {item.respondentCount}
                </td>
                <td className="px-3 py-3.5 text-right font-semibold tabular-nums text-kb-heading">
                  {formatPercent(item.errorRate)}
                </td>
                <td className="px-4 py-3.5 text-right">
                  {item.sampleSufficient ? (
                    <span className="inline-flex items-center gap-1 text-kb-body">
                      <FileSearch className="h-3.5 w-3.5 text-primary" /> 可用于分析
                    </span>
                  ) : (
                    <span className="text-remind-foreground">样本不足</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </DataTableShell>
    </section>
  );
}

function DefinitionRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-divider pb-3 last:border-b-0 last:pb-0">
      <dt className="text-kb-muted">{label}</dt>
      <dd className="font-semibold tabular-nums text-kb-heading">{value}</dd>
    </div>
  );
}

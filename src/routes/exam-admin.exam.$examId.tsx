import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ChevronLeft, ChevronRight, Search } from "lucide-react";
import {
  AsyncState,
  ExamTaskStatusTag,
  ResultStatusTag,
} from "@/components/ability-admin/admin-ui";
import { ExamAnswerList } from "@/components/exam/exam-answer-list";
import { PageTitleMark } from "@/components/learning/ui";
import { PageShell } from "@/components/workbench/PageShell";
import { Input } from "@/components/ui/input";
import { formatDateRange, formatScoreMode } from "@/lib/exam-admin/format";
import type { ExamPersonResult } from "@/lib/exam-admin/types";
import {
  getAggregatesForPaper,
  type PersonAggregate,
  type PersonExamRecord,
  type QuestionType,
} from "@/lib/mock/examAdmin";
import { cn } from "@/lib/utils";
import { getExamDetail } from "@/services/examAdmin";

export const Route = createFileRoute("/exam-admin/exam/$examId")({
  component: ExamProgressPage,
  head: () => ({ meta: [{ title: "考试进度 · 涉网运行能力智能提升平台" }] }),
});

type ExamDetailData = NonNullable<Awaited<ReturnType<typeof getExamDetail>>>;
type PersonListFilter = "all" | "submitted" | "pending";

const PEOPLE_PAGE_SIZE = 8;
const QUESTION_TYPE_ORDER: QuestionType[] = [
  "单选题",
  "多选题",
  "判断题",
  "填空题",
  "案例分析题",
  "简答题",
];

function ExamProgressPage() {
  const { examId } = Route.useParams();
  const navigate = useNavigate();
  const detailQuery = useQuery({
    queryKey: ["exam-admin", "exam-detail", examId],
    queryFn: () => getExamDetail(examId),
  });

  return (
    <PageShell compact mainClassName="flex min-h-0 flex-col overflow-hidden px-5 py-4 lg:px-6">
      {detailQuery.isPending ? (
        <AsyncState state="loading" />
      ) : detailQuery.isError ? (
        <AsyncState
          state="error"
          description="考试进度暂时无法加载。"
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
        <ExamProgressWorkspace detail={detailQuery.data} />
      )}
    </PageShell>
  );
}

function ExamProgressWorkspace({ detail }: { detail: ExamDetailData }) {
  const { task } = detail;
  const aggregateById = useMemo(
    () =>
      new Map(getAggregatesForPaper(task.paperId).map((person) => [person.id, person] as const)),
    [task.paperId],
  );
  const initialPersonId =
    detail.people.find((person) => person.status === "submitted")?.id ?? detail.people[0]?.id ?? "";
  const [selectedPersonId, setSelectedPersonId] = useState(initialPersonId);
  const [keyword, setKeyword] = useState("");
  const [statusFilter, setStatusFilter] = useState<PersonListFilter>("all");
  const [page, setPage] = useState(1);

  const submittedCount = useMemo(
    () => detail.people.filter((person) => person.status === "submitted").length,
    [detail.people],
  );
  const filteredPeople = useMemo(() => {
    const normalized = keyword.trim().toLowerCase();
    return detail.people.filter((person) => {
      if (statusFilter === "submitted" && person.status !== "submitted") return false;
      if (statusFilter === "pending" && person.status === "submitted") return false;
      if (!normalized) return true;
      return [person.name, person.teamName, person.specialtyName]
        .join(" ")
        .toLowerCase()
        .includes(normalized);
    });
  }, [detail.people, keyword, statusFilter]);
  const totalPages = Math.max(1, Math.ceil(filteredPeople.length / PEOPLE_PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageRows = useMemo(
    () => filteredPeople.slice((safePage - 1) * PEOPLE_PAGE_SIZE, safePage * PEOPLE_PAGE_SIZE),
    [filteredPeople, safePage],
  );
  const selectedPerson =
    detail.people.find((person) => person.id === selectedPersonId) ?? pageRows[0] ?? null;
  const selectedAggregate = selectedPerson ? (aggregateById.get(selectedPerson.id) ?? null) : null;
  const selectedRecord = selectedAggregate?.records[0] ?? null;

  useEffect(() => {
    setSelectedPersonId(initialPersonId);
    setKeyword("");
    setStatusFilter("all");
    setPage(1);
  }, [initialPersonId, task.id]);

  useEffect(() => setPage(1), [keyword, statusFilter]);

  useEffect(() => {
    if (pageRows.length === 0) {
      setSelectedPersonId("");
      return;
    }
    if (!pageRows.some((person) => person.id === selectedPersonId)) {
      setSelectedPersonId(pageRows[0]!.id);
    }
  }, [pageRows, selectedPersonId]);

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col">
      <header className="mb-3 shrink-0">
        <Link
          to="/exam-admin"
          className="inline-flex min-h-8 items-center gap-1 text-[12px] text-kb-muted transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> 返回考试任务
        </Link>
        <div className="mt-0.5 flex flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <PageTitleMark className="pt-0.5" />
            <div className="min-w-0">
              <h1 className="truncate text-[19px] font-semibold tracking-[-0.01em] text-kb-heading">
                {task.name}
              </h1>
              <p className="mt-1 text-[12px] leading-5 text-kb-muted">
                {formatDateRange(task.startsAt, task.endsAt)}
                <span className="mx-2 text-kb-border">|</span>
                {formatScoreMode(task.scoreMode, task.totalScore)}
                <span className="mx-2 text-kb-border">|</span>
                {task.scope.teamNames.join("、") || "范围待设置"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 pt-0.5">
            <ExamTaskStatusTag status={task.status} />
            <span className="text-[12px] tabular-nums text-kb-muted">
              已交 <strong className="font-semibold text-kb-heading">{task.submittedCount}</strong>{" "}
              / {task.scope.assignedCount}
            </span>
          </div>
        </div>
      </header>

      <div className="grid min-h-0 flex-1 gap-4 overflow-y-auto lg:grid-cols-[300px_minmax(0,1fr)] lg:overflow-hidden">
        <aside className="flex min-h-[460px] flex-col overflow-hidden rounded-[10px] border border-kb-border bg-white lg:min-h-0">
          <div className="shrink-0 border-b border-divider px-3.5 py-3">
            <div className="flex items-baseline justify-between gap-2">
              <h2 className="text-[13.5px] font-semibold text-kb-heading">考试学员</h2>
              <span className="text-[11px] tabular-nums text-kb-muted">
                已交 {submittedCount} / {detail.peopleTotal}
              </span>
            </div>
            <div className="relative mt-2.5">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-kb-muted" />
              <Input
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
                placeholder="搜索姓名或班组"
                aria-label="搜索考试学员"
                className="h-8 rounded-[6px] border-kb-border bg-kb-surface pl-8 text-[12px] shadow-none"
              />
            </div>
            <div className="mt-2 flex gap-1" role="tablist" aria-label="学员交卷状态">
              {(
                [
                  ["all", "全部", detail.people.length],
                  ["submitted", "已交", submittedCount],
                  ["pending", "未交", Math.max(0, detail.people.length - submittedCount)],
                ] as const
              ).map(([value, label, count]) => {
                const active = statusFilter === value;
                return (
                  <button
                    key={value}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setStatusFilter(value)}
                    className={cn(
                      "inline-flex h-7 items-center gap-1 rounded-[5px] px-2 text-[11px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25",
                      active
                        ? "bg-primary text-white"
                        : "bg-kb-surface text-kb-muted hover:text-kb-heading",
                    )}
                  >
                    {label}
                    <span className={active ? "text-white/80" : "text-kb-muted"}>{count}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {pageRows.length === 0 ? (
              <div className="grid min-h-48 place-items-center px-4 text-center">
                <div>
                  <p className="text-[13px] font-medium text-kb-heading">没有符合条件的学员</p>
                  <button
                    type="button"
                    onClick={() => {
                      setKeyword("");
                      setStatusFilter("all");
                    }}
                    className="mt-2 text-[12px] font-medium text-primary hover:text-primary/80"
                  >
                    清空筛选
                  </button>
                </div>
              </div>
            ) : (
              pageRows.map((person) => (
                <PersonListItem
                  key={person.id}
                  person={person}
                  active={person.id === selectedPerson?.id}
                  onSelect={() => setSelectedPersonId(person.id)}
                />
              ))
            )}
          </div>

          <PeoplePager
            page={safePage}
            totalPages={totalPages}
            totalItems={filteredPeople.length}
            onPageChange={setPage}
          />
        </aside>

        <LearnerExamPanel
          key={selectedPerson?.id ?? "empty"}
          person={selectedPerson}
          aggregate={selectedAggregate}
          record={selectedRecord}
          scoreTracked={task.scoreMode === "fixed"}
        />
      </div>
    </div>
  );
}

function PersonListItem({
  person,
  active,
  onSelect,
}: {
  person: ExamPersonResult;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-current={active ? "true" : undefined}
      className={cn(
        "flex w-full items-center justify-between gap-3 border-b border-divider px-3.5 py-2.5 text-left transition-colors last:border-b-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/25",
        active ? "bg-primary-soft" : "hover:bg-kb-surface/70",
      )}
    >
      <div className="min-w-0">
        <div
          className={cn(
            "truncate text-[13px] font-medium",
            active ? "text-primary" : "text-kb-heading",
          )}
        >
          {person.name}
        </div>
        <div className="mt-0.5 truncate text-[10.5px] text-kb-muted">
          {person.teamName} {person.specialtyName}
        </div>
      </div>
      <div className="shrink-0 text-right">
        <ResultStatusTag status={person.status} />
        <div className="mt-1 text-[12px] font-semibold tabular-nums text-kb-heading">
          {person.score != null ? `${person.score} 分` : "-"}
        </div>
      </div>
    </button>
  );
}

function PeoplePager({
  page,
  totalPages,
  totalItems,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  totalItems: number;
  onPageChange: (page: number) => void;
}) {
  const start = totalItems === 0 ? 0 : (page - 1) * PEOPLE_PAGE_SIZE + 1;
  const end = Math.min(page * PEOPLE_PAGE_SIZE, totalItems);

  return (
    <div className="flex shrink-0 items-center justify-between gap-3 border-t border-divider px-3.5 py-2.5">
      <span className="text-[11px] tabular-nums text-kb-muted">
        {start}-{end} / {totalItems}
      </span>
      <div className="flex items-center gap-1" role="navigation" aria-label="学员列表分页">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          aria-label="上一页"
          className="inline-flex h-7 w-7 items-center justify-center rounded-[4px] text-kb-muted transition-colors hover:bg-kb-surface hover:text-kb-heading disabled:pointer-events-none disabled:opacity-30"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>
        <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-[4px] bg-primary px-2 text-[11.5px] font-semibold tabular-nums text-white">
          {page}
        </span>
        <span className="px-0.5 text-[11px] tabular-nums text-kb-muted">/ {totalPages}</span>
        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page === totalPages}
          aria-label="下一页"
          className="inline-flex h-7 w-7 items-center justify-center rounded-[4px] text-kb-muted transition-colors hover:bg-kb-surface hover:text-kb-heading disabled:pointer-events-none disabled:opacity-30"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

function LearnerExamPanel({
  person,
  aggregate,
  record,
  scoreTracked,
}: {
  person: ExamPersonResult | null;
  aggregate: PersonAggregate | null;
  record: PersonExamRecord | null;
  scoreTracked: boolean;
}) {
  if (!person) {
    return (
      <section className="grid min-h-[560px] place-items-center rounded-[10px] border border-kb-border bg-white px-6 text-center lg:min-h-0">
        <div>
          <p className="text-[14px] font-medium text-kb-heading">请选择学员</p>
          <p className="mt-1 text-[12px] text-kb-muted">选择左侧学员后查看考试情况。</p>
        </div>
      </section>
    );
  }

  const statusText = record?.status ?? statusLabel(person.status);
  const resultText = person.passed == null ? "待判定" : person.passed ? "已通过" : "未通过";

  return (
    <section className="flex min-h-[560px] flex-col overflow-hidden rounded-[10px] border border-kb-border bg-white lg:min-h-0">
      <header className="shrink-0 border-b border-divider px-5 py-4 lg:px-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary-soft text-[14px] font-semibold text-primary">
              {person.name.slice(0, 1)}
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-[16px] font-semibold text-kb-heading">{person.name}</h2>
                <ResultStatusTag status={person.status} />
              </div>
              <p className="mt-1 truncate text-[11.5px] text-kb-muted">
                {aggregate?.team ?? person.teamName} {person.specialtyName}
                {record?.submittedAt ? `  提交于 ${record.submittedAt}` : ""}
              </p>
            </div>
          </div>

          <dl className="grid w-full grid-cols-2 gap-x-6 gap-y-3 sm:w-auto sm:grid-cols-5">
            <ExamMetric label="状态" value={statusText} />
            <ExamMetric
              label="得分"
              value={scoreTracked && record?.score != null ? `${record.score} 分` : "-"}
            />
            <ExamMetric
              label="正确率"
              value={scoreTracked && record?.correctRate != null ? `${record.correctRate}%` : "-"}
            />
            <ExamMetric
              label="用时"
              value={record?.duration != null ? `${record.duration} 分钟` : "-"}
            />
            <ExamMetric
              label="结果"
              value={scoreTracked ? resultText : "不计分"}
              tone={person.passed == null ? "muted" : person.passed ? "success" : "danger"}
            />
          </dl>
        </div>
      </header>

      <div className="grid min-h-0 flex-1 lg:grid-cols-[188px_minmax(0,1fr)]">
        {record?.answers?.length ? (
          <>
            <QuestionNavigator items={record.answers} />
            <div className="min-h-0 overflow-y-auto border-t border-divider px-5 py-2 lg:border-l lg:border-t-0 lg:px-6">
            
              <ExamAnswerList items={record.answers} />
            </div>
          </>
        ) : (
          <div className="lg:col-span-2">
            <LearnerEmptyState status={record?.status ?? statusLabel(person.status)} />
          </div>
        )}
      </div>
    </section>
  );
}

function QuestionNavigator({ items }: { items: PersonExamRecord["answers"] }) {
  const groups = useMemo(() => {
    const grouped = new Map<QuestionType, typeof items>();
    for (const item of items) {
      grouped.set(item.type, [...(grouped.get(item.type) ?? []), item]);
    }
    return QUESTION_TYPE_ORDER.filter((type) => grouped.has(type)).map((type) => ({
      type,
      items: grouped.get(type)!,
    }));
  }, [items]);

  const jumpToQuestion = (questionNo: number) => {
    document.getElementById(`answer-question-${questionNo}`)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  return (
    <nav
      aria-label="答卷题目导航"
      className="shrink-0 overflow-x-auto px-3.5 py-4 lg:min-h-0 lg:overflow-y-auto"
    >
      <h3 className="text-[12.5px] font-semibold text-kb-heading">题目导航</h3>
      <div className="mt-2 flex items-center gap-3 text-[10px] text-kb-muted">
        <span className="inline-flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-success" /> 正确
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-destructive" /> 错误
        </span>
      </div>
      <div className="mt-4 flex min-w-max gap-5 lg:min-w-0 lg:flex-col lg:gap-4">
        {groups.map((group) => (
          <section key={group.type}>
            <h4 className="text-[11px] font-medium text-kb-body">
              {group.type}
              <span className="ml-1 font-normal text-kb-muted">({group.items.length} 题)</span>
            </h4>
            <div className="mt-2 grid grid-cols-6 gap-1.5 lg:grid-cols-5">
              {group.items.map((item) => (
                <button
                  key={item.no}
                  type="button"
                  onClick={() => jumpToQuestion(item.no)}
                  aria-label={`查看第 ${item.no} 题，${item.isCorrect ? "正确" : "错误"}`}
                  className={cn(
                    "grid h-7 w-7 place-items-center rounded-[4px] text-[11px] font-semibold tabular-nums text-white transition-transform active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
                    item.isCorrect ? "bg-success" : "bg-destructive",
                  )}
                >
                  {item.no}
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>
    </nav>
  );
}

function ExamMetric({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "muted" | "success" | "danger";
}) {
  return (
    <div className="min-w-[68px]">
      <dt className="text-[10.5px] text-kb-muted">{label}</dt>
      <dd
        className={cn(
          "mt-1 whitespace-nowrap text-[15px] font-semibold tabular-nums text-kb-heading",
          tone === "muted" && "text-kb-muted",
          tone === "success" && "text-success",
          tone === "danger" && "text-destructive",
        )}
      >
        {value}
      </dd>
    </div>
  );
}

function LearnerEmptyState({ status }: { status: string }) {
  const copy =
    status === "进行中"
      ? ["考试进行中", "该学员正在作答，交卷后可查看答题明细。"]
      : status === "已过期"
        ? ["考试已过期", "该学员未在规定时间内提交答卷。"]
        : ["尚未提交答卷", "该学员还未开始或尚未完成本次考试。"];
  return (
    <div className="grid min-h-[320px] place-items-center text-center">
      <div>
        <p className="text-[14px] font-medium text-kb-heading">{copy[0]}</p>
        <p className="mt-1 text-[12.5px] text-kb-muted">{copy[1]}</p>
      </div>
    </div>
  );
}

function statusLabel(status: ExamPersonResult["status"]) {
  if (status === "submitted") return "已提交";
  if (status === "inProgress") return "进行中";
  if (status === "expired") return "已过期";
  return "未开始";
}

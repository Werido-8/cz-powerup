import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BookOpen,
  CheckCircle2,
  ChevronRight,
  Clock3,
  FileQuestion,
  History,
  Search,
  ShieldAlert,
} from "lucide-react";
import { PageShell } from "@/components/workbench/PageShell";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { PageHeader, TableListPager, TABLE_PAGE_SIZE_DEFAULT } from "@/components/learning/ui";
import {
  CONTRIBUTION_AUDIT_LOGS,
  CONTRIBUTION_STATUS_STYLE,
  QUESTION_CONTRIBUTIONS,
  type ContributionStatus,
  type QuestionContribution,
} from "@/lib/mock/my-question-contributions";
import { DOCS } from "@/lib/mock/data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/learn/submissions")({
  component: QuestionSubmissionRecordsPage,
  head: () => ({
    meta: [
      { title: "题目提交记录 · 我的学习" },
      { name: "description", content: "查看本人提交题目的审核状态、结果与审核记录。" },
    ],
  }),
});

type StatusFilter = "all" | Exclude<ContributionStatus, "草稿">;
type TimeFilter = "all" | "7d" | "30d";

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "全部状态" },
  { value: "待审核", label: "待审核" },
  { value: "已入库", label: "已通过" },
  { value: "已退回", label: "已驳回" },
];

const TYPE_LABEL: Record<QuestionContribution["type"], string> = {
  单选题: "单选",
  多选题: "多选",
  判断题: "判断",
  简答题: "简答",
};

const STATUS_LABEL: Record<Exclude<ContributionStatus, "草稿">, string> = {
  待审核: "待审核",
  已入库: "已通过",
  已退回: "已驳回",
};

const DOC_TITLE_BY_ID = new Map(DOCS.map((doc) => [doc.id, doc.title]));
const DEMO_NOW = new Date("2026-07-03T12:00:00");

function inTimeRange(item: QuestionContribution, range: TimeFilter) {
  if (range === "all") return true;
  const date = new Date((item.submittedAt ?? item.updatedAt).replace(" ", "T"));
  const days = range === "7d" ? 7 : 30;
  return DEMO_NOW.getTime() - date.getTime() <= days * 24 * 60 * 60 * 1000;
}

function StatusBadge({ status }: { status: Exclude<ContributionStatus, "草稿"> }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-[6px] px-2 py-1 text-[11px] font-medium",
        CONTRIBUTION_STATUS_STYLE[status],
      )}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}

function SubmissionDetail({
  item,
  onClose,
}: {
  item: QuestionContribution | null;
  onClose: () => void;
}) {
  const logs = item ? (CONTRIBUTION_AUDIT_LOGS[item.id] ?? []) : [];
  const sourceTitle = item ? (DOC_TITLE_BY_ID.get(item.docId) ?? "来源资料已失效") : "";

  return (
    <Sheet open={Boolean(item)} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-xl">
        {item && item.status !== "草稿" && (
          <>
            <SheetHeader className="border-b border-kb-border px-6 py-4">
              <SheetTitle>提交记录详情</SheetTitle>
              <SheetDescription>
                该记录仅支持查看，审核结束后不提供修改或重新提交。
              </SheetDescription>
            </SheetHeader>
            <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-5">
              <section className="rounded-[12px] border border-kb-border bg-kb-surface/35 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-[5px] bg-white px-2 py-1 text-[11px] text-kb-muted">
                    {TYPE_LABEL[item.type]}
                  </span>
                  <StatusBadge status={item.status} />
                </div>
                <p className="mt-3 text-[14px] font-medium leading-6 text-kb-heading">
                  {item.stem}
                </p>
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11.5px] text-kb-muted">
                  <span>来源：{sourceTitle}</span>
                  <span>提交时间：{item.submittedAt ?? "未提交"}</span>
                </div>
              </section>

              {item.status === "已退回" && item.rejectComment && (
                <section className="rounded-[12px] border border-destructive/20 bg-destructive/5 p-4">
                  <div className="flex items-center gap-2 text-[12.5px] font-semibold text-destructive">
                    <ShieldAlert className="h-4 w-4" /> 驳回原因
                  </div>
                  <p className="mt-2 text-[12.5px] leading-6 text-destructive/90">
                    {item.rejectComment}
                  </p>
                </section>
              )}

              <section>
                <h3 className="flex items-center gap-2 text-[13px] font-semibold text-kb-heading">
                  <History className="h-4 w-4 text-primary" /> 审核记录
                </h3>
                <ol className="mt-3 space-y-2.5">
                  {logs.map((log) => (
                    <li key={log.id} className="rounded-[10px] border border-kb-border px-4 py-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-[12.5px] font-medium text-kb-heading">
                          {log.action}
                        </span>
                        <time className="text-[11px] tabular-nums text-kb-muted">{log.time}</time>
                      </div>
                      <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[11.5px] text-kb-muted">
                        <span>操作人：{log.operator}</span>
                        {log.statusAfter !== "草稿" && <StatusBadge status={log.statusAfter} />}
                      </div>
                      {log.comment && (
                        <p className="mt-2 rounded-[7px] bg-kb-surface px-3 py-2 text-[11.5px] leading-5 text-kb-body">
                          {log.comment}
                        </p>
                      )}
                    </li>
                  ))}
                </ol>
              </section>
            </div>
            <div className="flex items-center justify-between gap-3 border-t border-kb-border px-6 py-3">
              {DOC_TITLE_BY_ID.has(item.docId) ? (
                <Link
                  to="/learn/doc/$id"
                  params={{ id: item.docId }}
                  className="inline-flex min-h-9 items-center gap-1.5 text-[12.5px] font-medium text-primary hover:text-primary/80"
                >
                  <BookOpen className="h-4 w-4" /> 查看来源资料
                </Link>
              ) : (
                <span className="text-[11.5px] text-kb-muted">来源资料已不可访问</span>
              )}
              <button
                type="button"
                onClick={onClose}
                className="min-h-9 rounded-[8px] border border-kb-border px-4 text-[12.5px] font-medium text-kb-body hover:bg-kb-surface"
              >
                关闭
              </button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function QuestionSubmissionRecordsPage() {
  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [timeRange, setTimeRange] = useState<TimeFilter>("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(TABLE_PAGE_SIZE_DEFAULT);
  const [selected, setSelected] = useState<QuestionContribution | null>(null);

  const submittedRecords = useMemo(
    () => QUESTION_CONTRIBUTIONS.filter((item) => item.status !== "草稿"),
    [],
  );
  const filtered = useMemo(() => {
    const normalized = keyword.trim().toLowerCase();
    return submittedRecords.filter((item) => {
      if (status !== "all" && item.status !== status) return false;
      if (!inTimeRange(item, timeRange)) return false;
      if (!normalized) return true;
      return [item.stem, DOC_TITLE_BY_ID.get(item.docId) ?? "", ...item.knowledgePoints]
        .join(" ")
        .toLowerCase()
        .includes(normalized);
    });
  }, [keyword, status, submittedRecords, timeRange]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageRows = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);
  const resetFilters = () => {
    setKeyword("");
    setStatus("all");
    setTimeRange("all");
    setPage(1);
  };

  const counts = {
    total: submittedRecords.length,
    pending: submittedRecords.filter((item) => item.status === "待审核").length,
    approved: submittedRecords.filter((item) => item.status === "已入库").length,
    rejected: submittedRecords.filter((item) => item.status === "已退回").length,
  };

  return (
    <PageShell>
      <nav aria-label="页面导航" className="mb-2 flex items-center gap-1 text-[12px]">
        <Link to="/learn" className="text-kb-muted hover:text-primary">
          我的学习
        </Link>
        <ChevronRight className="h-3 w-3 text-kb-muted/40" />
        <span className="text-kb-body">题目提交记录</span>
      </nav>
      <PageHeader
        title="题目提交记录"
        subtitle="查看本人从资料配题提交的题目，以及对应的审核状态和处理结果。"
        size="md"
      />

      <section className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="提交记录概览">
        {[
          {
            label: "全部提交",
            value: counts.total,
            icon: FileQuestion,
            tone: "text-primary bg-primary-soft",
          },
          {
            label: "待审核",
            value: counts.pending,
            icon: Clock3,
            tone: "text-remind-foreground bg-remind-soft",
          },
          {
            label: "已通过",
            value: counts.approved,
            icon: CheckCircle2,
            tone: "text-success bg-success-soft",
          },
          {
            label: "已驳回",
            value: counts.rejected,
            icon: ShieldAlert,
            tone: "text-destructive bg-destructive/10",
          },
        ].map((item) => (
          <article
            key={item.label}
            className="flex items-center gap-3 rounded-[12px] border border-kb-border bg-white px-4 py-3"
          >
            <span className={cn("grid h-9 w-9 place-items-center rounded-[9px]", item.tone)}>
              <item.icon className="h-[17px] w-[17px]" />
            </span>
            <div>
              <div className="text-[11.5px] text-kb-muted">{item.label}</div>
              <div className="mt-0.5 text-[21px] font-semibold tabular-nums text-kb-heading">
                {item.value}
              </div>
            </div>
          </article>
        ))}
      </section>

      <section className="overflow-hidden rounded-[12px] border border-kb-border bg-white">
        <div className="flex flex-wrap items-end gap-3 border-b border-kb-border bg-kb-surface/35 px-4 py-3">
          <label className="min-w-[220px] flex-1 xl:max-w-[360px]">
            <span className="mb-1 block text-[11px] text-kb-muted">关键词</span>
            <span className="relative block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-kb-muted" />
              <Input
                value={keyword}
                onChange={(event) => {
                  setKeyword(event.target.value);
                  setPage(1);
                }}
                placeholder="搜索题干、来源资料或知识点"
                className="h-9 border-kb-border bg-white pl-9 text-[12.5px]"
              />
            </span>
          </label>
          <label>
            <span className="mb-1 block text-[11px] text-kb-muted">审核状态</span>
            <select
              value={status}
              onChange={(event) => {
                setStatus(event.target.value as StatusFilter);
                setPage(1);
              }}
              className="h-9 min-w-[128px] rounded-md border border-kb-border bg-white px-3 text-[12.5px] text-kb-body outline-none focus:ring-2 focus:ring-primary/20"
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="mb-1 block text-[11px] text-kb-muted">提交时间</span>
            <select
              value={timeRange}
              onChange={(event) => {
                setTimeRange(event.target.value as TimeFilter);
                setPage(1);
              }}
              className="h-9 min-w-[120px] rounded-md border border-kb-border bg-white px-3 text-[12.5px] text-kb-body outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="all">全部时间</option>
              <option value="7d">近 7 天</option>
              <option value="30d">近 30 天</option>
            </select>
          </label>
          <button
            type="button"
            onClick={resetFilters}
            className="ml-auto h-9 rounded-md border border-kb-border bg-white px-3 text-[12px] font-medium text-kb-muted hover:bg-kb-surface hover:text-kb-heading"
          >
            重置筛选
          </button>
        </div>

        {pageRows.length === 0 ? (
          <div className="grid min-h-56 place-items-center px-6 text-center">
            <div>
              <FileQuestion className="mx-auto h-8 w-8 text-kb-muted/45" />
              <h2 className="mt-3 text-[14px] font-medium text-kb-heading">
                没有符合条件的提交记录
              </h2>
              <p className="mt-1 text-[12px] text-kb-muted">调整筛选条件后再试。</p>
              <button
                type="button"
                onClick={resetFilters}
                className="mt-3 text-[12.5px] font-medium text-primary hover:text-primary/80"
              >
                清空筛选
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[920px] table-fixed text-left text-[12.5px]">
                <thead className="bg-kb-table-head text-[11px] font-medium text-kb-muted">
                  <tr>
                    <th className="w-[38%] px-4 py-3 font-medium">题目</th>
                    <th className="w-[22%] px-3 py-3 font-medium">来源资料</th>
                    <th className="w-[14%] px-3 py-3 font-medium">提交时间</th>
                    <th className="w-[12%] px-3 py-3 font-medium">审核状态</th>
                    <th className="w-[14%] px-4 py-3 text-right font-medium">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((item) => (
                    <tr
                      key={item.id}
                      className="border-t border-divider align-middle hover:bg-kb-surface/35"
                    >
                      <td className="px-4 py-3.5">
                        <div className="line-clamp-2 font-medium leading-5 text-kb-heading">
                          {item.stem}
                        </div>
                        <div className="mt-1 flex flex-wrap gap-1.5 text-[10.5px] text-kb-muted">
                          <span>{TYPE_LABEL[item.type]}</span>
                          {item.knowledgePoints.map((point) => (
                            <span key={point}>{point}</span>
                          ))}
                        </div>
                      </td>
                      <td className="px-3 py-3.5 text-kb-body">
                        {DOC_TITLE_BY_ID.get(item.docId) ?? "来源资料已失效"}
                      </td>
                      <td className="px-3 py-3.5 tabular-nums text-kb-muted">
                        {item.submittedAt ?? "-"}
                      </td>
                      <td className="px-3 py-3.5">
                        <StatusBadge status={item.status as Exclude<ContributionStatus, "草稿">} />
                      </td>
                      <td className="px-4 py-3.5 text-right">
                        <button
                          type="button"
                          onClick={() => setSelected(item)}
                          className="inline-flex min-h-9 items-center gap-1 rounded-[7px] px-3 text-[12px] font-medium text-primary hover:bg-primary-soft"
                        >
                          查看记录 <ChevronRight className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <TableListPager
              page={safePage}
              totalPages={totalPages}
              totalItems={filtered.length}
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setPage(1);
              }}
            />
          </>
        )}
      </section>

      <SubmissionDetail item={selected} onClose={() => setSelected(null)} />
    </PageShell>
  );
}

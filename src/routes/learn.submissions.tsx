import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Eye, FileQuestion, Search, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { KbFilterCombo } from "@/components/knowledge/ui";
import { LearningBreadcrumb, LearningPageShell } from "@/components/learning/learning-breadcrumb";
import {
  FileListRefreshButton,
  FileListSortButton,
} from "@/components/knowledge/workbench/KnowledgeFileTable";
import { AppDialogButton, AppFormDialog } from "@/components/ui/app-dialog";
import { PageHeader, TableListPager, TABLE_PAGE_SIZE_DEFAULT } from "@/components/learning/ui";
import {
  CONTRIBUTION_STATUS_STYLE,
  QUESTION_CONTRIBUTIONS,
  type ContributionStatus,
  type QuestionContribution,
} from "@/lib/mock/my-question-contributions";
import { DOCS } from "@/lib/mock/data";
import type { KnowledgeSortBy } from "@/lib/knowledge/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/learn/submissions")({
  component: QuestionSubmissionRecordsPage,
  head: () => ({
    meta: [
      { title: "提交记录 · 我的学习" },
      { name: "description", content: "查看本人提交题目的审核状态与处理结果。" },
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

const TIME_OPTIONS: { value: TimeFilter; label: string }[] = [
  { value: "all", label: "全部时间" },
  { value: "7d", label: "近 7 天" },
  { value: "30d", label: "近 30 天" },
];

const SORT_OPTIONS: { value: KnowledgeSortBy; label: string }[] = [
  { value: "updated", label: "提交时间" },
  { value: "status", label: "审核状态" },
  { value: "name", label: "题目" },
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

function sortRecords(items: QuestionContribution[], sortBy: KnowledgeSortBy) {
  return [...items].sort((a, b) => {
    if (sortBy === "status") {
      return STATUS_LABEL[a.status as Exclude<ContributionStatus, "草稿">].localeCompare(
        STATUS_LABEL[b.status as Exclude<ContributionStatus, "草稿">],
        "zh",
      );
    }
    if (sortBy === "name") return a.stem.localeCompare(b.stem, "zh");
    return (b.submittedAt ?? b.updatedAt).localeCompare(a.submittedAt ?? a.updatedAt);
  });
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
  const sourceTitle = item ? (DOC_TITLE_BY_ID.get(item.docId) ?? "来源资料已失效") : "";
  const showDetail = Boolean(item && item.status !== "草稿");

  return (
    <AppFormDialog
      open={showDetail}
      onClose={onClose}
      title="查看题目"
      titleIcon={FileQuestion}
      size="medium"
      variant="detail"
      footer={<AppDialogButton onClick={onClose}>关闭</AppDialogButton>}
    >
      {item && item.status !== "草稿" && (
        <div className="max-h-[calc(100vh-64px-56px-56px)] space-y-5 overflow-y-auto px-6 py-5">
          <p className="text-[12.5px] leading-5 text-kb-muted">
            该记录仅支持查看，审核结束后不提供修改或重新提交。
          </p>

          {item.status === "已退回" && (
            <section className="rounded-[12px] border border-destructive/20 bg-destructive/5 p-4">
              <div className="flex items-center gap-2 text-[12.5px] font-semibold text-destructive">
                <ShieldAlert className="h-4 w-4" />
                驳回原因
              </div>
              <p className="mt-2 text-[12.5px] leading-6 text-destructive/90">
                {item.rejectComment ?? "暂无驳回说明"}
              </p>
            </section>
          )}

          <section className="rounded-[12px] border border-kb-border bg-kb-surface/35 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-[5px] bg-white px-2 py-1 text-[11px] text-kb-muted">
                {TYPE_LABEL[item.type]}
              </span>
              <StatusBadge status={item.status} />
            </div>
            <p className="mt-3 text-[14px] font-medium leading-6 text-kb-heading">{item.stem}</p>
            {item.options && item.options.length > 0 && (
              <ul className="mt-3 space-y-1.5">
                {item.options.map((option) => (
                  <li
                    key={option.key}
                    className="rounded-[8px] border border-kb-border bg-white px-3 py-2 text-[12.5px] text-kb-body"
                  >
                    <span className="font-medium text-primary">{option.key}.</span> {option.text}
                  </li>
                ))}
              </ul>
            )}
            {(item.answer || item.analysis) && (
              <div className="mt-3 space-y-1.5 text-[12.5px] leading-6 text-kb-body">
                {item.answer && (
                  <p>
                    <span className="text-kb-muted">答案：</span>
                    {item.answer}
                  </p>
                )}
                {item.analysis && (
                  <p>
                    <span className="text-kb-muted">解析：</span>
                    {item.analysis}
                  </p>
                )}
              </div>
            )}
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11.5px] text-kb-muted">
              <span>来源：{sourceTitle}</span>
              <span>提交时间：{item.submittedAt ?? "未提交"}</span>
            </div>
          </section>
        </div>
      )}
    </AppFormDialog>
  );
}

function RejectReasonDialog({
  item,
  onClose,
}: {
  item: QuestionContribution | null;
  onClose: () => void;
}) {
  return (
    <AppFormDialog
      open={Boolean(item)}
      onClose={onClose}
      title="查看驳回原因"
      titleIcon={ShieldAlert}
      size="compact"
      variant="detail"
      footer={<AppDialogButton onClick={onClose}>关闭</AppDialogButton>}
    >
      {item && (
        <div className="space-y-4 px-6 py-5">
          <p className="text-[13px] leading-6 text-kb-heading">{item.stem}</p>
          <div className="rounded-[12px] border border-destructive/20 bg-destructive/5 p-4">
            <p className="text-[13px] leading-6 text-destructive/90">
              {item.rejectComment ?? "暂无驳回说明"}
            </p>
          </div>
        </div>
      )}
    </AppFormDialog>
  );
}

function QuestionSubmissionRecordsPage() {
  const [draftKeyword, setDraftKeyword] = useState("");
  const [draftStatus, setDraftStatus] = useState<StatusFilter>("all");
  const [draftTimeRange, setDraftTimeRange] = useState<TimeFilter>("all");
  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [timeRange, setTimeRange] = useState<TimeFilter>("all");
  const [sortBy, setSortBy] = useState<KnowledgeSortBy>("updated");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(TABLE_PAGE_SIZE_DEFAULT);
  const [selected, setSelected] = useState<QuestionContribution | null>(null);
  const [rejectItem, setRejectItem] = useState<QuestionContribution | null>(null);
  const [refreshSeed, setRefreshSeed] = useState(0);

  const submittedRecords = useMemo(
    () => QUESTION_CONTRIBUTIONS.filter((item) => item.status !== "草稿"),
    [refreshSeed],
  );

  const applyQuery = () => {
    setKeyword(draftKeyword);
    setStatus(draftStatus);
    setTimeRange(draftTimeRange);
    setPage(1);
  };

  const filtered = useMemo(() => {
    const normalized = keyword.trim().toLowerCase();
    const matched = submittedRecords.filter((item) => {
      if (status !== "all" && item.status !== status) return false;
      if (!inTimeRange(item, timeRange)) return false;
      if (!normalized) return true;
      return [item.stem, DOC_TITLE_BY_ID.get(item.docId) ?? "", ...item.knowledgePoints]
        .join(" ")
        .toLowerCase()
        .includes(normalized);
    });
    return sortRecords(matched, sortBy);
  }, [keyword, sortBy, status, submittedRecords, timeRange]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageRows = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  return (
    <LearningPageShell>
      <LearningBreadcrumb current="submissions" />
      <PageHeader
        title="提交记录"
        subtitle="查看本人从资料配题提交的题目，以及对应的审核状态和处理结果。"
        size="md"
        className="mb-3 shrink-0"
      />

      <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[12px] border border-kb-border bg-white">
        <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-[#e8eef1] bg-[#FAFCFD] px-3.5 py-2.5">
          <div className="flex h-9 min-w-[220px] max-w-[320px] flex-1 items-center gap-2 rounded-[8px] border border-border bg-card px-3 transition-colors focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/20">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
            <input
              value={draftKeyword}
              onChange={(event) => setDraftKeyword(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") applyQuery();
              }}
              placeholder="搜索题干、来源资料或知识点"
              className="min-w-0 flex-1 border-0 bg-transparent text-[13px] leading-normal outline-none placeholder:text-muted-foreground"
            />
          </div>
          <KbFilterCombo
            value={draftStatus}
            onChange={(value) => setDraftStatus(value as StatusFilter)}
            placeholder="全部状态"
            options={STATUS_OPTIONS}
          />
          <KbFilterCombo
            value={draftTimeRange}
            onChange={(value) => setDraftTimeRange(value as TimeFilter)}
            placeholder="全部时间"
            options={TIME_OPTIONS}
          />
          <button
            type="button"
            onClick={applyQuery}
            className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-[8px] bg-primary px-3.5 text-[13px] font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Search className="h-3.5 w-3.5" />
            查询
          </button>
          <div className="ml-auto flex items-center gap-2">
            <FileListRefreshButton
              onClick={() => {
                setRefreshSeed((value) => value + 1);
                toast.message("列表已刷新");
              }}
            />
            <FileListSortButton
              value={sortBy}
              onChange={(next) => {
                setSortBy(next);
                setPage(1);
              }}
              options={SORT_OPTIONS}
              ariaLabel="排序"
            />
          </div>
        </div>

        {pageRows.length === 0 ? (
          <div className="grid min-h-0 flex-1 place-items-center px-6 text-center">
            <div>
              <FileQuestion className="mx-auto h-8 w-8 text-kb-muted/45" />
              <h2 className="mt-3 text-[14px] font-medium text-kb-heading">
                没有符合条件的提交记录
              </h2>
              <p className="mt-1 text-[12px] text-kb-muted">调整筛选条件后再试。</p>
              <button
                type="button"
                onClick={() => {
                  setDraftKeyword("");
                  setDraftStatus("all");
                  setDraftTimeRange("all");
                  setKeyword("");
                  setStatus("all");
                  setTimeRange("all");
                  setPage(1);
                }}
                className="mt-3 text-[12.5px] font-medium text-primary hover:text-primary/80"
              >
                清空筛选
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="scrollbar-thin min-h-0 flex-1 overflow-auto">
              <table className="w-full min-w-[960px] table-fixed text-left text-[12.5px]">
                <thead className="sticky top-0 z-10 bg-kb-table-head text-[11px] font-medium text-kb-muted">
                  <tr>
                    <th className="w-[36%] px-4 py-3 font-medium">题目</th>
                    <th className="w-[20%] px-3 py-3 font-medium">来源资料</th>
                    <th className="w-[14%] px-3 py-3 font-medium">提交时间</th>
                    <th className="w-[12%] px-3 py-3 font-medium">审核状态</th>
                    <th className="w-[18%] px-4 py-3 text-right font-medium">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((item) => (
                    <tr
                      key={item.id}
                      onClick={() => setSelected(item)}
                      className="cursor-pointer border-t border-divider align-middle transition-colors hover:bg-kb-surface/35"
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
                      <td
                        className="px-4 py-3.5 text-right"
                        onClick={(event) => event.stopPropagation()}
                      >
                        <div className="flex flex-wrap items-center justify-end gap-x-3 gap-y-1">
                          <button
                            type="button"
                            onClick={() => setSelected(item)}
                            className="inline-flex min-h-9 items-center gap-1 rounded-[6px] px-2 text-[12px] font-medium text-primary transition-colors hover:bg-primary-soft/40 hover:text-primary/80"
                          >
                            <Eye className="h-3.5 w-3.5 stroke-[1.8]" />
                            查看题目
                          </button>
                          {item.status === "已退回" && (
                            <button
                              type="button"
                              onClick={() => setRejectItem(item)}
                              className="inline-flex min-h-9 items-center gap-1 rounded-[6px] px-2 text-[12px] font-medium text-destructive transition-colors hover:bg-destructive/5 hover:text-destructive/80"
                            >
                              <ShieldAlert className="h-3.5 w-3.5 stroke-[1.8]" />
                              查看驳回原因
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="shrink-0">
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
            </div>
          </>
        )}
      </section>

      <SubmissionDetail item={selected} onClose={() => setSelected(null)} />
      <RejectReasonDialog item={rejectItem} onClose={() => setRejectItem(null)} />
    </LearningPageShell>
  );
}

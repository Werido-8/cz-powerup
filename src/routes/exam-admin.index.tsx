import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart3,
  ChevronDown,
  ChevronRight,
  Eye,
  FileText,
  MoreHorizontal,
  PencilLine,
  Plus,
  Search,
  Send,
  Sparkles,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import {
  AdminPageFrame,
  AsyncState,
  DataTableShell,
  ExamAdminNav,
  ExamTaskStatusTag,
  FilterBar,
  FilterField,
  InlineProgress,
} from "@/components/ability-admin/admin-ui";
import { AssignDialog } from "@/components/exam/exam-dialogs";
import { PageHeader, TableListPager, TABLE_PAGE_SIZE_DEFAULT } from "@/components/learning/ui";
import { PageShell } from "@/components/workbench/PageShell";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  formatDateRange,
  formatPercent,
  formatScore,
  formatScoreMode,
} from "@/lib/exam-admin/format";
import type { ExamTask, ExamTaskStatus } from "@/lib/exam-admin/types";
import { PAPERS, type Paper } from "@/lib/mock/examAdmin";
import { EXAM_SPECIALTIES, EXAM_TEAMS } from "@/lib/mock/examAnalytics";
import { listExamTasks } from "@/services/examAdmin";

export const Route = createFileRoute("/exam-admin/")({
  component: ExamAdminPage,
  head: () => ({
    meta: [
      { title: "考试任务 · 涉网运行能力智能提升平台" },
      { name: "description", content: "创建、下发并跟踪考试任务。" },
    ],
  }),
});

type StatusFilter = "all" | ExamTaskStatus;

const STATUS_LABELS: Record<StatusFilter, string> = {
  all: "全部",
  draft: "草稿",
  scheduled: "待开始",
  inProgress: "进行中",
  ended: "已结束",
};

function ExamAdminPage() {
  const navigate = useNavigate();
  const tasksQuery = useQuery({
    queryKey: ["exam-admin", "tasks"],
    queryFn: () => listExamTasks(),
  });
  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [timeRange, setTimeRange] = useState<"all" | "30d" | "90d">("all");
  const [teamId, setTeamId] = useState("all");
  const [specialtyId, setSpecialtyId] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(TABLE_PAGE_SIZE_DEFAULT);
  const [assignPaper, setAssignPaper] = useState<Paper | null>(null);
  const [deleteTask, setDeleteTask] = useState<ExamTask | null>(null);
  const [removedIds, setRemovedIds] = useState<string[]>([]);

  const allTasks = useMemo(
    () => (tasksQuery.data ?? []).filter((task) => !removedIds.includes(task.id)),
    [removedIds, tasksQuery.data],
  );
  const filtered = useMemo(() => {
    const normalized = keyword.trim().toLowerCase();
    return allTasks.filter((task) => {
      if (status !== "all" && task.status !== status) return false;
      if (teamId !== "all" && !task.scope.teamIds.includes(teamId)) return false;
      if (specialtyId !== "all" && !task.scope.specialtyIds.includes(specialtyId)) return false;
      if (timeRange !== "all") {
        const boundary = timeRange === "30d" ? "2026-05-20" : "2026-03-21";
        if ((task.startsAt ?? task.updatedAt).slice(0, 10) < boundary) return false;
      }
      if (!normalized) return true;
      return [
        task.name,
        task.goal,
        task.category,
        ...task.scope.teamNames,
        ...task.scope.specialtyNames,
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalized);
    });
  }, [allTasks, keyword, specialtyId, status, teamId, timeRange]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageRows = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  useEffect(() => setPage(1), [keyword, pageSize, specialtyId, status, teamId, timeRange]);

  const clearFilters = () => {
    setKeyword("");
    setStatus("all");
    setTimeRange("all");
    setTeamId("all");
    setSpecialtyId("all");
  };

  return (
    <PageShell>
      <AdminPageFrame>
        <PageHeader
          title="考试任务"
          subtitle="创建、下发并跟踪考试任务。历史趋势与跨考试对比请进入成绩分析。"
          size="md"
          action={
            <div className="flex flex-wrap items-center justify-end gap-2">
              <Link
                to="/exam-admin/analysis"
                className="inline-flex min-h-10 items-center gap-2 rounded-[8px] border border-kb-border bg-white px-4 text-[13px] font-medium text-kb-body hover:bg-kb-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              >
                <BarChart3 className="h-4 w-4" /> 成绩分析
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="inline-flex min-h-10 items-center gap-2 rounded-[8px] bg-primary px-4 text-[13px] font-semibold text-white hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                  >
                    <Plus className="h-4 w-4" /> 创建考试 <ChevronDown className="h-3.5 w-3.5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <DropdownMenuItem
                    onClick={() =>
                      navigate({
                        to: "/exam-admin/paper/new",
                        search: { step: 1, source: "existing" },
                      })
                    }
                  >
                    <FileText className="mr-2 h-4 w-4" /> 选用已有试卷
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() =>
                      navigate({ to: "/exam-admin/paper/new", search: { step: 1, source: "ai" } })
                    }
                  >
                    <Sparkles className="mr-2 h-4 w-4" /> 智能组卷创建
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() =>
                      navigate({
                        to: "/exam-admin/paper/new",
                        search: { step: 1, source: "manual" },
                      })
                    }
                  >
                    <PencilLine className="mr-2 h-4 w-4" /> 手动组卷创建
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          }
        />

        <ExamAdminNav />

        {tasksQuery.isPending ? (
          <AsyncState state="loading" />
        ) : tasksQuery.isError ? (
          <AsyncState
            state="error"
            description="考试任务暂时无法加载，已保留当前筛选条件。"
            actionLabel="重新加载"
            onAction={() => tasksQuery.refetch()}
          />
        ) : (
          <>
            <section aria-label="任务筛选">
              <FilterBar>
                <FilterField label="考试名称">
                  <div className="relative min-w-[240px] sm:w-[300px]">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-kb-muted" />
                    <Input
                      value={keyword}
                      onChange={(event) => setKeyword(event.target.value)}
                      placeholder="搜索考试名称或专题"
                      className="h-9 rounded-md border-kb-border bg-white pl-9 text-[13px]"
                    />
                  </div>
                </FilterField>
                <FilterField label="状态">
                  <select
                    value={status}
                    onChange={(event) => setStatus(event.target.value as StatusFilter)}
                    className="h-9 min-w-[118px] rounded-md border border-kb-border bg-white px-3 text-[13px] text-kb-body outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    {(Object.keys(STATUS_LABELS) as StatusFilter[]).map((value) => {
                      const count =
                        value === "all"
                          ? allTasks.length
                          : allTasks.filter((task) => task.status === value).length;
                      return (
                        <option key={value} value={value}>
                          {STATUS_LABELS[value]}（{count}）
                        </option>
                      );
                    })}
                  </select>
                </FilterField>
                <FilterField label="时间范围">
                  <select
                    value={timeRange}
                    onChange={(event) => setTimeRange(event.target.value as typeof timeRange)}
                    className="h-9 rounded-md border border-kb-border bg-white px-3 text-[13px] text-kb-body outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="all">全部时间</option>
                    <option value="30d">近 30 天</option>
                    <option value="90d">近 90 天</option>
                  </select>
                </FilterField>
                <FilterField label="班组">
                  <select
                    value={teamId}
                    onChange={(event) => setTeamId(event.target.value)}
                    className="h-9 min-w-[132px] rounded-md border border-kb-border bg-white px-3 text-[13px] text-kb-body outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="all">全部班组</option>
                    {EXAM_TEAMS.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.name}
                      </option>
                    ))}
                  </select>
                </FilterField>
                <FilterField label="专业">
                  <select
                    value={specialtyId}
                    onChange={(event) => setSpecialtyId(event.target.value)}
                    className="h-9 min-w-[132px] rounded-md border border-kb-border bg-white px-3 text-[13px] text-kb-body outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="all">全部专业</option>
                    {EXAM_SPECIALTIES.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.name}
                      </option>
                    ))}
                  </select>
                </FilterField>
                <button
                  type="button"
                  onClick={clearFilters}
                  className="ml-auto inline-flex h-9 items-center rounded-md border border-kb-border bg-white px-3 text-[12.5px] font-medium text-kb-muted hover:bg-kb-surface hover:text-kb-heading"
                >
                  重置筛选
                </button>
              </FilterBar>
            </section>

            {pageRows.length === 0 ? (
              <AsyncState
                state="empty"
                title="没有符合条件的考试任务"
                description="可以清空当前筛选，或创建新的考试任务。"
                actionLabel="清空筛选"
                onAction={clearFilters}
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
                <table className="w-full min-w-[1160px] table-fixed text-left text-[13px]">
                  <thead className="sticky top-0 bg-kb-table-head text-[11.5px] font-medium text-kb-muted">
                    <tr>
                      <th className="w-[25%] px-4 py-3 font-medium">考试名称</th>
                      <th className="w-[18%] px-3 py-3 font-medium">适用范围</th>
                      <th className="w-[16%] px-3 py-3 font-medium">考试时间</th>
                      <th className="w-[9%] px-3 py-3 font-medium">状态</th>
                      <th className="w-[14%] px-3 py-3 font-medium">完成进度</th>
                      <th className="w-[10%] px-3 py-3 font-medium">结果摘要</th>
                      <th className="w-[8%] px-4 py-3 text-right font-medium">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageRows.map((task) => (
                      <ExamTaskRow
                        key={task.id}
                        task={task}
                        onAssign={() =>
                          setAssignPaper(PAPERS.find((paper) => paper.id === task.paperId) ?? null)
                        }
                        onDelete={() => setDeleteTask(task)}
                      />
                    ))}
                  </tbody>
                </table>
              </DataTableShell>
            )}
          </>
        )}
      </AdminPageFrame>

      <AssignDialog paper={assignPaper} onClose={() => setAssignPaper(null)} />
      <AlertDialog open={Boolean(deleteTask)} onOpenChange={(open) => !open && setDeleteTask(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>删除草稿考试？</AlertDialogTitle>
            <AlertDialogDescription>
              将删除“{deleteTask?.name}”及其未下发配置。已下发任务不会在此处提供删除入口。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (!deleteTask) return;
                setRemovedIds((ids) => [...ids, deleteTask.id]);
                toast.success("草稿考试已删除");
                setDeleteTask(null);
              }}
            >
              确认删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageShell>
  );
}

function ExamTaskRow({
  task,
  onAssign,
  onDelete,
}: {
  task: ExamTask;
  onAssign: () => void;
  onDelete: () => void;
}) {
  const primaryLabel =
    task.status === "draft"
      ? "继续编辑"
      : task.status === "inProgress"
        ? "查看进度"
        : task.status === "ended"
          ? "查看结果"
          : "查看详情";
  const scopeNames = [...task.scope.teamNames, ...task.scope.specialtyNames];

  return (
    <tr className="border-t border-divider align-middle transition-colors hover:bg-kb-surface/45">
      <td className="px-4 py-3.5">
        <div className="line-clamp-2 font-semibold leading-5 text-kb-heading">{task.name}</div>
        <div className="mt-1 flex flex-wrap gap-x-2 text-[11px] text-kb-muted">
          <span>{task.goal}</span>
          <span>{task.category}</span>
          <span>{formatScoreMode(task.scoreMode, task.totalScore)}</span>
          <span>更新 {task.updatedAt.slice(0, 10)}</span>
        </div>
      </td>
      <td className="px-3 py-3.5">
        <div className="flex flex-wrap gap-1">
          {scopeNames.length ? (
            <>
              {scopeNames.slice(0, 2).map((name, index) => (
                <span
                  key={`${name}-${index}`}
                  className="rounded-[5px] bg-kb-surface px-2 py-1 text-[10.5px] text-kb-body"
                >
                  {name}
                </span>
              ))}
              {scopeNames.length > 2 && (
                <span className="rounded-[5px] bg-kb-surface px-2 py-1 text-[10.5px] text-kb-muted">
                  等 {scopeNames.length} 项
                </span>
              )}
            </>
          ) : (
            <span className="text-kb-muted">待设置</span>
          )}
        </div>
        <div className="mt-1.5 text-[11px] text-kb-muted">应参加 {task.scope.assignedCount} 人</div>
      </td>
      <td className="px-3 py-3.5 text-[11.5px] leading-5 text-kb-body">
        {formatDateRange(task.startsAt, task.endsAt)}
      </td>
      <td className="px-3 py-3.5">
        <ExamTaskStatusTag status={task.status} />
      </td>
      <td className="px-3 py-3.5">
        <InlineProgress
          value={task.completionRate}
          label={`${task.submittedCount}/${task.scope.assignedCount}`}
        />
      </td>
      <td className="px-3 py-3.5">
        {task.status === "ended" && task.submittedCount > 0 && task.scoreMode === "fixed" ? (
          <div className="space-y-1 text-[11.5px] tabular-nums text-kb-body">
            <div>平均分 {formatScore(task.averageScore)}</div>
            <div>通过率 {formatPercent(task.passRate)}</div>
          </div>
        ) : task.status === "ended" && task.scoreMode !== "fixed" ? (
          <span className="text-[11.5px] text-kb-muted">
            {task.scoreMode === "variable" ? "按题计分" : "未设分数"}
          </span>
        ) : (
          <span className="text-kb-muted">—</span>
        )}
      </td>
      <td className="px-4 py-3.5 text-right">
        <div className="inline-flex items-center gap-1">
          {task.status === "draft" ? (
            <Link
              to="/exam-admin/paper/$paperId/edit"
              params={{ paperId: task.paperId }}
              className="inline-flex min-h-9 items-center gap-1 rounded-[7px] px-2.5 text-[12px] font-medium text-primary hover:bg-primary-soft"
            >
              {primaryLabel} <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          ) : (
            <Link
              to="/exam-admin/exam/$examId"
              params={{ examId: task.id }}
              className="inline-flex min-h-9 items-center gap-1 rounded-[7px] px-2.5 text-[12px] font-medium text-primary hover:bg-primary-soft"
            >
              {primaryLabel} <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label={`${task.name}更多操作`}
                className="grid h-9 w-9 place-items-center rounded-[7px] text-kb-muted hover:bg-kb-surface hover:text-kb-heading focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25"
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuItem asChild>
                <Link to="/exam-admin/paper/$paperId/preview" params={{ paperId: task.paperId }}>
                  <Eye className="mr-2 h-4 w-4" /> 预览试卷
                </Link>
              </DropdownMenuItem>
              {task.status === "draft" ? (
                <>
                  <DropdownMenuItem onClick={onAssign}>
                    <Send className="mr-2 h-4 w-4" /> 下发考试
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={onDelete}
                  >
                    <Trash2 className="mr-2 h-4 w-4" /> 删除草稿
                  </DropdownMenuItem>
                </>
              ) : (
                <DropdownMenuItem disabled>
                  <PencilLine className="mr-2 h-4 w-4" /> 已下发任务不可直接修改
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </td>
    </tr>
  );
}

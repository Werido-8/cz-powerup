import { Fragment, useMemo, useRef, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ChevronDown,
  Eye,
  FileText,
  Info,
  PencilLine,
  Plus,
  RotateCcw,
  Search,
  Send,
  Sparkles,
  Trash2,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import {
  AdminPageFrame,
  AsyncState,
  ExamAdminNav,
  ExamTaskStatusTag,
} from "@/components/ability-admin/admin-ui";
import { AssignDialog } from "@/components/exam/exam-dialogs";
import { KbFilterCombo } from "@/components/knowledge/ui";
import {
  FileListRefreshButton,
  FileListSortButton,
} from "@/components/knowledge/workbench/KnowledgeFileTable";
import {
  PageHeader,
  TABLE_PAGE_SIZE_DEFAULT,
  TableListPager,
} from "@/components/learning/ui";
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
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { formatDateRange, formatPercent } from "@/lib/exam-admin/format";
import type { ExamTask, ExamTaskStatus } from "@/lib/exam-admin/types";
import type { KnowledgeSortBy } from "@/lib/knowledge/types";
import { PAPERS, type Paper } from "@/lib/mock/examAdmin";
import { listExamTasks } from "@/services/examAdmin";
import { cn } from "@/lib/utils";

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

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "all", label: "全部状态" },
  { value: "draft", label: "草稿" },
  { value: "scheduled", label: "待开始" },
  { value: "inProgress", label: "进行中" },
  { value: "ended", label: "已结束" },
];

const TIME_OPTIONS: { value: string; label: string }[] = [
  { value: "all", label: "全部时间" },
  { value: "30d", label: "近 30 天" },
  { value: "90d", label: "近 90 天" },
];

const SORT_OPTIONS: { value: KnowledgeSortBy; label: string }[] = [
  { value: "updated", label: "更新时间" },
  { value: "name", label: "考试名称" },
  { value: "size", label: "考试时间" },
  { value: "status", label: "状态" },
];

const STATUS_ORDER: Record<ExamTaskStatus, number> = {
  inProgress: 0,
  scheduled: 1,
  draft: 2,
  ended: 3,
};

const GOAL_OPTIONS: { value: string; label: string }[] = [
  { value: "all", label: "全部目标" },
  { value: "取证复习", label: "取证复习" },
  { value: "复证巩固", label: "复证巩固" },
  { value: "岗位达标", label: "岗位达标" },
  { value: "阶段测评", label: "阶段测评" },
  { value: "日常自测", label: "日常自测" },
];

function splitRoleLabels(value: string) {
  return value
    .split(/[/／、,，]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function taskSpecialtyLabels(task: ExamTask) {
  const fromScope = task.scope.specialtyNames.filter((name) => name && name !== "未归属");
  if (fromScope.length) return [...new Set(fromScope)];
  return splitRoleLabels(task.specialty);
}

function formatSpecialty(task: ExamTask) {
  const labels = taskSpecialtyLabels(task);
  return labels.length ? labels.join(" / ") : "—";
}

function taskMatchesSpecialty(task: ExamTask, specialty: string) {
  if (specialty === "all") return true;
  return taskSpecialtyLabels(task).includes(specialty);
}

function sortTasks(items: ExamTask[], sortBy: KnowledgeSortBy) {
  return [...items].sort((a, b) => {
    if (sortBy === "name") return a.name.localeCompare(b.name, "zh");
    if (sortBy === "status") return STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
    if (sortBy === "size") {
      return (b.startsAt ?? b.updatedAt).localeCompare(a.startsAt ?? a.updatedAt);
    }
    return b.updatedAt.localeCompare(a.updatedAt);
  });
}

function ExamAdminPage() {
  const navigate = useNavigate();
  const tasksQuery = useQuery({
    queryKey: ["exam-admin", "tasks"],
    queryFn: () => listExamTasks(),
  });
  const [draftKeyword, setDraftKeyword] = useState("");
  const [draftStatus, setDraftStatus] = useState<StatusFilter>("all");
  const [draftTimeRange, setDraftTimeRange] = useState<"all" | "30d" | "90d">("all");
  const [draftGoal, setDraftGoal] = useState("all");
  const [draftSpecialty, setDraftSpecialty] = useState("all");
  const [keyword, setKeyword] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [timeRange, setTimeRange] = useState<"all" | "30d" | "90d">("all");
  const [goal, setGoal] = useState("all");
  const [specialty, setSpecialty] = useState("all");
  const [sortBy, setSortBy] = useState<KnowledgeSortBy>("updated");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(TABLE_PAGE_SIZE_DEFAULT);
  const [assignPaper, setAssignPaper] = useState<Paper | null>(null);
  const [deleteTask, setDeleteTask] = useState<ExamTask | null>(null);
  const [removedIds, setRemovedIds] = useState<string[]>([]);

  const allTasks = useMemo(
    () => (tasksQuery.data ?? []).filter((task) => !removedIds.includes(task.id)),
    [removedIds, tasksQuery.data],
  );

  const specialtyOptions = useMemo(() => {
    const labels = [...new Set(allTasks.flatMap(taskSpecialtyLabels))].sort((a, b) =>
      a.localeCompare(b, "zh"),
    );
    return [
      { value: "all", label: "全部专业" },
      ...labels.map((value) => ({ value, label: value })),
    ];
  }, [allTasks]);

  const applyQuery = () => {
    setKeyword(draftKeyword);
    setStatus(draftStatus);
    setTimeRange(draftTimeRange);
    setGoal(draftGoal);
    setSpecialty(draftSpecialty);
    setPage(1);
  };

  const filtered = useMemo(() => {
    const normalized = keyword.trim().toLowerCase();
    const matched = allTasks.filter((task) => {
      if (status !== "all" && task.status !== status) return false;
      if (goal !== "all" && task.goal !== goal) return false;
      if (!taskMatchesSpecialty(task, specialty)) return false;
      if (timeRange !== "all") {
        const boundary = timeRange === "30d" ? "2026-05-20" : "2026-03-21";
        if ((task.startsAt ?? task.updatedAt).slice(0, 10) < boundary) return false;
      }
      if (!normalized) return true;
      return [task.name, task.goal, task.specialty, formatSpecialty(task), ...task.scope.teamNames]
        .join(" ")
        .toLowerCase()
        .includes(normalized);
    });
    return sortTasks(matched, sortBy);
  }, [allTasks, goal, keyword, specialty, sortBy, status, timeRange]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageRows = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  const clearFilters = () => {
    setDraftKeyword("");
    setDraftStatus("all");
    setDraftTimeRange("all");
    setDraftGoal("all");
    setDraftSpecialty("all");
    setKeyword("");
    setStatus("all");
    setTimeRange("all");
    setGoal("all");
    setSpecialty("all");
    setPage(1);
  };

  return (
    <PageShell>
      <AdminPageFrame>
        <PageHeader
          title="考试任务"
          subtitle="创建、下发并跟踪考试任务。历史趋势与跨考试对比请进入成绩分析。"
          size="md"
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
          <section
            className="overflow-hidden rounded-[12px] border border-kb-border bg-white"
            aria-label="考试任务列表"
          >
            <div className="flex flex-wrap items-center gap-2 border-b border-[#e8eef1] bg-[#FAFCFD] px-3.5 py-2.5">
              <form
                className="flex min-w-0 flex-1 flex-wrap items-center gap-2"
                onSubmit={(event) => {
                  event.preventDefault();
                  applyQuery();
                }}
              >
                <div className="flex h-9 min-w-[220px] max-w-[320px] flex-1 items-center gap-2 rounded-[8px] border border-border bg-card px-3 transition-colors focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/20">
                  <Search className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                  <input
                    value={draftKeyword}
                    onChange={(event) => setDraftKeyword(event.target.value)}
                    placeholder="搜索考试名称"
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
                  onChange={(value) => setDraftTimeRange(value as "all" | "30d" | "90d")}
                  placeholder="全部时间"
                  options={TIME_OPTIONS}
                />
                <KbFilterCombo
                  value={draftGoal}
                  onChange={setDraftGoal}
                  placeholder="全部目标"
                  options={GOAL_OPTIONS}
                />
                <KbFilterCombo
                  value={draftSpecialty}
                  onChange={setDraftSpecialty}
                  placeholder="全部专业"
                  options={specialtyOptions}
                />
                <button
                  type="submit"
                  className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-[8px] bg-primary px-3.5 text-[13px] font-medium text-white hover:bg-primary/90"
                >
                  <Search className="h-3.5 w-3.5" aria-hidden />
                  查询
                </button>
                <button
                  type="button"
                  onClick={clearFilters}
                  className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-[8px] border border-border bg-white px-3.5 text-[13px] text-muted-foreground hover:bg-muted"
                >
                  <RotateCcw className="h-3.5 w-3.5" aria-hidden />
                  重置
                </button>
              </form>
              <div className="ml-auto flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="inline-flex h-9 items-center gap-1.5 rounded-[8px] bg-primary px-3.5 text-[13px] font-medium text-white hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
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
                <FileListRefreshButton
                  onClick={() => {
                    void tasksQuery.refetch();
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
              <div className="grid min-h-56 place-items-center px-6 text-center">
                <div>
                  <h2 className="text-[14px] font-medium text-kb-heading">
                    没有符合条件的考试任务
                  </h2>
                  <p className="mt-1 text-[12px] text-kb-muted">
                    可以清空当前筛选，或创建新的考试任务。
                  </p>
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="mt-3 text-[12.5px] font-medium text-primary hover:text-primary/80"
                  >
                    清空筛选
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1220px] table-fixed text-left text-[13px]">
                    <thead className="bg-kb-table-head text-[11.5px] font-medium text-kb-muted">
                      <tr>
                        <th className="w-[18%] px-4 py-3 font-medium">考试名称</th>
                        <th className="w-[9%] px-3 py-3 font-medium">目标</th>
                        <th className="w-[12%] px-3 py-3 font-medium">专业</th>
                        <th className="w-[20%] min-w-[260px] px-3 py-3 font-medium">考试时间</th>
                        <th className="w-[8%] px-3 py-3 font-medium">状态</th>
                        <th className="w-[13%] px-3 py-3 font-medium">
                          <ColumnHint
                            label="完成进度"
                            tip="已提交人数占应参加人数的比例。未交卷人员仍计入分母。"
                          />
                        </th>
                        <th className="w-[9%] px-3 py-3 font-medium">通过率</th>
                        <th className="w-[8%] px-3 py-3 font-medium">更新时间</th>
                        <th className="w-[16%] min-w-[236px] px-4 py-3 text-right font-medium">
                          操作
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {pageRows.map((task) => (
                        <ExamTaskRow
                          key={task.id}
                          task={task}
                          onAssign={() =>
                            setAssignPaper(
                              PAPERS.find((paper) => paper.id === task.paperId) ?? null,
                            )
                          }
                          onDelete={() => setDeleteTask(task)}
                        />
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
                  onPageSizeChange={setPageSize}
                />
              </>
            )}
          </section>
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

function useHoverMenu(closeDelay = 160) {
  const [open, setOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = () => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  };
  const openNow = () => {
    clearTimer();
    setOpen(true);
  };
  const closeSoon = () => {
    clearTimer();
    timer.current = setTimeout(() => setOpen(false), closeDelay);
  };

  return {
    open,
    setOpen,
    hoverProps: { onMouseEnter: openNow, onMouseLeave: closeSoon },
  };
}

type TaskAction = {
  key: string;
  label: string;
  icon: LucideIcon;
  tone?: "primary" | "muted" | "danger";
  disabled?: boolean;
  onClick: () => void;
};

function splitRowActions(actions: TaskAction[]) {
  if (actions.length <= 3) {
    return { visible: actions, overflow: [] as TaskAction[] };
  }
  return { visible: actions.slice(0, 2), overflow: actions.slice(2) };
}

function TaskActionButton({ action }: { action: TaskAction }) {
  const Icon = action.icon;
  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        action.onClick();
      }}
      disabled={action.disabled}
      className={cn(
        "inline-flex items-center justify-end gap-1 whitespace-nowrap px-0.5 py-0.5 text-[12px] transition-colors disabled:cursor-not-allowed disabled:opacity-45",
        action.tone === "primary"
          ? "font-medium text-primary hover:text-primary/80"
          : action.tone === "danger"
            ? "text-destructive hover:text-destructive/80"
            : "text-muted-foreground hover:text-primary",
      )}
    >
      <Icon className="h-3.5 w-3.5 shrink-0 stroke-[1.8]" />
      <span className="whitespace-nowrap">{action.label}</span>
    </button>
  );
}

function ColumnHint({ label, tip }: { label: string; tip: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      {label}
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            aria-label={`${label}说明`}
            className="inline-flex h-6 w-6 items-center justify-center rounded-full text-kb-muted hover:bg-kb-surface hover:text-kb-heading focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25"
          >
            <Info className="h-3 w-3" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-[260px] text-left font-normal leading-relaxed">
          {tip}
        </TooltipContent>
      </Tooltip>
    </span>
  );
}

function CompletionProgress({
  submittedCount,
  assignedCount,
}: {
  submittedCount: number;
  assignedCount: number;
}) {
  if (assignedCount <= 0) {
    return <span className="text-kb-muted">—</span>;
  }
  const remaining = Math.max(0, assignedCount - submittedCount);
  return (
    <div className="text-[12.5px] leading-5 text-kb-body">
      <div>
        已提交{" "}
        <span className="font-medium tabular-nums text-kb-heading">{submittedCount}</span> 人
      </div>
      <div className="text-[11.5px] text-kb-muted">
        {remaining === 0 ? "已全部交卷" : `未交 ${remaining} 人`}
      </div>
    </div>
  );
}

function passRateTone(rate: number) {
  if (rate >= 80) return "bg-success-soft text-success";
  if (rate >= 60) return "bg-warning-soft text-warning-foreground";
  return "bg-destructive/10 text-destructive";
}

function PassRateValue({ rate }: { rate: number | null }) {
  if (rate == null) {
    return <span className="text-kb-muted">—</span>;
  }
  return (
    <span
      className={cn(
        "inline-flex rounded-[5px] px-2 py-0.5 text-[12px] font-medium tabular-nums",
        passRateTone(rate),
      )}
    >
      {formatPercent(rate)}
    </span>
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
  const navigate = useNavigate();
  const { open, setOpen, hoverProps } = useHoverMenu();
  const preview = {
    key: "preview",
    label: "预览试卷",
    icon: Eye,
    onClick: () =>
      navigate({ to: "/exam-admin/paper/$paperId/preview", params: { paperId: task.paperId } }),
  } satisfies TaskAction;

  const openDetail = () => {
    if (task.status === "draft") {
      navigate({
        to: "/exam-admin/paper/$paperId/edit",
        params: { paperId: task.paperId },
      });
      return;
    }
    navigate({ to: "/exam-admin/exam/$examId", params: { examId: task.id } });
  };

  const actions: TaskAction[] =
    task.status === "draft"
      ? [
          {
            key: "edit",
            label: "继续编辑",
            icon: PencilLine,
            tone: "primary",
            onClick: openDetail,
          },
          preview,
          { key: "assign", label: "下发考试", icon: Send, onClick: onAssign },
          {
            key: "delete",
            label: "删除草稿",
            icon: Trash2,
            tone: "danger",
            onClick: onDelete,
          },
        ]
      : [
          {
            key: "view",
            label:
              task.status === "inProgress"
                ? "查看进度"
                : task.status === "ended"
                  ? "查看结果"
                  : "查看详情",
            icon: FileText,
            tone: "primary",
            onClick: openDetail,
          },
          preview,
        ];

  const { visible, overflow } = splitRowActions(actions);

  return (
    <tr
      className="cursor-pointer border-t border-divider align-middle transition-colors hover:bg-kb-surface/45"
      onClick={openDetail}
    >
      <td className="px-4 py-3.5">
        <div className="line-clamp-2 leading-5 text-kb-heading">{task.name}</div>
      </td>
      <td className="px-3 py-3.5 text-[12.5px] text-kb-body">{task.goal || "—"}</td>
      <td className="px-3 py-3.5 text-[12.5px] text-kb-body">{formatSpecialty(task)}</td>
      <td className="whitespace-nowrap px-3 py-3.5 text-[12px] tabular-nums text-kb-body">
        {formatDateRange(task.startsAt, task.endsAt)}
      </td>
      <td className="px-3 py-3.5">
        <ExamTaskStatusTag status={task.status} />
      </td>
      <td className="px-3 py-3.5">
        <CompletionProgress
          submittedCount={task.submittedCount}
          assignedCount={task.scope.assignedCount}
        />
      </td>
      <td className="px-3 py-3.5">
        <PassRateValue rate={task.passRate} />
      </td>
      <td className="px-3 py-3.5 text-[12px] tabular-nums text-kb-body">
        {task.updatedAt.slice(0, 10)}
      </td>
      <td
        className="min-w-[236px] px-4 py-3.5 text-right"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="ml-auto grid w-fit grid-cols-[minmax(0,6.5rem)_minmax(0,6.5rem)_minmax(0,2rem)] items-center justify-items-end gap-x-3">
          {visible.map((action) => (
            <TaskActionButton key={action.key} action={action} />
          ))}
          {overflow.length > 0 ? (
            <DropdownMenu open={open} onOpenChange={setOpen} modal={false}>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  aria-label={`${task.name}更多操作`}
                  {...hoverProps}
                  className="inline-flex items-center justify-end whitespace-nowrap px-0.5 py-0.5 text-[12px] text-muted-foreground transition-colors hover:text-primary data-[state=open]:text-primary"
                >
                  更多
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="min-w-[140px]"
                onCloseAutoFocus={(event) => event.preventDefault()}
                {...hoverProps}
              >
                {overflow.map((action, index) => {
                  const Icon = action.icon;
                  return (
                    <Fragment key={action.key}>
                      {action.tone === "danger" && index > 0 ? <DropdownMenuSeparator /> : null}
                      <DropdownMenuItem
                        className={cn(
                          "text-[12.5px]",
                          action.tone === "danger" && "text-destructive focus:text-destructive",
                        )}
                        disabled={action.disabled}
                        onClick={action.onClick}
                      >
                        <Icon className="h-3.5 w-3.5 stroke-[1.8]" />
                        {action.label}
                      </DropdownMenuItem>
                    </Fragment>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <span aria-hidden className="block h-5" />
          )}
        </div>
      </td>
    </tr>
  );
}

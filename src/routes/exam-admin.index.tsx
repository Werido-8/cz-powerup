import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  Activity,
  ArrowUpRight,
  CalendarClock,
  CircleCheck,
  ChevronDown,
  FileText,
  PencilLine,
  Plus,
  Sparkles,
  Users,
} from "lucide-react";
import { PageShell } from "@/components/workbench/PageShell";
import { ExamSplitView } from "@/components/exam/exam-split-view";
import { AssignDialog } from "@/components/exam/exam-dialogs";
import { PageHeader, ModulePanel } from "@/components/learning/ui";
import { EXAM_ADMIN_STATS, type Paper } from "@/lib/mock/examAdmin";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const Route = createFileRoute("/exam-admin/")({
  component: ExamAdminPage,
  head: () => ({
    meta: [
      { title: "考试管理 · 涉网运行 AI 训练平台" },
      { name: "description", content: "智能组卷、试卷下发、成绩跟踪与答题分析。" },
    ],
  }),
});

function ExamCommandSummary() {
  const valueOf = (key: string, fallback: string) =>
    EXAM_ADMIN_STATS.find((item) => item.key === key)?.value ?? fallback;

  return (
    <section className="mb-4 grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(400px,.85fr)]">
      <article className="relative overflow-hidden rounded-[20px] border border-kb-border bg-white p-5 shadow-[0_12px_34px_rgba(25,69,78,0.045)] md:p-6">
        <div className="pointer-events-none absolute right-0 top-0 h-full w-[38%] bg-[radial-gradient(circle_at_78%_36%,rgba(52,155,172,.11),transparent_58%)]" />
        <div className="pointer-events-none absolute right-10 top-7 h-28 w-28 rounded-full border border-dashed border-primary/18" />
        <span className="pointer-events-none absolute right-[102px] top-[58px] h-3 w-3 rounded-full bg-primary/25" />
        <span className="pointer-events-none absolute right-[52px] top-[104px] h-2 w-2 rounded-full bg-[#e2a153]/55" />

        <div className="relative flex flex-wrap items-start justify-between gap-5">
          <div>
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-primary">
              <Activity className="h-3.5 w-3.5" /> Exam operations
            </div>
            <h2 className="mt-2 text-[21px] font-semibold text-kb-heading">考试运行态势</h2>
            <p className="mt-1 text-[12px] text-kb-muted">
              当前 8 场考试正在执行，2 场需要关注完成进度。
            </p>
          </div>
          <span className="rounded-full border border-[#e8d5be] bg-[#fff9f0] px-3 py-1.5 text-[11px] font-medium text-[#a7621d]">
            2 项待跟进
          </span>
        </div>

        <div className="relative mt-6 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            className="group flex min-h-[76px] items-center gap-3 rounded-[14px] border border-kb-border bg-[#fbfcfc] px-4 text-left transition hover:border-primary/30 hover:bg-white"
          >
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[11px] bg-[#fff2e3] text-[#ad651e]">
              <CalendarClock className="h-[18px] w-[18px]" />
            </span>
            <span className="min-w-0 flex-1">
              <strong className="block truncate text-[13.5px] text-kb-heading">
                月度测评将在 2 小时后开始
              </strong>
              <span className="mt-1 block text-[11px] text-kb-muted">
                56 人待参加 · 已完成考前检查
              </span>
            </span>
            <ArrowUpRight className="h-4 w-4 text-kb-muted/50 group-hover:text-primary" />
          </button>
          <button
            type="button"
            className="group flex min-h-[76px] items-center gap-3 rounded-[14px] border border-kb-border bg-[#fbfcfc] px-4 text-left transition hover:border-primary/30 hover:bg-white"
          >
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[11px] bg-primary-soft text-primary">
              <Users className="h-[18px] w-[18px]" />
            </span>
            <span className="min-w-0 flex-1">
              <strong className="block truncate text-[13.5px] text-kb-heading">
                3 人尚未提交取证复习考试
              </strong>
              <span className="mt-1 block text-[11px] text-kb-muted">距离截止还有 1 天 6 小时</span>
            </span>
            <ArrowUpRight className="h-4 w-4 text-kb-muted/50 group-hover:text-primary" />
          </button>
        </div>
      </article>

      <article className="rounded-[20px] border border-kb-border bg-white p-5 md:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-kb-muted">
              Quality pulse
            </p>
            <h2 className="mt-1 text-[18px] font-semibold text-kb-heading">本月答题质量</h2>
          </div>
          <span className="grid h-10 w-10 place-items-center rounded-full bg-success-soft text-success">
            <CircleCheck className="h-[18px] w-[18px]" />
          </span>
        </div>
        <div className="mt-5 grid grid-cols-[minmax(0,1fr)_118px] items-end gap-5">
          <div>
            <div className="flex items-end gap-2">
              <strong className="text-[36px] leading-none text-kb-heading">
                {valueOf("correct", "77%")}
              </strong>
              <span className="pb-1 text-[11px] text-kb-muted">平均正确率</span>
            </div>
            <div className="mt-5 flex h-14 items-end gap-1.5" aria-label="近七次考试正确率趋势">
              {[48, 55, 51, 67, 62, 78, 72].map((height, index) => (
                <span
                  key={index}
                  className="flex-1 rounded-t-sm bg-primary/15 last:bg-primary"
                  style={{ height: `${height}%` }}
                />
              ))}
            </div>
          </div>
          <dl className="space-y-4 border-l border-divider pl-5">
            <div>
              <dt className="text-[10.5px] text-kb-muted">答题完成率</dt>
              <dd className="mt-1 text-[20px] font-semibold text-kb-heading">
                {valueOf("finish", "84%")}
              </dd>
            </div>
            <div>
              <dt className="text-[10.5px] text-kb-muted">累计参考</dt>
              <dd className="mt-1 text-[20px] font-semibold text-kb-heading">
                {valueOf("assigned", "323")}
              </dd>
            </div>
          </dl>
        </div>
      </article>
    </section>
  );
}

function ExamAdminPage() {
  const navigate = useNavigate();
  const [assignPaper, setAssignPaper] = useState<Paper | null>(null);

  return (
    <PageShell>
      <PageHeader
        title="考试任务"
        subtitle="创建并下发考试任务，跟踪参考进度、成绩与答题质量。"
        size="md"
        action={
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="inline-flex min-h-11 items-center gap-2 rounded-[10px] bg-primary px-5 text-[14px] font-semibold text-white hover:bg-primary/90"
              >
                <Plus className="h-4 w-4" /> 创建考试 <ChevronDown className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuItem
                onClick={() => navigate({ to: "/exam-admin/paper/new", search: { step: 1 } })}
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
                  navigate({ to: "/exam-admin/paper/new", search: { step: 1, source: "manual" } })
                }
              >
                <PencilLine className="mr-2 h-4 w-4" /> 手动组卷创建
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        }
      />

      <ExamCommandSummary />

      <ModulePanel>
        <div className="p-4">
          <ExamSplitView
            onEdit={(p) =>
              navigate({ to: "/exam-admin/paper/$paperId/edit", params: { paperId: p.id } })
            }
            onAssign={setAssignPaper}
            onPreview={(p) =>
              navigate({ to: "/exam-admin/paper/$paperId/preview", params: { paperId: p.id } })
            }
          />
        </div>
      </ModulePanel>

      <AssignDialog paper={assignPaper} onClose={() => setAssignPaper(null)} />
    </PageShell>
  );
}

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  ClipboardList,
  Clock,
  FileText,
  ListChecks,
  TrendingUp,
  Users,
} from "lucide-react";
import { PageShell } from "@/components/workbench/PageShell";
import { ExamSplitView } from "@/components/exam/exam-split-view";
import { AssignDialog } from "@/components/exam/exam-dialogs";
import { PageHeader, StatCard, ModulePanel } from "@/components/learning/ui";
import { EXAM_ADMIN_STATS, type Paper } from "@/lib/mock/examAdmin";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/exam-admin/")({
  component: ExamAdminPage,
  head: () => ({
    meta: [
      { title: "考试管理 · 涉网运行 AI 训练平台" },
      { name: "description", content: "智能组卷、试卷下发、成绩跟踪与答题分析。" },
    ],
  }),
});

const EXAM_STAT_ICONS: Record<string, React.ReactNode> = {
  papers: <ClipboardList className="h-[18px] w-[18px]" />,
  issued: <FileText className="h-[18px] w-[18px]" />,
  assigned: <Users className="h-[18px] w-[18px]" />,
  finish: <ListChecks className="h-[18px] w-[18px]" />,
  correct: <TrendingUp className="h-[18px] w-[18px]" />,
  time: <Clock className="h-[18px] w-[18px]" />,
};

function StatCards() {
  return (
    <section className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
      {EXAM_ADMIN_STATS.map((s, i) => (
        <StatCard
          key={s.key}
          label={s.label}
          value={s.value}
          hint={s.hint}
          icon={EXAM_STAT_ICONS[s.key]}
          tint={i}
          emphasis={s.tone === "warning" ? "remind" : s.tone === "success" ? "default" : "primary"}
        />
      ))}
    </section>
  );
}

function ExamAdminPage() {
  const navigate = useNavigate();
  const [assignPaper, setAssignPaper] = useState<Paper | null>(null);

  return (
    <PageShell>
      <PageHeader
        title="考试管理"
        subtitle="智能组卷、试卷下发、成绩跟踪与答题分析。"
        size="md"
      />

      <StatCards />

      <ModulePanel>
        <div className="p-4">
          <ExamSplitView
            onGenerate={() =>
              navigate({ to: "/exam-admin/paper/new", search: { step: 1, source: "ai" } })
            }
            onNew={() => navigate({ to: "/exam-admin/paper/new", search: { step: 1 } })}
            onEdit={(p) =>
              navigate({ to: "/exam-admin/paper/$paperId/edit", params: { paperId: p.id } })
            }
            onAssign={setAssignPaper}
            onPreview={(p) => toast.info(`预览：${p.name}（${p.questionCount} 题）`)}
          />
        </div>
      </ModulePanel>

      <AssignDialog paper={assignPaper} onClose={() => setAssignPaper(null)} />
    </PageShell>
  );
}

import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { ChevronLeft, Eye, Pencil, Send } from "lucide-react";
import { useState } from "react";
import { PageShell } from "@/components/workbench/PageShell";
import { PaperReadonlyList, PaperQuestionSummary, usePaperQuestionGroups } from "@/components/exam/paper-question-list";
import { AssignDialog } from "@/components/exam/exam-dialogs";
import {
  PaperPreviewSidebar,
  PAPER_SPLIT_PANEL_H,
  paperPreviewFromData,
} from "@/components/exam/paper-side-panel";
import { cn } from "@/lib/utils";
import { getPaperQuestionGroups, PAPERS } from "@/lib/mock/examAdmin";

export const Route = createFileRoute("/exam-admin/paper/$paperId/preview")({
  component: PaperPreviewPage,
  head: () => ({ meta: [{ title: "试卷预览 · 考试管理" }] }),
});

function PaperPreviewPage() {
  const { paperId } = Route.useParams();
  const navigate = useNavigate();
  const paper = PAPERS.find((p) => p.id === paperId);
  if (!paper) throw notFound();

  const seedGroups = getPaperQuestionGroups(paper.id);
  const { groups, summary } = usePaperQuestionGroups(seedGroups);
  const [assignPaper, setAssignPaper] = useState<typeof paper | null>(null);

  const previewProps = paperPreviewFromData(paper, groups);

  return (
    <PageShell compact>
      <div className="mb-3 flex shrink-0 flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <Link
            to="/exam-admin"
            className="inline-flex items-center gap-1 text-[12px] text-muted-foreground hover:text-primary"
          >
            <ChevronLeft className="h-3.5 w-3.5" /> 考试管理
          </Link>
          <span className="text-muted-foreground/40">/</span>
          <h1 className="flex min-w-0 items-center gap-2 truncate text-[16px] font-semibold">
            <Eye className="h-4 w-4 shrink-0 text-primary" />
            <span className="truncate">试卷预览 · {paper.name}</span>
          </h1>
        </div>
        <div className="flex shrink-0 gap-2">
          <Link
            to="/exam-admin"
            className="rounded-lg border border-border px-4 py-2 text-[13px] hover:bg-muted"
          >
            返回列表
          </Link>
          <Link
            to="/exam-admin/paper/$paperId/edit"
            params={{ paperId: paper.id }}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-[13px] font-medium hover:bg-muted"
          >
            <Pencil className="h-4 w-4" /> 编辑试卷
          </Link>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-stretch">
        <div className={cn("min-h-0 overflow-y-auto overscroll-contain pr-0.5", PAPER_SPLIT_PANEL_H)}>
          <div className="space-y-4 pb-2">
            <PaperQuestionSummary summary={summary} />
            <PaperReadonlyList groups={groups} />
          </div>
        </div>

        <PaperPreviewSidebar
          {...previewProps}
          footer={
            <div className="space-y-2">
              {paper.status === "草稿" ? (
                <button
                  type="button"
                  onClick={() => setAssignPaper(paper)}
                  className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 text-[13px] font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                >
                  <Send className="h-3.5 w-3.5" />
                  下发试卷
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setAssignPaper(paper)}
                  className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-primary/30 bg-primary-soft/40 px-4 py-2.5 text-[13px] font-semibold text-primary transition-colors hover:bg-primary-soft"
                >
                  <Send className="h-3.5 w-3.5" />
                  再次下发
                </button>
              )}
              <button
                type="button"
                onClick={() =>
                  navigate({ to: "/exam-admin/paper/$paperId/edit", params: { paperId: paper.id } })
                }
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-border px-4 py-2 text-[13px] font-medium hover:bg-muted"
              >
                <Pencil className="h-3.5 w-3.5" />
                编辑卷面
              </button>
            </div>
          }
        />
      </div>

      <AssignDialog paper={assignPaper} onClose={() => setAssignPaper(null)} showDraft={false} />
    </PageShell>
  );
}

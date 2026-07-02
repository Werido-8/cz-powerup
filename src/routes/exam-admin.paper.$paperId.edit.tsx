import { createFileRoute, notFound } from "@tanstack/react-router";
import { PAPERS } from "@/lib/mock/examAdmin";
import { ExamPaperEditorPage } from "@/components/exam/exam-paper-editor-page";

export const Route = createFileRoute("/exam-admin/paper/$paperId/edit")({
  component: EditPaperPage,
  head: () => ({ meta: [{ title: "编辑试卷 · 考试管理" }] }),
});

function EditPaperPage() {
  const { paperId } = Route.useParams();
  const paper = PAPERS.find((p) => p.id === paperId);
  if (!paper) throw notFound();

  return <ExamPaperEditorPage paper={paper} />;
}

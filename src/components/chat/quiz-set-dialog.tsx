import { Link } from "@tanstack/react-router";
import { BookOpen, ExternalLink, Loader2, Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { QUESTIONS, type Question, type QuestionType } from "@/lib/mock/data";
import type { QuizSet } from "@/lib/mock/learning-hub";

const TYPE_LABELS: Record<QuestionType, string> = {
  single: "单选题",
  multiple: "多选题",
  judge: "判断题",
  text: "简答题",
};

export function pickQuestionsForAnswer(
  docIds: string[],
  summary: string,
  count = 5,
): string[] {
  const pool = QUESTIONS.filter(
    (q) =>
      (q.relatedDocId && docIds.includes(q.relatedDocId)) ||
      q.knowledgePoints.some((k) => summary.includes(k)),
  );
  const source = pool.length > 0 ? pool : QUESTIONS;
  return source.slice(0, count).map((q) => q.id);
}

export function inferQuizFilter(questionIds: string[]): string {
  const first = questionIds
    .map((id) => QUESTIONS.find((q) => q.id === id))
    .find(Boolean);
  return first?.knowledgePoints[0] ?? "AGC";
}

export function buildQuizSetTitle(userQuestion: string, summary: string): string {
  const base = userQuestion.trim() || summary.slice(0, 24);
  return base.length > 20 ? `${base.slice(0, 20)}…专项练习` : `${base}专项练习`;
}

export function QuizSetDialog({
  open,
  onOpenChange,
  loading,
  quizSet,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loading: boolean;
  quizSet: QuizSet | null;
}) {
  const questions: Question[] = (quizSet?.questionIds ?? [])
    .map((id) => QUESTIONS.find((q) => q.id === id))
    .filter(Boolean) as Question[];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] max-w-2xl flex-col gap-0 overflow-hidden p-0">
        <DialogHeader className="border-b border-border px-6 py-4">
          <DialogTitle className="flex items-center gap-2 text-[16px]">
            <Sparkles className="h-5 w-5 text-primary" />
            {loading ? "正在生成题单" : quizSet?.title ?? "题单预览"}
          </DialogTitle>
          <DialogDescription className="text-[12.5px]">
            {loading
              ? "AI 正在根据对话内容与依据资料整理练习题，可关闭弹窗，生成完成后会在个人沉淀中显示。"
              : "基于当前对话生成的专项练习题单，可在个人沉淀中继续查看。"}
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="text-[14px] font-medium text-foreground">正在生成题单…</p>
              <p className="max-w-sm text-[12.5px] text-muted-foreground">
                通常需要 10–30 秒，关闭弹窗不影响后台生成
              </p>
            </div>
          ) : quizSet ? (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2 text-[12px] text-muted-foreground">
                <Badge variant="secondary">{quizSet.source}</Badge>
                <span>{quizSet.questionCount} 题</span>
                <span>·</span>
                <span>{quizSet.status}</span>
                <span>·</span>
                <span>{quizSet.createdAt}</span>
              </div>

              {quizSet.relatedChat && (
                <div className="rounded-lg border border-border bg-muted/30 px-3 py-2.5 text-[12.5px] text-muted-foreground">
                  关联对话：{quizSet.relatedChat}
                </div>
              )}

              <div className="space-y-2">
                {questions.map((q, idx) => (
                  <div
                    key={q.id}
                    className="rounded-lg border border-border bg-card px-4 py-3 text-[12.5px]"
                  >
                    <div className="flex items-start gap-2">
                      <span className="shrink-0 text-muted-foreground">{idx + 1}.</span>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium leading-snug">{q.stem}</p>
                        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                          <Badge variant="outline" className="font-normal">
                            {TYPE_LABELS[q.type]}
                          </Badge>
                          {q.knowledgePoints.slice(0, 2).map((k) => (
                            <Badge key={k} variant="secondary" className="font-normal">
                              {k}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        {!loading && quizSet && (
          <div className="flex items-center justify-end gap-2 border-t border-border px-6 py-3.5">
            <Link
              to="/assets"
              search={{ tab: "quizsets" }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-[13px] hover:bg-muted"
              onClick={() => onOpenChange(false)}
            >
              <ExternalLink className="h-4 w-4" />
              个人沉淀
            </Link>
            <Link
              to="/training/session/$id"
              params={{ id: quizSet.id }}
              search={{
                mode: "practice",
                filter: quizSet.filter,
                count: quizSet.questionCount,
                limit: 0,
              }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-[13px] font-medium text-primary-foreground hover:bg-primary/90"
              onClick={() => onOpenChange(false)}
            >
              <BookOpen className="h-4 w-4" />
              开始练习
            </Link>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

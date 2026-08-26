import { useEffect, useMemo, useState } from "react";
import { BookOpen, ChevronLeft, RotateCcw, Save } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
import { cn } from "@/lib/utils";
import type { Question, Topic } from "@/lib/mock/data";
import {
  clearTopicPracticeDraft,
  getTopicQuestions,
  loadTopicPracticeDraft,
  saveTopicPracticeDraft,
  type TopicQuestionItem,
} from "@/lib/mock/topic-practice";
import { useMockStore } from "@/lib/mock/store";

const TYPE_LABEL: Record<Question["type"], string> = {
  single: "单选题",
  multiple: "多选题",
  judge: "判断题",
  text: "简答题",
};

type Answers = Record<string, string | string[]>;

function isQuestionCorrect(question: Question, answer: string | string[] | undefined) {
  if (question.type === "text") return false;
  return Array.isArray(question.answer)
    ? Array.isArray(answer) && [...answer].sort().join() === [...question.answer].sort().join()
    : answer === question.answer;
}

export function TopicPracticeSheet({
  topic,
  open,
  onOpenChange,
  onSaved,
}: {
  topic: Topic;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: () => void;
}) {
  const items = useMemo(() => getTopicQuestions(topic), [topic]);
  const { addWrong, recordDocAnswers, startDocPractice } = useMockStore();
  const [answers, setAnswers] = useState<Answers>({});
  const [showRestartConfirm, setShowRestartConfirm] = useState(false);

  useEffect(() => {
    if (!open) return;
    const draft = loadTopicPracticeDraft(topic.id);
    setAnswers(draft?.answers ?? {});
    Array.from(new Set(items.map((item) => item.docId))).forEach((docId) =>
      startDocPractice(docId),
    );
  }, [items, open, startDocPractice, topic.id]);

  const answeredCount = items.filter((item) => {
    const a = answers[item.question.id];
    if (a === undefined) return false;
    if (Array.isArray(a)) return a.length > 0;
    return String(a).length > 0;
  }).length;

  const handleSave = () => {
    saveTopicPracticeDraft({
      topicId: topic.id,
      answers,
      currentIndex: 0,
      savedAt: new Date().toISOString(),
    });
    toast.success("练习进度已暂存，可稍后继续");
    onSaved?.();
  };

  const handleRestart = () => {
    clearTopicPracticeDraft(topic.id);
    setAnswers({});
    setShowRestartConfirm(false);
    toast.success("已清空练习记录，请重新开始");
    onSaved?.();
  };

  const handleSubmit = () => {
    const byDoc = new Map<string, { answeredIds: string[]; correctIds: string[] }>();

    items.forEach((item) => {
      const { docId, question } = item;
      const entry = byDoc.get(docId) ?? { answeredIds: [], correctIds: [] };
      entry.answeredIds.push(question.id);
      if (isQuestionCorrect(question, answers[question.id])) {
        entry.correctIds.push(question.id);
      } else if (question.type !== "text") {
        addWrong(question.id);
      }
      byDoc.set(docId, entry);
    });

    byDoc.forEach(({ answeredIds, correctIds }, docId) =>
      recordDocAnswers(docId, answeredIds, correctIds),
    );
    clearTopicPracticeDraft(topic.id);
    toast.success("练习已提交，已同步更新资料学习状态");
    onSaved?.();
    onOpenChange(false);
  };

  const grouped = useMemo(() => {
    const map = new Map<string, { docTitle: string; items: TopicQuestionItem[] }>();
    items.forEach((item) => {
      const g = map.get(item.docId) ?? { docTitle: item.docTitle, items: [] };
      g.items.push(item);
      map.set(item.docId, g);
    });
    return Array.from(map.entries());
  }, [items]);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="flex max-h-[min(92dvh,880px)] max-w-3xl flex-col gap-0 overflow-hidden p-0">
          <DialogHeader className="shrink-0 border-b border-divider px-5 py-4">
            <div className="flex flex-wrap items-center justify-between gap-3 pr-8">
              <div>
                <DialogTitle className="text-left text-[16px]">
                  {topic.title} · 专题练习
                </DialogTitle>
                <p className="mt-1 text-left text-[12px] text-muted-foreground">
                  汇总本专题 {items.length} 道题 · 已作答 {answeredCount} 题
                </p>
                <p className="mt-1 text-left text-[11px] text-muted-foreground">
                  关联客观题全部答对会自动标记资料已学习；简答题资料可手动标记。
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setShowRestartConfirm(true)}
                  className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1.5 text-[12px] hover:bg-muted"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  重新练习
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  className="inline-flex items-center gap-1 rounded-md border border-primary/30 bg-primary-soft/50 px-2.5 py-1.5 text-[12px] text-primary"
                >
                  <Save className="h-3.5 w-3.5" />
                  暂存练习
                </button>
              </div>
            </div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{
                  width: items.length ? `${(answeredCount / items.length) * 100}%` : "0%",
                }}
              />
            </div>
          </DialogHeader>

          <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto bg-muted/10 px-5 py-4">
            {grouped.map(([docId, group]) => (
              <section key={docId} className="mb-6 last:mb-0">
                <div className="mb-3 flex items-center gap-2 border-b border-divider pb-2">
                  <BookOpen className="h-4 w-4 text-primary" />
                  <h3 className="text-[13px] font-semibold text-foreground">{group.docTitle}</h3>
                  <span className="text-[11px] text-muted-foreground">{group.items.length} 题</span>
                </div>
                <div className="space-y-4">
                  {group.items.map((item) => (
                    <PaperQuestionBlock
                      key={item.question.id}
                      item={item}
                      answer={answers[item.question.id]}
                      onChange={(val) =>
                        setAnswers((prev) => ({ ...prev, [item.question.id]: val }))
                      }
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>

          <div className="flex shrink-0 items-center justify-between border-t border-divider bg-card px-5 py-3">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="inline-flex items-center gap-1 text-[12.5px] text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="h-4 w-4" />
              返回专题
            </button>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleSave}
                className="rounded-md border border-border px-3 py-1.5 text-[12.5px] hover:bg-muted"
              >
                暂存后继续
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                className="rounded-md bg-primary px-4 py-1.5 text-[12.5px] font-medium text-primary-foreground hover:bg-primary/90"
              >
                提交练习
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showRestartConfirm} onOpenChange={setShowRestartConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认重新练习？</AlertDialogTitle>
            <AlertDialogDescription>
              重新练习将清空当前专题的所有作答记录与暂存进度，此操作不可恢复。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleRestart}>确认清空</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function PaperQuestionBlock({
  item,
  answer,
  onChange,
}: {
  item: TopicQuestionItem;
  answer?: string | string[];
  onChange: (val: string | string[]) => void;
}) {
  const { question, globalIndex } = item;
  const isMulti = question.type === "multiple";
  const isJudge = question.type === "judge";
  const isText = question.type === "text";

  const options =
    question.options ??
    (isJudge
      ? [
          { key: "T", label: "正确" },
          { key: "F", label: "错误" },
        ]
      : []);

  const selectedKeys = Array.isArray(answer)
    ? answer
    : answer
      ? isMulti
        ? answer.split("")
        : [answer]
      : [];

  const toggle = (key: string) => {
    if (isMulti) {
      const next = selectedKeys.includes(key)
        ? selectedKeys.filter((k) => k !== key)
        : [...selectedKeys, key];
      onChange(next);
    } else {
      onChange(key);
    }
  };

  return (
    <article className="rounded-lg border border-border bg-card p-4 shadow-[var(--shadow-card)]">
      <div className="mb-3 flex items-start gap-2">
        <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-primary-soft text-[11px] font-bold text-primary">
          {globalIndex}
        </span>
        <div className="min-w-0 flex-1">
          <span className="mb-1 inline-block rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
            {TYPE_LABEL[question.type]}
          </span>
          <p className="text-[13.5px] font-medium leading-snug text-foreground">{question.stem}</p>
        </div>
      </div>

      {isText ? (
        <textarea
          value={typeof answer === "string" ? answer : ""}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          placeholder="请输入你的答案…"
          className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-[13px] outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      ) : (
        <ul className="space-y-1.5">
          {options.map((opt) => {
            const active = selectedKeys.includes(opt.key);
            return (
              <li key={opt.key}>
                <button
                  type="button"
                  onClick={() => toggle(opt.key)}
                  className={cn(
                    "flex w-full items-start gap-3 rounded-md border px-3 py-2.5 text-left text-[13px] transition-colors",
                    active
                      ? "border-primary/40 bg-primary-soft/40"
                      : "border-divider bg-muted/15 hover:border-primary/25",
                  )}
                >
                  <span
                    className={cn(
                      "mt-0.5 grid h-4 w-4 shrink-0 place-items-center border text-[10px] font-semibold",
                      isMulti ? "rounded-[3px]" : "rounded-full",
                      active
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background text-muted-foreground",
                    )}
                  >
                    {opt.key}
                  </span>
                  <span className="leading-snug text-foreground">{opt.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </article>
  );
}

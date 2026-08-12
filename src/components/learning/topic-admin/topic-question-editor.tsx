import { useMemo, useState } from "react";
import {
  BookOpen,
  ChevronRight,
  FileText,
  LayoutGrid,
  List,
  Loader2,
  Pencil,
  Plus,
  Sparkles,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { DOCS, QUESTIONS, type Question } from "@/lib/mock/data";
import type { EditableTopicQuestion, TopicDocQuestion } from "@/lib/mock/topicAdmin";
import { listActionClass } from "@/components/learning/ui";

type ViewMode = "list" | "paper";

const TYPE_LABEL: Record<EditableTopicQuestion["type"], string> = {
  single: "单选",
  multiple: "多选",
  judge: "判断",
  text: "简答",
};

function nextOptionKey(options: { key: string }[]) {
  const used = new Set(options.map((o) => o.key));
  for (let i = 0; i < 26; i++) {
    const key = String.fromCharCode(65 + i);
    if (!used.has(key)) return key;
  }
  return `O${options.length + 1}`;
}

function questionFromBank(q: Question): EditableTopicQuestion {
  return {
    id: q.id,
    type: q.type,
    stem: q.stem,
    options: q.options?.map((o) => ({ ...o })),
    answer: Array.isArray(q.answer) ? [...q.answer] : q.answer,
    analysis: q.analysis,
    relatedDocId: q.relatedDocId ?? "",
    confirmed: false,
  };
}

function createMockQuestion(id: string, docId: string, index: number): EditableTopicQuestion {
  const doc = DOCS.find((d) => d.id === docId);
  const title = doc?.title ?? "学习资料";
  const isMulti = index % 3 === 1;
  const isJudge = index % 3 === 2;
  if (isJudge) {
    return {
      id,
      type: "judge",
      stem: `阅读《${title}》后判断：下列说法是否正确。（第 ${index + 1} 题）`,
      answer: "T",
      analysis: "请根据资料内容核对判断依据。",
      relatedDocId: docId,
      confirmed: false,
    };
  }
  const options = isMulti
    ? [
        { key: "A", label: "符合规程要求的做法" },
        { key: "B", label: "需要现场复核的要点" },
        { key: "C", label: "常见误操作风险点" },
        { key: "D", label: "与调度协调的注意事项" },
      ]
    : [
        { key: "A", label: "按调度指令执行" },
        { key: "B", label: "先汇报后操作" },
        { key: "C", label: "核对设备名称编号" },
        { key: "D", label: "以上均是" },
      ];
  return {
    id,
    type: isMulti ? "multiple" : "single",
    stem: isMulti
      ? `根据《${title}》，下列做法正确的有（多选）：`
      : `根据《${title}》，现场处置的首项应为：`,
    options,
    answer: isMulti ? ["A", "B", "D"] : "D",
    analysis: "本题考查资料中的关键操作要点。",
    relatedDocId: docId,
    confirmed: false,
  };
}

export function resolveTopicQuestion(
  qid: string,
  edits: Record<string, EditableTopicQuestion> | undefined,
  docId: string,
  index: number,
): EditableTopicQuestion {
  if (edits?.[qid]) return edits[qid];
  const bank = QUESTIONS.find((q) => q.id === qid);
  if (bank) return questionFromBank(bank);
  return createMockQuestion(qid, docId, index);
}

function QuestionEditForm({
  question,
  onChange,
  variant = "dialog",
}: {
  question: EditableTopicQuestion;
  onChange: (q: EditableTopicQuestion) => void;
  variant?: "dialog" | "paper";
}) {
  const paper = variant === "paper";
  const hasOptions = question.type === "single" || question.type === "multiple";
  const isJudge = question.type === "judge";
  const isMulti = question.type === "multiple";

  const options =
    question.options ??
    (isJudge
      ? [
          { key: "T", label: "正确" },
          { key: "F", label: "错误" },
        ]
      : []);

  const updateOption = (key: string, label: string) => {
    onChange({
      ...question,
      options: options.map((o) => (o.key === key ? { ...o, label } : o)),
    });
  };

  const addOption = () => {
    if (!isMulti) return;
    const key = nextOptionKey(options);
    onChange({
      ...question,
      options: [...options, { key, label: "" }],
    });
  };

  const removeOption = (key: string) => {
    if (!isMulti || options.length <= 2) return;
    const nextOptions = options.filter((o) => o.key !== key);
    const nextAnswer = Array.isArray(question.answer)
      ? question.answer.filter((a) => a !== key)
      : question.answer;
    onChange({ ...question, options: nextOptions, answer: nextAnswer });
  };

  const toggleAnswer = (key: string) => {
    if (isMulti) {
      const current = Array.isArray(question.answer) ? question.answer : [];
      const next = current.includes(key) ? current.filter((k) => k !== key) : [...current, key];
      onChange({ ...question, answer: next });
    } else {
      onChange({ ...question, answer: key });
    }
  };

  const answerKeys = Array.isArray(question.answer)
    ? question.answer
    : question.answer
      ? question.answer.split("")
      : [];

  return (
    <div className={cn("space-y-4", paper && "space-y-5")}>
      <div>
        <label
          className={cn(
            "mb-1.5 block text-[12px] font-medium text-muted-foreground",
            paper && "text-[11px] tracking-wide",
          )}
        >
          题干
        </label>
        <textarea
          value={question.stem}
          onChange={(e) => onChange({ ...question, stem: e.target.value })}
          rows={paper ? 2 : 3}
          className={cn(
            "w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-[13px] outline-none focus-visible:ring-2 focus-visible:ring-ring",
            paper &&
              "min-h-[68px] border-kb-border bg-[#fbfcfc] px-4 py-3 text-[14px] font-medium leading-6 text-kb-heading focus-visible:border-primary focus-visible:ring-primary/15",
          )}
        />
      </div>

      {(hasOptions || isJudge) && (
        <div>
          <div className="mb-2 flex items-center justify-between">
            <label className="text-[12px] font-medium text-muted-foreground">
              选项{isMulti ? "（可多选为答案）" : "（点击设为答案）"}
            </label>
            {isMulti && (
              <button
                type="button"
                onClick={addOption}
                className="inline-flex items-center gap-1 text-[11.5px] text-primary hover:underline"
              >
                <Plus className="h-3 w-3" />
                增加选项
              </button>
            )}
          </div>
          <ul className={cn("space-y-2", paper && "space-y-1.5")}>
            {options.map((opt) => {
              const isAnswer = answerKeys.includes(opt.key);
              return (
                <li key={opt.key} className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => toggleAnswer(opt.key)}
                    className={cn(
                      "grid h-5 w-5 shrink-0 place-items-center border text-[10px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25",
                      isMulti ? "rounded-[3px]" : "rounded-full",
                      isAnswer
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-background text-muted-foreground hover:border-primary/40",
                    )}
                    title="设为答案"
                  >
                    {opt.key}
                  </button>
                  <Input
                    value={opt.label}
                    onChange={(e) => updateOption(opt.key, e.target.value)}
                    className={cn(
                      "h-8 flex-1 text-[12.5px]",
                      paper &&
                        "h-10 border-transparent bg-[#f4f8f9] px-3 text-[13px] shadow-none hover:border-primary/20 focus-visible:border-primary/35 focus-visible:bg-white",
                    )}
                    placeholder={`选项 ${opt.key}`}
                  />
                  {isMulti && options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeOption(opt.key)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <div className={cn(paper && "border-t border-dashed border-divider pt-4")}>
        <label className="mb-1.5 block text-[12px] font-medium text-muted-foreground">解析</label>
        <textarea
          value={question.analysis}
          onChange={(e) => onChange({ ...question, analysis: e.target.value })}
          rows={2}
          className={cn(
            "w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-[12.5px] text-muted-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring",
            paper &&
              "min-h-[56px] border-transparent bg-primary-soft/20 px-4 py-2.5 leading-5 focus-visible:border-primary/25 focus-visible:bg-white focus-visible:ring-primary/10",
          )}
        />
      </div>
    </div>
  );
}

function QuestionListRow({
  index,
  question,
  onClick,
}: {
  index: number;
  question: EditableTopicQuestion;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex w-full items-start gap-3 rounded-lg border border-divider bg-muted/15 px-3 py-2.5 text-left transition-colors hover:border-primary/30 hover:bg-primary-soft/20"
    >
      <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-md bg-muted text-[11px] font-semibold tabular-nums text-muted-foreground group-hover:bg-primary-soft group-hover:text-primary">
        {index}
      </span>
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex flex-wrap items-center gap-2">
          <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
            {TYPE_LABEL[question.type]}
          </span>
          {question.confirmed && <span className="text-[10px] text-success">已确认</span>}
        </div>
        <p className="line-clamp-2 text-[13px] leading-snug text-foreground">{question.stem}</p>
      </div>
      <Pencil className="mt-1 h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
    </button>
  );
}

function PaperQuestionBlock({
  index,
  question,
  onChange,
}: {
  index: number;
  question: EditableTopicQuestion;
  onChange: (q: EditableTopicQuestion) => void;
}) {
  return (
    <article className="px-5 py-5 sm:px-6">
      <div className="mb-4 flex items-center gap-2.5">
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary text-[11px] font-semibold tabular-nums text-white">
          {String(index).padStart(2, "0")}
        </span>
        <span className="rounded-[4px] bg-kb-surface px-2 py-1 text-[10.5px] font-medium text-kb-muted">
          {TYPE_LABEL[question.type]}
        </span>
        <span
          className={cn(
            "ml-auto text-[10.5px]",
            question.confirmed ? "text-success" : "text-kb-muted",
          )}
        >
          {question.confirmed ? "已确认" : "待确认"}
        </span>
      </div>
      <QuestionEditForm question={question} onChange={onChange} variant="paper" />
    </article>
  );
}

export function TopicQuestionEditorPanel({
  docIds,
  docQuestions,
  questionEdits = {},
  aiLoading,
  onUpdate,
  onGenerate,
}: {
  docIds: string[];
  docQuestions: TopicDocQuestion[];
  questionEdits?: Record<string, EditableTopicQuestion>;
  aiLoading: boolean;
  onUpdate: (patch: {
    docQuestions?: TopicDocQuestion[];
    questionEdits?: Record<string, EditableTopicQuestion>;
  }) => void;
  onGenerate: (docId: string) => void;
}) {
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [dialogDraft, setDialogDraft] = useState<EditableTopicQuestion | null>(null);

  const allQuestions = useMemo(() => {
    const items: {
      docId: string;
      docTitle: string;
      question: EditableTopicQuestion;
      globalIndex: number;
    }[] = [];
    let n = 0;
    docIds.forEach((docId) => {
      const doc = DOCS.find((d) => d.id === docId);
      const dq = docQuestions.find((d) => d.docId === docId);
      (dq?.questionIds ?? []).forEach((qid, i) => {
        n += 1;
        items.push({
          docId,
          docTitle: doc?.title ?? docId,
          question: resolveTopicQuestion(qid, questionEdits, docId, i),
          globalIndex: n,
        });
      });
    });
    return items;
  }, [docIds, docQuestions, questionEdits]);

  const openEditDialog = (question: EditableTopicQuestion) => {
    setEditingId(question.id);
    setDialogDraft({ ...question });
  };

  const saveQuestionEdit = (q: EditableTopicQuestion) => {
    onUpdate({
      questionEdits: { ...questionEdits, [q.id]: q },
    });
  };

  const confirmDocQuestions = (docId: string) => {
    const dq = docQuestions.find((d) => d.docId === docId);
    if (!dq?.questionIds.length) return;
    const nextEdits = { ...questionEdits };
    dq.questionIds.forEach((qid, i) => {
      const q = resolveTopicQuestion(qid, questionEdits, docId, i);
      nextEdits[qid] = { ...q, confirmed: true };
    });
    onUpdate({
      docQuestions: docQuestions.map((d) => (d.docId === docId ? { ...d, confirmed: true } : d)),
      questionEdits: nextEdits,
    });
    toast.success("该资料下题目已全部确认");
  };

  const totalCount = allQuestions.length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[13px] text-muted-foreground">
          题目绑定到文档级，共 <strong className="text-foreground">{totalCount}</strong> 道题
        </p>
        <div className="flex items-center gap-1 rounded-md border border-border bg-card p-0.5">
          <button
            type="button"
            onClick={() => setViewMode("list")}
            className={cn(
              "inline-flex items-center gap-1 rounded-[3px] px-2.5 py-1 text-[11.5px] transition-colors",
              viewMode === "list"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted",
            )}
          >
            <List className="h-3.5 w-3.5" />
            列表模式
          </button>
          <button
            type="button"
            onClick={() => setViewMode("paper")}
            className={cn(
              "inline-flex items-center gap-1 rounded-[3px] px-2.5 py-1 text-[11.5px] transition-colors",
              viewMode === "paper"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted",
            )}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            卷面模式
          </button>
        </div>
      </div>

      {docIds.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border py-10 text-center text-[13px] text-muted-foreground">
          请先在「选择资料」步骤中添加学习资料
        </div>
      ) : viewMode === "list" ? (
        <div className="space-y-4">
          {docIds.map((docId) => {
            const doc = DOCS.find((d) => d.id === docId);
            const dq = docQuestions.find((d) => d.docId === docId);
            const docItems = allQuestions.filter((item) => item.docId === docId);

            return (
              <section key={docId} className="rounded-lg border border-divider p-4">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <BookOpen className="h-4 w-4 shrink-0 text-primary" />
                    <span className="truncate text-[13.5px] font-medium">
                      {doc?.title ?? docId}
                    </span>
                    <span className="shrink-0 text-[11px] text-muted-foreground">
                      {docItems.length} 道题
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => onGenerate(docId)}
                      disabled={aiLoading}
                      className="inline-flex items-center gap-1 rounded-md border border-primary/30 px-2.5 py-1 text-[11.5px] text-primary"
                    >
                      {aiLoading ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Sparkles className="h-3 w-3" />
                      )}
                      {dq?.generated ? "重新生成" : "AI 生成题目"}
                    </button>
                    {docItems.length > 0 && (
                      <button
                        type="button"
                        onClick={() => confirmDocQuestions(docId)}
                        className={cn(
                          "rounded-md px-2.5 py-1 text-[11.5px]",
                          dq?.confirmed
                            ? "bg-success-soft text-success"
                            : "border border-border hover:bg-muted",
                        )}
                      >
                        {dq?.confirmed ? "已确认" : "确认全部"}
                      </button>
                    )}
                  </div>
                </div>

                {docItems.length === 0 ? (
                  <p className="text-[12px] text-muted-foreground">
                    尚未生成题目，点击「AI 生成题目」或从其他资料复用
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {docItems.map((item) => (
                      <li key={item.question.id}>
                        <QuestionListRow
                          index={item.globalIndex}
                          question={item.question}
                          onClick={() => openEditDialog(item.question)}
                        />
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            );
          })}
        </div>
      ) : (
        <div className="space-y-5">
          {docIds.map((docId) => {
            const doc = DOCS.find((d) => d.id === docId);
            const dq = docQuestions.find((d) => d.docId === docId);
            const docItems = allQuestions.filter((item) => item.docId === docId);

            return (
              <section
                key={docId}
                className="overflow-hidden rounded-[12px] border border-kb-border bg-white shadow-[0_12px_30px_rgba(22,74,84,0.04)]"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-kb-border bg-[#f8fafb] px-5 py-3.5 sm:px-6">
                  <div className="flex items-center gap-2">
                    <span className="h-5 w-1 rounded-full bg-primary" aria-hidden="true" />
                    <FileText className="h-4 w-4 text-primary" />
                    <h3 className="text-[14px] font-semibold text-kb-heading">
                      {doc?.title ?? docId}
                    </h3>
                    <span className="text-[11px] text-kb-muted">共 {docItems.length} 题</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => onGenerate(docId)}
                      disabled={aiLoading}
                      className={listActionClass("outline")}
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      {dq?.generated ? "重新生成" : "AI 生成"}
                    </button>
                    {docItems.length > 0 && (
                      <button
                        type="button"
                        onClick={() => confirmDocQuestions(docId)}
                        className={listActionClass(dq?.confirmed ? "soft" : "outline")}
                      >
                        {dq?.confirmed ? "已确认" : "确认全部"}
                        <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {docItems.length === 0 ? (
                  <p className="py-6 text-center text-[12px] text-muted-foreground">暂无题目</p>
                ) : (
                  <div className="divide-y divide-divider">
                    {docItems.map((item) => (
                      <PaperQuestionBlock
                        key={item.question.id}
                        index={item.globalIndex}
                        question={item.question}
                        onChange={(q) => saveQuestionEdit(q)}
                      />
                    ))}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}

      <Dialog
        open={!!editingId && !!dialogDraft}
        onOpenChange={(open) => {
          if (!open) {
            setEditingId(null);
            setDialogDraft(null);
          }
        }}
      >
        <DialogContent className="max-w-xl gap-0 overflow-y-auto p-0 sm:max-h-[min(90dvh,720px)]">
          <DialogHeader className="border-b border-divider px-5 py-4">
            <DialogTitle className="text-[16px]">编辑题目</DialogTitle>
            {dialogDraft && (
              <p className="text-left text-[12px] text-muted-foreground">
                {TYPE_LABEL[dialogDraft.type]}
                {dialogDraft.confirmed ? " · 已确认" : " · 待确认"}
              </p>
            )}
          </DialogHeader>
          {dialogDraft && (
            <div className="px-5 py-4">
              <QuestionEditForm question={dialogDraft} onChange={setDialogDraft} />
            </div>
          )}
          <DialogFooter className="border-t border-divider px-5 py-3">
            <button
              type="button"
              onClick={() => {
                setEditingId(null);
                setDialogDraft(null);
              }}
              className="rounded-md border border-border px-3 py-1.5 text-[12.5px] hover:bg-muted"
            >
              取消
            </button>
            <button
              type="button"
              onClick={() => {
                if (dialogDraft) {
                  saveQuestionEdit({ ...dialogDraft, confirmed: true });
                  toast.success("题目已保存");
                }
                setEditingId(null);
                setDialogDraft(null);
              }}
              className="rounded-md bg-primary px-3 py-1.5 text-[12.5px] font-medium text-primary-foreground hover:bg-primary/90"
            >
              保存
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

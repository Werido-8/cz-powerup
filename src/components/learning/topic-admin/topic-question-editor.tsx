import { useMemo, useState } from "react";
import {
  BookOpen,
  CheckSquare,
  ChevronDown,
  ClipboardList,
  Loader2,
  Pencil,
  Plus,
  Sparkles,
  Square,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AppDialogButton, AppFormDialog } from "@/components/ui/app-dialog";
import { cn } from "@/lib/utils";
import { DOCS, QUESTIONS, type Question } from "@/lib/mock/data";
import type { EditableTopicQuestion, TopicDocQuestion } from "@/lib/mock/topicAdmin";

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

function candidateQuestionIds(
  docId: string,
  selectedIds: string[],
  edits: Record<string, EditableTopicQuestion> | undefined,
) {
  const ids: string[] = [];
  const seen = new Set<string>();
  const push = (id: string) => {
    if (seen.has(id)) return;
    seen.add(id);
    ids.push(id);
  };
  QUESTIONS.filter((question) => question.relatedDocId === docId).forEach((question) =>
    push(question.id),
  );
  selectedIds.forEach(push);
  Object.values(edits ?? {}).forEach((question) => {
    if (question.relatedDocId === docId) push(question.id);
  });
  if (ids.length === 0) {
    push(`mock-q-${docId}-1`);
    push(`mock-q-${docId}-2`);
    push(`mock-q-${docId}-3`);
  }
  return ids;
}

function QuestionEditForm({
  question,
  onChange,
}: {
  question: EditableTopicQuestion;
  onChange: (q: EditableTopicQuestion) => void;
}) {
  const [regenPrompt, setRegenPrompt] = useState("");
  const [regenLoading, setRegenLoading] = useState(false);
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

  const regenerateByPrompt = () => {
    if (!regenPrompt.trim()) {
      toast.error("请先用自然语言说明希望怎么改这道题");
      return;
    }
    const hint = regenPrompt.trim().slice(0, 18);
    setRegenLoading(true);
    window.setTimeout(() => {
      onChange({
        ...question,
        stem: `${question.stem.replace(/（已按「[^」]+」调整）$/, "").trim()}（已按「${hint}」调整）`,
        options: question.options?.map((option, index) =>
          index === 0
            ? option
            : { ...option, label: `${option.label.replace(/（易与现场习惯混淆）$/, "")}（易与现场习惯混淆）` },
        ),
        analysis: `已按「${hint}」重新生成。${(question.analysis ?? "").replace(/^已按「[^」]+」重新生成。/, "").trim()}`,
      });
      setRegenLoading(false);
      toast.success("已按说明重新生成题目，请核对后保存");
    }, 700);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-[8px] border border-primary/18 bg-primary-soft/30 px-3 py-2.5">
        <div className="flex items-center gap-1.5 text-[12px] font-medium text-primary">
          <Sparkles className="h-3.5 w-3.5" />
          自然语言重新生成
        </div>
        <p className="mt-0.5 text-[11px] text-muted-foreground">
          说明场景、干扰项或难度，系统据此重写本题。
        </p>
        <div className="mt-2 flex items-end gap-2">
          <textarea
            value={regenPrompt}
            onChange={(event) => setRegenPrompt(event.target.value)}
            rows={2}
            placeholder="例如：改成现场交接班判断，增加一个干扰项"
            className="min-h-[56px] flex-1 resize-none rounded-md border border-input bg-white px-3 py-2 text-[12.5px] outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <button
            type="button"
            onClick={regenerateByPrompt}
            disabled={regenLoading}
            className="inline-flex h-9 shrink-0 items-center gap-1 rounded-md bg-primary px-3 text-[12px] font-medium text-white hover:bg-primary/90 disabled:opacity-60"
          >
            {regenLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            重新生成
          </button>
        </div>
      </div>
      <div>
        <label className="mb-1.5 block text-[12px] font-medium text-muted-foreground">题干</label>
        <textarea
          value={question.stem}
          onChange={(e) => onChange({ ...question, stem: e.target.value })}
          rows={3}
          className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-[13px] outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
          <ul className="space-y-2">
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
                    className="h-8 flex-1 text-[12.5px]"
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

      <div>
        <label className="mb-1.5 block text-[12px] font-medium text-muted-foreground">解析</label>
        <textarea
          value={question.analysis}
          onChange={(e) => onChange({ ...question, analysis: e.target.value })}
          rows={2}
          className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-[12.5px] text-muted-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>
    </div>
  );
}

export function TopicQuestionEditorPanel({
  docIds,
  docQuestions,
  questionEdits = {},
  onUpdate,
}: {
  docIds: string[];
  docQuestions: TopicDocQuestion[];
  questionEdits?: Record<string, EditableTopicQuestion>;
  onUpdate: (patch: {
    docQuestions?: TopicDocQuestion[];
    questionEdits?: Record<string, EditableTopicQuestion>;
  }) => void;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [dialogDraft, setDialogDraft] = useState<EditableTopicQuestion | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickDraftByDoc, setPickDraftByDoc] = useState<Record<string, string[]>>({});
  const [activePickDocId, setActivePickDocId] = useState<string>("");

  const docs = useMemo(
    () =>
      docIds.map((docId) => {
        const doc = DOCS.find((item) => item.id === docId);
        const dq = docQuestions.find((item) => item.docId === docId);
        const selectedIds = dq?.questionIds ?? [];
        const candidateIds = candidateQuestionIds(docId, selectedIds, questionEdits);
        const candidates = candidateIds.map((qid, index) =>
          resolveTopicQuestion(qid, questionEdits, docId, index),
        );
        return {
          docId,
          title: doc?.title ?? docId,
          selectedIds,
          candidates,
        };
      }),
    [docIds, docQuestions, questionEdits],
  );

  const flatSelected = useMemo(() => {
    const rows: {
      docId: string;
      docTitle: string;
      question: EditableTopicQuestion;
      index: number;
    }[] = [];
    let index = 0;
    docs.forEach((doc) => {
      doc.selectedIds.forEach((qid, qIndex) => {
        index += 1;
        rows.push({
          docId: doc.docId,
          docTitle: doc.title,
          question: resolveTopicQuestion(qid, questionEdits, doc.docId, qIndex),
          index,
        });
      });
    });
    return rows;
  }, [docs, questionEdits]);

  const pickSelectedCount = Object.values(pickDraftByDoc).reduce(
    (sum, ids) => sum + ids.length,
    0,
  );
  const activePickDoc =
    docs.find((doc) => doc.docId === activePickDocId) ?? docs[0] ?? null;
  const activePickSelectedIds = activePickDoc
    ? (pickDraftByDoc[activePickDoc.docId] ?? [])
    : [];

  const openQuestionPicker = () => {
    const next: Record<string, string[]> = {};
    docs.forEach((doc) => {
      next[doc.docId] = [...doc.selectedIds];
    });
    setPickDraftByDoc(next);
    setActivePickDocId(docs[0]?.docId ?? "");
    setPickerOpen(true);
  };

  const togglePickId = (docId: string, questionId: string) => {
    setPickDraftByDoc((current) => {
      const list = current[docId] ?? [];
      return {
        ...current,
        [docId]: list.includes(questionId)
          ? list.filter((id) => id !== questionId)
          : [...list, questionId],
      };
    });
  };

  const applyQuestionSelection = () => {
    const nextDocQuestions = docIds.map((docId) => {
      const existing = docQuestions.find((item) => item.docId === docId);
      return {
        docId,
        questionIds: pickDraftByDoc[docId] ?? [],
        generated: existing?.generated ?? false,
        confirmed: false,
      };
    });
    onUpdate({ docQuestions: nextDocQuestions });
    setPickerOpen(false);
    toast.success(`已关联 ${pickSelectedCount} 道题`);
  };

  const removeQuestion = (docId: string, questionId: string) => {
    const nextDocQuestions = docQuestions.map((item) =>
      item.docId === docId
        ? { ...item, questionIds: item.questionIds.filter((id) => id !== questionId) }
        : item,
    );
    onUpdate({ docQuestions: nextDocQuestions });
  };

  const openEditDialog = (question: EditableTopicQuestion) => {
    setEditingId(question.id);
    setDialogDraft({ ...question });
  };

  const saveQuestionEdit = (q: EditableTopicQuestion) => {
    onUpdate({
      questionEdits: { ...questionEdits, [q.id]: q },
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[13px] text-muted-foreground">
          已关联 <strong className="text-foreground">{flatSelected.length}</strong> 道题
        </p>
        <button
          type="button"
          onClick={openQuestionPicker}
          disabled={docIds.length === 0}
          className="inline-flex min-h-9 items-center gap-1.5 rounded-md border border-primary/30 bg-primary-soft/40 px-3 text-[12px] font-medium text-primary hover:bg-primary-soft disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus className="h-3.5 w-3.5" />
          选择题目
        </button>
      </div>

      {docIds.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border py-10 text-center text-[13px] text-muted-foreground">
          请先在「选择资料」步骤中添加学习资料
        </div>
      ) : flatSelected.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border py-10 text-center text-[13px] text-muted-foreground">
          尚未选择题目，点击「选择题目」按资料勾选
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-divider">
          <div className="min-w-[720px]">
          <div className="grid grid-cols-[56px_72px_minmax(0,1.4fr)_minmax(140px,0.9fr)_88px] gap-3 border-b border-divider bg-muted/25 px-3 py-2 text-[11px] font-medium text-muted-foreground">
            <span>序号</span>
            <span>题型</span>
            <span>题干</span>
            <span>来源文件</span>
            <span className="text-right">操作</span>
          </div>
          <ul className="divide-y divide-divider">
            {flatSelected.map((row) => (
              <li
                key={`${row.docId}-${row.question.id}`}
                className="grid grid-cols-[56px_72px_minmax(0,1.4fr)_minmax(140px,0.9fr)_88px] items-start gap-3 px-3 py-3"
              >
                <span className="pt-0.5 text-[12px] tabular-nums text-muted-foreground">
                  {row.index}
                </span>
                <span className="pt-0.5">
                  <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                    {TYPE_LABEL[row.question.type]}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => openEditDialog(row.question)}
                  className="min-w-0 text-left"
                >
                  <p className="line-clamp-2 text-[13px] leading-snug text-foreground">
                    {row.question.stem}
                  </p>
                </button>
                <p className="line-clamp-2 pt-0.5 text-[12px] text-muted-foreground" title={row.docTitle}>
                  {row.docTitle}
                </p>
                <div className="flex justify-end gap-1">
                  <button
                    type="button"
                    onClick={() => openEditDialog(row.question)}
                    aria-label="编辑题目"
                    className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-primary"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeQuestion(row.docId, row.question.id)}
                    aria-label="移除题目"
                    className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
          </div>
        </div>
      )}

      <AppFormDialog
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        title="选择题目"
        titleIcon={ClipboardList}
        size="large"
        fillHeight
        footer={
          <>
            <AppDialogButton onClick={() => setPickerOpen(false)}>取消</AppDialogButton>
            <AppDialogButton variant="primary" onClick={applyQuestionSelection}>
              确定
            </AppDialogButton>
          </>
        }
      >
        <div className="flex min-h-0 flex-1 flex-col gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <Select value={activePickDoc?.docId ?? ""} onValueChange={setActivePickDocId}>
              <SelectTrigger className="h-9 w-[360px] max-w-full rounded-md border-kb-border bg-white text-[12.5px]">
                <SelectValue placeholder="选择资料文件" />
              </SelectTrigger>
              <SelectContent>
                {docs.map((doc) => (
                  <SelectItem key={doc.docId} value={doc.docId} className="text-[12.5px]">
                    {doc.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {activePickDoc ? (
              <span className="text-[12.5px] text-muted-foreground">
                {activePickDoc.title} 已选{" "}
                <strong className="text-foreground">{activePickSelectedIds.length}</strong> /{" "}
                {activePickDoc.candidates.length} 道
              </span>
            ) : null}
          </div>
          <p className="text-[12.5px] text-muted-foreground">
            本阶段共已勾选 <strong className="text-foreground">{pickSelectedCount}</strong> 道题
          </p>
          {activePickDoc ? (
            <div className="flex items-center justify-end">
              <button
                type="button"
                onClick={() =>
                  setPickDraftByDoc((current) => ({
                    ...current,
                    [activePickDoc.docId]:
                      activePickSelectedIds.length === activePickDoc.candidates.length
                        ? []
                        : activePickDoc.candidates.map((question) => question.id),
                  }))
                }
                className="rounded-md px-2.5 py-1.5 text-[11.5px] text-primary hover:bg-primary-soft"
              >
                {activePickSelectedIds.length === activePickDoc.candidates.length
                  ? "取消全选"
                  : "批量选择"}
              </button>
            </div>
          ) : null}
          <div className="min-h-0 flex-1 overflow-y-auto pr-1">
            {activePickDoc ? (
              <div className="space-y-2">
                {activePickDoc.candidates.map((question, index) => {
                  const selected = activePickSelectedIds.includes(question.id);
                  return (
                    <button
                      key={question.id}
                      type="button"
                      onClick={() => togglePickId(activePickDoc.docId, question.id)}
                      className={cn(
                        "flex w-full items-start gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors",
                        selected
                          ? "border-primary/40 bg-primary-soft/25"
                          : "border-divider hover:bg-muted/30",
                      )}
                    >
                      {selected ? (
                        <CheckSquare className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      ) : (
                        <Square className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex flex-wrap items-center gap-2">
                          <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                            {index + 1}
                          </span>
                          <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                            {TYPE_LABEL[question.type]}
                          </span>
                        </div>
                        <p className="text-[13px] leading-snug text-foreground">
                          {question.stem}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="grid min-h-40 place-items-center text-[13px] text-muted-foreground">
                暂无可选资料
              </div>
            )}
          </div>
        </div>
      </AppFormDialog>

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
                  saveQuestionEdit(dialogDraft);
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

import { CircleCheck, CircleHelp, FileText, ListChecks, PlusCircle, Power, Tag, Trash2 } from "lucide-react";
import { type ReactNode, useEffect, useState } from "react";
import { KbFormDialog } from "@/components/knowledge/ui/KbFormDialog";
import { AppDialogButton } from "@/components/ui/app-dialog";
import { AppFormTextarea } from "@/components/ui/app-form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { KnowledgeExercise, KnowledgeExerciseOption } from "@/lib/knowledge/types";

const optionLabel = (index: number) => String.fromCharCode(65 + index);
const defaultChoiceOptions = (): KnowledgeExerciseOption[] => ["选项内容 A", "选项内容 B"].map((content, index) => ({ id: optionLabel(index), label: optionLabel(index), content }));
const defaultJudgeOptions = (): KnowledgeExerciseOption[] => ["正确", "错误"].map((content, index) => ({ id: optionLabel(index), label: optionLabel(index), content }));
const questionTypeLabels: Record<KnowledgeExercise["type"], string> = { single: "单选题", multiple: "多选题", judge: "判断题" };

function EditorField({ icon: Icon, label, required, children }: { icon: typeof FileText; label: string; required?: boolean; children: ReactNode }) {
  return <div><div className="mb-2 flex items-center gap-2 text-[13px] font-semibold text-[#31485D]"><Icon className="size-4 text-[#6C8496]" strokeWidth={1.8} /><span>{label}{required && <b className="ml-0.5 font-medium text-[#E85C5C]">*</b>}</span></div>{children}</div>;
}

export function ExerciseEditorDialog({ item, open, sourceName, close, save }: { item: KnowledgeExercise | null; open: boolean; sourceName: string; close: () => void; save: (item: KnowledgeExercise) => void }) {
  const [stem, setStem] = useState("");
  const [type, setType] = useState<KnowledgeExercise["type"]>("single");
  const [difficulty, setDifficulty] = useState<NonNullable<KnowledgeExercise["difficulty"]>>("medium");
  const [knowledgePoint, setKnowledgePoint] = useState("");
  const [source, setSource] = useState("");
  const [options, setOptions] = useState<KnowledgeExerciseOption[]>([]);
  const [correctAnswers, setCorrectAnswers] = useState<string[]>([]);
  const [analysis, setAnalysis] = useState("");
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    if (!item) return;
    setStem(item.stem);
    setType(item.type);
    setDifficulty(item.difficulty ?? "medium");
    setKnowledgePoint(item.knowledgePoint ?? "并网运行");
    setSource(item.source ?? sourceName);
    setOptions(item.options.map((option, index) => ({ ...option, id: optionLabel(index), label: optionLabel(index) })));
    setCorrectAnswers(item.correctAnswers);
    setAnalysis(item.analysis ?? "");
    setEnabled(item.enabled ?? true);
  }, [item, sourceName]);

  if (!item) return null;

  const updateType = (next: KnowledgeExercise["type"]) => {
    if (next === type) return;
    setType(next);
    if (next === "judge") {
      setOptions(defaultJudgeOptions());
      setCorrectAnswers((answers) => answers.includes("B") ? ["B"] : answers.includes("A") ? ["A"] : []);
      return;
    }
    setOptions((current) => current.length >= 2 && !["正确", "错误"].includes(current[0]?.content ?? "") ? current : defaultChoiceOptions());
    setCorrectAnswers((answers) => next === "single" ? answers.slice(0, 1) : answers);
  };

  const toggleAnswer = (label: string) => {
    if (type === "multiple") {
      setCorrectAnswers((answers) => answers.includes(label) ? answers.filter((answer) => answer !== label) : [...answers, label]);
      return;
    }
    setCorrectAnswers([label]);
  };

  const addOption = () => {
    if (options.length >= 26 || type === "judge") return;
    const label = optionLabel(options.length);
    setOptions((current) => [...current, { id: label, label, content: `选项内容 ${label}` }]);
  };

  const removeOption = (label: string) => {
    if (options.length <= 2 || type === "judge") return;
    setOptions((current) => {
      const removedIndex = current.findIndex((option) => option.label === label);
      const next = current.filter((option) => option.label !== label).map((option, index) => ({ ...option, id: optionLabel(index), label: optionLabel(index) }));
      setCorrectAnswers((answers) => answers
        .filter((answer) => answer !== label)
        .map((answer) => {
          const answerIndex = current.findIndex((option) => option.label === answer);
          return answerIndex > removedIndex ? optionLabel(answerIndex - 1) : answer;
        })
        .filter((answer) => next.some((option) => option.label === answer)));
      return next;
    });
  };

  const submit = () => {
    save({ ...item, stem: stem.trim(), type, difficulty, knowledgePoint: knowledgePoint.trim(), source: source.trim(), options, correctAnswers, analysis: analysis.trim(), enabled });
  };

  return <KbFormDialog open={open} onClose={close} title="编辑题目" titleIcon={ListChecks} size="large" className="max-h-[calc(100vh-32px)]" footer={<><AppDialogButton variant="outline" onClick={close}>取消</AppDialogButton><AppDialogButton variant="primary" disabled={!stem.trim() || correctAnswers.length === 0} onClick={submit}>保存修改</AppDialogButton></>}>
    <div className="space-y-5"><p className="-mt-1 text-[13px] text-[#6D8497]">修改题型、答案与题目解析</p>
      <EditorField icon={FileText} label="题干" required><AppFormTextarea value={stem} onChange={(event) => setStem(event.target.value)} rows={1} showCount={false} className="!h-10 !min-h-10 !resize-none !rounded-[7px] !py-[7px] text-[13px] leading-6" /></EditorField>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2"><EditorField icon={CircleHelp} label="题型" required><Select value={type} onValueChange={(value) => updateType(value as KnowledgeExercise["type"])}><SelectTrigger className="h-10 !rounded-[7px] border-[#D6E1E9] text-[13px]"><SelectValue /></SelectTrigger><SelectContent>{Object.entries(questionTypeLabels).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select></EditorField><EditorField icon={Tag} label="难度"><Select value={difficulty} onValueChange={(value) => setDifficulty(value as NonNullable<KnowledgeExercise["difficulty"]>)}><SelectTrigger className="h-10 !rounded-[7px] border-[#D6E1E9] text-[13px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="easy">易</SelectItem><SelectItem value="medium">中</SelectItem><SelectItem value="hard">难</SelectItem></SelectContent></Select></EditorField></div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2"><EditorField icon={Tag} label="知识点"><input value={knowledgePoint} onChange={(event) => setKnowledgePoint(event.target.value)} className="h-10 w-full rounded-[7px] border border-[#D6E1E9] px-3 text-[13px] text-[#31485D] outline-none transition-colors focus:border-[#1496B4]" /></EditorField><EditorField icon={FileText} label="来源资料"><input value={source} onChange={(event) => setSource(event.target.value)} className="h-10 w-full rounded-[7px] border border-[#D6E1E9] px-3 text-[13px] text-[#31485D] outline-none transition-colors focus:border-[#1496B4]" /></EditorField></div>
      <EditorField icon={ListChecks} label="选项" required><div className="space-y-2.5">{options.map((option) => <div key={option.label} className="flex items-center gap-2.5"><input aria-label={`正确答案 ${option.label}`} type={type === "multiple" ? "checkbox" : "radio"} name="exercise-answer" checked={correctAnswers.includes(option.label)} onChange={() => toggleAnswer(option.label)} className="size-4 shrink-0 accent-[#1496B4]" /><span className="w-4 shrink-0 text-center text-[13px] text-[#587185]">{option.label}</span><input aria-label={`选项 ${option.label}`} value={option.content} onChange={(event) => setOptions((current) => current.map((entry) => entry.label === option.label ? { ...entry, content: event.target.value } : entry))} className="h-10 min-w-0 flex-1 rounded-[7px] border border-[#D6E1E9] px-3 text-[13px] text-[#31485D] outline-none transition-colors focus:border-[#1496B4]" /><button type="button" aria-label={`删除选项 ${option.label}`} title="删除选项" disabled={options.length <= 2 || type === "judge"} onClick={() => removeOption(option.label)} className="flex size-8 shrink-0 items-center justify-center rounded-md text-[#6E8393] transition-colors hover:bg-[#FFF2F2] hover:text-[#E85C5C] disabled:opacity-30"><Trash2 className="size-4" /></button></div>)}{type !== "judge" && <button type="button" onClick={addOption} disabled={options.length >= 26} className="flex h-10 w-full items-center justify-center gap-1.5 rounded-[7px] border border-dashed border-[#93D6E4] bg-[#F3FBFC] text-[13px] font-medium text-[#1496B4] transition-colors hover:bg-[#EAF8FA] disabled:opacity-40"><PlusCircle className="size-4" />新增选项</button>}</div></EditorField>
      <EditorField icon={CircleCheck} label="正确答案" required><input readOnly value={correctAnswers.join("，")} placeholder="请在上方选择正确选项" className="h-10 w-full cursor-default rounded-[7px] border border-[#D6E1E9] bg-[#F8FAFC] px-3 text-[13px] text-[#31485D] outline-none" /></EditorField>
      <EditorField icon={FileText} label="解析"><AppFormTextarea value={analysis} onChange={(event) => setAnalysis(event.target.value)} rows={1} showCount={false} className="!h-10 !min-h-10 !resize-none !rounded-[7px] !py-[7px] text-[13px] leading-6" /></EditorField>
    </div>
  </KbFormDialog>;
}

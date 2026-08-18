import { useEffect, useMemo, useRef, useState } from "react";
import {
  CheckCircle2,
  FileText,
  Info,
  Save,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { AiAppendConfirmDialog, type AiAppendContext } from "@/components/exam/ai-append-confirm-dialog";
import {
  AI_APPEND_DISABLED_TOOLTIP,
  AI_APPEND_ENABLED_TOOLTIP,
  AI_APPEND_INCOMPLETE_MSG,
  isPaperContextReady,
} from "@/components/exam/paper-context";
import {
  PaperQuestionList,
  PaperQuestionSummary,
  usePaperQuestionGroups,
} from "@/components/exam/paper-question-list";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  EDITOR_GROUPS,
  EMPTY_EDITOR_GROUPS,
  GEN_PREVIEW,
  PAPER_CATEGORIES,
  type Difficulty,
  type ExamGoal,
  type Paper,
  type QuestionType,
} from "@/lib/mock/examAdmin";

export type ExamPaperEditorMode = "manual" | "ai";

const GOAL_OPTIONS: ExamGoal[] = ["取证复习", "复证巩固", "岗位达标", "阶段测评", "日常自测"];

const ALL_QUESTION_TYPES: QuestionType[] = ["单选题", "多选题", "判断题", "填空题", "简答题"];

const AI_DEFAULT_PROMPT =
  "生成一套 AGC/两细则取证复习考试，20 题，中等难度，30 分钟";

const DIFFICULTY_OPTIONS: Difficulty[] = ["易", "中", "难"];

interface PaperBasicInfo {
  name: string;
  goal: ExamGoal;
  category: string;
  position: string;
  duration: string;
  passLine: string;
  difficulty: Difficulty | "";
  note: string;
}

const EMPTY_BASIC_INFO: PaperBasicInfo = {
  name: "",
  goal: "取证复习",
  category: "",
  position: "",
  duration: "",
  passLine: "60",
  difficulty: "",
  note: "",
};

const AI_GENERATED_BASIC_INFO: PaperBasicInfo = {
  name: "AGC / 两细则取证复习考试",
  goal: "取证复习",
  category: "调频调压",
  position: "值班员 / 值班长",
  duration: "30",
  passLine: "60",
  difficulty: "中",
  note: "",
};

function riskClass(r: string) {
  return r === "高"
    ? "bg-destructive/10 text-destructive"
    : r === "中"
      ? "bg-warning-soft text-warning-foreground"
      : r === "低"
        ? "bg-primary-soft text-primary"
        : "bg-muted text-muted-foreground";
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="mb-1 block text-[12px] font-medium text-muted-foreground">{children}</label>;
}

function DistBlock({ title, items }: { title: string; items: { name: string; count: number }[] }) {
  const total = items.reduce((s, i) => s + i.count, 0) || 1;
  return (
    <div>
      <div className="mb-1.5 text-[12px] font-medium text-muted-foreground">{title}</div>
      <div className="space-y-1.5">
        {items.map((i) => (
          <div key={i.name} className="flex items-center gap-2 text-[11.5px]">
            <span className="w-20 shrink-0 truncate">{i.name}</span>
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-primary" style={{ width: `${(i.count / total) * 100}%` }} />
            </div>
            <span className="w-5 shrink-0 text-right text-muted-foreground">{i.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export interface ExamPaperEditorProps {
  open: boolean;
  onClose: () => void;
  paper?: Paper | null;
  mode: ExamPaperEditorMode;
  onAddQuestion: (type: QuestionType) => void;
  onSwapQuestion: () => void;
}

export function ExamPaperEditor({
  open,
  onClose,
  paper = null,
  mode,
  onAddQuestion,
  onSwapQuestion,
}: ExamPaperEditorProps) {
  const isEdit = !!paper;
  const isAiMode = mode === "ai" && !isEdit;

  const { groups, collapsed, toggleCollapse, moveQuestion, removeQuestion, aiAppend, resetGroups, collapseAll, expandAll, summary } =
    usePaperQuestionGroups(EMPTY_EDITOR_GROUPS);

  const [aiPrompt, setAiPrompt] = useState("");
  const [aiGenerated, setAiGenerated] = useState(false);
  const [basicInfo, setBasicInfo] = useState<PaperBasicInfo>(EMPTY_BASIC_INFO);
  const [appendConfirmOpen, setAppendConfirmOpen] = useState(false);
  const [pendingAppendType, setPendingAppendType] = useState<QuestionType | null>(null);

  const contextReady = useMemo(() => isPaperContextReady(basicInfo), [basicInfo]);

  const showEditorBody = isEdit || mode === "manual" || aiGenerated;
  const initKeyRef = useRef("");

  useEffect(() => {
    if (!open) {
      initKeyRef.current = "";
      return;
    }

    const sessionKey = `${mode}:${paper?.id ?? "new"}`;
    if (initKeyRef.current === sessionKey) return;
    initKeyRef.current = sessionKey;

    setAiGenerated(false);
    setAiPrompt(mode === "ai" && !paper ? AI_DEFAULT_PROMPT : "");

    if (paper) {
      resetGroups(EDITOR_GROUPS);
      expandAll();
      setBasicInfo({
        name: paper.name,
        goal: paper.goal,
        category: paper.category,
        position: "值班员 / 值班长",
        duration: String(paper.duration),
        passLine: "60",
        difficulty: "中",
        note: "",
      });
    } else {
      resetGroups(EMPTY_EDITOR_GROUPS);
      collapseAll(ALL_QUESTION_TYPES);
      setBasicInfo(EMPTY_BASIC_INFO);
    }
  }, [open, paper, mode, resetGroups, collapseAll, expandAll]);

  const subtitle = isEdit
    ? `编辑：${paper.name}`
    : mode === "ai"
      ? "描述考试需求，AI 辅助生成试卷草稿，正式下发前需人工确认"
      : "新建试卷";

  const handleGeneratePreview = () => {
    resetGroups(EDITOR_GROUPS);
    expandAll();
    setBasicInfo(AI_GENERATED_BASIC_INFO);
    setAiGenerated(true);
    toast.success("已生成试卷预览");
  };

  const updateBasicInfo = <K extends keyof PaperBasicInfo>(key: K, value: PaperBasicInfo[K]) => {
    setBasicInfo((prev) => ({ ...prev, [key]: value }));
  };

  const handleSaveDraft = () => {
    toast.success("已保存为草稿");
    onClose();
  };

  const handleSavePaper = () => {
    toast.success("试卷已保存");
    onClose();
  };

  const appendContext: AiAppendContext | null = useMemo(() => {
    if (!pendingAppendType || !basicInfo.difficulty) return null;
    const group = groups.find((g) => g.type === pendingAppendType);
    const currentCount = group?.questions.length ?? 0;
    const targetCount = GEN_PREVIEW.typeRatio.find((t) => t.name === pendingAppendType)?.count ?? 3;
    const gapCount = Math.max(targetCount - currentCount, 1);

    return {
      name: basicInfo.name,
      goal: basicInfo.goal,
      category: basicInfo.category,
      position: basicInfo.position,
      difficulty: basicInfo.difficulty,
      questionType: pendingAppendType,
      gapCount,
    };
  }, [pendingAppendType, basicInfo, groups]);

  const handleAiAppendRequest = (type: QuestionType) => {
    if (!contextReady) {
      toast.warning(AI_APPEND_INCOMPLETE_MSG);
      return;
    }
    setPendingAppendType(type);
    setAppendConfirmOpen(true);
  };

  const handleConfirmAiAppend = () => {
    if (!pendingAppendType || !basicInfo.difficulty) return;
    const appendedCount = aiAppend(pendingAppendType, {
      knowledge: basicInfo.category,
      difficulty: basicInfo.difficulty,
    });
    if (appendedCount > 0) {
      toast.success(`已为${pendingAppendType}补 ${appendedCount} 道题`);
    } else {
      toast.info("当前题库没有可补充的同题型题目");
    }
    setAppendConfirmOpen(false);
    setPendingAppendType(null);
  };

  const handleCloseAppendConfirm = () => {
    setAppendConfirmOpen(false);
    setPendingAppendType(null);
  };

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-3xl">
        <SheetHeader className="border-b border-border px-6 py-4">
          <SheetTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" /> 试卷编辑器
          </SheetTitle>
          <SheetDescription>{subtitle}</SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
          {isAiMode && (
            <section className="rounded-lg border border-border bg-card p-4">
              <div className="mb-1.5 text-[12.5px] font-medium">自然语言组卷</div>
              <Textarea
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder={AI_DEFAULT_PROMPT}
                rows={3}
                className="text-[13px]"
              />
              <button
                type="button"
                onClick={handleGeneratePreview}
                className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 text-[13px] font-medium text-primary-foreground hover:bg-primary/90"
              >
                <Sparkles className="h-4 w-4" /> 生成预览
              </button>
            </section>
          )}

          {isAiMode && aiGenerated && (
            <section className="space-y-4">
              <div className="rounded-lg border border-border bg-card p-3">
                <div className="text-[13px] font-semibold">{basicInfo.name}</div>
                <div className="mt-1 flex flex-wrap gap-3 text-[11.5px] text-muted-foreground">
                  <span>题量 {summary[0]?.value ?? 0}</span>
                  <span>总分 {summary[1]?.value ?? 0}</span>
                  <span>时长 {basicInfo.duration} 分</span>
                  <span>及格线 {basicInfo.passLine}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* <DistBlock title="知识点覆盖" items={GEN_PREVIEW.knowledgeCoverage} /> */}
                <DistBlock title="题型比例" items={GEN_PREVIEW.typeRatio} />
                <DistBlock title="难度分布" items={GEN_PREVIEW.difficulty} />
                {/* <div>
                  <div className="mb-1.5 text-[12px] font-medium text-muted-foreground">重复题风险</div>
                  <span className={`rounded-md px-2 py-0.5 text-[12px] ${riskClass(GEN_PREVIEW.dupRisk)}`}>
                    {GEN_PREVIEW.dupRisk}
                  </span>
                </div> */}
              </div>

              <div className="flex items-start gap-2 rounded-lg bg-primary-soft px-3 py-2 text-[11.5px] text-primary">
                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                缺题提醒：简答题题量不足，建议补充 1 道或调整题型比例。
              </div>
            </section>
          )}

          {showEditorBody && (
            <>
              <section className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <FieldLabel>试卷名称</FieldLabel>
                  <Input
                    value={basicInfo.name}
                    onChange={(e) => updateBasicInfo("name", e.target.value)}
                    placeholder="如：AGC / 两细则取证复习考试"
                    className="h-9 text-[13px]"
                  />
                </div>
                <div>
                  <FieldLabel>考试目标</FieldLabel>
                  <select
                    value={basicInfo.goal}
                    onChange={(e) => updateBasicInfo("goal", e.target.value as ExamGoal)}
                    className="h-9 w-full rounded-md border border-input bg-background px-2 text-[13px]"
                  >
                    {GOAL_OPTIONS.map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <FieldLabel>分类</FieldLabel>
                  <Select
                    value={basicInfo.category || undefined}
                    onValueChange={(v) => updateBasicInfo("category", v)}
                  >
                    <SelectTrigger className="h-9 text-[13px]">
                      <SelectValue placeholder="请选择分类" />
                    </SelectTrigger>
                    <SelectContent>
                      {PAPER_CATEGORIES.map((c) => (
                        <SelectItem key={c} value={c} className="text-[12px]">
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <FieldLabel>适用岗位</FieldLabel>
                  <Input
                    value={basicInfo.position}
                    onChange={(e) => updateBasicInfo("position", e.target.value)}
                    placeholder="如：值班员 / 值班长"
                    className="h-9 text-[13px]"
                  />
                </div>
                <div>
                  <FieldLabel>考试时长(分钟)</FieldLabel>
                  <Input
                    value={basicInfo.duration}
                    onChange={(e) => updateBasicInfo("duration", e.target.value)}
                    placeholder="30"
                    className="h-9 text-[13px]"
                  />
                </div>
                <div>
                  <FieldLabel>及格线(分)</FieldLabel>
                  <Input
                    value={basicInfo.passLine}
                    onChange={(e) => updateBasicInfo("passLine", e.target.value)}
                    placeholder="60"
                    className="h-9 text-[13px]"
                  />
                </div>
                <div>
                  <FieldLabel>难度</FieldLabel>
                  <select
                    value={basicInfo.difficulty}
                    onChange={(e) => updateBasicInfo("difficulty", e.target.value as Difficulty | "")}
                    className="h-9 w-full rounded-md border border-input bg-background px-2 text-[13px]"
                  >
                    <option value="">请选择</option>
                    {DIFFICULTY_OPTIONS.map((d) => (
                      <option key={d} value={d}>{d === "易" ? "简单" : d === "中" ? "中等" : "困难"}</option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2">
                  <FieldLabel>备注</FieldLabel>
                  <Input
                    value={basicInfo.note}
                    onChange={(e) => updateBasicInfo("note", e.target.value)}
                    placeholder="选填"
                    className="h-9 text-[13px]"
                  />
                </div>
              </section>

              <PaperQuestionSummary summary={summary} />

              <PaperQuestionList
                groups={groups}
                collapsed={collapsed}
                onToggleCollapse={toggleCollapse}
                onAdd={onAddQuestion}
                onAiAppend={handleAiAppendRequest}
                onMoveQuestion={moveQuestion}
                onRemoveQuestion={removeQuestion}
                onSwap={onSwapQuestion}
                aiAppendReady={contextReady}
                aiAppendTooltip={AI_APPEND_ENABLED_TOOLTIP}
                aiAppendDisabledTooltip={AI_APPEND_DISABLED_TOOLTIP}
              />

              {/* {isAiMode && aiGenerated && (
                <div className="flex items-start gap-2 rounded-lg bg-warning-soft px-3 py-2 text-[11.5px] text-warning-foreground">
                  <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  智能组卷用于辅助培训负责人创建考试，正式下发前需人工确认。
                </div>
              )} */}
            </>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-border px-6 py-3.5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-border px-4 py-2 text-[13px] hover:bg-muted"
          >
            取消
          </button>
          <button
            type="button"
            onClick={handleSaveDraft}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-[13px] font-medium hover:bg-muted"
          >
            <Save className="h-4 w-4" /> 保存草稿
          </button>
          <button
            type="button"
            onClick={handleSavePaper}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-[13px] font-medium text-primary-foreground hover:bg-primary/90"
          >
            <CheckCircle2 className="h-4 w-4" /> 保存试卷
          </button>
        </div>
      </SheetContent>

      <AiAppendConfirmDialog
        open={appendConfirmOpen}
        context={appendContext}
        onClose={handleCloseAppendConfirm}
        onConfirm={handleConfirmAiAppend}
      />
    </Sheet>
  );
}

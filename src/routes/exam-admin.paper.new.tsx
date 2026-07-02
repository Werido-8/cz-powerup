import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import {
  Check,
  CheckSquare,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  FileText,
  Info,
  Loader2,
  Save,
  Send,
  Sparkles,
  Square,
} from "lucide-react";
import { toast } from "sonner";
import { PageShell } from "@/components/workbench/PageShell";
import {
  PaperQuestionList,
  PaperQuestionSummary,
  PaperTypeToolbar,
  usePaperQuestionGroups,
} from "@/components/exam/paper-question-list";
import { AddQuestionDialog } from "@/components/exam/exam-dialogs";
import { AssignPanel } from "@/components/exam/assign-panel";
import { Input } from "@/components/ui/input";
import {
  PAPER_CATEGORIES,
  PAPER_DRAFT_KEY,
  TYPE_PER_SCORE,
  type Difficulty,
  type EditorGroup,
  type ExamGoal,
  type QuestionType,
} from "@/lib/mock/examAdmin";
import type { PaperBasicInfo } from "@/components/exam/exam-paper-editor-page";
import { cn } from "@/lib/utils";
import { generateExamDraft, type AiDraftParams } from "@/services/examAi";

// ─────────────────── Route ───────────────────

const searchSchema = z.object({
  step: z.coerce.number().default(1),
  source: z.enum(["ai", "manual"]).optional(),
});

export const Route = createFileRoute("/exam-admin/paper/new")({
  validateSearch: searchSchema,
  component: NewPaperWizardPage,
  head: () => ({ meta: [{ title: "新建试卷 · 考试管理" }] }),
});

// ─────────────────── 常量 ───────────────────

/** 普通模式 3 步 */
const NORMAL_STEPS = ["基本信息", "组卷策略", "下发设置"];
const NORMAL_HINTS = [
  "填写试卷基础信息，用于后续组卷和下发",
  "配置题型模块，可从题库选题或新增题目",
  "选择下发对象，确认后提交试卷",
];

/** AI 模式 4 步（步骤 1 = AI 起草，步骤 2~4 = 普通 1~3） */
const AI_STEPS = ["AI 起草", "基本信息", "组卷策略", "下发设置"];
const AI_HINTS = [
  "描述考试对象、知识范围和题目要求，AI 将自动生成试卷草稿",
  "AI 已预填基础信息，请确认或调整",
  "AI 已生成题目，可继续编辑、删除或从题库替换",
  "选择下发对象，确认后提交试卷",
];

const GOAL_OPTIONS: ExamGoal[] = ["取证复习", "复证巩固", "岗位达标", "阶段测评", "日常自测"];
const DIFFICULTY_OPTIONS: Difficulty[] = ["易", "中", "难"];

const AI_GOAL_OPTIONS = ["取证复习", "新员工自测", "专项能力测评", "规程学习检查", "错题巩固"];
const POSITION_SUGGESTIONS = ["值班员", "值班长", "集控运行", "检修员", "继保员"];
const SOURCE_SCOPE_OPTIONS = [
  { value: "bank", label: "仅题库" },
  { value: "bank+kb", label: "题库 + 知识库" },
  { value: "kb", label: "指定知识库" },
] as const;

const QUICK_TEMPLATES = [
  {
    label: "取证复习",
    text: "面向运行一班值班员，围绕 AGC 控制方式、两个细则考核、一二次调频响应要求生成一套取证复习试卷，题目难度中等，重点考察现场处置和规则理解。",
  },
  {
    label: "新员工自测",
    text: "面向新入职的运行班组员工，考察基础操作规范、安全规程和调度术语理解，题目数量 15 题，难度偏易，覆盖岗前培训主要内容。",
  },
  {
    label: "专项能力测评",
    text: "针对集控运行人员，重点检测 AGC、AVC 协调控制与异常处置能力，题目偏难，涵盖典型故障场景与规程制度要求。",
  },
  {
    label: "规程学习检查",
    text: "检验运行值班员对最新下发规程制度的掌握情况，涉及调度规程、操作规程更新内容，出 20 道判断题和单选题，通过率 80 分。",
  },
  {
    label: "错题巩固",
    text: "基于历次考试中错误率较高的知识点，生成一套巩固练习试卷，着重 AGC 细则考核计算类和两细则规则理解类题目。",
  },
];

const EMPTY_BASIC: PaperBasicInfo = {
  name: "",
  goal: "取证复习",
  category: "",
  position: "",
  duration: "30",
  passLine: "60",
  difficulty: "中",
  note: "",
};

type Draft = { basicInfo: PaperBasicInfo; groups: EditorGroup[] };

function loadDraft(): Draft | null {
  try {
    const raw = sessionStorage.getItem(PAPER_DRAFT_KEY);
    return raw ? (JSON.parse(raw) as Draft) : null;
  } catch {
    return null;
  }
}

function saveDraft(d: Draft) {
  sessionStorage.setItem(PAPER_DRAFT_KEY, JSON.stringify(d));
}

// ─────────────────── 共用小组件 ───────────────────

function FieldLabel({
  children,
  required,
  hint,
}: {
  children: React.ReactNode;
  required?: boolean;
  hint?: string;
}) {
  return (
    <div className="mb-1.5">
      <label className="block text-[13px] font-medium text-[#425B66]">
        {children}
        {required && <span className="ml-0.5 text-[#E65A5A]">*</span>}
      </label>
      {hint && <p className="mt-0.5 text-[11.5px] text-[#9AAAB0]">{hint}</p>}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-5 flex items-center">
      <span className="mr-[5px] h-[1em] w-[5px] shrink-0 rounded-[1px] bg-primary" />
      <h2 className="text-[16px] font-bold leading-none">{children}</h2>
    </div>
  );
}

const SELECT_CLS =
  "h-10 w-full appearance-none rounded-[8px] border border-[#DCE8EA] bg-white px-3 text-[13.5px] text-[#1F3440] transition-colors hover:border-[#B8D4D9] focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15";

const INPUT_CLS =
  "h-10 rounded-[8px] border-[#DCE8EA] text-[14px] text-[#1F3440] placeholder:text-[#9AAAB0] transition-colors hover:border-[#B8D4D9] focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/15";

const INPUT_NUM_CLS =
  "h-10 w-full rounded-[8px] border border-[#DCE8EA] bg-white px-3 text-[13.5px] text-[#1F3440] transition-colors hover:border-[#B8D4D9] focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15";

function SelectField({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  options: readonly string[] | { value: string; label: string }[];
  placeholder?: string;
}) {
  return (
    <div className="relative">
      <select value={value} onChange={(e) => onChange(e.target.value)} className={SELECT_CLS}>
        {placeholder && <option value="">{placeholder}</option>}
        {(options as any[]).map((opt) => {
          const v = typeof opt === "string" ? opt : opt.value;
          const l = typeof opt === "string" ? opt : opt.label;
          return (
            <option key={v} value={v}>
              {l}
            </option>
          );
        })}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#9AAAB0]" />
    </div>
  );
}

function CheckboxItem({
  checked,
  onToggle,
  label,
}: {
  checked: boolean;
  onToggle: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex items-center gap-2 text-[13px] text-[#1F3440] hover:text-primary"
    >
      {checked ? (
        <CheckSquare className="h-4 w-4 shrink-0 text-primary" />
      ) : (
        <Square className="h-4 w-4 shrink-0 text-[#9AAAB0]" />
      )}
      {label}
    </button>
  );
}

// ─────────────────── AI 起草步骤内容 ───────────────────

interface AiStepProps {
  prompt: string;
  setPrompt: (v: string) => void;
  aiGoal: string;
  setAiGoal: (v: string) => void;
  aiCategory: string;
  setAiCategory: (v: string) => void;
  positionsInput: string;
  setPositionsInput: (v: string) => void;
  totalCount: number;
  setTotalCount: (v: number) => void;
  singleCount: number;
  setSingleCount: (v: number) => void;
  multiCount: number;
  setMultiCount: (v: number) => void;
  judgeCount: number;
  setJudgeCount: (v: number) => void;
  difficulty: Difficulty | "";
  setDifficulty: (v: Difficulty | "") => void;
  duration: number;
  setDuration: (v: number) => void;
  passScore: number;
  setPassScore: (v: number) => void;
  sourceScope: "bank" | "bank+kb" | "kb";
  setSourceScope: (v: "bank" | "bank+kb" | "kb") => void;
  genAnswer: boolean;
  toggleGenAnswer: () => void;
  genAnalysis: boolean;
  toggleGenAnalysis: () => void;
  genEvidence: boolean;
  toggleGenEvidence: () => void;
  aiStatus: "idle" | "loading" | "done" | "error";
  aiError: string;
  aiDraftDone: boolean;
}

function AiDraftStepContent(p: AiStepProps) {
  const isLoading = p.aiStatus === "loading";

  const togglePosition = (pos: string) => {
    const cur = p.positionsInput
      .split(/[,，、\s]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    const idx = cur.indexOf(pos);
    p.setPositionsInput(
      (idx >= 0 ? cur.filter((x) => x !== pos) : [...cur, pos]).join("、"),
    );
  };

  return (
    <div
      className={cn(
        "grid gap-5 lg:grid-cols-[1fr_380px]",
        isLoading && "pointer-events-none opacity-60",
      )}
    >
      {/* ─── 左侧：组卷需求 ─── */}
      <div className="rounded-[12px] border border-[#DCE8EA] bg-white p-6 shadow-[0_8px_24px_rgba(31,52,64,0.06)] lg:p-7">
        <div className="mb-4">
          <h3 className="mb-1 text-[15px] font-semibold text-[#1F3440]">组卷需求</h3>
          <p className="text-[12.5px] text-[#607681]">
            请用自然语言描述本次考试的对象、范围、目标和题目要求。
          </p>
        </div>

        {/* 成功提示：曾经生成过，当前返回重新编辑 */}
        {p.aiDraftDone && (
          <div className="mb-3 flex items-center gap-2 rounded-[6px] bg-[#EAF7F9] px-3 py-2 text-[12.5px] text-primary">
            <Check className="h-3.5 w-3.5 shrink-0" />
            草稿已生成。可修改需求后重新生成，新草稿将覆盖当前题目。
          </div>
        )}

        {/* 错误提示 */}
        {p.aiStatus === "error" && p.aiError && (
          <div className="mb-3 flex items-start gap-2 rounded-[6px] bg-[#FFF3F3] px-3 py-2 text-[12.5px] text-[#E65A5A]">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            {p.aiError}
          </div>
        )}

        <textarea
          value={p.prompt}
          onChange={(e) => p.setPrompt(e.target.value)}
          rows={8}
          placeholder="示例：面向运行一班值班员，围绕 AGC 控制方式、两个细则考核、一二次调频响应要求生成一套取证复习试卷，题目难度中等，重点考察现场处置和规则理解。"
          className="w-full resize-none rounded-[8px] border border-[#DCE8EA] bg-white px-3.5 py-2.5 text-[13.5px] leading-relaxed text-[#1F3440] placeholder:text-[#91A3AA] transition-colors hover:border-[#B8D4D9] focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
          style={{ minHeight: 180, maxHeight: 240 }}
        />

        <p className="mt-2 flex items-start gap-1.5 text-[12px] text-[#91A3AA]">
          <Info className="mt-px h-3.5 w-3.5 shrink-0" />
          AI 将根据你的描述生成试卷基础信息、题型配置、题目、答案、解析和资料依据。生成后仍可人工修改。
        </p>

        {/* 快捷模板 */}
        <div className="mt-4">
          <p className="mb-2 text-[12px] font-medium text-[#607681]">快捷模板</p>
          <div className="flex flex-wrap gap-2">
            {QUICK_TEMPLATES.map((tpl) => (
              <button
                key={tpl.label}
                type="button"
                onClick={() => {
                  p.setPrompt(tpl.text);
                  p.setAiGoal(tpl.label);
                }}
                className="rounded-full border border-[#DCE8EA] bg-white px-3 py-1 text-[12.5px] text-[#607681] transition-colors hover:border-primary hover:text-primary"
              >
                {tpl.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ─── 右侧：生成设置 ─── */}
      <div className="rounded-[12px] border border-[#DCE8EA] bg-white p-6 shadow-[0_8px_24px_rgba(31,52,64,0.06)] lg:p-7">
        <h3 className="mb-4 text-[15px] font-semibold text-[#1F3440]">生成设置</h3>

        <div className="space-y-4">
          {/* 考试目标 */}
          <div>
            <label className="mb-1 block text-[13px] font-medium text-[#425B66]">考试目标</label>
            <SelectField
              value={p.aiGoal}
              onChange={p.setAiGoal}
              options={AI_GOAL_OPTIONS}
            />
          </div>

          {/* 分类 */}
          <div>
            <label className="mb-1 block text-[13px] font-medium text-[#425B66]">分类</label>
            <SelectField
              value={p.aiCategory}
              onChange={p.setAiCategory}
              options={PAPER_CATEGORIES}
              placeholder="请选择"
            />
          </div>

          {/* 适用岗位 */}
          <div>
            <label className="mb-1 block text-[13px] font-medium text-[#425B66]">适用岗位</label>
            <input
              value={p.positionsInput}
              onChange={(e) => p.setPositionsInput(e.target.value)}
              placeholder="值班员、值班长"
              className={INPUT_NUM_CLS}
            />
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {POSITION_SUGGESTIONS.map((pos) => {
                const active = p.positionsInput.includes(pos);
                return (
                  <button
                    key={pos}
                    type="button"
                    onClick={() => togglePosition(pos)}
                    className={cn(
                      "rounded-full border px-2.5 py-0.5 text-[12px] transition-colors",
                      active
                        ? "border-primary bg-primary-soft text-primary"
                        : "border-[#DCE8EA] text-[#607681] hover:border-primary/50 hover:text-primary",
                    )}
                  >
                    {pos}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 题目总数 */}
          <div>
            <label className="mb-1 block text-[13px] font-medium text-[#425B66]">
              题目总数
            </label>
            <input
              type="number"
              min={1}
              value={p.totalCount}
              onChange={(e) => p.setTotalCount(parseInt(e.target.value) || 0)}
              className={INPUT_NUM_CLS}
            />
          </div>

          {/* 题型数量 */}
          <div>
            <label className="mb-1 block text-[13px] font-medium text-[#425B66]">
              题型数量
              {p.singleCount + p.multiCount + p.judgeCount !== p.totalCount && (
                <span className="ml-1.5 text-[11.5px] font-normal text-[#E65A5A]">
                  合计 {p.singleCount + p.multiCount + p.judgeCount}，需等于 {p.totalCount}
                </span>
              )}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                {
                  label: "单选",
                  value: p.singleCount,
                  set: (v: number) => p.setSingleCount(v),
                },
                {
                  label: "多选",
                  value: p.multiCount,
                  set: (v: number) => p.setMultiCount(v),
                },
                {
                  label: "判断",
                  value: p.judgeCount,
                  set: (v: number) => p.setJudgeCount(v),
                },
              ].map((item) => (
                <div key={item.label}>
                  <p className="mb-1 text-center text-[11.5px] text-[#91A3AA]">{item.label}</p>
                  <input
                    type="number"
                    min={0}
                    value={item.value}
                    onChange={(e) => item.set(parseInt(e.target.value) || 0)}
                    className={cn(INPUT_NUM_CLS, "text-center")}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* 难度 | 时长 */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-[13px] font-medium text-[#425B66]">难度</label>
              <SelectField
                value={p.difficulty}
                onChange={(v) => p.setDifficulty(v as Difficulty | "")}
                options={DIFFICULTY_OPTIONS}
              />
            </div>
            <div>
              <label className="mb-1 block text-[13px] font-medium text-[#425B66]">时长（分钟）</label>
              <input
                type="number"
                min={1}
                value={p.duration}
                onChange={(e) => p.setDuration(parseInt(e.target.value) || 30)}
                className={INPUT_NUM_CLS}
              />
            </div>
          </div>

          {/* 及格线 */}
          <div>
            <label className="mb-1 block text-[13px] font-medium text-[#425B66]">及格线（分）</label>
            <input
              type="number"
              min={0}
              max={100}
              value={p.passScore}
              onChange={(e) => p.setPassScore(parseInt(e.target.value) || 60)}
              className={INPUT_NUM_CLS}
            />
          </div>

          {/* 资料范围 */}
          <div>
            <label className="mb-1 block text-[13px] font-medium text-[#425B66]">资料范围</label>
            <SelectField
              value={p.sourceScope}
              onChange={(v) => p.setSourceScope(v as "bank" | "bank+kb" | "kb")}
              options={SOURCE_SCOPE_OPTIONS}
            />
          </div>

          {/* 生成内容 */}
          <div>
            <label className="mb-2 block text-[13px] font-medium text-[#425B66]">生成内容</label>
            <div className="flex flex-col gap-2.5">
              <CheckboxItem checked={p.genAnswer} onToggle={p.toggleGenAnswer} label="生成答案" />
              <CheckboxItem
                checked={p.genAnalysis}
                onToggle={p.toggleGenAnalysis}
                label="生成解析"
              />
              <CheckboxItem
                checked={p.genEvidence}
                onToggle={p.toggleGenEvidence}
                label="生成资料依据"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────── 主向导页 ───────────────────

function NewPaperWizardPage() {
  const { step, source } = Route.useSearch();
  const navigate = useNavigate();

  const isAiMode = source === "ai";
  const STEPS = isAiMode ? AI_STEPS : NORMAL_STEPS;
  const STEP_HINTS = isAiMode ? AI_HINTS : NORMAL_HINTS;
  const maxStep = STEPS.length;
  const currentStep = Math.min(Math.max(Number(step || 1), 1), maxStep);

  /**
   * contentStep 映射：
   *  0 = AI 起草（仅 AI 模式 step=1）
   *  1 = 基本信息
   *  2 = 组卷策略
   *  3 = 下发设置
   */
  const contentStep = isAiMode ? currentStep - 1 : currentStep;

  // ── AI 表单状态 ──
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiGoal, setAiGoal] = useState("取证复习");
  const [aiCategory, setAiCategory] = useState("");
  const [aiPositionsInput, setAiPositionsInput] = useState("");
  const [aiTotalCount, setAiTotalCount] = useState(20);
  const [aiSingleCount, setAiSingleCount] = useState(10);
  const [aiMultiCount, setAiMultiCount] = useState(5);
  const [aiJudgeCount, setAiJudgeCount] = useState(5);
  const [aiDifficulty, setAiDifficulty] = useState<Difficulty | "">( "中");
  const [aiDuration, setAiDuration] = useState(30);
  const [aiPassScore, setAiPassScore] = useState(60);
  const [aiSourceScope, setAiSourceScope] = useState<"bank" | "bank+kb" | "kb">("bank");
  const [aiGenAnswer, setAiGenAnswer] = useState(true);
  const [aiGenAnalysis, setAiGenAnalysis] = useState(true);
  const [aiGenEvidence, setAiGenEvidence] = useState(true);

  // ── AI 生成状态 ──
  const [aiStatus, setAiStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [aiError, setAiError] = useState("");
  const aiDraftDone = aiStatus === "done";

  // ── 试卷表单状态 ──
  const [basicInfo, setBasicInfo] = useState<PaperBasicInfo>(EMPTY_BASIC);
  const [draftReady, setDraftReady] = useState(false);
  const [assigneeCount, setAssigneeCount] = useState(0);
  const [fromAiDraft, setFromAiDraft] = useState(false);

  const {
    groups,
    collapsed,
    toggleCollapse,
    moveQuestion,
    removeQuestion,
    moveGroup,
    removeGroup,
    addGroup,
    resetGroups,
    summary,
    appendFromBank,
  } = usePaperQuestionGroups([{ type: "单选题", perScore: TYPE_PER_SCORE["单选题"], questions: [] }]);

  const [addType, setAddType] = useState<QuestionType | null>(null);

  // 载入草稿（仅普通模式）
  useEffect(() => {
    if (!isAiMode) {
      const draft = loadDraft();
      if (draft) {
        setBasicInfo(draft.basicInfo);
        resetGroups(draft.groups);
      }
    }
    setDraftReady(true);
  }, [isAiMode, resetGroups]);

  // 自动保存
  useEffect(() => {
    if (!draftReady) return;
    saveDraft({ basicInfo, groups });
  }, [basicInfo, groups, draftReady]);

  const updateBasic = <K extends keyof PaperBasicInfo>(key: K, val: PaperBasicInfo[K]) => {
    setBasicInfo((p) => ({ ...p, [key]: val }));
  };

  // ── 计算 ──
  const totalQuestions = groups.reduce((s, g) => s + g.questions.length, 0);
  const totalScore = (summary.find((s) => s.label === "试卷总分")?.value ?? 0) as number;
  const canCompleteBasic = basicInfo.name.trim().length > 0;
  const canCompleteStrategy = groups.length > 0 && totalQuestions > 0;

  const maxReachableStep = useMemo(() => {
    if (isAiMode) {
      if (!aiDraftDone) return 1;
      return canCompleteBasic ? (canCompleteStrategy ? 4 : 3) : 2;
    }
    return canCompleteBasic ? (canCompleteStrategy ? 3 : 2) : 1;
  }, [isAiMode, aiDraftDone, canCompleteBasic, canCompleteStrategy]);

  const goStep = (n: number) =>
    navigate({ to: "/exam-admin/paper/new", search: { step: n, source } });

  const canOpenStep = (n: number) => n <= currentStep || n <= maxReachableStep;

  // ── AI 生成 ──
  const handleAiGenerate = async () => {
    if (!aiPrompt.trim()) {
      toast.error("请先输入组卷需求");
      return;
    }
    if (aiTotalCount <= 0) {
      toast.error("题目数量需大于 0");
      return;
    }
    if (aiSingleCount + aiMultiCount + aiJudgeCount !== aiTotalCount) {
      toast.error("题型数量合计需等于题目总数");
      return;
    }

    const positions = aiPositionsInput
      .split(/[,，、\s]+/)
      .map((s) => s.trim())
      .filter(Boolean);

    const params: AiDraftParams = {
      prompt: aiPrompt,
      goal: aiGoal,
      category: aiCategory,
      positions,
      totalCount: aiTotalCount,
      typeRatio: { 单选题: aiSingleCount, 多选题: aiMultiCount, 判断题: aiJudgeCount },
      difficulty: aiDifficulty,
      duration: aiDuration,
      passScore: aiPassScore,
      sourceScope: aiSourceScope,
      genAnswer: aiGenAnswer,
      genAnalysis: aiGenAnalysis,
      genEvidence: aiGenEvidence,
    };

    setAiStatus("loading");
    setAiError("");

    try {
      const draft = await generateExamDraft(params);

      // 预填基础信息
      setBasicInfo(draft.basicInfo);

      // 转换为 EditorGroup
      const editorGroups: EditorGroup[] = draft.groups.map((g) => ({
        type: g.type,
        perScore: g.perScore,
        questions: g.questions.map((q) => ({
          id: q.id,
          stem: q.stem,
          knowledge: q.knowledge,
          difficulty: q.difficulty,
          source: q.source,
          score: q.score,
          options: q.options,
          answer: q.answer,
          isAIGenerated: true as const,
        })),
      }));
      resetGroups(editorGroups);
      setFromAiDraft(true);
      setAiStatus("done");

      const questionCount = draft.groups.reduce((s, g) => s + g.questions.length, 0);
      toast.success(`AI 已生成 ${questionCount} 道题目，已跳转至题目编辑`);

      // 跳转到第 3 步（组卷策略，在 AI 模式中是步骤 3）
      goStep(3);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "试卷草稿生成失败，请稍后重试。";
      setAiStatus("error");
      setAiError(msg);
    }
  };

  // ── 普通下一步 ──
  const handleNext = () => {
    if (contentStep === 1) {
      if (!basicInfo.name.trim()) { toast.error("请填写试卷名称"); return; }
      goStep(currentStep + 1);
    } else if (contentStep === 2) {
      if (groups.length === 0) { toast.error("请至少添加一种题型"); return; }
      if (totalQuestions < 1) { toast.error("请至少添加 1 道题目"); return; }
      goStep(currentStep + 1);
    }
  };

  const handlePrev = () => { if (currentStep > 1) goStep(currentStep - 1); };

  const handleRemoveGroup = (type: QuestionType) => {
    if (groups.length <= 1) { toast.warning("至少保留一种题型"); return; }
    removeGroup(type);
  };

  const finish = (mode: "assign" | "draft") => {
    sessionStorage.removeItem(PAPER_DRAFT_KEY);
    toast.success(mode === "assign" ? "试卷已下发" : "试卷已暂存为草稿");
    navigate({ to: "/exam-admin" });
  };

  const isAiLoading = aiStatus === "loading";

  return (
    <PageShell>
      <div className="relative -mx-6 -my-7 min-h-[calc(100vh-64px)] bg-[#F5FAFB] px-6 py-7 lg:-mx-8 lg:px-8">
        <div className="relative mx-auto w-full max-w-[1180px] pb-24">

          {/* ── 页面头部 ── */}
          <div className="mb-5">
            <Link
              to="/exam-admin"
              className="inline-flex items-center gap-1 text-[12px] text-muted-foreground transition-colors hover:text-primary"
            >
              <ChevronLeft className="h-3.5 w-3.5" /> 返回考试管理
            </Link>
            <div className="mt-2 flex items-center gap-2">
              {isAiMode ? (
                <Sparkles className="h-[18px] w-[18px] text-primary" />
              ) : (
                <FileText className="h-[18px] w-[18px] text-primary" />
              )}
              <h1 className="text-[20px] font-semibold text-[#1F3440]">
                {isAiMode ? "智能组卷" : "新建试卷"}
              </h1>
            </div>
          </div>

          {/* ── 步骤条 ── */}
          <div className="mb-[10px] rounded-[12px] border border-[#E3EEF0] bg-white px-6 py-5 shadow-[0_8px_24px_rgba(31,52,64,0.04)]">
            <nav aria-label="步骤导航" className="flex items-center justify-center">
              {STEPS.map((label, i) => {
                const n = i + 1;
                const active = currentStep === n;
                const done = currentStep > n;
                const reachable = canOpenStep(n);
                const connectorDone = currentStep > n;

                return (
                  <div key={label} className="flex items-center">
                    {i > 0 && (
                      <div
                        aria-hidden
                        className={cn(
                          "mx-2 h-px shrink-0 transition-colors sm:mx-3",
                          isAiMode ? "w-12 sm:w-16 md:w-20" : "w-16 sm:w-20 md:w-28",
                          connectorDone ? "bg-primary/45" : "bg-[#DCE8EA]",
                        )}
                      />
                    )}
                    <button
                      type="button"
                      disabled={!reachable}
                      onClick={() => { if (n !== currentStep && canOpenStep(n)) goStep(n); }}
                      aria-current={active ? "step" : undefined}
                      className={cn(
                        "group flex flex-col items-center gap-2 rounded-[8px] px-2 py-1 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/25",
                        isAiMode ? "min-w-[72px]" : "min-w-[88px]",
                        reachable && !active && "hover:bg-[#F5FAFB]",
                        !reachable && !done && !active && "cursor-not-allowed",
                      )}
                    >
                      <span
                        className={cn(
                          "flex h-9 w-9 items-center justify-center rounded-full text-[13px] font-semibold transition-all",
                          active && "bg-primary text-white shadow-[0_0_0_4px_rgba(52,155,172,0.14)]",
                          done && "border border-primary/25 bg-primary text-white",
                          !active && !done && "border border-[#DCE8EA] bg-white text-[#9AAAB0]",
                        )}
                      >
                        {done ? (
                          <Check className="h-4 w-4 stroke-[2.5]" />
                        ) : n === 1 && isAiMode ? (
                          <Sparkles className="h-4 w-4" />
                        ) : (
                          n
                        )}
                      </span>
                      <span
                        className={cn(
                          "whitespace-nowrap text-[12.5px] leading-none",
                          active && "font-semibold text-primary",
                          done && "font-medium text-[#2F8D9D]",
                          !active && !done && "font-medium text-[#9AAAB0]",
                        )}
                      >
                        {label}
                      </span>
                    </button>
                  </div>
                );
              })}
            </nav>

            <div className="mt-4 flex items-start gap-2.5 border-t border-[#EDF3F5] pt-3.5">
              <span className="mt-px shrink-0 rounded-[4px] bg-primary-soft px-2 py-0.5 text-[11px] font-medium text-primary">
                步骤 {currentStep}/{maxStep}
              </span>
              <p className="text-[13px] leading-relaxed text-[#6B7F88]">
                {STEP_HINTS[currentStep - 1]}
              </p>
            </div>
          </div>

          {/* ── 步骤内容 ── */}

          {/* Step 0: AI 起草 */}
          {contentStep === 0 && (
            <AiDraftStepContent
              prompt={aiPrompt}
              setPrompt={setAiPrompt}
              aiGoal={aiGoal}
              setAiGoal={setAiGoal}
              aiCategory={aiCategory}
              setAiCategory={setAiCategory}
              positionsInput={aiPositionsInput}
              setPositionsInput={setAiPositionsInput}
              totalCount={aiTotalCount}
              setTotalCount={setAiTotalCount}
              singleCount={aiSingleCount}
              setSingleCount={setAiSingleCount}
              multiCount={aiMultiCount}
              setMultiCount={setAiMultiCount}
              judgeCount={aiJudgeCount}
              setJudgeCount={setAiJudgeCount}
              difficulty={aiDifficulty}
              setDifficulty={setAiDifficulty}
              duration={aiDuration}
              setDuration={setAiDuration}
              passScore={aiPassScore}
              setPassScore={setAiPassScore}
              sourceScope={aiSourceScope}
              setSourceScope={setAiSourceScope}
              genAnswer={aiGenAnswer}
              toggleGenAnswer={() => setAiGenAnswer((v) => !v)}
              genAnalysis={aiGenAnalysis}
              toggleGenAnalysis={() => setAiGenAnalysis((v) => !v)}
              genEvidence={aiGenEvidence}
              toggleGenEvidence={() => setAiGenEvidence((v) => !v)}
              aiStatus={aiStatus}
              aiError={aiError}
              aiDraftDone={aiDraftDone}
            />
          )}

          {/* Step 1: 基本信息 */}
          {contentStep === 1 && (
            <section className="rounded-[12px] bg-white p-6 shadow-[0px_0px_10px_0px_rgba(0,0,0,0.05)] lg:p-7">
              {fromAiDraft && (
                <div className="mb-5 flex items-center gap-2 rounded-[8px] border border-[#B8DFE5] bg-[#EAF7F9] px-4 py-2.5">
                  <Sparkles className="h-4 w-4 shrink-0 text-primary" />
                  <p className="text-[13px] text-[#2F8D9D]">
                    以下内容由 AI 起草，请确认后继续。可随时返回第 1 步重新生成。
                  </p>
                </div>
              )}
              <SectionTitle>基本信息</SectionTitle>
              <div className="space-y-5">
                <div>
                  <FieldLabel required>试卷名称</FieldLabel>
                  <Input
                    value={basicInfo.name}
                    onChange={(e) => updateBasic("name", e.target.value)}
                    placeholder="请输入试卷名称"
                    className={INPUT_CLS}
                  />
                </div>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div>
                    <FieldLabel hint="用于明确本试卷考察方向">考试目标</FieldLabel>
                    <div className="relative">
                      <select
                        value={basicInfo.goal}
                        onChange={(e) => updateBasic("goal", e.target.value as ExamGoal)}
                        className={SELECT_CLS}
                      >
                        {GOAL_OPTIONS.map((g) => (
                          <option key={g} value={g}>{g}</option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#9AAAB0]" />
                    </div>
                  </div>
                  <div>
                    <FieldLabel>分类</FieldLabel>
                    <div className="relative">
                      <select
                        value={basicInfo.category}
                        onChange={(e) => updateBasic("category", e.target.value)}
                        className={SELECT_CLS}
                      >
                        <option value="">请选择</option>
                        {PAPER_CATEGORIES.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#9AAAB0]" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div>
                    <FieldLabel>适用岗位</FieldLabel>
                    <Input
                      value={basicInfo.position}
                      onChange={(e) => updateBasic("position", e.target.value)}
                      placeholder="值班员 / 值班长"
                      className={INPUT_CLS}
                    />
                  </div>
                  <div>
                    <FieldLabel>时长（分钟）</FieldLabel>
                    <Input
                      type="number"
                      value={basicInfo.duration}
                      onChange={(e) => updateBasic("duration", e.target.value)}
                      className={INPUT_CLS}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div>
                    <FieldLabel>及格线（分）</FieldLabel>
                    <Input
                      type="number"
                      value={basicInfo.passLine}
                      onChange={(e) => updateBasic("passLine", e.target.value)}
                      className={INPUT_CLS}
                    />
                  </div>
                  <div>
                    <FieldLabel>难度</FieldLabel>
                    <div className="relative">
                      <select
                        value={basicInfo.difficulty}
                        onChange={(e) => updateBasic("difficulty", e.target.value as Difficulty | "")}
                        className={SELECT_CLS}
                      >
                        {DIFFICULTY_OPTIONS.map((d) => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#9AAAB0]" />
                    </div>
                  </div>
                </div>

                <div>
                  <FieldLabel>备注</FieldLabel>
                  <Input
                    value={basicInfo.note}
                    onChange={(e) => updateBasic("note", e.target.value)}
                    placeholder="选填，不超过 200 字"
                    className={INPUT_CLS}
                  />
                </div>
              </div>
            </section>
          )}

          {/* Step 2: 组卷策略 */}
          {contentStep === 2 && (
            <div className="space-y-[10px]">
              {fromAiDraft && (
                <div className="flex items-center gap-2 rounded-[8px] border border-[#B8DFE5] bg-[#EAF7F9] px-4 py-2.5">
                  <Sparkles className="h-4 w-4 shrink-0 text-primary" />
                  <p className="text-[13px] text-[#2F8D9D]">
                    以下题目由 AI 自动生成，带
                    <span className="mx-1 inline-flex items-center rounded-[4px] bg-[#EAF7F9] px-1.5 py-0.5 text-[11px] font-medium text-primary">
                      AI 生成
                    </span>
                    标签。可继续编辑、删除或从题库替换。
                  </p>
                </div>
              )}
              <PaperTypeToolbar groups={groups} onAddGroup={addGroup} />
              <PaperQuestionSummary summary={summary} />
              <PaperQuestionList
                groups={groups}
                collapsed={collapsed}
                onToggleCollapse={toggleCollapse}
                onAdd={setAddType}
                onMoveQuestion={moveQuestion}
                onRemoveQuestion={removeQuestion}
                onMoveGroup={moveGroup}
                onRemoveGroup={handleRemoveGroup}
              />
              <AddQuestionDialog
                open={addType !== null}
                type={addType ?? undefined}
                onClose={() => setAddType(null)}
                onAdd={(ids) => {
                  if (addType) appendFromBank(addType, ids);
                  toast.success(`已添加 ${ids.length} 题`);
                }}
              />
            </div>
          )}

          {/* Step 3: 下发设置 */}
          {contentStep === 3 && (
            <section className="rounded-[12px] bg-white p-6 shadow-[0px_0px_10px_0px_rgba(0,0,0,0.05)] lg:p-7">
              <SectionTitle>下发设置</SectionTitle>
              <div className="mb-5 rounded-[8px] border border-[#DCE8EA] bg-[#F5FAFB] px-4 py-3">
                <div className="text-[14px] font-semibold text-[#1F3440]">
                  {basicInfo.name || "未命名试卷"}
                </div>
                <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12.5px] text-muted-foreground">
                  <span>{basicInfo.goal}</span>
                  {basicInfo.category && <span>{basicInfo.category}</span>}
                  <span className="text-[#DCE8EA]">|</span>
                  <span>{totalQuestions} 题</span>
                  <span>总分 {totalScore} 分</span>
                  <span>{basicInfo.duration} 分钟</span>
                  {basicInfo.difficulty && <span>难度：{basicInfo.difficulty}</span>}
                </div>
              </div>
              <AssignPanel
                onAssign={() => finish("assign")}
                onDraft={() => finish("draft")}
                showDraft
                hideActions
                onSelectionChange={setAssigneeCount}
              />
            </section>
          )}
        </div>

        {/* ── 底部操作栏 ── */}
        <div className="fixed inset-x-0 bottom-0 z-50 border-t border-[#EDF3F5] bg-white shadow-[0_-2px_12px_rgba(31,52,64,0.06)]">
          <div className="mx-auto flex h-16 w-full max-w-[1180px] items-center justify-between px-6 lg:px-8">
            {/* 左侧状态 */}
            <div className="flex min-w-0 items-center gap-2.5 text-[13px]">
              <span className="font-semibold text-[#1F3440]">
                步骤 {currentStep}/{maxStep}
              </span>
              <span className="text-[#DCE8EA]">·</span>
              {isAiLoading ? (
                <span className="flex items-center gap-1.5 text-primary">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  正在生成草稿…
                </span>
              ) : (
                <span className="text-muted-foreground">{STEPS[currentStep - 1]}</span>
              )}
              {contentStep === 2 && totalQuestions > 0 && (
                <span className="rounded-full bg-primary-soft px-2 py-0.5 text-[11px] font-medium text-primary">
                  {totalQuestions} 题 · {totalScore} 分
                </span>
              )}
              {contentStep === 3 && assigneeCount > 0 && (
                <span className="rounded-full bg-primary-soft px-2 py-0.5 text-[11px] font-medium text-primary">
                  已选 {assigneeCount} 人
                </span>
              )}
            </div>

            {/* 右侧按钮 */}
            <div className="flex items-center gap-2">
              {/* AI 起草步骤的取消按钮 */}
              {contentStep === 0 && (
                <Link
                  to="/exam-admin"
                  className="inline-flex h-9 items-center gap-1.5 rounded-[8px] border border-[#DCE8EA] bg-white px-4 text-[13px] font-medium text-[#1F3440] transition-colors hover:bg-[#F5FAFB]"
                >
                  取消 / 返回考试管理
                </Link>
              )}

              {/* 普通步骤的上一步 */}
              {contentStep > 0 && (
                <button
                  type="button"
                  disabled={currentStep <= 1}
                  onClick={handlePrev}
                  className="inline-flex h-9 items-center gap-1.5 rounded-[8px] border border-[#DCE8EA] bg-white px-4 text-[13px] font-medium text-[#1F3440] transition-colors hover:bg-[#F5FAFB] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft className="h-4 w-4" />
                  上一步
                </button>
              )}

              {/* AI 起草：生成按钮 */}
              {contentStep === 0 && (
                <button
                  type="button"
                  disabled={isAiLoading}
                  onClick={handleAiGenerate}
                  className="inline-flex h-9 items-center gap-1.5 rounded-[8px] bg-primary px-5 text-[13px] font-medium text-white transition-colors hover:bg-[#2F8D9D] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isAiLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      正在生成...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      生成试卷草稿
                    </>
                  )}
                </button>
              )}

              {/* 基本信息 / 组卷策略：下一步 */}
              {(contentStep === 1 || contentStep === 2) && (
                <button
                  type="button"
                  onClick={handleNext}
                  className="inline-flex h-9 items-center gap-1.5 rounded-[8px] bg-primary px-5 text-[13px] font-medium text-white transition-colors hover:bg-[#2F8D9D]"
                >
                  下一步
                  <ChevronRight className="h-4 w-4" />
                </button>
              )}

              {/* 下发设置：暂存 + 确认下发 */}
              {contentStep === 3 && (
                <>
                  <button
                    type="button"
                    onClick={() => finish("draft")}
                    className="inline-flex h-9 items-center gap-1.5 rounded-[8px] border border-[#DCE8EA] bg-white px-4 text-[13px] font-medium text-[#1F3440] transition-colors hover:bg-[#F5FAFB]"
                  >
                    <Save className="h-4 w-4 text-muted-foreground" />
                    暂存草稿
                  </button>
                  <button
                    type="button"
                    disabled={assigneeCount === 0}
                    onClick={() => finish("assign")}
                    className="inline-flex h-9 items-center gap-1.5 rounded-[8px] bg-primary px-5 text-[13px] font-medium text-white transition-colors hover:bg-[#2F8D9D] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Send className="h-4 w-4" />
                    确认下发
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}

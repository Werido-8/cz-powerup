import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import {
  AlignLeft,
  BarChart3,
  BookOpen,
  BriefcaseBusiness,
  Check,
  CheckSquare,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleDot,
  Clock3,
  Eye,
  FileText,
  Folder,
  Gauge,
  Info,
  Loader2,
  Save,
  Send,
  Settings2,
  ShieldCheck,
  Sparkles,
  Square,
  Target,
  TextCursorInput,
  ToggleLeft,
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
  PAPERS,
  TYPE_PER_SCORE,
  getPaperQuestionGroups,
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
  source: z.enum(["ai", "manual", "existing"]).optional(),
});

export const Route = createFileRoute("/exam-admin/paper/new")({
  validateSearch: searchSchema,
  component: NewPaperWizardPage,
  head: () => ({ meta: [{ title: "新建试卷 · 考试管理" }] }),
});

// ─────────────────── 常量 ───────────────────

/** 普通模式 3 步 */
const NORMAL_STEPS = ["基本信息", "组卷策略", "试卷下发"];

/** AI 模式 4 步（步骤 1 = AI 起草，步骤 2~4 = 普通 1~3） */
const AI_STEPS = ["AI 起草", "基本信息", "组卷策略", "试卷下发"];

const GOAL_OPTIONS: ExamGoal[] = ["取证复习", "复证巩固", "岗位达标", "阶段测评", "日常自测"];
const DIFFICULTY_OPTIONS: Difficulty[] = ["易", "中", "难"];

const AI_GOAL_OPTIONS = ["取证复习", "新员工自测", "专项能力测评", "规程学习检查", "错题巩固"];
const SPECIALTY_SUGGESTIONS = ["运行专业", "电气专业", "继电保护", "涉网与调度", "安全管理"];
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
  specialty: "",
  duration: "30",
  passLine: "60",
  totalScore: "100",
  scoreMode: "fixed",
  difficulty: "中",
  note: "",
};

type Draft = { basicInfo: PaperBasicInfo; groups: EditorGroup[] };

function formatScore(value: number) {
  return Number.isInteger(value)
    ? String(value)
    : value.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
}

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
    <div className="mb-1.5 flex min-h-5 items-baseline gap-1.5">
      <label className="shrink-0 text-[13px] font-medium text-[#425B66]">
        {children}
        {required && <span className="ml-0.5 text-[#E65A5A]">*</span>}
      </label>
      {hint ? <span className="truncate text-[11px] text-[#9AAAB0]">{hint}</span> : null}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-center">
      <span className="mr-[5px] h-[1em] w-[5px] shrink-0 rounded-[1px] bg-primary" />
      <h2 className="text-[15px] font-bold leading-none">{children}</h2>
    </div>
  );
}

type OverviewIcon = React.ComponentType<{ className?: string }>;

function OverviewRow({
  icon: Icon,
  label,
  value,
  muted = false,
}: {
  icon: OverviewIcon;
  label: string;
  value: React.ReactNode;
  muted?: boolean;
}) {
  return (
    <div className="flex min-h-7 items-center gap-2.5">
      <Icon className="h-3.5 w-3.5 shrink-0 text-primary" />
      <span className="min-w-0 flex-1 text-[12px] text-[#536B76]">{label}</span>
      <span
        className={cn(
          "max-w-[58%] truncate text-right text-[12px] font-medium",
          muted ? "text-[#9AAAB0]" : "text-[#425B66]",
        )}
      >
        {value}
      </span>
    </div>
  );
}

function OverviewBlock({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-[10px] border border-[#E3EEF0] bg-white p-4 shadow-[0_4px_16px_rgba(31,52,64,0.035)]",
        className,
      )}
    >
      <h3 className="mb-2.5 text-[12.5px] font-semibold text-primary">{title}</h3>
      {children}
    </section>
  );
}

const QUESTION_TYPE_META: Record<
  QuestionType,
  { icon: OverviewIcon; color: string; short: string }
> = {
  单选题: { icon: CircleDot, color: "#349BAC", short: "单选" },
  多选题: { icon: CheckSquare, color: "#4C7FE8", short: "多选" },
  判断题: { icon: ToggleLeft, color: "#D89020", short: "判断" },
  填空题: { icon: TextCursorInput, color: "#7B6BC7", short: "填空" },
  简答题: { icon: AlignLeft, color: "#5A7380", short: "简答" },
  案例分析题: { icon: BookOpen, color: "#C45C7A", short: "案例" },
};

function TypeDistDonut({
  segments,
  total,
  label,
}: {
  segments: { key: string; value: number; color: string }[];
  total: number;
  label: string;
}) {
  const size = 88;
  const thickness = 15;
  const center = size / 2;
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;
  const sum = segments.reduce((acc, segment) => acc + segment.value, 0);
  const gap = segments.length > 1 ? 2.5 : 0;
  let consumed = 0;

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={label}>
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="#EDF3F5"
          strokeWidth={thickness}
        />
        <g transform={`rotate(-90 ${center} ${center})`}>
          {sum > 0 &&
            segments.map((segment) => {
              const length = (segment.value / sum) * circumference;
              const dash = Math.max(0.5, length - gap);
              const dashOffset = -consumed;
              consumed += length;
              return (
                <circle
                  key={segment.key}
                  cx={center}
                  cy={center}
                  r={radius}
                  fill="none"
                  stroke={segment.color}
                  strokeWidth={thickness}
                  strokeDasharray={`${dash} ${circumference - dash}`}
                  strokeDashoffset={dashOffset}
                >
                  <title>{`${segment.key} ${segment.value} 题`}</title>
                </circle>
              );
            })}
        </g>
      </svg>
      <span className="pointer-events-none absolute inset-0 grid place-items-center">
        <span className="text-center leading-none">
          <span className="block text-[16px] font-bold tabular-nums text-[#1F3440]">{total}</span>
          <span className="mt-0.5 block text-[9px] text-[#9AAAB0]">题</span>
        </span>
      </span>
    </div>
  );
}

function TypeDistChart({
  groups,
  totalQuestions,
  scoreMode,
  totalScore,
}: {
  groups: EditorGroup[];
  totalQuestions: number;
  scoreMode: NonNullable<PaperBasicInfo["scoreMode"]>;
  totalScore: number;
}) {
  const items = groups
    .filter((group) => group.questions.length > 0)
    .map((group) => {
      const meta = QUESTION_TYPE_META[group.type];
      return {
        type: group.type,
        count: group.questions.length,
        score: group.questions.length * group.perScore,
        icon: meta.icon,
        color: meta.color,
        short: meta.short,
      };
    });
  const summary = items.map((item) => `${item.type} ${item.count} 题`).join("，");

  return (
    <div>
      <p className="sr-only">{summary}</p>
      <div className="flex items-center gap-3">
        <TypeDistDonut
          segments={items.map((item) => ({
            key: item.type,
            value: item.count,
            color: item.color,
          }))}
          total={totalQuestions}
          label={`题型分布：${summary}`}
        />
        <ul className="min-w-0 flex-1 space-y-1">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <li
                key={item.type}
                className="flex min-h-6 items-center gap-1.5"
                title={
                  scoreMode !== "unscored"
                    ? `${item.type} ${item.count} 题 / ${formatScore(item.score)} 分`
                    : `${item.type} ${item.count} 题`
                }
              >
                <span
                  className="flex h-5 w-5 shrink-0 items-center justify-center rounded-[5px]"
                  style={{ backgroundColor: `${item.color}18`, color: item.color }}
                >
                  <Icon className="h-3 w-3" aria-hidden />
                </span>
                <span className="min-w-0 flex-1 truncate text-[11px] text-[#536B76]">{item.short}</span>
                <span className="shrink-0 text-[11px] font-medium tabular-nums text-[#425B66]">
                  {item.count}题
                  {scoreMode !== "unscored" ? ` / ${formatScore(item.score)}分` : ""}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
      {scoreMode !== "unscored" && (
        <div className="mt-2.5 flex items-center justify-between border-t border-[#EDF3F5] pt-2 text-[12px]">
          <span className="text-[#6B7F88]">当前卷面分</span>
          <strong className="font-semibold tabular-nums text-[#1F3440]">
            {formatScore(totalScore)} 分
          </strong>
        </div>
      )}
    </div>
  );
}

function PaperSettingsOverview({
  basicInfo,
  groups,
  totalQuestions,
  totalScore,
  targetScore,
  hasValidTargetScore,
  scoreMode,
  modeLabel,
}: {
  basicInfo: PaperBasicInfo;
  groups: EditorGroup[];
  totalQuestions: number;
  totalScore: number;
  targetScore: number;
  hasValidTargetScore: boolean;
  scoreMode: NonNullable<PaperBasicInfo["scoreMode"]>;
  modeLabel: string;
}) {
  const scoreModeText =
    scoreMode === "fixed" ? "固定总分" : scoreMode === "variable" ? "按题计分" : "不设分数";
  const strategyText =
    modeLabel === "智能组卷"
      ? "AI 起草，人工确认"
      : modeLabel === "选用已有试卷"
        ? "基于已有试卷调整"
        : "手动组卷";

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-[10px] border border-[#E3EEF0] bg-white p-4 shadow-[0_8px_24px_rgba(31,52,64,0.05)]">
      <div className="mb-3.5 flex items-center justify-between">
        <h2 className="text-[15px] font-bold text-[#1F3440]">试卷设置概览</h2>
      </div>

      <div className="flex flex-1 flex-col space-y-2.5">
        <OverviewBlock title="基础信息">
          <div className="space-y-0.5">
            <OverviewRow icon={FileText} label="组卷方式" value={strategyText} />
            <OverviewRow icon={Target} label="考试目标" value={basicInfo.goal || "未选择"} />
            <OverviewRow
              icon={Folder}
              label="分类"
              value={basicInfo.category || "未选择"}
              muted={!basicInfo.category}
            />
            <OverviewRow
              icon={BriefcaseBusiness}
              label="适用专业"
              value={basicInfo.specialty || "未选择"}
              muted={!basicInfo.specialty}
            />
            <OverviewRow
              icon={Clock3}
              label="时长（分钟）"
              value={`${basicInfo.duration || 0} 分钟`}
            />
            <OverviewRow
              icon={Gauge}
              label="难度"
              value={basicInfo.difficulty || "未选择"}
              muted={!basicInfo.difficulty}
            />
            <OverviewRow icon={Settings2} label="成绩设置" value={scoreModeText} />
            <OverviewRow
              icon={BarChart3}
              label="总分"
              value={
                scoreMode === "fixed"
                  ? `${hasValidTargetScore ? formatScore(targetScore) : "未设置"} 分`
                  : "不设固定总分"
              }
              muted={scoreMode === "fixed" && !hasValidTargetScore}
            />
            <OverviewRow
              icon={ShieldCheck}
              label="及格线"
              value={scoreMode === "fixed" ? `${basicInfo.passLine || 0} 分` : "不设置"}
              muted={scoreMode !== "fixed"}
            />
          </div>
        </OverviewBlock>

        <OverviewBlock
          title={`题型分布${totalQuestions > 0 ? `（${totalQuestions} 题）` : "（待设置）"}`}
          className="flex min-h-0 flex-1 flex-col"
        >
          {totalQuestions > 0 ? (
            <div className="flex flex-1 flex-col justify-center">
              <TypeDistChart
                groups={groups}
                totalQuestions={totalQuestions}
                scoreMode={scoreMode}
                totalScore={totalScore}
              />
            </div>
          ) : (
            <div className="flex min-h-28 flex-1 flex-col items-center justify-center text-center">
              <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-full bg-[#F1FAFB]">
                <BarChart3 className="h-5 w-5 text-primary/45" />
              </div>
              <p className="text-[12px] font-medium text-[#6B7F88]">暂无题型配置</p>
              <p className="mt-1 text-[11px] leading-5 text-[#9AAAB0]">
                在“组卷策略”中添加题型后显示统计信息
              </p>
            </div>
          )}
        </OverviewBlock>
      </div>
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
  options: ReadonlyArray<string | { readonly value: string; readonly label: string }>;
  placeholder?: string;
}) {
  return (
    <div className="relative">
      <select value={value} onChange={(e) => onChange(e.target.value)} className={SELECT_CLS}>
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => {
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
  specialtyInput: string;
  setSpecialtyInput: (v: string) => void;
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

  return (
    <div
      className={cn(
        "grid h-full min-h-0 gap-3 overflow-hidden lg:grid-cols-[minmax(0,1fr)_340px]",
        isLoading && "pointer-events-none opacity-60",
      )}
    >
      {/* ─── 左侧：组卷需求 ─── */}
      <div className="flex min-h-0 flex-col overflow-y-auto rounded-[12px] border border-[#DCE8EA] bg-white p-5 shadow-[0_8px_24px_rgba(31,52,64,0.06)]">
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
          AI
          将根据你的描述生成试卷基础信息、题型配置、题目、答案、解析和资料依据。生成后仍可人工修改。
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
      <div className="min-h-0 overflow-y-auto rounded-[12px] border border-[#DCE8EA] bg-white p-5 shadow-[0_8px_24px_rgba(31,52,64,0.06)]">
        <h3 className="mb-3 text-[15px] font-semibold text-[#1F3440]">生成设置</h3>

        <div className="space-y-3">
          {/* 考试目标 */}
          <div>
            <label className="mb-1 block text-[13px] font-medium text-[#425B66]">考试目标</label>
            <SelectField value={p.aiGoal} onChange={p.setAiGoal} options={AI_GOAL_OPTIONS} />
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

          {/* 适用专业 */}
          <div>
            <label className="mb-1 block text-[13px] font-medium text-[#425B66]">适用专业</label>
            <SelectField
              value={p.specialtyInput}
              onChange={p.setSpecialtyInput}
              options={SPECIALTY_SUGGESTIONS}
              placeholder="请选择"
            />
          </div>

          {/* 题目总数 */}
          <div>
            <label className="mb-1 block text-[13px] font-medium text-[#425B66]">题目总数</label>
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
              <label className="mb-1 block text-[13px] font-medium text-[#425B66]">
                时长（分钟）
              </label>
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
            <label className="mb-1 block text-[13px] font-medium text-[#425B66]">
              及格线（分）
            </label>
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
  const isExistingMode = source === "existing";
  const STEPS = isAiMode ? AI_STEPS : NORMAL_STEPS;
  const maxStep = STEPS.length;
  const currentStep = Math.min(Math.max(Number(step || 1), 1), maxStep);

  /**
   * contentStep 映射：
   *  0 = AI 起草（仅 AI 模式 step=1）
   *  1 = 基本信息
   *  2 = 组卷策略
   *  3 = 试卷下发
   */
  const contentStep = isAiMode ? currentStep - 1 : currentStep;

  // ── AI 表单状态 ──
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiGoal, setAiGoal] = useState("取证复习");
  const [aiCategory, setAiCategory] = useState("");
  const [aiSpecialtyInput, setAiSpecialtyInput] = useState("");
  const [aiTotalCount, setAiTotalCount] = useState(20);
  const [aiSingleCount, setAiSingleCount] = useState(10);
  const [aiMultiCount, setAiMultiCount] = useState(5);
  const [aiJudgeCount, setAiJudgeCount] = useState(5);
  const [aiDifficulty, setAiDifficulty] = useState<Difficulty | "">("中");
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
  const [selectedExistingPaperId, setSelectedExistingPaperId] = useState<string | null>(null);

  const {
    groups,
    collapsed,
    toggleCollapse,
    moveQuestion,
    removeQuestion,
    moveGroup,
    removeGroup,
    addGroup,
    updateGroupScore,
    resetGroups,
    summary,
    appendFromBank,
    appendFromBankAuto,
  } = usePaperQuestionGroups([
    { type: "单选题", perScore: TYPE_PER_SCORE["单选题"], questions: [] },
  ]);

  const [addType, setAddType] = useState<QuestionType | null>(null);
  const [directAddOpen, setDirectAddOpen] = useState(false);

  // 载入草稿（已有试卷模式保持当前选择，不覆盖为本地草稿）
  useEffect(() => {
    if (!isAiMode && !isExistingMode) {
      const draft = loadDraft();
      if (draft) {
        setBasicInfo(draft.basicInfo);
        resetGroups(draft.groups);
      }
    }
    setDraftReady(true);
  }, [isAiMode, isExistingMode, resetGroups]);

  // 自动保存
  useEffect(() => {
    if (!draftReady || isExistingMode) return;
    saveDraft({ basicInfo, groups });
  }, [basicInfo, groups, draftReady, isExistingMode]);

  const updateBasic = <K extends keyof PaperBasicInfo>(key: K, val: PaperBasicInfo[K]) => {
    setBasicInfo((p) => ({ ...p, [key]: val }));
  };

  const selectExistingPaper = (paper: (typeof PAPERS)[number]) => {
    const paperGroups = getPaperQuestionGroups(paper.id);
    const paperTotalScore = paperGroups.reduce(
      (sum, group) => sum + group.questions.length * group.perScore,
      0,
    );
    setSelectedExistingPaperId(paper.id);
    setBasicInfo({
      ...EMPTY_BASIC,
      name: paper.name,
      goal: paper.goal,
      category: paper.category,
      specialty: "运行专业",
      duration: String(paper.duration),
      totalScore: formatScore(paperTotalScore),
      passLine: formatScore(Math.min(Number(EMPTY_BASIC.passLine) || 60, paperTotalScore)),
      difficulty: "中",
    });
    resetGroups(paperGroups);
    setFromAiDraft(false);
  };

  // ── 计算 ──
  const totalQuestions = groups.reduce((s, g) => s + g.questions.length, 0);
  const existingQuestionIds = groups.flatMap((group) =>
    group.questions.map((question) => question.id),
  );
  const totalScore = (summary.find((s) => s.label === "当前卷面分")?.value ?? 0) as number;
  const scoreMode = basicInfo.scoreMode ?? "fixed";
  const targetScore = Number(basicInfo.totalScore ?? "");
  const hasValidTargetScore = Number.isFinite(targetScore) && targetScore > 0;
  const passLine = Number(basicInfo.passLine);
  const isPassLineValid =
    hasValidTargetScore && Number.isFinite(passLine) && passLine >= 0 && passLine <= targetScore;
  const isScoreMatched = hasValidTargetScore && Math.abs(totalScore - targetScore) < 0.001;
  const scoreDifference = hasValidTargetScore ? totalScore - targetScore : 0;
  const isScoreConfigurationValid = scoreMode !== "fixed" || (isScoreMatched && isPassLineValid);
  const scoreStatusText = !hasValidTargetScore
    ? "请先在基本信息中设置目标总分"
    : !isScoreMatched
      ? scoreDifference < 0
        ? `还差 ${formatScore(Math.abs(scoreDifference))} 分`
        : `已超出 ${formatScore(scoreDifference)} 分`
      : !isPassLineValid
        ? `请将及格线设置为 0 至 ${formatScore(targetScore)} 分`
        : "卷面分与目标总分一致，可继续下发";
  const canCompleteBasic = basicInfo.name.trim().length > 0;
  const canCompleteStrategy = groups.length > 0 && totalQuestions > 0 && isScoreConfigurationValid;

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

    const specialties = aiSpecialtyInput.trim() ? [aiSpecialtyInput.trim()] : [];

    const params: AiDraftParams = {
      prompt: aiPrompt,
      goal: aiGoal,
      category: aiCategory,
      specialties,
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
      if (isExistingMode && !selectedExistingPaperId) {
        toast.error("请先选择一份已有试卷");
        return;
      }
      if (!basicInfo.name.trim()) {
        toast.error("请填写试卷名称");
        return;
      }
      goStep(currentStep + 1);
    } else if (contentStep === 2) {
      if (groups.length === 0) {
        toast.error("请至少添加一种题型");
        return;
      }
      if (totalQuestions < 1) {
        toast.error("请至少添加 1 道题目");
        return;
      }
      if (scoreMode === "fixed") {
        if (!hasValidTargetScore) {
          toast.error("请设置大于 0 的目标总分");
          return;
        }
        if (!isPassLineValid) {
          toast.error("及格线需大于等于 0，且不能超过目标总分");
          return;
        }
        if (!isScoreMatched) {
          toast.error(
            `当前卷面 ${formatScore(totalScore)} 分，与目标总分 ${formatScore(targetScore)} 分不一致，请调整题型分值或总分`,
          );
          return;
        }
      }
      goStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) goStep(currentStep - 1);
  };

  const handleRemoveGroup = (type: QuestionType) => {
    if (groups.length <= 1) {
      toast.warning("至少保留一种题型");
      return;
    }
    removeGroup(type);
  };

  const finish = (mode: "assign" | "draft") => {
    if (mode === "assign" && scoreMode === "fixed") {
      if (!hasValidTargetScore) {
        toast.error("请设置大于 0 的目标总分");
        return;
      }
      if (!isPassLineValid) {
        toast.error("及格线需大于等于 0，且不能超过目标总分");
        return;
      }
      if (!isScoreMatched) {
        toast.error("卷面分与目标总分不一致，不能下发");
        return;
      }
    }
    sessionStorage.removeItem(PAPER_DRAFT_KEY);
    toast.success(mode === "assign" ? "试卷已下发" : "试卷已暂存为草稿");
    navigate({ to: "/exam-admin" });
  };

  const isAiLoading = aiStatus === "loading";
  const modeLabel = isAiMode ? "智能组卷" : isExistingMode ? "选用已有试卷" : "手动组卷";

  return (
    <PageShell compact mainClassName="flex min-h-0 flex-col overflow-hidden p-0">
      <div className="flex min-h-0 flex-1 flex-col bg-[#F5FAFB]">
        <div className="flex min-h-0 flex-1 flex-col px-4 pt-3 sm:px-6 lg:px-8">
          {/* ── 页面头部：返回 | 标题 ── */}
          <div className="mb-2.5 flex min-h-9 shrink-0 flex-wrap items-center gap-x-2.5 gap-y-1">
            <Link
              to="/exam-admin"
              className="inline-flex items-center gap-1 text-[13px] text-[#6B7F88] transition-colors hover:text-primary"
            >
              <ChevronLeft className="h-3.5 w-3.5" /> 返回考试管理
            </Link>
            <span className="h-3.5 w-px shrink-0 bg-[#DCE8EA]" aria-hidden />
            {isAiMode ? (
              <Sparkles className="h-4 w-4 shrink-0 text-primary" />
            ) : (
              <FileText className="h-4 w-4 shrink-0 text-primary" />
            )}
            <h1 className="text-[16px] font-semibold text-[#1F3440]">新建试卷</h1>
            <span className="text-[12.5px] text-[#607681]">{modeLabel}</span>
          </div>

          {/* ── 步骤条 ── */}
          <div className="mb-2.5 shrink-0 rounded-[10px] border border-[#E3EEF0] bg-white px-3 py-2 shadow-[0_6px_20px_rgba(31,52,64,0.04)] sm:px-4">
                <nav
                  aria-label="步骤导航"
                  className="flex min-w-0 items-center overflow-x-auto"
                >
                  {STEPS.map((label, i) => {
                    const n = i + 1;
                    const active = currentStep === n;
                    const done = currentStep > n;
                    const reachable = canOpenStep(n);

                    return (
                      <div
                        key={label}
                        className={cn(
                          "flex min-w-0 items-center",
                          i < STEPS.length - 1 && "flex-1",
                        )}
                      >
                        <button
                          type="button"
                          disabled={!reachable}
                          onClick={() => {
                            if (n !== currentStep && canOpenStep(n)) goStep(n);
                          }}
                          aria-current={active ? "step" : undefined}
                          className={cn(
                            "group flex shrink-0 items-center gap-2 rounded-[8px] px-1 py-0.5 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/25",
                            reachable && !active && "hover:bg-[#F5FAFB]",
                            !reachable && !done && !active && "cursor-not-allowed",
                          )}
                        >
                          <span
                            className={cn(
                              "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[12px] font-semibold transition-colors",
                              active &&
                                "bg-primary text-white shadow-[0_0_0_3px_rgba(52,155,172,0.14)]",
                              done && "border border-primary/25 bg-primary text-white",
                              !active && !done && "border border-[#DCE8EA] bg-white text-[#8FA2AA]",
                            )}
                          >
                            {done ? (
                              <Check className="h-3.5 w-3.5 stroke-[2.5]" />
                            ) : n === 1 && isAiMode ? (
                              <Sparkles className="h-3.5 w-3.5" />
                            ) : (
                              n
                            )}
                          </span>
                          <span className="hidden sm:block">
                            <span
                              className={cn(
                                "block whitespace-nowrap text-[12.5px] font-semibold",
                                active
                                  ? "text-primary"
                                  : done
                                    ? "text-[#2F8D9D]"
                                    : "text-[#607681]",
                              )}
                            >
                              {label}
                            </span>
                          </span>
                        </button>
                        {i < STEPS.length - 1 && (
                          <div
                            aria-hidden
                            className={cn(
                              "mx-2 h-px min-w-4 flex-1 sm:mx-3",
                              currentStep > n ? "bg-primary/40" : "bg-[#DCE8EA]",
                            )}
                          />
                        )}
                      </div>
                    );
                  })}
                </nav>
          </div>

          <div className="grid min-h-0 flex-1 items-stretch gap-3 overflow-hidden xl:grid-cols-[minmax(0,1fr)_320px]">
            <main className="flex min-h-0 min-w-0 flex-col overflow-y-auto xl:overflow-hidden">
              {/* ── 步骤内容 ── */}

              {/* Step 0: AI 起草 */}
              {contentStep === 0 && (
                <div className="min-h-0 flex-1">
                <AiDraftStepContent
                  prompt={aiPrompt}
                  setPrompt={setAiPrompt}
                  aiGoal={aiGoal}
                  setAiGoal={setAiGoal}
                  aiCategory={aiCategory}
                  setAiCategory={setAiCategory}
                  specialtyInput={aiSpecialtyInput}
                  setSpecialtyInput={setAiSpecialtyInput}
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
                </div>
              )}

              {/* Step 1: 基本信息 */}
              {contentStep === 1 && isExistingMode ? (
                <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[12px] bg-white p-5 shadow-[0px_0px_10px_0px_rgba(0,0,0,0.05)]">
                  <SectionTitle>选择已有试卷</SectionTitle>
                  <p className="-mt-1 mb-3 text-[12.5px] text-[#6B7F88]">
                    选用后可继续调整题型、题目和下发对象，原试卷不会被覆盖。
                  </p>
                  <div className="min-h-0 flex-1 overflow-y-auto rounded-[8px] border border-[#DCE8EA]">
                    {PAPERS.filter((paper) => paper.status !== "草稿").map((paper) => {
                      const selected = selectedExistingPaperId === paper.id;
                      return (
                        <button
                          key={paper.id}
                          type="button"
                          onClick={() => selectExistingPaper(paper)}
                          className={cn(
                            "flex w-full items-center justify-between gap-4 border-b border-[#EDF3F5] px-4 py-3 text-left last:border-b-0 transition-colors",
                            selected ? "bg-primary-soft/60" : "hover:bg-[#F8FBFB]",
                          )}
                        >
                          <span className="min-w-0">
                            <span className="block truncate text-[13.5px] font-medium text-[#1F3440]">
                              {paper.name}
                            </span>
                            <span className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[11.5px] text-[#6B7F88]">
                              <span>{paper.goal}</span>
                              <span>{paper.category}</span>
                              <span>{paper.questionCount} 题</span>
                              <span>{paper.duration} 分钟</span>
                            </span>
                          </span>
                          <span
                            className={cn(
                              "shrink-0 rounded-md border px-2.5 py-1 text-[11.5px] font-medium",
                              selected
                                ? "border-primary bg-primary text-white"
                                : "border-[#DCE8EA] bg-white text-[#6B7F88]",
                            )}
                          >
                            {selected ? "已选择" : "选择"}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </section>
              ) : contentStep === 1 ? (
                <section className="flex min-h-0 flex-1 flex-col overflow-y-auto rounded-[12px] bg-white p-5 shadow-[0px_0px_10px_0px_rgba(0,0,0,0.05)]">
                
                  <SectionTitle>基本信息</SectionTitle>
                  <div className="grid grid-cols-1 gap-x-5 gap-y-3.5 sm:grid-cols-2">
                    <div>
                      <FieldLabel required>试卷名称</FieldLabel>
                      <Input
                        value={basicInfo.name}
                        onChange={(e) => updateBasic("name", e.target.value)}
                        placeholder="请输入试卷名称"
                        className={INPUT_CLS}
                      />
                    </div>
                    <div>
                      <FieldLabel>考试目标</FieldLabel>
                      <div className="relative">
                        <select
                          value={basicInfo.goal}
                          onChange={(e) => updateBasic("goal", e.target.value as ExamGoal)}
                          className={SELECT_CLS}
                        >
                          {GOAL_OPTIONS.map((g) => (
                            <option key={g} value={g}>
                              {g}
                            </option>
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
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#9AAAB0]" />
                      </div>
                    </div>
                    <div>
                      <FieldLabel>适用专业</FieldLabel>
                      <div className="relative">
                        <select
                          value={basicInfo.specialty}
                          onChange={(e) => updateBasic("specialty", e.target.value)}
                          className={SELECT_CLS}
                        >
                          <option value="">请选择</option>
                          {SPECIALTY_SUGGESTIONS.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#9AAAB0]" />
                      </div>
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
                    <div>
                      <FieldLabel>难度</FieldLabel>
                      <div className="relative">
                        <select
                          value={basicInfo.difficulty}
                          onChange={(e) =>
                            updateBasic("difficulty", e.target.value as Difficulty | "")
                          }
                          className={SELECT_CLS}
                        >
                          {DIFFICULTY_OPTIONS.map((d) => (
                            <option key={d} value={d}>
                              {d}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#9AAAB0]" />
                      </div>
                    </div>

                    <div>
                      <FieldLabel
                        hint={
                          scoreMode === "variable"
                            ? "保留题目分值，不汇总总分"
                            : scoreMode === "unscored"
                              ? "只记录完成情况，不计分"
                              : undefined
                        }
                      >
                        成绩设置
                      </FieldLabel>
                      <div className="relative">
                        <select
                          value={scoreMode}
                          onChange={(e) =>
                            updateBasic(
                              "scoreMode",
                              e.target.value as NonNullable<PaperBasicInfo["scoreMode"]>,
                            )
                          }
                          className={SELECT_CLS}
                        >
                          <option value="fixed">固定总分</option>
                          <option value="variable">按题计分，不设总分</option>
                          <option value="unscored">不设分数</option>
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#9AAAB0]" />
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

                    {scoreMode === "fixed" ? (
                      <>
                        <div>
                          <FieldLabel required hint="卷面分需与总分一致">
                            总分（分）
                          </FieldLabel>
                          <Input
                            type="number"
                            min="1"
                            step="0.5"
                            value={basicInfo.totalScore ?? ""}
                            onChange={(e) => updateBasic("totalScore", e.target.value)}
                            aria-label="目标总分"
                            aria-invalid={!hasValidTargetScore}
                            className={INPUT_CLS}
                          />
                        </div>
                        <div>
                          <FieldLabel required>及格线（分）</FieldLabel>
                          <Input
                            type="number"
                            min="0"
                            step="0.5"
                            value={basicInfo.passLine}
                            onChange={(e) => updateBasic("passLine", e.target.value)}
                            aria-label="及格线"
                            aria-invalid={!isPassLineValid}
                            className={INPUT_CLS}
                          />
                        </div>
                      </>
                    ) : null}
                  </div>
                </section>
              ) : null}

              {/* Step 2: 组卷策略 */}
              {contentStep === 2 && (
                <div className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-hidden">
                  <div className="shrink-0 space-y-2.5">
                    <PaperTypeToolbar
                      groups={groups}
                      onAddGroup={addGroup}
                      onAddQuestions={() => setDirectAddOpen(true)}
                    />
                    <PaperQuestionSummary summary={summary} showTotalScore={scoreMode === "fixed"} />
                  </div>
                  {scoreMode === "fixed" && (
                    <div
                      role="status"
                      aria-live="polite"
                      className={cn(
                        "flex shrink-0 flex-wrap items-center gap-x-5 gap-y-2 rounded-[8px] border px-4 py-2",
                        isScoreConfigurationValid
                          ? "border-success/25 bg-success-soft/45"
                          : "border-warning/25 bg-warning-soft/45",
                      )}
                    >
                      <div>
                        <span className="text-[11px] text-[#6B7F88]">当前卷面分</span>
                        <strong className="ml-2 text-[15px] tabular-nums text-[#1F3440]">
                          {formatScore(totalScore)} 分
                        </strong>
                      </div>
                      <div className="h-4 w-px bg-[#DCE8EA]" aria-hidden />
                      <div>
                        <span className="text-[11px] text-[#6B7F88]">目标总分</span>
                        <strong className="ml-2 text-[15px] tabular-nums text-[#1F3440]">
                          {hasValidTargetScore ? `${formatScore(targetScore)} 分` : "未设置"}
                        </strong>
                      </div>
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 text-[12px] font-medium",
                          isScoreConfigurationValid ? "text-success" : "text-warning-foreground",
                        )}
                      >
                        {isScoreConfigurationValid ? (
                          <Check className="h-3.5 w-3.5" />
                        ) : (
                          <Info className="h-3.5 w-3.5" />
                        )}
                        {scoreStatusText}
                      </span>
                    </div>
                  )}
                  <div className="min-h-0 flex-1 overflow-y-auto">
                    <PaperQuestionList
                      groups={groups}
                      collapsed={collapsed}
                      onToggleCollapse={toggleCollapse}
                      onAdd={setAddType}
                      onMoveQuestion={moveQuestion}
                      onRemoveQuestion={removeQuestion}
                      onMoveGroup={moveGroup}
                      onRemoveGroup={handleRemoveGroup}
                      showScores={scoreMode !== "unscored"}
                      showScoreEditor={scoreMode === "fixed"}
                      onScoreChange={updateGroupScore}
                    />
                  </div>
                  <AddQuestionDialog
                    open={addType !== null}
                    type={addType ?? undefined}
                    excludedIds={existingQuestionIds}
                    onClose={() => setAddType(null)}
                    onAdd={(ids) => {
                      if (addType) appendFromBank(addType, ids);
                      toast.success(`已添加 ${ids.length} 题`);
                    }}
                  />
                  <AddQuestionDialog
                    open={directAddOpen}
                    excludedIds={existingQuestionIds}
                    onClose={() => setDirectAddOpen(false)}
                    onAdd={(ids) => {
                      appendFromBankAuto(ids);
                      toast.success(`已添加 ${ids.length} 题，并按题型自动分组`);
                    }}
                  />
                </div>
              )}

              {/* Step 3: 下发设置 */}
              {contentStep === 3 && (
                <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[12px] bg-white p-5 shadow-[0px_0px_10px_0px_rgba(0,0,0,0.05)]">
                  <SectionTitle>试卷下发</SectionTitle>
                  <AssignPanel
                    onAssign={() => finish("assign")}
                    onDraft={() => finish("draft")}
                    showDraft
                    hideActions
                    fill
                    onSelectionChange={setAssigneeCount}
                  />
                </section>
              )}
              <div className="mt-3 min-h-0 overflow-y-auto xl:hidden">
                <PaperSettingsOverview
                  basicInfo={basicInfo}
                  groups={groups}
                  totalQuestions={totalQuestions}
                  totalScore={totalScore}
                  targetScore={targetScore}
                  hasValidTargetScore={hasValidTargetScore}
                  scoreMode={scoreMode}
                  modeLabel={modeLabel}
                />
              </div>
            </main>

            <aside className="hidden min-h-0 overflow-hidden xl:block" aria-label="试卷设置概览">
              <PaperSettingsOverview
                basicInfo={basicInfo}
                groups={groups}
                totalQuestions={totalQuestions}
                totalScore={totalScore}
                targetScore={targetScore}
                hasValidTargetScore={hasValidTargetScore}
                scoreMode={scoreMode}
                modeLabel={modeLabel}
              />
            </aside>
          </div>
        </div>

        {/* ── 底部操作栏 ── */}
        <div className="shrink-0 border-t border-[#EDF3F5] bg-white shadow-[0_-2px_12px_rgba(31,52,64,0.06)]">
          <div className="flex h-14 w-full items-center justify-between px-4 sm:px-6 lg:px-8">
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
                  {totalQuestions} 题 ·{" "}
                  {scoreMode === "fixed"
                    ? `卷面 ${formatScore(totalScore)} / ${hasValidTargetScore ? formatScore(targetScore) : "未设置"} 分`
                    : scoreMode === "variable"
                      ? "按题计分"
                      : "不设分数"}
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
                  取消
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

              {/* 试卷下发：暂存 + 确认下发 */}
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
                    disabled={assigneeCount === 0 || !isScoreConfigurationValid}
                    onClick={() => finish("assign")}
                    title={
                      !isScoreConfigurationValid
                        ? "卷面分需等于目标总分，且及格线需在有效范围内"
                        : undefined
                    }
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

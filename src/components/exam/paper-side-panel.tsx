import type { ReactNode } from "react";
import {
  Award,
  BarChart3,
  Clock,
  FileText,
  ShieldCheck,
  Target,
  type LucideIcon,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  PAPER_CATEGORIES,
  type Difficulty,
  type EditorGroup,
  type ExamGoal,
  type Paper,
} from "@/lib/mock/examAdmin";
import type { PaperBasicInfo } from "@/components/exam/exam-paper-editor-page";

/** 左右分栏固定高度：内容在栏内独立滚动，右侧不随左侧滚动 */
export const PAPER_SPLIT_PANEL_H =
  "h-[min(720px,calc(100vh-11.5rem))] max-h-[min(720px,calc(100vh-11.5rem))]";

const GOAL_OPTIONS: ExamGoal[] = ["取证复习", "复证巩固", "岗位达标", "阶段测评", "日常自测"];
const DIFFICULTY_OPTIONS: Difficulty[] = ["易", "中", "难"];

function PreviewCell({ n, l }: { n: string | number; l: string }) {
  return (
    <div className="rounded-lg bg-white/15 px-2 py-2.5 text-center backdrop-blur-sm">
      <div className="text-[20px] font-bold leading-none tabular-nums">{n}</div>
      <div className="mt-1 text-[10px] opacity-90">{l}</div>
    </div>
  );
}

function MetaItem({
  icon: Icon,
  label,
  value,
  valueClass,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="flex items-start gap-1.5">
      <Icon className="mt-0.5 h-3 w-3 shrink-0 text-muted-foreground/70" />
      <div className="min-w-0">
        <dt className="text-[10px] text-muted-foreground">{label}</dt>
        <dd className={cn("truncate text-[12px] font-medium", valueClass)}>{value}</dd>
      </div>
    </div>
  );
}

function TypeBar({ label, count, total }: { label: string; count: number; total: number }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-2">
      <span className="w-12 shrink-0 text-[10.5px] text-muted-foreground">{label}</span>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-primary/60 transition-all" style={{ width: `${pct}%` }} />
      </div>
      <span className="w-8 shrink-0 text-right text-[10.5px] tabular-nums text-muted-foreground">
        {count} 题
      </span>
    </div>
  );
}

function levelTone(level: string) {
  return level === "难"
    ? "text-destructive"
    : level === "中"
      ? "text-warning-foreground"
      : "text-success";
}

const SCORING_RULES = [
  "单选 / 判断：对得满分，错得 0 分",
  "多选：全对得分，漏选半分，错选 0 分",
  "简答：按要点匹配率给分",
];

export type TypeBreakdown = { label: string; count: number };

function buildTypeBreakdown(groups: EditorGroup[]): TypeBreakdown[] {
  return groups
    .filter((g) => g.questions.length > 0)
    .map((g) => ({
      label: g.type.replace("题", ""),
      count: g.questions.length,
    }));
}

function FieldLabel({ children }: { children: ReactNode }) {
  return <label className="mb-1 block text-[11px] font-medium text-muted-foreground">{children}</label>;
}

const selectCls =
  "h-8 w-full rounded-md border border-input bg-background px-2 text-[12px] outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/15";

type PaperPreviewSidebarProps = {
  title: string;
  questionCount: number;
  duration: number | string;
  passLine: number | string;
  goal: string;
  category: string;
  difficulty?: string;
  issuedAt?: string;
  highlightLabel?: string;
  highlightValue?: string | number | null;
  typeBreakdown: TypeBreakdown[];
  footer?: ReactNode;
  className?: string;
};

/** 试卷预览侧栏 — 详情页 / 只读预览 */
export function PaperPreviewSidebar({
  title,
  questionCount,
  duration,
  passLine,
  goal,
  category,
  difficulty = "中",
  issuedAt,
  highlightLabel,
  highlightValue,
  typeBreakdown,
  footer,
  className,
}: PaperPreviewSidebarProps) {
  const total = typeBreakdown.reduce((s, t) => s + t.count, 0) || questionCount;

  return (
    <aside
      className={cn(
        "flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-[0_1px_3px_rgba(0,0,0,0.04)]",
        PAPER_SPLIT_PANEL_H,
        className,
      )}
    >
      <div className="shrink-0 rounded-t-xl bg-gradient-to-br from-primary to-[oklch(0.5_0.13_205)] px-4 py-4 text-white">
        <div className="inline-flex items-center gap-1.5 text-[11px] opacity-90">
          <Award className="h-3.5 w-3.5" />
          试卷预览
        </div>
        <div className="mt-1.5 line-clamp-2 text-[15px] font-semibold leading-snug">{title}</div>
        <div className="mt-4 grid grid-cols-3 gap-2">
          <PreviewCell n={questionCount} l="题量" />
          <PreviewCell n={duration} l="分钟" />
          <PreviewCell n={passLine} l="及格线" />
        </div>
      </div>

      <div className="shrink-0 border-b border-border/60 px-4 py-3.5">
        <div className="mb-2.5 text-[11px] font-medium text-muted-foreground">试卷信息</div>
        <dl className="grid grid-cols-2 gap-x-3 gap-y-2.5">
          <MetaItem icon={Target} label="考试目标" value={goal} />
          <MetaItem
            icon={BarChart3}
            label="难度"
            value={difficulty}
            valueClass={levelTone(difficulty)}
          />
          <MetaItem icon={FileText} label="知识分类" value={category || "—"} />
          <MetaItem icon={Clock} label={issuedAt ? "创建时间" : "状态"} value={issuedAt ?? "—"} />
        </dl>
        {highlightValue != null && highlightLabel && (
          <div className="mt-3 flex items-center justify-between rounded-lg bg-muted/40 px-2.5 py-2">
            <span className="text-[11px] text-muted-foreground">{highlightLabel}</span>
            <span className="text-[14px] font-semibold tabular-nums text-primary">
              {highlightValue}
            </span>
          </div>
        )}
      </div>

      <div className="shrink-0 border-b border-border/60 px-4 py-3.5">
        <div className="inline-flex items-center gap-1.5 text-[12px] font-medium">
          <ShieldCheck className="h-3.5 w-3.5 text-success" />
          评分规则
        </div>
        <ul className="mt-2 space-y-1 text-[11px] leading-relaxed text-foreground/75">
          {SCORING_RULES.map((rule) => (
            <li key={rule} className="flex gap-1.5">
              <span className="shrink-0 text-muted-foreground">·</span>
              <span>{rule}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3.5" style={{ flex: "1 0 155px" }}>
        <div className="mb-2 text-[11px] font-medium text-muted-foreground">题型构成</div>
        <div className="space-y-1.5">
          {typeBreakdown.length === 0 ? (
            <p className="text-[11px] text-muted-foreground">暂无题目</p>
          ) : (
            typeBreakdown.map((t) => (
              <TypeBar key={t.label} label={t.label} count={t.count} total={total} />
            ))
          )}
        </div>
      </div>

      {footer && <div className="mt-auto shrink-0 border-t border-border/60 p-4">{footer}</div>}
    </aside>
  );
}

type PaperBasicInfoPanelProps = {
  basicInfo: PaperBasicInfo;
  onChange: <K extends keyof PaperBasicInfo>(key: K, value: PaperBasicInfo[K]) => void;
  questionCount: number;
  totalScore: number;
  className?: string;
};

/** 编辑页右侧基本信息面板 — 固定不随左侧题目区滚动 */
export function PaperBasicInfoPanel({
  basicInfo,
  onChange,
  questionCount,
  totalScore,
  className,
}: PaperBasicInfoPanelProps) {
  return (
    <aside
      className={cn(
        "flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-[0_1px_3px_rgba(0,0,0,0.04)]",
        PAPER_SPLIT_PANEL_H,
        className,
      )}
    >
      <div className="shrink-0 rounded-t-xl bg-gradient-to-br from-primary to-[oklch(0.5_0.13_205)] px-4 py-4 text-white">
        <div className="inline-flex items-center gap-1.5 text-[11px] opacity-90">
          <FileText className="h-3.5 w-3.5" />
          试卷基本信息
        </div>
        <div className="mt-1.5 line-clamp-2 text-[15px] font-semibold leading-snug">
          {basicInfo.name.trim() || "未命名试卷"}
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2">
          <PreviewCell n={questionCount} l="题量" />
          <PreviewCell n={basicInfo.duration || "—"} l="分钟" />
          <PreviewCell n={basicInfo.passLine || "60"} l="及格线" />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        <div className="space-y-3">
          <div>
            <FieldLabel>试卷名称</FieldLabel>
            <Input
              value={basicInfo.name}
              onChange={(e) => onChange("name", e.target.value)}
              className="h-8 text-[12px]"
              placeholder="请输入试卷名称"
            />
          </div>
          <div>
            <FieldLabel>考试目标</FieldLabel>
            <select
              value={basicInfo.goal}
              onChange={(e) => onChange("goal", e.target.value as ExamGoal)}
              className={selectCls}
            >
              {GOAL_OPTIONS.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>
          <div>
            <FieldLabel>分类</FieldLabel>
            <select
              value={basicInfo.category}
              onChange={(e) => onChange("category", e.target.value)}
              className={selectCls}
            >
              <option value="">请选择分类</option>
              {PAPER_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <FieldLabel>适用专业</FieldLabel>
            <Input
              value={basicInfo.specialty}
              onChange={(e) => onChange("specialty", e.target.value)}
              className="h-8 text-[12px]"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <FieldLabel>考试时长</FieldLabel>
              <Input
                value={basicInfo.duration}
                onChange={(e) => onChange("duration", e.target.value)}
                className="h-8 text-[12px]"
                placeholder="分钟"
              />
            </div>
            <div>
              <FieldLabel>及格线</FieldLabel>
              <Input
                value={basicInfo.passLine}
                onChange={(e) => onChange("passLine", e.target.value)}
                className="h-8 text-[12px]"
                placeholder="分"
              />
            </div>
          </div>
          <div>
            <FieldLabel>难度</FieldLabel>
            <select
              value={basicInfo.difficulty}
              onChange={(e) => onChange("difficulty", e.target.value as Difficulty | "")}
              className={selectCls}
            >
              <option value="">请选择</option>
              {DIFFICULTY_OPTIONS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
          <div>
            <FieldLabel>备注</FieldLabel>
            <Input
              value={basicInfo.note}
              onChange={(e) => onChange("note", e.target.value)}
              className="h-8 text-[12px]"
              placeholder="选填"
            />
          </div>
        </div>

        <div className="mt-4 rounded-lg border border-border/60 bg-muted/25 px-3 py-2.5">
          <div className="text-[11px] font-medium text-muted-foreground">当前卷面</div>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="text-[12px] text-foreground/80">试卷总分</span>
            <span className="text-[18px] font-bold tabular-nums text-primary">{totalScore}</span>
          </div>
        </div>
      </div>
    </aside>
  );
}

/** 从 Paper + groups 构建预览侧栏 props */
export function paperPreviewFromData(
  paper: Paper,
  groups: EditorGroup[],
  passLine = 60,
  difficulty = "中",
) {
  const typeBreakdown = buildTypeBreakdown(groups);
  const questionCount =
    typeBreakdown.reduce((s, t) => s + t.count, 0) || paper.questionCount;

  return {
    title: paper.name,
    questionCount,
    duration: paper.duration,
    passLine,
    goal: paper.goal,
    category: paper.category,
    difficulty,
    issuedAt: paper.createdAt,
    highlightLabel: paper.assigned > 0 ? "平均得分" : undefined,
    highlightValue: paper.assigned > 0 && paper.avgScore > 0 ? paper.avgScore : null,
    typeBreakdown,
  };
}

export { buildTypeBreakdown };

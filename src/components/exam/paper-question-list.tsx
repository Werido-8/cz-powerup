import { useCallback, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  ChevronUp,
  Eye,
  FileSearch,
  Info,
  Plus,
  Sparkles,
  Trash2,
  Wand2,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  EDITOR_GROUPS,
  type Difficulty,
  type EditorGroup,
  type QuestionType,
} from "@/lib/mock/examAdmin";

function diffClass(d: Difficulty) {
  return d === "易"
    ? "bg-success-soft text-success"
    : d === "中"
      ? "bg-warning-soft text-warning-foreground"
      : "bg-destructive/10 text-destructive";
}

function ActionBtn({
  icon: Icon,
  label,
  onClick,
  tone = "default",
  disabled = false,
  tooltip,
}: {
  icon: typeof Eye;
  label: string;
  onClick?: () => void;
  tone?: "default" | "primary";
  disabled?: boolean;
  tooltip?: string;
}) {
  const cls = disabled
    ? "cursor-not-allowed text-muted-foreground/40"
    : tone === "primary"
      ? "text-primary hover:bg-primary-soft"
      : "text-muted-foreground hover:bg-muted hover:text-foreground";

  const btn = (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={cn(
        "inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-md px-2 py-1 text-[12px] transition-colors",
        cls,
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  );

  if (!tooltip) return btn;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex">{btn}</span>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-[240px] text-[11.5px]">
        {tooltip}
      </TooltipContent>
    </Tooltip>
  );
}

function IconBtn({
  icon: Icon,
  title,
  onClick,
  danger = false,
}: {
  icon: typeof Eye;
  title: string;
  onClick?: () => void;
  danger?: boolean;
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      className={`grid h-6 w-6 place-items-center rounded transition-colors ${
        danger ? "text-destructive hover:bg-destructive/10" : "text-muted-foreground hover:bg-muted hover:text-foreground"
      }`}
    >
      <Icon className="h-3.5 w-3.5" />
    </button>
  );
}

export function usePaperQuestionGroups(initialGroups: EditorGroup[] = EDITOR_GROUPS) {
  const [groups, setGroups] = useState<EditorGroup[]>(() => structuredClone(initialGroups));
  const [collapsed, setCollapsed] = useState<Set<QuestionType>>(new Set());

  const resetGroups = useCallback(
    (override?: EditorGroup[]) => setGroups(structuredClone(override ?? initialGroups)),
    [initialGroups],
  );

  const collapseAll = useCallback(
    (types?: QuestionType[]) => setCollapsed(new Set(types)),
    [],
  );

  const expandAll = useCallback(() => setCollapsed(new Set()), []);

  const toggleCollapse = (t: QuestionType) =>
    setCollapsed((prev) => {
      const n = new Set(prev);
      n.has(t) ? n.delete(t) : n.add(t);
      return n;
    });

  const move = (type: QuestionType, idx: number, dir: -1 | 1) => {
    setGroups((prev) =>
      prev.map((g) => {
        if (g.type !== type) return g;
        const q = [...g.questions];
        const j = idx + dir;
        if (j < 0 || j >= q.length) return g;
        [q[idx], q[j]] = [q[j], q[idx]];
        return { ...g, questions: q };
      }),
    );
  };

  const remove = (type: QuestionType, id: string) => {
    setGroups((prev) =>
      prev.map((g) => (g.type === type ? { ...g, questions: g.questions.filter((q) => q.id !== id) } : g)),
    );
  };

  const aiAppend = useCallback((type: QuestionType, context?: { knowledge: string; difficulty: Difficulty }) => {
    setGroups((prev) =>
      prev.map((g) => {
        if (g.type !== type) return g;
        const base = g.questions[0];
        const extra = Array.from({ length: 3 }).map((_, i) => ({
          id: `ai-${type}-${Date.now()}-${i}`,
          stem: `AI 补充的${type}：${context?.knowledge ?? base?.knowledge ?? "AGC / 两细则"}${context?.difficulty === "难" ? "（较难）" : ""} 题目 ${i + 1}`,
          knowledge: context?.knowledge ?? base?.knowledge ?? "AGC / 两细则",
          difficulty: context?.difficulty ?? base?.difficulty ?? ("中" as Difficulty),
          source: base?.source ?? "AGC 控制器 SOP v2024.06",
          score: g.perScore,
        }));
        return { ...g, questions: [...g.questions, ...extra] };
      }),
    );
  }, []);

  const totalCount = groups.reduce((s, g) => s + g.questions.length, 0);
  const totalScore = groups.reduce((s, g) => s + g.questions.length * g.perScore, 0);
  const countByType = (t: QuestionType) => groups.find((g) => g.type === t)?.questions.length ?? 0;

  const summary: { label: string; value: string | number }[] = [
    { label: "当前题量", value: totalCount },
    { label: "试卷总分", value: totalScore },
    { label: "单选题", value: countByType("单选题") },
    { label: "多选题", value: countByType("多选题") },
    { label: "判断题", value: countByType("判断题") },
    { label: "填空题", value: countByType("填空题") },
    { label: "简答题", value: countByType("简答题") },
  ];

  return { groups, collapsed, toggleCollapse, move, remove, aiAppend, resetGroups, collapseAll, expandAll, summary };
}

export function PaperQuestionSummary({ summary }: { summary: { label: string; value: string | number }[] }) {
  return (
    <div className="grid grid-cols-4 gap-2 rounded-lg border border-border bg-muted/30 p-3 md:grid-cols-7">
      {summary.map((s) => (
        <div key={s.label} className="text-center">
          <div className="text-[16px] font-semibold tracking-tight text-primary">{s.value}</div>
          <div className="mt-0.5 text-[10.5px] text-muted-foreground">{s.label}</div>
        </div>
      ))}
    </div>
  );
}

export function PaperQuestionList({
  groups,
  collapsed,
  onToggleCollapse,
  onAdd,
  onAiAppend,
  onMove,
  onRemove,
  onSwap,
  aiAppendReady = false,
  aiAppendTooltip,
  aiAppendDisabledTooltip,
}: {
  groups: EditorGroup[];
  collapsed: Set<QuestionType>;
  onToggleCollapse: (t: QuestionType) => void;
  onAdd: (t: QuestionType) => void;
  onAiAppend: (t: QuestionType) => void;
  onMove: (type: QuestionType, idx: number, dir: -1 | 1) => void;
  onRemove: (type: QuestionType, id: string) => void;
  onSwap: () => void;
  aiAppendReady?: boolean;
  aiAppendTooltip?: string;
  aiAppendDisabledTooltip?: string;
}) {
  return (
    <div className="space-y-3">
      {groups.map((g) => {
        const isCol = collapsed.has(g.type);
        const groupScore = g.questions.length * g.perScore;
        return (
          <div key={g.type} className="rounded-lg border border-border bg-card">
            <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-2.5">
              <button onClick={() => onToggleCollapse(g.type)} className="flex items-center gap-1.5 text-[13px] font-medium">
                {isCol ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                {g.type}(共 {g.questions.length} 小题,每小题 {g.perScore} 分,共 {groupScore} 分)
              </button>
              <div className="flex items-center gap-0.5">
                <ActionBtn icon={Plus} label="添加题目" onClick={() => onAdd(g.type)} />
                <ActionBtn
                  icon={Sparkles}
                  label="AI 补题"
                  disabled={!aiAppendReady}
                  tooltip={aiAppendReady ? aiAppendTooltip : aiAppendDisabledTooltip}
                  onClick={() => onAiAppend(g.type)}
                />
              </div>
            </div>
            {!isCol && (
              <div className="divide-y divide-border">
                {g.questions.map((q, idx) => (
                  <div key={q.id} className="flex items-center gap-3 px-4 py-2 text-[12.5px]">
                    <span className="w-5 shrink-0 text-muted-foreground">{idx + 1}.</span>
                    <span className="min-w-0 flex-1 truncate font-medium">{q.stem}</span>
                    <Badge variant="secondary" className="shrink-0 font-normal">
                      {q.knowledge}
                    </Badge>
                    <span className={`shrink-0 rounded px-1.5 py-0.5 text-[11px] ${diffClass(q.difficulty)}`}>
                      {q.difficulty}
                    </span>
                    <span className="hidden w-32 shrink-0 truncate text-[11px] text-muted-foreground lg:block">
                      {q.source}
                    </span>
                    <span className="w-10 shrink-0 text-right text-muted-foreground">{q.score} 分</span>
                    <div className="flex shrink-0 items-center gap-0.5">
                      {/* <IconBtn icon={FileSearch} title="查看依据" onClick={() => toast.info("查看资料依据")} />
                      <IconBtn icon={Wand2} title="AI 换题" onClick={onSwap} /> */}
                      <IconBtn icon={ArrowUp} title="上移" onClick={() => onMove(g.type, idx, -1)} />
                      <IconBtn icon={ArrowDown} title="下移" onClick={() => onMove(g.type, idx, 1)} />
                      <IconBtn icon={Trash2} title="删除" danger onClick={() => onRemove(g.type, q.id)} />
                    </div>
                  </div>
                ))}
                {g.questions.length === 0 && (
                  <div className="px-4 py-4 text-center text-[12px] text-muted-foreground">
                    暂无题目,点击“添加题目”或“AI 补题”
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* <div className="flex items-start gap-2 rounded-lg bg-warning-soft px-3 py-2 text-[11.5px] text-warning-foreground">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        AI 补题和换题仅用于辅助组卷,正式保存和下发前需培训负责人确认。
      </div> */}
    </div>
  );
}

import { useCallback, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  ChevronUp,
  GripVertical,
  LayoutList,
  Plus,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  BANK_QUESTIONS,
  EDITOR_GROUPS,
  PAPER_QUESTION_TYPES,
  TYPE_PER_SCORE,
  defaultOptionsForType,
  editorQuestionFromBank,
  type Difficulty,
  type EditorGroup,
  type EditorQuestion,
  type QuestionType,
} from "@/lib/mock/examAdmin";

function diffClass(d: Difficulty) {
  return d === "易"
    ? "bg-success-soft text-success"
    : d === "中"
      ? "bg-warning-soft text-warning-foreground"
      : "bg-destructive/10 text-destructive";
}

/** 学员端只读预览：选项不可选、填空不可填 */
export function QuestionStudentPreview({
  question,
  type,
}: {
  question: EditorQuestion;
  type: QuestionType;
}) {
  const options =
    question.options ??
    defaultOptionsForType(type) ??
    (type === "单选题" || type === "多选题"
      ? [
          { key: "A", text: "（选项未配置）" },
          { key: "B", text: "（选项未配置）" },
          { key: "C", text: "（选项未配置）" },
          { key: "D", text: "（选项未配置）" },
        ]
      : undefined);

  if (type === "单选题" || type === "多选题" || type === "判断题") {
    const isMulti = type === "多选题";
    const correctKeys = question.answer ? question.answer.split("") : [];
    return (
      <div className="mt-3 space-y-1.5" aria-readonly>
        {options?.map((o) => {
          const isCorrect = correctKeys.includes(o.key);
          return (
            <div
              key={o.key}
              className={cn(
                "flex items-start gap-3 rounded-[6px] px-3 py-2",
                isCorrect ? "bg-primary-soft/60" : "bg-[#F5FAFB]",
              )}
            >
              <span
                className={cn(
                  "mt-0.5 grid h-[16px] w-[16px] shrink-0 place-items-center border",
                  isMulti ? "rounded-[3px]" : "rounded-full",
                  isCorrect
                    ? "border-primary/50 bg-primary-soft"
                    : "border-[#C8DADD] bg-white",
                )}
                aria-hidden
              />
              <span className="text-[13px] leading-snug text-[#1F3440]/90">
                <span
                  className={cn(
                    "mr-2 inline-flex h-4 min-w-[16px] items-center justify-center rounded-[3px] px-1 text-[10.5px] font-semibold",
                    isCorrect
                      ? "bg-primary/15 text-primary"
                      : "bg-[#EDF3F5] text-[#6B7F88]",
                  )}
                >
                  {o.key}
                </span>
                {o.text}
              </span>
              {isCorrect && (
                <span className="ml-auto shrink-0 rounded-full bg-primary-soft px-2 py-0.5 text-[10px] font-medium text-primary">
                  答案
                </span>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  if (type === "填空题") {
    const count = question.blankCount ?? 1;
    return (
      <div className="mt-3 space-y-2" aria-readonly>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <span className="w-14 shrink-0 text-[12px] text-muted-foreground">填空 {i + 1}</span>
            <div className="h-9 flex-1 rounded-[6px] border border-dashed border-[#DCE8EA] bg-[#F5FAFB]" />
          </div>
        ))}
      </div>
    );
  }

  if (type === "简答题" || type === "案例分析题") {
    return (
      <div className="mt-3 rounded-[6px] border border-dashed border-[#DCE8EA] bg-[#F5FAFB] px-3 py-2" aria-readonly>
        <div className="mb-1 text-[11px] text-muted-foreground">作答区（学员填写）</div>
        <div className="min-h-[80px] rounded-[4px] bg-white/80" />
      </div>
    );
  }

  return null;
}

export function usePaperQuestionGroups(initialGroups: EditorGroup[] = EDITOR_GROUPS) {
  const [groups, setGroups] = useState<EditorGroup[]>(() => structuredClone(initialGroups));
  const [collapsed, setCollapsed] = useState<Set<QuestionType>>(new Set());

  const resetGroups = useCallback(
    (override?: EditorGroup[]) => setGroups(structuredClone(override ?? initialGroups)),
    [initialGroups],
  );

  const expandAll = useCallback(() => setCollapsed(new Set()), []);

  const toggleCollapse = (t: QuestionType) =>
    setCollapsed((prev) => {
      const n = new Set(prev);
      n.has(t) ? n.delete(t) : n.add(t);
      return n;
    });

  const moveQuestion = (type: QuestionType, idx: number, dir: -1 | 1) => {
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

  const removeQuestion = (type: QuestionType, id: string) => {
    setGroups((prev) =>
      prev.map((g) => (g.type === type ? { ...g, questions: g.questions.filter((q) => q.id !== id) } : g)),
    );
  };

  const moveGroup = (type: QuestionType, dir: -1 | 1) => {
    setGroups((prev) => {
      const idx = prev.findIndex((g) => g.type === type);
      if (idx < 0) return prev;
      const j = idx + dir;
      if (j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[j]] = [next[j], next[idx]];
      return next;
    });
  };

  const removeGroup = (type: QuestionType) => {
    setGroups((prev) => prev.filter((g) => g.type !== type));
  };

  const addGroup = (type: QuestionType) => {
    setGroups((prev) => {
      if (prev.some((g) => g.type === type)) return prev;
      return [...prev, { type, perScore: TYPE_PER_SCORE[type] ?? 2, questions: [] }];
    });
    expandAll();
  };

  const appendFromBank = useCallback((type: QuestionType, bankIds: string[]) => {
    if (bankIds.length === 0) return;
    const picked = BANK_QUESTIONS.filter((b) => bankIds.includes(b.id));
    setGroups((prev) =>
      prev.map((g) => {
        if (g.type !== type) return g;
        const existing = new Set(g.questions.map((q) => q.id));
        const added = picked
          .filter((b) => !existing.has(b.id))
          .map((b) => editorQuestionFromBank(b, g.perScore));
        return { ...g, questions: [...g.questions, ...added] };
      }),
    );
  }, []);

  const totalCount = groups.reduce((s, g) => s + g.questions.length, 0);
  const totalScore = groups.reduce((s, g) => s + g.questions.length * g.perScore, 0);

  const summary: { label: string; value: string | number }[] = [
    { label: "当前题量", value: totalCount },
    { label: "试卷总分", value: totalScore },
    ...groups.map((g) => ({ label: g.type.replace("题", ""), value: g.questions.length })),
  ];

  return {
    groups,
    collapsed,
    toggleCollapse,
    moveQuestion,
    removeQuestion,
    moveGroup,
    removeGroup,
    addGroup,
    appendFromBank,
    resetGroups,
    expandAll,
    summary,
  };
}

/** 横向摘要条 — 专业信息列表样式 */
export function PaperQuestionSummary({ summary }: { summary: { label: string; value: string | number }[] }) {
  return (
    <div className="flex items-center rounded-[12px] bg-white px-5 py-3 shadow-[0px_0px_10px_0px_rgba(0,0,0,0.05)]">
      <div className="flex flex-1 flex-wrap items-center">
        {summary.map((s, i) => (
          <div
            key={s.label}
            className={cn(
              "flex min-w-[80px] flex-col items-center px-4 py-1.5",
              i > 0 && "border-l border-[#EDF3F5]",
            )}
          >
            <span
              className={cn(
                "text-[18px] font-semibold tabular-nums leading-none",
                i < 2 ? "text-primary" : "text-[#1F3440]",
              )}
            >
              {s.value}
            </span>
            <span className="mt-1 text-[11px] text-muted-foreground">{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** 顶部工具栏 — 左侧标题，右侧添加题型按钮 */
export function PaperTypeToolbar({
  groups,
  onAddGroup,
}: {
  groups: EditorGroup[];
  onAddGroup: (type: QuestionType) => void;
}) {
  const existing = new Set(groups.map((g) => g.type));
  const available = PAPER_QUESTION_TYPES.filter((t) => !existing.has(t));

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-[12px] bg-white px-5 py-3.5 shadow-[0px_0px_10px_0px_rgba(0,0,0,0.05)]">
      <div className="flex items-center">
        <span className="mr-[5px] inline-block h-[1em] w-[5px] shrink-0 rounded-[1px] bg-primary" />
        <span className="text-[15px] font-bold text-[#1F3440]">题目配置</span>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {available.length === 0 ? (
          <span className="text-[12px] text-muted-foreground">所有题型已全部添加</span>
        ) : (
          <>
            <span className="text-[12px] text-muted-foreground">添加题型模块：</span>
            {available.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => onAddGroup(t)}
                className="inline-flex items-center gap-1.5 rounded-[8px] border border-[#DCE8EA] bg-white px-3 py-1.5 text-[12px] font-medium text-[#425B66] transition-colors hover:border-primary/40 hover:bg-primary-soft hover:text-primary"
              >
                <Plus className="h-3.5 w-3.5" /> {t}
              </button>
            ))}
          </>
        )}
      </div>
    </div>
  );
}

export function PaperQuestionList({
  groups,
  collapsed,
  onToggleCollapse,
  onAdd,
  onMoveQuestion,
  onRemoveQuestion,
  onMoveGroup,
  onRemoveGroup,
  canRemoveGroup = true,
}: {
  groups: EditorGroup[];
  collapsed: Set<QuestionType>;
  onToggleCollapse: (t: QuestionType) => void;
  onAdd: (t: QuestionType) => void;
  onMoveQuestion: (type: QuestionType, idx: number, dir: -1 | 1) => void;
  onRemoveQuestion: (type: QuestionType, id: string) => void;
  onMoveGroup?: (type: QuestionType, dir: -1 | 1) => void;
  onRemoveGroup?: (type: QuestionType) => void;
  canRemoveGroup?: boolean;
}) {
  if (groups.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-[12px] bg-white px-6 py-14 text-center shadow-[0px_0px_10px_0px_rgba(0,0,0,0.05)]">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#F5FAFB]">
          <LayoutList className="h-5 w-5 text-[#9AAAB0]" />
        </div>
        <p className="text-[14px] font-medium text-[#1F3440]/70">暂无题型模块</p>
        <p className="mt-1 text-[12px] text-muted-foreground">请在上方添加题型，再为各模块添加题目</p>
      </div>
    );
  }

  return (
    <div className="space-y-[10px]">
      {groups.map((g, groupIdx) => {
        const isCol = collapsed.has(g.type);
        const groupScore = g.questions.length * g.perScore;
        const canMoveUp = groupIdx > 0;
        const canMoveDown = groupIdx < groups.length - 1;

        return (
          <section
            key={g.type}
            className="overflow-hidden rounded-[12px] bg-white shadow-[0px_0px_10px_0px_rgba(0,0,0,0.05)]"
          >
            {/* Module header */}
            <header className="flex flex-wrap items-center justify-between gap-2 border-b border-[#EDF3F5] bg-[#F9FBFC] px-5 py-3">
              <div className="flex min-w-0 flex-1 items-center gap-2.5">
                <GripVertical className="h-4 w-4 shrink-0 text-[#9AAAB0]" />
                <button
                  type="button"
                  onClick={() => onToggleCollapse(g.type)}
                  className="flex min-w-0 items-center gap-2 text-left"
                >
                  {isCol ? (
                    <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                  ) : (
                    <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" />
                  )}
                  <div>
                    <div className="text-[14px] font-semibold text-[#1F3440]">{g.type}</div>
                    <div className="text-[11.5px] text-muted-foreground">
                      {g.questions.length} 题 · 每题 {g.perScore} 分 · 小计{" "}
                      <span className="font-medium text-[#1F3440]">{groupScore}</span> 分
                    </div>
                  </div>
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-1">
                {onMoveGroup && (
                  <>
                    <IconBtn
                      icon={ArrowUp}
                      title="题型块上移"
                      disabled={!canMoveUp}
                      onClick={() => onMoveGroup(g.type, -1)}
                    />
                    <IconBtn
                      icon={ArrowDown}
                      title="题型块下移"
                      disabled={!canMoveDown}
                      onClick={() => onMoveGroup(g.type, 1)}
                    />
                  </>
                )}
                {onRemoveGroup && canRemoveGroup && groups.length > 1 && (
                  <IconBtn
                    icon={Trash2}
                    title="删除题型模块"
                    danger
                    onClick={() => {
                      if (
                        g.questions.length > 0 &&
                        !window.confirm(
                          `确定删除「${g.type}」模块及其 ${g.questions.length} 道题目？`,
                        )
                      ) {
                        return;
                      }
                      onRemoveGroup(g.type);
                    }}
                  />
                )}
                <button
                  type="button"
                  onClick={() => onAdd(g.type)}
                  className="inline-flex h-8 items-center gap-1.5 rounded-[8px] border border-[#DCE8EA] bg-white px-3 text-[12px] font-medium text-[#425B66] transition-colors hover:border-primary/40 hover:bg-primary-soft hover:text-primary"
                >
                  <Plus className="h-3.5 w-3.5" /> 添加题目
                </button>
              </div>
            </header>

            {/* Module body */}
            {!isCol && (
              <div className="divide-y divide-[#EDF3F5]">
                {g.questions.map((q, idx) => (
                  <article key={q.id} className="group/question px-5 py-4 transition-colors hover:bg-[#FAFCFD]">
                    <div className="flex items-start gap-3">
                      {/* Question number */}
                      <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary-soft text-[11px] font-bold text-primary">
                        {String(idx + 1).padStart(2, "0")}
                      </span>

                      <div className="min-w-0 flex-1">
                        <p className="text-[14px] font-medium leading-relaxed text-[#1F3440]">
                          {q.stem}
                        </p>

                        <QuestionStudentPreview question={q} type={g.type} />

                        {/* Meta info footer */}
                        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-dashed border-[#EDF3F5] pt-3">
                          {q.isAIGenerated && (
                            <span className="inline-flex h-[22px] items-center rounded-[4px] bg-[#EAF7F9] px-1.5 text-[11px] font-medium text-primary">
                              AI 生成
                            </span>
                          )}
                          <Badge
                            variant="secondary"
                            className="rounded-[4px] border-0 bg-[#F5FAFB] text-[11px] font-normal text-[#6B7F88]"
                          >
                            {q.knowledge}
                          </Badge>
                          <span
                            className={cn(
                              "rounded-[4px] px-1.5 py-0.5 text-[11px] font-medium",
                              diffClass(q.difficulty),
                            )}
                          >
                            {q.difficulty}
                          </span>
                          <span className="text-[11px] text-muted-foreground">{q.score} 分</span>
                          <span className="text-[11px] text-[#9AAAB0]">来源：{q.source}</span>
                        </div>
                      </div>

                      {/* Question action buttons */}
                      <div className="flex shrink-0 flex-col gap-0.5 opacity-0 transition-opacity group-hover/question:opacity-100">
                        <IconBtn
                          icon={ArrowUp}
                          title="题目上移"
                          disabled={idx === 0}
                          onClick={() => onMoveQuestion(g.type, idx, -1)}
                        />
                        <IconBtn
                          icon={ArrowDown}
                          title="题目下移"
                          disabled={idx === g.questions.length - 1}
                          onClick={() => onMoveQuestion(g.type, idx, 1)}
                        />
                        <IconBtn
                          icon={Trash2}
                          title="删除题目"
                          danger
                          onClick={() => onRemoveQuestion(g.type, q.id)}
                        />
                      </div>
                    </div>
                  </article>
                ))}

                {/* Empty module state */}
                {g.questions.length === 0 && (
                  <div className="flex flex-col items-center justify-center px-4 py-10 text-center">
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-[#F5FAFB]">
                      <LayoutList className="h-4.5 w-4.5 text-[#9AAAB0]" />
                    </div>
                    <p className="text-[13px] font-medium text-[#1F3440]/60">暂无题目</p>
                    <p className="mt-1 text-[12px] text-[#9AAAB0]">可从题库选择或新增题目</p>
                    <button
                      type="button"
                      onClick={() => onAdd(g.type)}
                      className="mt-4 inline-flex items-center gap-1.5 rounded-[8px] border border-primary/30 px-3.5 py-1.5 text-[12px] font-medium text-primary transition-colors hover:bg-primary-soft"
                    >
                      <Plus className="h-3.5 w-3.5" /> 添加题目
                    </button>
                  </div>
                )}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}

function IconBtn({
  icon: Icon,
  title,
  onClick,
  danger = false,
  disabled = false,
}: {
  icon: typeof ArrowUp;
  title: string;
  onClick?: () => void;
  danger?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "grid h-7 w-7 place-items-center rounded-[6px] transition-colors",
        disabled && "cursor-not-allowed opacity-30",
        !disabled && danger && "text-[#9AAAB0] hover:bg-destructive/10 hover:text-destructive",
        !disabled && !danger && "text-[#9AAAB0] hover:bg-[#F0F5F6] hover:text-[#1F3440]",
      )}
    >
      <Icon className="h-3.5 w-3.5" />
    </button>
  );
}

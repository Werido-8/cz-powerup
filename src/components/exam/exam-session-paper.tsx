import { useEffect, useMemo, useState } from "react";
import {
  Award,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Clock,
  FileText,
  ShieldCheck,
  Target,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PaperQuestionSummary } from "@/components/exam/paper-question-list";
import { PAPER_SPLIT_PANEL_H } from "@/components/exam/paper-side-panel";
import {
  buildExamSummary,
  flattenExamQuestions,
  isExamAnswerFilled,
  type ExamSessionPaper as ExamSessionPaperMeta,
} from "@/lib/mock/exam-session";
import {
  defaultOptionsForType,
  type Difficulty,
  type EditorGroup,
  type EditorQuestion,
  type QuestionType,
} from "@/lib/mock/examAdmin";
import { cn } from "@/lib/utils";

function diffClass(d: Difficulty) {
  return d === "易"
    ? "bg-success-soft text-success"
    : d === "中"
      ? "bg-warning-soft text-warning-foreground"
      : "bg-destructive/10 text-destructive";
}

function QuestionExamInteractive({
  question,
  type,
  value,
  onChange,
}: {
  question: EditorQuestion;
  type: QuestionType;
  value?: string | string[];
  onChange: (val: string | string[]) => void;
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
    const selected = Array.isArray(value)
      ? value
      : value
        ? isMulti
          ? value.split("")
          : [value]
        : [];

    const toggle = (key: string) => {
      if (isMulti) {
        const next = selected.includes(key) ? selected.filter((k) => k !== key) : [...selected, key];
        onChange(next.sort().join(""));
      } else {
        onChange(key);
      }
    };

    return (
      <div className="mt-3 space-y-1.5">
        {options?.map((o) => {
          const checked = selected.includes(o.key);
          return (
            <button
              key={o.key}
              type="button"
              onClick={() => toggle(o.key)}
              className={cn(
                "flex w-full items-start gap-3 rounded-[6px] px-3 py-2.5 text-left transition-colors",
                checked
                  ? "border border-primary/35 bg-primary-soft/70"
                  : "border border-transparent bg-[#F5FAFB] hover:border-[#DCE8EA] hover:bg-[#F0F7F8]",
              )}
            >
              <span
                className={cn(
                  "mt-0.5 grid h-[16px] w-[16px] shrink-0 place-items-center border",
                  isMulti ? "rounded-[3px]" : "rounded-full",
                  checked ? "border-primary/50 bg-primary-soft" : "border-[#C8DADD] bg-white",
                )}
                aria-hidden
              />
              <span className="text-[13px] leading-snug text-[#1F3440]/90">
                <span
                  className={cn(
                    "mr-2 inline-flex h-4 min-w-[16px] items-center justify-center rounded-[3px] px-1 text-[10.5px] font-semibold",
                    checked ? "bg-primary/15 text-primary" : "bg-[#EDF3F5] text-[#6B7F88]",
                  )}
                >
                  {o.key}
                </span>
                {o.text}
              </span>
            </button>
          );
        })}
      </div>
    );
  }

  if (type === "填空题") {
    const count = question.blankCount ?? 1;
    const blanks = Array.isArray(value) ? value : value ? [value] : Array(count).fill("");
    return (
      <div className="mt-3 space-y-2">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <span className="w-14 shrink-0 text-[12px] text-muted-foreground">填空 {i + 1}</span>
            <input
              type="text"
              value={blanks[i] ?? ""}
              onChange={(e) => {
                const next = [...blanks];
                next[i] = e.target.value;
                onChange(count === 1 ? next[0] : next);
              }}
              placeholder="请填写答案"
              className="h-9 flex-1 rounded-[6px] border border-[#DCE8EA] bg-white px-3 text-[13px] outline-none transition-colors focus:border-primary/50 focus:ring-1 focus:ring-primary/15"
            />
          </div>
        ))}
      </div>
    );
  }

  if (type === "简答题" || type === "案例分析题") {
    return (
      <div className="mt-3 rounded-[6px] border border-[#DCE8EA] bg-[#F5FAFB] px-3 py-2">
        <div className="mb-1.5 text-[11px] text-muted-foreground">作答区</div>
        <textarea
          rows={4}
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder="请输入你的作答…"
          className="min-h-[88px] w-full resize-y rounded-[4px] border border-[#DCE8EA] bg-white px-3 py-2 text-[13px] leading-relaxed outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/15"
        />
      </div>
    );
  }

  return null;
}

function ExamPaperInteractiveList({
  groups,
  answers,
  onAnswerChange,
  focusedId,
  onFocusQuestion,
}: {
  groups: EditorGroup[];
  answers: Record<string, string | string[]>;
  onAnswerChange: (id: string, val: string | string[]) => void;
  focusedId?: string;
  onFocusQuestion?: (id: string) => void;
}) {
  let globalNo = 0;

  if (groups.every((g) => g.questions.length === 0)) {
    return (
      <div className="flex flex-col items-center justify-center rounded-[12px] bg-white px-6 py-14 text-center shadow-[0px_0px_10px_0px_rgba(0,0,0,0.05)]">
        <p className="text-[14px] font-medium text-[#1F3440]/70">暂无题目</p>
      </div>
    );
  }

  return (
    <div className="space-y-[10px]">
      {groups.map((g) => {
        if (g.questions.length === 0) return null;
        const sectionScore = g.questions.length * g.perScore;

        return (
          <section
            key={g.type}
            className="overflow-hidden rounded-[12px] bg-white shadow-[0px_0px_10px_0px_rgba(0,0,0,0.05)]"
          >
            <header className="flex items-center justify-between border-b border-[#EDF3F5] bg-[#FAFCFD] px-5 py-3">
              <div className="flex items-center gap-2">
                <span className="inline-block h-[1em] w-[5px] shrink-0 rounded-[1px] bg-primary" />
                <span className="text-[14px] font-bold text-[#1F3440]">{g.type}</span>
                <span className="text-[12px] text-muted-foreground">
                  共 {g.questions.length} 题 · 每题 {g.perScore} 分 · 小计 {sectionScore} 分
                </span>
              </div>
            </header>

            <div className="divide-y divide-[#EDF3F5]">
              {g.questions.map((q) => {
                globalNo += 1;
                const filled = isExamAnswerFilled(answers[q.id]);
                const isFocused = focusedId === q.id;
                return (
                  <article
                    key={q.id}
                    id={`exam-q-${q.id}`}
                    onFocus={() => onFocusQuestion?.(q.id)}
                    className={cn(
                      "scroll-mt-4 px-5 py-4 transition-colors",
                      isFocused && "bg-primary-soft/20",
                      filled && !isFocused && "bg-[#FAFCFD]",
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className={cn(
                          "mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full text-[11px] font-bold",
                          filled ? "bg-primary text-primary-foreground" : "bg-primary-soft text-primary",
                        )}
                      >
                        {String(globalNo).padStart(2, "0")}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-[14px] font-medium leading-relaxed text-[#1F3440]">{q.stem}</p>
                        <QuestionExamInteractive
                          question={q}
                          type={g.type}
                          value={answers[q.id]}
                          onChange={(val) => onAnswerChange(q.id, val)}
                        />
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
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}

const ANSWER_CARD_PAGE_SIZE = 15;
const ANSWER_CARD_COLS = 5;

function AnswerSheetPager({
  page,
  totalPages,
  onPrev,
  onNext,
  onGoPage,
}: {
  page: number;
  totalPages: number;
  onPrev: () => void;
  onNext: () => void;
  onGoPage: (p: number) => void;
}) {
  const canPrev = page > 0;
  const canNext = page < totalPages - 1;

  return (
    <div className="mt-3 flex items-center justify-center gap-3">
      <button
        type="button"
        onClick={onPrev}
        disabled={!canPrev}
        aria-label="上一页"
        className={cn(
          "grid h-9 w-9 place-items-center rounded-full border border-[#DCE8EA] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.06)] transition-colors",
          canPrev
            ? "text-[#607681] hover:border-primary/35 hover:text-primary"
            : "cursor-not-allowed text-[#C8DADD]",
        )}
      >
        <ChevronLeft className="h-4 w-4 stroke-[2]" />
      </button>

      <div className="flex items-center gap-1.5 rounded-full border border-[#DCE8EA] bg-white px-3 py-2 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
        {Array.from({ length: totalPages }).map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onGoPage(i)}
            aria-label={`第 ${i + 1} 页`}
            aria-current={i === page ? "page" : undefined}
            className={cn(
              "rounded-full transition-all",
              i === page ? "h-1.5 w-6 bg-primary" : "h-1.5 w-1.5 bg-[#C8DADD] hover:bg-[#9AAAB0]",
            )}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={onNext}
        disabled={!canNext}
        aria-label="下一页"
        className={cn(
          "grid h-9 w-9 place-items-center rounded-full border border-[#DCE8EA] bg-white shadow-[0_1px_4px_rgba(0,0,0,0.06)] transition-colors",
          canNext
            ? "text-[#1F3440] hover:border-primary/35 hover:text-primary"
            : "cursor-not-allowed text-[#C8DADD]",
        )}
      >
        <ChevronRight className="h-4 w-4 stroke-[2]" />
      </button>
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

function ExamSessionSidebar({
  meta,
  groups,
  answers,
  focusedId,
  onQuestionJump,
  onSubmit,
  remaining,
  formatTime,
}: {
  meta: ExamSessionPaperMeta;
  groups: EditorGroup[];
  answers: Record<string, string | string[]>;
  focusedId?: string;
  onQuestionJump: (id: string) => void;
  onSubmit: () => void;
  remaining: number;
  formatTime: (s: number) => string;
}) {
  const flat = useMemo(() => flattenExamQuestions(groups), [groups]);
  const answered = flat.filter((item) => isExamAnswerFilled(answers[item.question.id])).length;
  const typeBreakdown = groups
    .filter((g) => g.questions.length > 0)
    .map((g) => ({ label: g.type.replace("题", ""), count: g.questions.length }));
  const total = typeBreakdown.reduce((s, t) => s + t.count, 0) || meta.questionCount;
  const timerUrgent = remaining > 0 && remaining < 60;

  const totalPages = Math.max(1, Math.ceil(flat.length / ANSWER_CARD_PAGE_SIZE));
  const [cardPage, setCardPage] = useState(0);

  useEffect(() => {
    if (!focusedId) return;
    const idx = flat.findIndex((item) => item.question.id === focusedId);
    if (idx >= 0) {
      setCardPage(Math.floor(idx / ANSWER_CARD_PAGE_SIZE));
    }
  }, [focusedId, flat]);

  const pageItems = flat.slice(
    cardPage * ANSWER_CARD_PAGE_SIZE,
    (cardPage + 1) * ANSWER_CARD_PAGE_SIZE,
  );

  return (
    <aside
      className={cn(
        "flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-[0_1px_3px_rgba(0,0,0,0.04)]",
        PAPER_SPLIT_PANEL_H,
      )}
    >
      <div className="shrink-0 rounded-t-xl bg-gradient-to-br from-primary to-[oklch(0.5_0.13_205)] px-4 py-4 text-white">
        <div className="inline-flex items-center gap-1.5 text-[11px] opacity-90">
          <Award className="h-3.5 w-3.5" />
          考试中
        </div>
        <div className="mt-1.5 line-clamp-2 text-[15px] font-semibold leading-snug">{meta.title}</div>
        <div className="mt-4 grid grid-cols-3 gap-2">
          <div className="rounded-lg bg-white/15 px-2 py-2.5 text-center backdrop-blur-sm">
            <div className="text-[20px] font-bold leading-none tabular-nums">{meta.questionCount}</div>
            <div className="mt-1 text-[10px] opacity-90">题量</div>
          </div>
          <div className="rounded-lg bg-white/15 px-2 py-2.5 text-center backdrop-blur-sm">
            <div className="text-[20px] font-bold leading-none tabular-nums">{meta.duration}</div>
            <div className="mt-1 text-[10px] opacity-90">分钟</div>
          </div>
          <div className="rounded-lg bg-white/15 px-2 py-2.5 text-center backdrop-blur-sm">
            <div className="text-[20px] font-bold leading-none tabular-nums">{meta.passLine}</div>
            <div className="mt-1 text-[10px] opacity-90">及格线</div>
          </div>
        </div>
      </div>

      <div className="shrink-0 border-b border-border/60 px-4 py-3">
        <div
          className={cn(
            "flex items-center justify-between rounded-lg px-3 py-2",
            timerUrgent ? "bg-destructive/10" : "bg-primary-soft/50",
          )}
        >
          <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            剩余时间
          </span>
          <span
            className={cn(
              "text-[16px] font-bold tabular-nums",
              timerUrgent ? "text-destructive" : "text-primary",
            )}
          >
            {formatTime(remaining)}
          </span>
        </div>
      </div>

      <div className="shrink-0 border-b border-border/60 px-4 py-3.5">
        <div className="mb-2.5 text-[11px] font-medium text-muted-foreground">试卷信息</div>
        <dl className="grid grid-cols-2 gap-x-3 gap-y-2.5">
          <div className="flex items-start gap-1.5">
            <Target className="mt-0.5 h-3 w-3 shrink-0 text-muted-foreground/70" />
            <div>
              <dt className="text-[10px] text-muted-foreground">考试目标</dt>
              <dd className="truncate text-[12px] font-medium">{meta.goal}</dd>
            </div>
          </div>
          <div className="flex items-start gap-1.5">
            <BarChart3 className="mt-0.5 h-3 w-3 shrink-0 text-muted-foreground/70" />
            <div>
              <dt className="text-[10px] text-muted-foreground">难度</dt>
              <dd className="truncate text-[12px] font-medium text-warning-foreground">{meta.difficulty}</dd>
            </div>
          </div>
          <div className="flex items-start gap-1.5">
            <FileText className="mt-0.5 h-3 w-3 shrink-0 text-muted-foreground/70" />
            <div>
              <dt className="text-[10px] text-muted-foreground">知识分类</dt>
              <dd className="truncate text-[12px] font-medium">{meta.category}</dd>
            </div>
          </div>
          <div className="flex items-start gap-1.5">
            <ShieldCheck className="mt-0.5 h-3 w-3 shrink-0 text-muted-foreground/70" />
            <div>
              <dt className="text-[10px] text-muted-foreground">答题进度</dt>
              <dd className="truncate text-[12px] font-semibold text-primary">
                {answered} / {flat.length}
              </dd>
            </div>
          </div>
        </dl>
      </div>

      <div className="shrink-0 border-b border-border/60 px-4 py-3.5">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[11px] font-medium text-muted-foreground">答题卡</span>
          <span className="text-[10.5px] text-muted-foreground">
            已答 {answered} / {flat.length}
          </span>
        </div>
        <div className="grid grid-cols-5 gap-1.5">
          {Array.from({ length: ANSWER_CARD_PAGE_SIZE }).map((_, i) => {
            const item = pageItems[i];
            if (!item) {
              return <div key={`empty-${i}`} className="h-8" aria-hidden />;
            }
            const filled = isExamAnswerFilled(answers[item.question.id]);
            const current = focusedId === item.question.id;
            return (
              <button
                key={item.question.id}
                type="button"
                onClick={() => onQuestionJump(item.question.id)}
                className={cn(
                  "grid h-8 place-items-center rounded-[6px] text-[11px] font-semibold transition-colors",
                  current
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : filled
                      ? "bg-success-soft text-success hover:bg-success-soft/80"
                      : "bg-muted text-muted-foreground hover:bg-muted/80",
                )}
              >
                {item.globalNo}
              </button>
            );
          })}
        </div>

        {totalPages > 1 && (
          <AnswerSheetPager
            page={cardPage}
            totalPages={totalPages}
            onPrev={() => setCardPage((p) => Math.max(0, p - 1))}
            onNext={() => setCardPage((p) => Math.min(totalPages - 1, p + 1))}
            onGoPage={setCardPage}
          />
        )}
      </div>

      <div className="shrink-0 px-4 py-3.5">
        <div className="mb-2 text-[11px] font-medium text-muted-foreground">题型构成</div>
        <div className="space-y-1.5">
          {typeBreakdown.map((t) => (
            <TypeBar key={t.label} label={t.label} count={t.count} total={total} />
          ))}
        </div>
      </div>

      <div className="mt-auto shrink-0 space-y-2 border-t border-border/60 p-4">
        <button
          type="button"
          onClick={onSubmit}
          className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-success px-4 py-2.5 text-[13px] font-semibold text-white transition-colors hover:bg-success/90"
        >
          提前交卷
        </button>
        <p className="text-center text-[10.5px] leading-relaxed text-muted-foreground">
          考试模式下不显示解析，提交后可查看完整解析与错题分析
        </p>
      </div>
    </aside>
  );
}

export function ExamSessionPaperView({
  meta,
  groups,
  answers,
  onAnswerChange,
  onSubmit,
  onExit,
  remaining,
  formatTime,
}: {
  meta: ExamSessionPaperMeta;
  groups: EditorGroup[];
  answers: Record<string, string | string[]>;
  onAnswerChange: (id: string, val: string | string[]) => void;
  onSubmit: () => void;
  onExit: () => void;
  remaining: number;
  formatTime: (s: number) => string;
}) {
  const summary = useMemo(() => buildExamSummary(groups), [groups]);
  const [focusedId, setFocusedId] = useState<string | undefined>(
    () => flattenExamQuestions(groups)[0]?.question.id,
  );

  const jumpToQuestion = (id: string) => {
    setFocusedId(id);
    document.getElementById(`exam-q-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <>
      <div className="mb-3 flex shrink-0 flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className="rounded-md bg-destructive/10 px-2 py-0.5 text-[10.5px] font-medium text-destructive">
            模拟考试
          </span>
          <h1 className="truncate text-[16px] font-semibold">{meta.title}</h1>
        </div>
        <button
          type="button"
          onClick={onExit}
          className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-[12px] text-muted-foreground hover:bg-muted"
        >
          <X className="h-3.5 w-3.5" /> 退出
        </button>
      </div>

      <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-stretch">
        <div className={cn("min-h-0 overflow-y-auto overscroll-contain pr-0.5", PAPER_SPLIT_PANEL_H)}>
          <div className="space-y-4 pb-2">
            <PaperQuestionSummary summary={summary} />
            <ExamPaperInteractiveList
              groups={groups}
              answers={answers}
              onAnswerChange={onAnswerChange}
              focusedId={focusedId}
              onFocusQuestion={setFocusedId}
            />
          </div>
        </div>

        <ExamSessionSidebar
          meta={meta}
          groups={groups}
          answers={answers}
          focusedId={focusedId}
          onQuestionJump={jumpToQuestion}
          onSubmit={onSubmit}
          remaining={remaining}
          formatTime={formatTime}
        />
      </div>
    </>
  );
}

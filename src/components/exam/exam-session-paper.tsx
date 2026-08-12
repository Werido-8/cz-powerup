import { useMemo, useState } from "react";
import {
  BarChart3,
  CheckCircle2,
  Clock,
  FileText,
  Flag,
  ShieldCheck,
  Target,
  X,
} from "lucide-react";
import {
  flattenExamQuestions,
  isExamAnswerFilled,
  type ExamSessionPaper as ExamSessionPaperMeta,
} from "@/lib/mock/exam-session";
import {
  defaultOptionsForType,
  type EditorGroup,
  type EditorQuestion,
  type QuestionType,
} from "@/lib/mock/examAdmin";
import { cn } from "@/lib/utils";

function ExamQuestion({
  question,
  type,
  value,
  onChange,
}: {
  question: EditorQuestion;
  type: QuestionType;
  value?: string | string[];
  onChange: (value: string | string[]) => void;
}) {
  const options =
    question.options ??
    defaultOptionsForType(type) ??
    (type === "单选题" || type === "多选题"
      ? [
          { key: "A", text: "选项内容未配置" },
          { key: "B", text: "选项内容未配置" },
          { key: "C", text: "选项内容未配置" },
          { key: "D", text: "选项内容未配置" },
        ]
      : undefined);

  if (type === "单选题" || type === "多选题" || type === "判断题") {
    const multiple = type === "多选题";
    const selected = Array.isArray(value)
      ? value
      : value
        ? multiple
          ? value.split("")
          : [value]
        : [];

    return (
      <div className="mt-4 grid gap-1.5">
        {options?.map((option) => {
          const checked = selected.includes(option.key);
          return (
            <button
              key={option.key}
              type="button"
              onClick={() => {
                if (!multiple) {
                  onChange(option.key);
                  return;
                }
                const next = checked
                  ? selected.filter((key) => key !== option.key)
                  : [...selected, option.key];
                onChange(next.sort().join(""));
              }}
              aria-pressed={checked}
              className={cn(
                "grid min-h-11 w-full grid-cols-[18px_22px_minmax(0,1fr)] items-center gap-2.5 rounded-[6px] border px-3 py-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25",
                checked
                  ? "border-primary/40 bg-primary-soft/70"
                  : "border-transparent bg-[#f4f8f9] hover:border-primary/25 hover:bg-[#eef7f8]",
              )}
            >
              <span
                aria-hidden="true"
                className={cn(
                  "h-[16px] w-[16px] rounded-full border",
                  checked
                    ? "border-primary bg-primary shadow-[inset_0_0_0_4px_white]"
                    : "border-[#bad4d9] bg-white",
                )}
              />
              <span
                className={cn(
                  "grid h-5 w-5 place-items-center rounded-[4px] text-[10px] font-bold",
                  checked ? "bg-primary/12 text-primary" : "bg-white/85 text-kb-muted",
                )}
              >
                {option.key}
              </span>
              <span className="text-[13px] leading-6 text-kb-body">{option.text}</span>
            </button>
          );
        })}
      </div>
    );
  }

  if (type === "填空题") {
    const blankCount = question.blankCount ?? 1;
    const blanks = Array.isArray(value) ? value : value ? [value] : Array(blankCount).fill("");
    return (
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {Array.from({ length: blankCount }).map((_, index) => (
          <label key={index} className="grid gap-1.5">
            <span className="text-[11px] font-medium text-kb-muted">填空 {index + 1}</span>
            <input
              value={blanks[index] ?? ""}
              onChange={(event) => {
                const next = [...blanks];
                next[index] = event.target.value;
                onChange(blankCount === 1 ? (next[0] ?? "") : next);
              }}
              className="min-h-11 rounded-[6px] border border-kb-border bg-[#f8fbfb] px-3.5 text-[13px] outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
              placeholder="请输入答案"
            />
          </label>
        ))}
      </div>
    );
  }

  return (
    <textarea
      rows={5}
      value={typeof value === "string" ? value : ""}
      onChange={(event) => onChange(event.target.value)}
      placeholder="请输入你的作答"
      className="mt-4 min-h-[124px] w-full resize-y rounded-[6px] border border-kb-border bg-[#f8fbfb] p-3.5 text-[13px] leading-6 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
    />
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
  onAnswerChange: (id: string, value: string | string[]) => void;
  onSubmit: () => void;
  onExit: () => void;
  remaining: number;
  formatTime: (seconds: number) => string;
}) {
  const flat = useMemo(() => flattenExamQuestions(groups), [groups]);
  const [activeQuestionId, setActiveQuestionId] = useState(flat[0]?.question.id ?? "");
  const answered = flat.filter((item) => isExamAnswerFilled(answers[item.question.id])).length;
  const personal = meta.employeePaperId === "default";
  const timerUrgent = remaining > 0 && remaining < 300;
  const totalScore = groups.reduce(
    (sum, group) =>
      sum + group.questions.reduce((groupSum, question) => groupSum + question.score, 0),
    0,
  );
  const maxGroupCount = Math.max(...groups.map((group) => group.questions.length), 1);

  const jumpToQuestion = (questionId: string) => {
    setActiveQuestionId(questionId);
    document.getElementById(`exam-question-${questionId}`)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  if (!flat.length) {
    return (
      <div className="grid h-full place-items-center rounded-[14px] border border-kb-border bg-white text-kb-muted">
        当前试卷暂无题目
      </div>
    );
  }

  let globalOffset = 0;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="mb-3 flex shrink-0 flex-wrap items-center justify-between gap-3 rounded-[12px] border border-kb-border bg-white px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <span
            className={cn(
              "rounded-full px-2.5 py-1 text-[11px] font-semibold",
              personal ? "bg-warning-soft text-warning" : "bg-primary-soft text-primary",
            )}
          >
            {personal ? "模拟考试" : "正式考试"}
          </span>
          <h1 className="truncate text-[16px] font-semibold text-kb-heading">{meta.title}</h1>
          <span className="hidden text-[11px] tabular-nums text-kb-muted sm:inline">
            已答 {answered} / {flat.length}
          </span>
        </div>
        <button
          type="button"
          onClick={onExit}
          className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-kb-border px-3.5 text-[12px] text-kb-muted transition-colors hover:bg-kb-surface hover:text-kb-heading"
        >
          <X className="h-3.5 w-3.5" /> 退出
        </button>
      </header>

      <div className="grid min-h-0 flex-1 gap-4 overflow-y-auto lg:grid-cols-[minmax(0,1fr)_360px] lg:overflow-hidden">
        <article className="min-h-[640px] overflow-y-auto rounded-[14px] border border-kb-border bg-white lg:min-h-0">
          {groups
            .filter((group) => group.questions.length > 0)
            .map((group, groupIndex) => {
              const startNo = globalOffset + 1;
              globalOffset += group.questions.length;
              const groupScore = group.questions.reduce((sum, question) => sum + question.score, 0);
              return (
                <section key={group.type}>
                  <div className="sticky top-0 z-10 border-b border-kb-border bg-[#f8fafb]/95 px-5 py-3 backdrop-blur sm:px-6">
                    <div className="mx-auto flex w-full max-w-[1080px] flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="h-5 w-1 rounded-full bg-primary" aria-hidden="true" />
                        <h2 className="text-[14px] font-semibold text-kb-heading">{group.type}</h2>
                        <span className="text-[12px] text-kb-muted">
                          共 {group.questions.length} 题 · 每题 {group.perScore} 分 · 小计{" "}
                          {groupScore} 分
                        </span>
                      </div>
                      <span className="text-[10.5px] text-kb-muted">第 {groupIndex + 1} 部分</span>
                    </div>
                  </div>

                  <div className="mx-auto w-full max-w-[1080px] divide-y divide-divider">
                    {group.questions.map((question, questionIndex) => {
                      const globalNo = startNo + questionIndex;
                      return (
                        <section
                          key={question.id}
                          id={`exam-question-${question.id}`}
                          className="scroll-mt-12 px-5 py-5 sm:px-6"
                          onFocusCapture={() => setActiveQuestionId(question.id)}
                        >
                          <div className="flex items-start gap-3">
                            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary text-[11px] font-semibold tabular-nums text-white">
                              {String(globalNo).padStart(2, "0")}
                            </span>
                            <div className="min-w-0 flex-1">
                              <h3 className="pt-0.5 text-[14px] font-medium leading-7 text-kb-heading">
                                {question.stem}
                              </h3>
                              <ExamQuestion
                                question={question}
                                type={group.type}
                                value={answers[question.id]}
                                onChange={(value) => {
                                  setActiveQuestionId(question.id);
                                  onAnswerChange(question.id, value);
                                }}
                              />
                              <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-dashed border-divider pt-2.5 text-[10.5px] text-kb-muted">
                                <span className="rounded-[4px] bg-kb-surface px-2 py-1">
                                  {question.knowledge}
                                </span>
                                <span
                                  className={cn(
                                    "rounded-[4px] px-2 py-1",
                                    question.difficulty === "难"
                                      ? "bg-destructive-soft text-destructive"
                                      : question.difficulty === "中"
                                        ? "bg-warning-soft text-warning"
                                        : "bg-success-soft text-success",
                                  )}
                                >
                                  {question.difficulty}
                                </span>
                                <span>{question.score} 分</span>
                              </div>
                            </div>
                          </div>
                        </section>
                      );
                    })}
                  </div>
                </section>
              );
            })}
        </article>

        <aside className="flex min-h-0 flex-col overflow-hidden rounded-[14px] border border-kb-border bg-white lg:h-full">
          <div className="shrink-0 bg-[linear-gradient(135deg,#0c98a7_0%,#078a99_100%)] p-5 text-white">
            <p className="flex items-center gap-2 text-[11.5px] font-medium text-white/85">
              <ShieldCheck className="h-4 w-4" /> 考试中
            </p>
            <h2 className="mt-3 line-clamp-2 text-[16px] font-semibold leading-6">{meta.title}</h2>
            <dl className="mt-4 grid grid-cols-3 gap-2">
              <StatusMetric value={`${flat.length}`} label="题量" inverse />
              <StatusMetric value={`${meta.duration}`} label="分钟" inverse />
              <StatusMetric value={`${meta.passLine}`} label="及格线" inverse />
            </dl>
          </div>

          <div className="shrink-0 border-b border-kb-border p-4">
            <div className="flex items-center justify-between rounded-full bg-[#f2f7f8] px-4 py-2.5">
              <span className="flex items-center gap-2 text-[11.5px] text-kb-muted">
                <Clock className="h-4 w-4" /> 剩余时间
              </span>
              <strong
                className={cn(
                  "text-[17px] tabular-nums",
                  timerUrgent ? "text-destructive" : "text-primary",
                )}
              >
                {formatTime(remaining)}
              </strong>
            </div>
          </div>

          <dl className="grid shrink-0 grid-cols-2 gap-4 border-b border-kb-border p-4 text-[11.5px]">
            <InfoItem icon={Target} label="考试目标" value={meta.goal} />
            <InfoItem icon={BarChart3} label="难度" value={meta.difficulty} />
            <InfoItem icon={FileText} label="知识分类" value={meta.category} />
            <InfoItem icon={ShieldCheck} label="答题进度" value={`${answered} / ${flat.length}`} />
          </dl>

          <div className="min-h-0 flex-1 overflow-y-auto border-b border-kb-border p-4">
            <div className="mb-3 flex items-center justify-between text-[11px] text-kb-muted">
              <span>答题卡</span>
              <span>
                已答 {answered} / {flat.length}
              </span>
            </div>
            <div className="space-y-4">
              {groups
                .filter((group) => group.questions.length > 0)
                .map((group) => (
                  <div key={group.type}>
                    <div className="mb-2 flex items-center justify-between text-[10.5px] text-kb-muted">
                      <span>{group.type}</span>
                      <span>{group.questions.length} 题</span>
                    </div>
                    <div className="grid grid-cols-5 gap-2">
                      {group.questions.map((question) => {
                        const item = flat.find((entry) => entry.question.id === question.id);
                        const filled = isExamAnswerFilled(answers[question.id]);
                        return (
                          <button
                            key={question.id}
                            type="button"
                            onClick={() => jumpToQuestion(question.id)}
                            aria-current={activeQuestionId === question.id ? "step" : undefined}
                            aria-label={`跳转到第 ${item?.globalNo ?? ""} 题${filled ? "，已作答" : ""}`}
                            className={cn(
                              "grid h-9 place-items-center rounded-[7px] border text-[11px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
                              activeQuestionId === question.id
                                ? "border-primary bg-primary text-white"
                                : filled
                                  ? "border-success/10 bg-success-soft text-success"
                                  : "border-transparent bg-kb-surface text-kb-muted hover:bg-primary-soft hover:text-primary",
                            )}
                          >
                            {item?.globalNo}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
            </div>
          </div>

          <div className="shrink-0 border-b border-kb-border p-4">
            <p className="mb-3 text-[11px] text-kb-muted">题型构成</p>
            <div className="space-y-2">
              {groups
                .filter((group) => group.questions.length > 0)
                .map((group) => (
                  <div
                    key={group.type}
                    className="grid grid-cols-[52px_minmax(0,1fr)_42px] items-center gap-2 text-[10.5px]"
                  >
                    <span className="text-kb-body">{group.type.replace("题", "")}</span>
                    <span className="h-1.5 overflow-hidden rounded-full bg-kb-surface">
                      <span
                        className="block h-full rounded-full bg-primary/60"
                        style={{
                          width: `${Math.max(10, (group.questions.length / maxGroupCount) * 100)}%`,
                        }}
                      />
                    </span>
                    <span className="text-right tabular-nums text-kb-muted">
                      {group.questions.length} 题
                    </span>
                  </div>
                ))}
            </div>
          </div>

          <div className="shrink-0 p-4">
            <button
              type="button"
              onClick={onSubmit}
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-[8px] bg-primary text-[13px] font-semibold text-white transition-colors hover:bg-primary/90"
            >
              <Flag className="h-4 w-4" /> 统一交卷
            </button>
            <p className="mt-2 flex items-center justify-center gap-1.5 text-center text-[10.5px] leading-5 text-kb-muted">
              <CheckCircle2 className="h-3.5 w-3.5 text-success" /> 交卷前可回看并修改全部答案
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}

function StatusMetric({
  value,
  label,
  inverse = false,
}: {
  value: string;
  label: string;
  inverse?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-[12px] px-2 py-3 text-center",
        inverse ? "bg-white/14" : "border border-kb-border bg-kb-surface/30",
      )}
    >
      <strong
        className={cn("block text-[18px] tabular-nums", inverse ? "text-white" : "text-kb-heading")}
      >
        {value}
      </strong>
      <span className={cn("text-[10px]", inverse ? "text-white/80" : "text-kb-muted")}>
        {label}
      </span>
    </div>
  );
}

function InfoItem({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Target;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
      <div className="min-w-0">
        <dt className="text-kb-muted">{label}</dt>
        <dd className="mt-0.5 truncate font-medium text-kb-heading">{value}</dd>
      </div>
    </div>
  );
}

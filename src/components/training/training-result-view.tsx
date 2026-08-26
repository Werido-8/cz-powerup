import {
  BookMarked,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Clock3,
  FileText,
  TrendingUp,
  X,
} from "lucide-react";
import { PageTitleMark } from "@/components/learning/ui";
import type {
  SavedTrainingResult,
  TrainingResultAnswer,
  TrainingResultQuestion,
} from "@/lib/training/result";
import { isTrainingResultAnswerFilled, resolveTrainingResultScore } from "@/lib/training/result";
import { cn } from "@/lib/utils";

type QuestionState = "correct" | "wrong" | "unanswered";

function formatDuration(seconds: number) {
  const safeSeconds = Math.max(0, Math.round(seconds));
  const minutes = Math.floor(safeSeconds / 60);
  const rest = safeSeconds % 60;
  if (minutes === 0) return `${rest} 秒`;
  return rest === 0 ? `${minutes} 分钟` : `${minutes} 分 ${rest} 秒`;
}

function formatDateTime(value?: string) {
  if (!value) return "本次提交";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function getQuestionState(result: SavedTrainingResult, question: TrainingResultQuestion) {
  if (!isTrainingResultAnswerFilled(result.answers[question.id])) return "unanswered" as const;
  return result.wrongIds.includes(question.id) ? ("wrong" as const) : ("correct" as const);
}

const stateStyle: Record<
  QuestionState,
  { label: string; icon: typeof Check; dot: string; text: string; answer: string }
> = {
  correct: {
    label: "正确",
    icon: Check,
    dot: "bg-success text-white",
    text: "text-success",
    answer: "text-success",
  },
  wrong: {
    label: "错误",
    icon: X,
    dot: "bg-destructive text-white",
    text: "text-destructive",
    answer: "text-destructive",
  },
  unanswered: {
    label: "未答",
    icon: X,
    dot: "bg-[#F28B20] text-white",
    text: "text-[#D96E00]",
    answer: "text-[#D96E00]",
  },
};

export function TrainingResultView({
  result,
  onBack,
  onViewWrong,
}: {
  result: SavedTrainingResult & { questions: TrainingResultQuestion[] };
  onBack: () => void;
  onViewWrong: () => void;
}) {
  const questionStates = result.questions.map((question) => ({
    question,
    state: getQuestionState(result, question),
  }));
  const correct = questionStates.filter((item) => item.state === "correct").length;
  const wrong = questionStates.filter((item) => item.state === "wrong").length;
  const unanswered = questionStates.filter((item) => item.state === "unanswered").length;
  const answered = Math.max(0, result.total - unanswered);
  const scoreDisplay = resolveTrainingResultScore(result, {
    correct,
    total: result.total,
  });
  const hasPassLine = scoreDisplay.hasPassLine;
  const passed =
    !hasPassLine || result.passScore == null || (scoreDisplay.scoreValue ?? 0) >= result.passScore;
  const tonePercent = scoreDisplay.tonePercent;
  const scoreTone =
    tonePercent >= 80
      ? {
          ring: "#169f82",
          track: "#d9e9e5",
          panel: "radial-gradient(circle at 35% 20%, #ffffff 0%, #f1faf8 52%, #e8f6f2 100%)",
          text: "text-success",
          badge: "bg-success text-white",
          icon: Check,
          practiceLabel: "掌握良好",
        }
      : tonePercent >= 60
        ? {
            ring: "#e59a16",
            track: "#f2e7cf",
            panel: "radial-gradient(circle at 35% 20%, #ffffff 0%, #fff9ed 52%, #fff2d8 100%)",
            text: "text-[#c77800]",
            badge: "bg-[#e59a16] text-white",
            icon: TrendingUp,
            practiceLabel: "基本掌握",
          }
        : {
            ring: "#e05252",
            track: "#f0dddd",
            panel: "radial-gradient(circle at 35% 20%, #ffffff 0%, #fff6f6 52%, #fde9e9 100%)",
            text: "text-destructive",
            badge: "bg-destructive text-white",
            icon: CircleAlert,
            practiceLabel: "需要加强",
          };
  const statusLabel = hasPassLine ? (passed ? "成绩合格" : "成绩未通过") : scoreTone.practiceLabel;
  const ScoreStatusIcon = scoreTone.icon;
  const sourceLabel = result.sourceLabel ?? "答题练习";

  const scrollToQuestion = (id: string) => {
    document
      .getElementById(`training-result-question-${id}`)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <div className="flex h-8 shrink-0 items-center justify-between gap-4">
        <nav
          aria-label="页面导航"
          className="flex min-w-0 items-center gap-1 text-[11.5px] text-kb-muted"
        >
          <button
            type="button"
            onClick={onBack}
            aria-label={`返回${sourceLabel}`}
            className="truncate rounded-[4px] transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          >
            {sourceLabel}
          </button>
          <ChevronRight className="h-3 w-3 shrink-0 text-kb-muted/50" aria-hidden />
          <span className="text-kb-heading">答题结果</span>
        </nav>
        <button
          type="button"
          onClick={onBack}
          className="inline-flex h-8 shrink-0 items-center gap-1 rounded-[7px] border border-kb-border bg-white px-3 text-[11.5px] font-medium text-kb-muted transition-colors hover:border-primary/30 hover:text-primary"
        >
          <ChevronLeft className="h-3.5 w-3.5" /> 返回
        </button>
      </div>

      <section className="grid shrink-0 gap-3 rounded-[14px] border border-kb-border bg-white p-3 shadow-[0_14px_36px_rgba(25,69,78,0.075)] xl:grid-cols-[218px_minmax(0,1fr)]">
        <div
          className="flex min-h-[186px] items-center justify-center gap-5 rounded-[11px] px-5 py-3 xl:flex-col xl:gap-2"
          style={{ background: scoreTone.panel }}
        >
          <div
            className="grid h-[108px] w-[108px] shrink-0 place-items-center rounded-full shadow-[0_8px_24px_rgba(35,139,151,0.12)]"
            style={{
              background: `conic-gradient(${scoreTone.ring} ${Math.min(Math.max(scoreDisplay.ringPercent, 0), 100) * 3.6}deg, ${scoreTone.track} 0deg)`,
            }}
          >
            <div className="grid h-[92px] w-[92px] place-items-center rounded-full bg-white text-center shadow-[inset_0_0_0_1px_rgba(220,235,237,0.82)]">
              <div>
                <strong
                  className={cn(
                    "block leading-none tabular-nums text-kb-heading",
                    scoreDisplay.displayValue.length >= 4 ||
                      (scoreDisplay.metric === "points" && (scoreDisplay.scoreValue ?? 0) >= 100)
                      ? "text-[24px] font-semibold"
                      : "text-[33px]",
                  )}
                >
                  {scoreDisplay.displayValue}
                </strong>
                <span className="mt-1 block text-[9.5px] text-kb-muted">
                  {scoreDisplay.displayLabel}
                </span>
              </div>
            </div>
          </div>
          <div
            className={cn("flex items-center gap-1.5 text-[13.5px] font-semibold", scoreTone.text)}
          >
            <span className={cn("grid h-5 w-5 place-items-center rounded-full", scoreTone.badge)}>
              <ScoreStatusIcon className="h-3.5 w-3.5" />
            </span>
            {statusLabel}
          </div>
          <p className="text-center text-[9.5px] leading-4 text-kb-muted">{scoreDisplay.caption}</p>
        </div>

        <div className="flex min-w-0 flex-col justify-center px-3 py-1.5 pr-4">
          <div className="flex min-w-0 items-start gap-3">
            <PageTitleMark className="pt-0" />
            <div className="min-w-0">
              <h1 className="truncate text-[18px] font-semibold tracking-[-0.01em] text-kb-heading">
                {result.title ?? "本次答题结果"}
              </h1>
              <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10.5px] text-kb-muted">
                <span>{formatDateTime(result.submittedAt)}</span>
                <span className="inline-flex items-center gap-1">
                  <Clock3 className="h-3 w-3" /> 用时 {formatDuration(result.elapsed)}
                </span>
                <span>{sourceLabel}</span>
              </div>
            </div>
          </div>

          <div className="mt-3.5 grid grid-cols-4 divide-x divide-divider border-y border-divider py-3.5">
            <SummaryMetric value={`${answered} / ${result.total}`} label="答题数" />
            <SummaryMetric value={`${correct} / ${result.total}`} label="答对题数" tone="success" />
            <SummaryMetric value={`${wrong} / ${result.total}`} label="答错题数" tone="danger" />
            <SummaryMetric
              value={`${unanswered} / ${result.total}`}
              label="未答题数"
              tone="warning"
            />
          </div>

          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              onClick={onViewWrong}
              className="inline-flex h-9 items-center gap-2 rounded-[8px] bg-primary px-4 text-[11.5px] font-semibold text-primary-foreground shadow-[0_7px_16px_rgba(13,150,167,0.18)] transition-[transform,background-color,box-shadow] hover:bg-primary/90 hover:shadow-[0_9px_20px_rgba(13,150,167,0.22)] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            >
              <BookMarked className="h-3.5 w-3.5" />
              查看错题本
            </button>
          </div>
        </div>
      </section>

      <div className="grid min-h-0 flex-1 gap-3 xl:grid-cols-[minmax(0,1fr)_282px]">
        <section className="flex min-h-[420px] min-w-0 flex-col overflow-hidden rounded-[12px] border border-kb-border bg-white xl:min-h-0">
          <header className="flex h-11 shrink-0 items-center justify-between border-b border-divider px-4">
            <div className="flex items-center gap-2">
              <span className="h-5 w-[3px] rounded-full bg-primary" aria-hidden />
              <h2 className="text-[14px] font-semibold text-kb-heading">答题详情</h2>
            </div>
            <span className="text-[10.5px] text-kb-muted">共 {result.total} 题</span>
          </header>

          <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto bg-[#F8FBFB] p-2.5">
            {questionStates.length > 0 ? (
              <div className="space-y-2">
                {questionStates.map(({ question, state }, index) => (
                  <ResultQuestionCard
                    key={question.id}
                    question={question}
                    number={index + 1}
                    state={state}
                    userAnswer={result.answers[question.id]}
                  />
                ))}
              </div>
            ) : (
              <div className="grid h-full min-h-56 place-items-center text-center">
                <div>
                  <FileText className="mx-auto h-8 w-8 text-kb-muted/45" />
                  <p className="mt-2 text-[12.5px] text-kb-muted">暂无可展示的答题明细</p>
                </div>
              </div>
            )}
          </div>
        </section>

        <aside className="flex min-h-0 flex-col gap-3 overflow-hidden">
          <section className="flex min-h-0 shrink-0 flex-col overflow-hidden rounded-[12px] border border-kb-border bg-white max-xl:max-h-[280px] xl:max-h-[50%]">
            <div className="shrink-0 px-4 pt-4">
              <h2 className="text-[14px] font-semibold text-kb-heading">答题卡</h2>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-[10px] text-kb-muted">
                <Legend color="bg-success" label="正确" />
                <Legend color="bg-destructive" label="错误" />
                <Legend color="bg-[#F28B20]" label="未答" />
              </div>
            </div>
            <div className="scrollbar-thin min-h-0 overflow-y-auto px-4 pb-4 pt-4">
              <div className="grid grid-cols-6 gap-2">
                {questionStates.map(({ question, state }, index) => (
                  <button
                    key={question.id}
                    type="button"
                    onClick={() => scrollToQuestion(question.id)}
                    aria-label={`定位到第 ${index + 1} 题`}
                    className={cn(
                      "grid h-8 place-items-center rounded-full text-[10.5px] font-semibold text-white transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
                      stateStyle[state].dot,
                    )}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>
            </div>
          </section>

          <section className="flex min-h-0 flex-col overflow-hidden rounded-[12px] border border-kb-border bg-white max-xl:max-h-[280px] xl:flex-1">
            <div className="shrink-0 px-4 pt-4">
              <h2 className="text-[14px] font-semibold text-kb-heading">答题信息</h2>
            </div>
            <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto px-4 pb-4 pt-3">
              <dl className="space-y-3.5">
                <InfoRow label="任务名称" value={result.title ?? "本次答题结果"} />
                <InfoRow label="任务类型" value={sourceLabel} />
                <InfoRow label="题目数量" value={`${result.total} 题`} />
                <InfoRow label="计分方式" value={scoreDisplay.scoringLabel} />
                <InfoRow
                  label="达标要求"
                  value={hasPassLine ? `${result.passScore} 分` : "不设置"}
                />
                <InfoRow
                  label="答题时限"
                  value={result.durationLimit ? `${result.durationLimit} 分钟` : "不限时"}
                />
                <InfoRow label="答题用时" value={formatDuration(result.elapsed)} />
                <InfoRow label="提交时间" value={formatDateTime(result.submittedAt)} />
              </dl>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

function SummaryMetric({
  value,
  label,
  tone = "default",
}: {
  value: string;
  label: string;
  tone?: "default" | "success" | "danger" | "warning";
}) {
  return (
    <div className="px-3 text-center">
      <strong
        className={cn(
          "block text-[19px] font-semibold leading-none tabular-nums",
          tone === "success" && "text-success",
          tone === "danger" && "text-destructive",
          tone === "warning" && "text-[#E7790A]",
          tone === "default" && "text-kb-heading",
        )}
      >
        {value}
      </strong>
      <span className="mt-1.5 block text-[10.5px] text-kb-muted">{label}</span>
    </div>
  );
}

function ResultQuestionCard({
  question,
  number,
  state,
  userAnswer,
}: {
  question: TrainingResultQuestion;
  number: number;
  state: QuestionState;
  userAnswer?: TrainingResultAnswer;
}) {
  const visual = stateStyle[state];
  const StateIcon = visual.icon;
  const optionMap = new Map(question.options?.map((option) => [option.key, option.label]));
  const withOptionText = (value?: TrainingResultAnswer) => {
    if (!isTrainingResultAnswerFilled(value)) return "未作答";
    const values = Array.isArray(value) ? value : [value!];
    return values
      .map((key) => {
        const displayKey = key === "T" ? "正确" : key === "F" ? "错误" : key;
        const label = optionMap.get(key);
        return label && key !== "T" && key !== "F" ? `${displayKey}. ${label}` : displayKey;
      })
      .join("；");
  };

  return (
    <article
      id={`training-result-question-${question.id}`}
      className="scroll-mt-2 rounded-[9px] border border-[#E5EEF0] bg-white px-4 py-3 shadow-[0_3px_12px_rgba(25,69,78,0.035)]"
    >
      <div className="flex items-start gap-3">
        <span
          className={cn("mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full", visual.dot)}
        >
          <StateIcon className="h-3.5 w-3.5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <p className="min-w-0 text-[12.5px] font-medium leading-5 text-kb-heading">
              <span className="mr-2 font-semibold tabular-nums text-primary">
                {String(number).padStart(2, "0")}
              </span>
              <span className="mr-2 text-[10px] font-medium text-kb-muted">[{question.type}]</span>
              {question.stem}
            </p>
            <span className={cn("shrink-0 text-[10.5px] font-medium", visual.text)}>
              {visual.label}
            </span>
          </div>
          <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-[10.5px] leading-5">
            <span className={visual.answer}>你的答案：{withOptionText(userAnswer)}</span>
            <span className="text-success">正确答案：{withOptionText(question.answer)}</span>
            {question.knowledge ? (
              <span className="text-kb-muted">知识点：{question.knowledge}</span>
            ) : null}
          </div>
          {question.analysis ? (
            <p className="mt-1.5 line-clamp-2 text-[10.5px] leading-5 text-kb-muted">
              <span className="font-medium text-kb-body">解析：</span>
              {question.analysis}
            </p>
          ) : null}
        </div>
      </div>
    </article>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn("h-2 w-2 rounded-full", color)} aria-hidden /> {label}
    </span>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[10px] text-kb-muted">{label}</dt>
      <dd className="mt-1 break-words text-[11.5px] font-medium leading-5 text-kb-heading">
        {value}
      </dd>
    </div>
  );
}

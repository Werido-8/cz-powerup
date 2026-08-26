import { useMemo } from "react";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getAnswerQuestionOptions,
  parseAnswerKeys,
  type AnswerDetailItem,
  type QuestionType,
} from "@/lib/mock/examAdmin";

const TYPE_ORDER: QuestionType[] = ["单选题", "多选题", "判断题", "填空题", "案例分析题", "简答题"];

const TYPE_INDEX = ["一", "二", "三", "四", "五", "六"];

function ChoiceOptions({
  item,
  options,
}: {
  item: AnswerDetailItem;
  options: { key: string; text: string }[];
}) {
  const userKeys = parseAnswerKeys(item.userAnswer, item.type);
  const correctKeys = parseAnswerKeys(item.correctAnswer, item.type);

  return (
    <div className="mt-3 space-y-1.5">
      {options.map((option) => {
        const isUser = userKeys.has(option.key);
        const isCorrect = correctKeys.has(option.key);
        return (
          <div
            key={option.key}
            className={cn(
              "grid grid-cols-[28px_minmax(0,1fr)_auto] items-center gap-2 rounded-[6px] px-3 py-2 text-[13px] leading-6",
              isCorrect && "bg-success-soft text-kb-heading",
              isUser && !isCorrect && "bg-danger-soft text-kb-heading",
              !isUser && !isCorrect && "bg-transparent text-kb-body",
            )}
          >
            <span
              className={cn(
                "text-[12px] font-semibold",
                isCorrect ? "text-success" : isUser ? "text-destructive" : "text-kb-muted",
              )}
            >
              {option.key}
            </span>
            <span>{option.text}</span>
            <span className="text-[11px] font-medium">
              {isCorrect ? (
                <span className="text-success">正确答案</span>
              ) : isUser ? (
                <span className="text-destructive">学员作答</span>
              ) : null}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function displayTextAnswer(answer: string) {
  if (!answer || answer === "未作答") return "未作答";
  if (answer === "T") return "正确";
  if (answer === "F") return "错误";
  return answer;
}

function TextAnswerFallback({ item }: { item: AnswerDetailItem }) {
  return (
    <div className="mt-3 space-y-2 text-[13px] leading-6">
      <div className="rounded-[6px] bg-kb-surface px-3 py-2.5">
        <div className="text-[11px] text-kb-muted">学员作答</div>
        <p className={cn("mt-1", item.isCorrect ? "text-kb-heading" : "text-destructive")}>
          {displayTextAnswer(item.userAnswer)}
        </p>
      </div>
      <div className="rounded-[6px] bg-success-soft/70 px-3 py-2.5">
        <div className="text-[11px] text-success">参考答案</div>
        <p className="mt-1 text-kb-heading">{displayTextAnswer(item.correctAnswer)}</p>
      </div>
    </div>
  );
}

function AnswerQuestionCard({ item }: { item: AnswerDetailItem }) {
  const options = getAnswerQuestionOptions(item);
  const showChoices =
    Boolean(options?.length) &&
    (item.type === "单选题" || item.type === "多选题" || item.type === "判断题");

  return (
    <article id={`answer-question-${item.no}`} className="scroll-mt-3 py-5 first:pt-4">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-[4px] bg-kb-surface text-[11px] font-semibold tabular-nums text-kb-body">
          {item.no}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <p className="text-[14px] leading-7 text-kb-heading">{item.stem}</p>
            {item.isCorrect ? (
              <span className="inline-flex shrink-0 items-center gap-1 text-[11.5px] font-medium text-success">
                <Check className="h-3.5 w-3.5 stroke-[2.4]" />
                正确
              </span>
            ) : (
              <span className="inline-flex shrink-0 items-center gap-1 text-[11.5px] font-medium text-destructive">
                <X className="h-3.5 w-3.5 stroke-[2.4]" />
                错误
              </span>
            )}
          </div>

          {showChoices && options ? (
            <ChoiceOptions item={item} options={options} />
          ) : (
            <TextAnswerFallback item={item} />
          )}

          {item.analysis?.trim() ? (
            <p className="mt-3 text-[12.5px] leading-6 text-kb-muted">
              <span className="font-medium text-kb-body">解析 </span>
              {item.analysis}
            </p>
          ) : null}
        </div>
      </div>
    </article>
  );
}

function groupByType(items: AnswerDetailItem[]) {
  const grouped = new Map<QuestionType, AnswerDetailItem[]>();
  for (const item of items) {
    grouped.set(item.type, [...(grouped.get(item.type) ?? []), item]);
  }
  return TYPE_ORDER.filter((type) => grouped.has(type)).map((type, index) => ({
    type,
    index,
    items: grouped.get(type)!,
  }));
}

export function ExamAnswerList({ items }: { items: AnswerDetailItem[] }) {
  const groups = useMemo(() => groupByType(items), [items]);

  if (items.length === 0) {
    return <p className="py-10 text-center text-[13px] text-kb-muted">暂无答题明细</p>;
  }

  return (
    <div>
      {groups.map(({ type, index, items: groupItems }) => (
        <section key={type} className="border-b border-divider last:border-b-0">
          <h3 className="pt-5 text-[13px] font-semibold text-kb-heading">
            {TYPE_INDEX[index] ?? index + 1}、{type}
          </h3>
          <div className="divide-y divide-divider">
            {groupItems.map((item) => (
              <AnswerQuestionCard key={item.no} item={item} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

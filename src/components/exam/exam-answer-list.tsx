import { useMemo, useState } from "react";
import { Check, ChevronDown, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getAnswerQuestionOptions,
  parseAnswerKeys,
  type AnswerDetailItem,
  type QuestionType,
} from "@/lib/mock/examAdmin";

function optionRowStyle(
  key: string,
  userKeys: Set<string>,
  correctKeys: Set<string>,
) {
  const isUser = userKeys.has(key);
  const isCorrect = correctKeys.has(key);

  if (isUser && isCorrect) {
    return "border-[#19A974]/30 bg-[#E8F6F2] text-[#1F3440]";
  }
  if (isCorrect) {
    return "border-[#19A974]/30 bg-[#E8F6F2] text-[#1F3440]";
  }
  if (isUser && !isCorrect) {
    return "border-[#E65A5A]/35 bg-[#FEF2F2] text-[#1F3440]";
  }
  return "border-[#EDF3F5] bg-[#FAFCFD] text-[#1F3440]/85";
}

function ChoiceOptions({
  item,
  options,
}: {
  item: AnswerDetailItem;
  options: { key: string; text: string }[];
}) {
  const userKeys = parseAnswerKeys(item.userAnswer, item.type);
  const correctKeys = parseAnswerKeys(item.correctAnswer, item.type);
  const isMulti = item.type === "多选题";

  return (
    <div className="mt-3 space-y-2">
      {options.map((o) => {
        const isUser = userKeys.has(o.key);
        const isCorrect = correctKeys.has(o.key);
        return (
          <div
            key={o.key}
            className={cn(
              "flex items-start gap-3 rounded-[8px] border px-3 py-2.5 transition-colors",
              optionRowStyle(o.key, userKeys, correctKeys),
            )}
          >
            <span
              className={cn(
                "mt-0.5 grid h-4 w-4 shrink-0 place-items-center border",
                isMulti ? "rounded-[3px]" : "rounded-full",
                isCorrect
                  ? "border-[#19A974]/50 bg-[#E8F6F2]"
                  : isUser
                    ? "border-[#E65A5A]/50 bg-[#FEF2F2]"
                    : "border-[#C8DADD] bg-white",
              )}
              aria-hidden
            />
            <span className="min-w-0 flex-1 text-[13px] leading-relaxed">
              <span
                className={cn(
                  "mr-2 inline-flex h-5 min-w-[20px] items-center justify-center rounded-[4px] px-1 text-[11px] font-semibold",
                  isCorrect
                    ? "bg-[#19A974]/15 text-[#19A974]"
                    : isUser
                      ? "bg-[#E65A5A]/12 text-[#E65A5A]"
                      : "bg-[#EDF3F5] text-[#607681]",
                )}
              >
                {o.key}
              </span>
              {o.text}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function TextAnswerFallback({ item }: { item: AnswerDetailItem }) {
  return (
    <div className="mt-3 space-y-2 rounded-[8px] border border-[#EDF3F5] bg-[#FAFCFD] px-3 py-2.5 text-[13px]">
      <div className="flex gap-2">
        <span className="w-16 shrink-0 text-[#91A3AA]">学员作答</span>
        <span
          className={cn(
            "font-medium",
            item.isCorrect ? "text-[#1F3440]" : "text-[#E65A5A]",
          )}
        >
          {item.userAnswer || "未作答"}
        </span>
      </div>
      <div className="flex gap-2">
        <span className="w-16 shrink-0 text-[#91A3AA]">参考答案</span>
        <span className="font-medium text-[#19A974]">{item.correctAnswer}</span>
      </div>
    </div>
  );
}

function AnswerQuestionCard({ item }: { item: AnswerDetailItem }) {
  const options = getAnswerQuestionOptions(item);
  const showChoices =
    options &&
    options.length > 0 &&
    (item.type === "单选题" || item.type === "多选题" || item.type === "判断题");

  return (
    <article className="border-b border-[#EDF3F5] px-1 py-4 last:border-b-0">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#F0F5F6] text-[11px] font-semibold text-[#607681]">
          {item.no}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[14px] font-medium leading-relaxed text-[#1F3440]">{item.stem}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {item.isCorrect ? (
              <span className="inline-flex h-6 items-center gap-1 rounded-full bg-[#E8F6F2] px-2 text-[11px] font-medium text-[#19A974]">
                <Check className="h-3 w-3 stroke-[2.5]" /> 答对
              </span>
            ) : (
              <span className="inline-flex h-6 items-center gap-1 rounded-full bg-[#FEF2F2] px-2 text-[11px] font-medium text-[#E65A5A]">
                <X className="h-3 w-3 stroke-[2.5]" /> 答错
              </span>
            )}
          </div>

          {showChoices ? (
            <ChoiceOptions item={item} options={options} />
          ) : (
            <TextAnswerFallback item={item} />
          )}

          {!item.isCorrect && item.analysis?.trim() && (
            <div className="mt-4 rounded-[8px] border border-[#EDF3F5] bg-[#F7FAFB] px-3 py-3">
              <div className="mb-1 text-[12px] font-semibold text-[#425B66]">解析</div>
              <p className="text-[13px] leading-relaxed text-[#425B66]">{item.analysis}</p>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

function groupByType(items: AnswerDetailItem[]): { type: QuestionType; items: AnswerDetailItem[] }[] {
  const order: QuestionType[] = [];
  const map = new Map<QuestionType, AnswerDetailItem[]>();
  for (const item of items) {
    if (!map.has(item.type)) {
      order.push(item.type);
      map.set(item.type, []);
    }
    map.get(item.type)!.push(item);
  }
  return order.map((type) => ({ type, items: map.get(type)! }));
}

export function ExamAnswerList({ items }: { items: AnswerDetailItem[] }) {
  const groups = useMemo(() => groupByType(items), [items]);
  const [collapsed, setCollapsed] = useState<Set<QuestionType>>(new Set());

  const toggle = (type: QuestionType) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  };

  if (items.length === 0) {
    return <p className="text-[13px] text-[#91A3AA]">暂无答题明细</p>;
  }

  return (
    <div className="space-y-3">
      {groups.map(({ type, items: groupItems }) => {
        const isCol = collapsed.has(type);
        const correctCount = groupItems.filter((i) => i.isCorrect).length;
        const wrongCount = groupItems.length - correctCount;

        return (
          <section
            key={type}
            className="overflow-hidden rounded-[12px] border border-[#DCE8EA] bg-white"
          >
            <button
              type="button"
              onClick={() => toggle(type)}
              className="flex w-full items-center justify-between gap-3 border-b border-[#EDF3F5] bg-[#FAFCFD] px-4 py-3 text-left transition-colors hover:bg-[#F5FAFB]"
            >
              <div className="flex min-w-0 items-center gap-2">
                {isCol ? (
                  <ChevronRight className="h-4 w-4 shrink-0 text-[#91A3AA]" />
                ) : (
                  <ChevronDown className="h-4 w-4 shrink-0 text-[#91A3AA]" />
                )}
                <div>
                  <div className="text-[14px] font-semibold text-[#1F3440]">{type}</div>
                  <div className="mt-0.5 text-[11.5px] text-[#91A3AA]">
                    {groupItems.length} 题
                    {correctCount > 0 && ` · 答对 ${correctCount}`}
                    {wrongCount > 0 && ` · 答错 ${wrongCount}`}
                  </div>
                </div>
              </div>
            </button>

            {!isCol && (
              <div className="px-4">
                {groupItems.map((item) => (
                  <AnswerQuestionCard key={item.no} item={item} />
                ))}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}

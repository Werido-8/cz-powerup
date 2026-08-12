import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState, type ReactNode } from "react";
import {
  ArrowRight,
  BookOpenCheck,
  ChevronLeft,
  Layers3,
  SlidersHorizontal,
  Target,
} from "lucide-react";
import { z } from "zod";
import { PageHeader } from "@/components/learning/ui";
import { PageShell } from "@/components/workbench/PageShell";
import { KNOWLEDGE_CATEGORIES, type QuestionType } from "@/lib/mock/data";
import {
  PRACTICE_TYPE_OPTIONS,
  countAvailableQuestions,
  type PracticeDifficulty,
} from "@/lib/mock/practice-filter";
import { cn } from "@/lib/utils";

const searchSchema = z.object({
  filters: z.string().optional(),
});

export const Route = createFileRoute("/training/practice")({
  validateSearch: searchSchema,
  component: PracticePage,
  head: () => ({ meta: [{ title: "专项练习 · 训练中心" }] }),
});

const DIFFICULTY_LABEL: Record<PracticeDifficulty, string> = {
  all: "全部",
  easy: "基础",
  hard: "进阶",
};

function PracticePage() {
  const navigate = useNavigate();
  const { filters: prefill } = Route.useSearch();
  const [selectedCats, setSelectedCats] = useState<Set<string>>(() => {
    if (prefill) return new Set(prefill.split(",").filter(Boolean));
    return new Set(["AGC"]);
  });
  const [selectedTypes, setSelectedTypes] = useState<Set<QuestionType>>(
    () => new Set(["single", "multiple", "judge"]),
  );
  const [diff, setDiff] = useState<PracticeDifficulty>("all");
  const [count, setCount] = useState(10);

  const categoryKeys = useMemo(() => Array.from(selectedCats), [selectedCats]);
  const types = useMemo(() => Array.from(selectedTypes), [selectedTypes]);
  const selectedCategories = KNOWLEDGE_CATEGORIES.filter((item) => selectedCats.has(item.key));
  const selectedLabels = selectedCategories.map((item) => item.label);
  const available = useMemo(
    () => countAvailableQuestions({ categoryKeys, types, diff }),
    [categoryKeys, types, diff],
  );
  const canStart = selectedCats.size > 0 && selectedTypes.size > 0 && available > 0;
  const actualCount = Math.min(count, available);

  const toggleCategory = (key: string) => {
    setSelectedCats((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleType = (key: QuestionType) => {
    setSelectedTypes((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const start = () => {
    if (!canStart) return;
    navigate({
      to: "/training/session/$id",
      params: { id: `专项练习-${Date.now()}` },
      search: {
        mode: "practice",
        filter: "",
        filters: categoryKeys.join(","),
        types: types.join(","),
        diff,
        count: actualCount,
        limit: 0,
        title: `${selectedLabels.slice(0, 2).join("与")}专项练习`,
      },
    });
  };

  return (
    <PageShell compact>
      <div className="flex h-full min-h-0 flex-col">
        <nav aria-label="页面导航" className="mb-1 flex shrink-0 items-center text-[12px]">
          <Link
            to="/training"
            className="inline-flex min-h-8 items-center gap-1 text-kb-muted hover:text-primary"
          >
            <ChevronLeft className="h-3.5 w-3.5" /> 训练中心
          </Link>
        </nav>

        <div className="shrink-0">
          <PageHeader
            title="专项练习"
            subtitle="选择需要强化的知识点与练习规则，提交后可逐题查看答案解析。"
            size="md"
          />
        </div>

        <div className="grid min-h-0 flex-1 items-stretch gap-5 overflow-y-auto xl:grid-cols-[minmax(0,1fr)_350px] xl:overflow-hidden">
          <main className="min-h-0 min-w-0">
            <section className="flex h-full min-h-[560px] flex-col overflow-hidden rounded-[18px] border border-kb-border bg-white shadow-[0_12px_36px_rgba(25,69,78,0.04)] xl:min-h-0">
              <div className="flex shrink-0 items-center gap-3 border-b border-divider px-5 py-4">
                <span className="grid h-9 w-9 place-items-center rounded-[9px] bg-kb-surface text-primary">
                  <SlidersHorizontal className="h-[18px] w-[18px]" />
                </span>
                <div>
                  <h2 className="text-[16px] font-semibold text-kb-heading">练习设置</h2>
                  <p className="mt-0.5 text-[11.5px] text-kb-muted">
                    所有条件在一个页面内完成，右侧练习方案会实时更新。
                  </p>
                </div>
              </div>

              <div className="min-h-0 flex-1 divide-y divide-divider overflow-y-auto px-5 sm:px-6">
                <SettingSection
                  index="01"
                  title="练习范围"
                  description={`已选 ${selectedLabels.length} 个知识点，可抽取 ${available.toLocaleString()} 道题。`}
                >
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {KNOWLEDGE_CATEGORIES.map((category) => {
                      const active = selectedCats.has(category.key);
                      return (
                        <button
                          key={category.key}
                          type="button"
                          onClick={() => toggleCategory(category.key)}
                          aria-pressed={active}
                          className={cn(
                            "flex min-h-12 items-center justify-between gap-3 rounded-[9px] border px-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20",
                            active
                              ? "border-primary/35 bg-primary-soft/60 text-primary"
                              : "border-kb-border bg-white text-kb-body hover:border-primary/25",
                          )}
                        >
                          <span className="truncate text-[12.5px] font-medium">
                            {category.label}
                          </span>
                          <span className="shrink-0 text-[10.5px] tabular-nums text-kb-muted">
                            {category.questionCount} 题
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </SettingSection>

                <SettingSection
                  index="02"
                  title="题型与难度"
                  description="按训练目标选择题型，并设置基础、全部或进阶难度。"
                >
                  <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_260px]">
                    <div>
                      <div className="mb-2 text-[11px] font-medium text-kb-muted">
                        题型（可多选）
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {PRACTICE_TYPE_OPTIONS.map((item) => (
                          <ChoiceButton
                            key={item.key}
                            active={selectedTypes.has(item.key)}
                            onClick={() => toggleType(item.key)}
                            label={item.label}
                          />
                        ))}
                      </div>
                    </div>
                    <div>
                      <div className="mb-2 text-[11px] font-medium text-kb-muted">难度</div>
                      <div className="grid grid-cols-3 gap-2">
                        {(["all", "easy", "hard"] as PracticeDifficulty[]).map((value) => (
                          <ChoiceButton
                            key={value}
                            active={diff === value}
                            onClick={() => setDiff(value)}
                            label={DIFFICULTY_LABEL[value]}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </SettingSection>

                <SettingSection
                  index="03"
                  title="练习题量"
                  description="建议选择一次可以专注完成的题量，练习中可随时退出。"
                >
                  <div className="flex flex-wrap gap-2">
                    {[5, 10, 15, 20].map((value) => (
                      <ChoiceButton
                        key={value}
                        active={count === value}
                        onClick={() => setCount(value)}
                        label={`${value} 题`}
                      />
                    ))}
                  </div>
                </SettingSection>
              </div>
            </section>
          </main>

          <aside className="flex min-h-0 flex-col gap-4 overflow-y-auto">
            <section className="relative flex min-h-[360px] flex-1 flex-col overflow-hidden rounded-[18px] border border-kb-border bg-white p-5 shadow-[0_14px_34px_rgba(25,69,78,0.055)]">
              <div className="pointer-events-none absolute inset-y-0 right-0 w-[62%] bg-[radial-gradient(circle_at_80%_20%,rgba(52,155,172,.12),transparent_62%)]" />
              <div className="pointer-events-none absolute -right-10 -top-12 h-44 w-44 rounded-full border-[22px] border-primary/[0.04]" />
              <div className="relative flex items-center gap-2 text-[11.5px] font-semibold text-primary">
                <Layers3 className="h-4 w-4" /> 实时练习预览
              </div>
              <h2 className="relative mt-3 text-[19px] font-semibold leading-7 text-kb-heading">
                {selectedLabels.length
                  ? `${selectedLabels.slice(0, 2).join("与")}专项练习`
                  : "待配置练习"}
              </h2>

              <div className="relative mt-5 grid grid-cols-3 gap-2">
                <PreviewMetric value={`${actualCount || 0}`} label="题" />
                <PreviewMetric value={`${types.length}`} label="种题型" />
                <PreviewMetric value={`${available}`} label="可抽取" />
              </div>

              <dl className="relative mt-5 space-y-3 border-t border-divider pt-4 text-[11.5px]">
                <PreviewRow
                  label="知识点"
                  value={selectedLabels.length ? selectedLabels.join("、") : "未选择"}
                />
                <PreviewRow label="难度" value={DIFFICULTY_LABEL[diff]} />
                <PreviewRow
                  label="题型"
                  value={
                    types.length
                      ? types
                          .map(
                            (type) =>
                              PRACTICE_TYPE_OPTIONS.find((item) => item.key === type)?.label,
                          )
                          .filter(Boolean)
                          .join("、")
                      : "未选择"
                  }
                />
              </dl>

              <div className="relative mt-auto pt-5">
                <div className="rounded-[10px] border border-primary/10 bg-[#f7fbfb] p-3 text-[10.5px] leading-5 text-kb-muted">
                  当前条件可生成 {available} 道练习题，本次随机抽取 {actualCount || 0} 道。
                </div>
              </div>
            </section>

            <section className="rounded-[16px] border border-kb-border bg-[linear-gradient(145deg,#ffffff,#f5fafb)] p-5">
              <div className="flex items-start gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[9px] bg-primary-soft text-primary">
                  <BookOpenCheck className="h-[18px] w-[18px]" />
                </span>
                <div>
                  <h3 className="text-[13.5px] font-semibold text-kb-heading">
                    即时练习，提交后看解析
                  </h3>
                  <p className="mt-1 text-[11.5px] leading-5 text-kb-muted">
                    不计入考试成绩，可反复练习；错题会自动进入错题本。
                  </p>
                </div>
              </div>
              <button
                type="button"
                disabled={!canStart}
                onClick={start}
                className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-[10px] bg-primary text-[13.5px] font-semibold text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Target className="h-4 w-4" /> 开始专项练习 <ArrowRight className="h-4 w-4" />
              </button>
            </section>
          </aside>
        </div>
      </div>
    </PageShell>
  );
}

function SettingSection({
  index,
  title,
  description,
  children,
}: {
  index: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="grid gap-4 py-5 lg:grid-cols-[210px_minmax(0,1fr)]">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 text-[10.5px] font-semibold text-primary">{index}</span>
        <div>
          <h3 className="text-[13.5px] font-semibold text-kb-heading">{title}</h3>
          <p className="mt-1 text-[11px] leading-5 text-kb-muted">{description}</p>
        </div>
      </div>
      <div className="min-w-0">{children}</div>
    </section>
  );
}

function ChoiceButton({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "min-h-10 rounded-[8px] border px-3.5 text-[12px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20",
        active
          ? "border-primary/35 bg-primary-soft text-primary"
          : "border-kb-border bg-white text-kb-body hover:border-primary/30",
      )}
    >
      {label}
    </button>
  );
}

function PreviewMetric({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-[10px] border border-kb-border bg-white px-2 py-3 text-center">
      <strong className="block text-[20px] tabular-nums text-kb-heading">{value}</strong>
      <span className="text-[10px] text-kb-muted">{label}</span>
    </div>
  );
}

function PreviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="shrink-0 text-kb-muted">{label}</dt>
      <dd className="text-right leading-5 text-kb-heading">{value}</dd>
    </div>
  );
}

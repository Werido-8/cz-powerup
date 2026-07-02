import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Target,
  ChevronRight,
  ChevronLeft,
  Layers,
  BookOpenCheck,
} from "lucide-react";
import { z } from "zod";
import { PageShell } from "@/components/workbench/PageShell";
import { KNOWLEDGE_CATEGORIES } from "@/lib/mock/data";
import {
  PRACTICE_TYPE_OPTIONS,
  countAvailableQuestions,
  type PracticeDifficulty,
} from "@/lib/mock/practice-filter";
import type { QuestionType } from "@/lib/mock/data";
import { PageHeader } from "@/components/learning/ui";
import { cn } from "@/lib/utils";

const searchSchema = z.object({
  filters: z.string().optional(),
});

export const Route = createFileRoute("/training/practice")({
  validateSearch: searchSchema,
  component: PracticePage,
  head: () => ({ meta: [{ title: "专项练习 · 题库训练" }] }),
});

function ToggleGroup<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { k: T; l: string }[];
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o.k}
          type="button"
          onClick={() => onChange(o.k)}
          className={cn(
            "rounded-lg border px-4 py-2 text-[12.5px] transition-colors",
            value === o.k
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-background hover:border-primary/40",
          )}
        >
          {o.l}
        </button>
      ))}
    </div>
  );
}

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

  const available = useMemo(
    () => countAvailableQuestions({ categoryKeys, types, diff }),
    [categoryKeys, types, diff],
  );

  const canStart = selectedCats.size > 0 && selectedTypes.size > 0 && available > 0;
  const actualCount = Math.min(count, available);

  const toggleCat = (key: string) => {
    setSelectedCats((prev) => {
      const n = new Set(prev);
      if (n.has(key)) n.delete(key);
      else n.add(key);
      return n;
    });
  };

  const toggleType = (key: QuestionType) => {
    setSelectedTypes((prev) => {
      const n = new Set(prev);
      if (n.has(key)) n.delete(key);
      else n.add(key);
      return n;
    });
  };

  const start = () => {
    if (!canStart) return;
    const sessionId = `专项练习-${Date.now()}`;
    navigate({
      to: "/training/session/$id",
      params: { id: sessionId },
      search: {
        mode: "practice",
        filter: "",
        filters: categoryKeys.join(","),
        types: types.join(","),
        diff,
        count: actualCount,
        limit: 0,
      },
    });
  };

  const selectedLabels = KNOWLEDGE_CATEGORIES.filter((c) => selectedCats.has(c.key)).map(
    (c) => c.label,
  );

  return (
    <PageShell>
      <nav aria-label="页面导航" className="mb-2 flex items-center gap-1 text-[12px]">
        <Link
          to="/training"
          className="inline-flex items-center gap-0.5 text-muted-foreground transition-colors hover:text-primary"
        >
          <ChevronLeft className="h-3.5 w-3.5" aria-hidden />
          题库训练
        </Link>
        <ChevronRight className="h-3 w-3 text-muted-foreground/30" aria-hidden />
        <span className="text-foreground/70">专项练习</span>
      </nav>

      <PageHeader
        title="专项练习"
        subtitle="按知识点自由组卷，支持多专项、多题型与难度筛选"
        size="md"
      />

      <div className="grid gap-5 lg:grid-cols-3 lg:items-stretch">
        <section className="rounded-lg border border-border bg-card p-5 lg:col-span-2">
          <div className="mb-3 text-[13px] font-semibold">1 · 选择知识点（可多选）</div>
          <div className="grid max-h-[min(28rem,55vh)] gap-2.5 overflow-y-auto pr-1 sm:grid-cols-2">
            {KNOWLEDGE_CATEGORIES.map((c) => {
              const active = selectedCats.has(c.key);
              return (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => toggleCat(c.key)}
                  className={cn(
                    "rounded-lg border p-3 text-left transition-all",
                    active
                      ? "border-primary bg-primary-soft shadow-[var(--shadow-card)]"
                      : "border-border bg-background hover:-translate-y-0.5 hover:border-primary/40",
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-[13.5px] font-medium leading-snug">{c.label}</div>
                    <span className="shrink-0 rounded-md bg-muted px-1.5 py-0.5 text-[10.5px] tabular-nums text-muted-foreground">
                      {c.questionCount} 题
                    </span>
                  </div>
                  <div className="mt-1 line-clamp-2 text-[11.5px] text-muted-foreground">{c.desc}</div>
                </button>
              );
            })}
          </div>

          <div className="mt-6 mb-3 text-[13px] font-semibold">2 · 题型（可多选）</div>
          <div className="flex flex-wrap gap-2">
            {PRACTICE_TYPE_OPTIONS.map((t) => {
              const active = selectedTypes.has(t.key);
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => toggleType(t.key)}
                  className={cn(
                    "rounded-lg border px-3 py-1.5 text-[12.5px] transition-colors",
                    active
                      ? "border-primary bg-primary-soft text-primary"
                      : "border-border hover:border-primary/40",
                  )}
                >
                  {t.label}
                </button>
              );
            })}
          </div>

          <div className="mt-6 mb-3 text-[13px] font-semibold">3 · 难度</div>
          <ToggleGroup
            value={diff}
            onChange={setDiff}
            options={[
              { k: "all" as const, l: "全部" },
              { k: "easy" as const, l: "基础" },
              { k: "hard" as const, l: "进阶" },
            ]}
          />

          <div className="mt-6 mb-3 text-[13px] font-semibold">4 · 题量</div>
          <div className="flex flex-wrap items-center gap-2">
            {[5, 10, 15, 20].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setCount(n)}
                className={cn(
                  "rounded-lg border px-4 py-2 text-[12.5px] transition-colors",
                  count === n
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background hover:border-primary/40",
                )}
              >
                {n} 题
              </button>
            ))}
          </div>
        </section>

        <aside className="flex flex-col gap-4">
          <div className="rounded-lg border border-border bg-card p-5">
            <div className="mb-3 flex items-center gap-2 text-[13px] font-semibold">
              <Layers className="h-4 w-4 text-primary" /> 组卷预览
            </div>
            <dl className="space-y-2 text-[12.5px]">
              <div>
                <dt className="text-muted-foreground">知识点</dt>
                <dd className="mt-0.5 font-medium">
                  {selectedLabels.length > 0 ? selectedLabels.join("、") : "未选择"}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">题型</dt>
                <dd className="mt-0.5 font-medium">
                  {types.length > 0
                    ? types.map((t) => PRACTICE_TYPE_OPTIONS.find((o) => o.key === t)?.label).join("、")
                    : "未选择"}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">难度</dt>
                <dd className="mt-0.5 font-medium">
                  {{ all: "全部", easy: "基础", hard: "进阶" }[diff]}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">可抽题数</dt>
                <dd className="mt-0.5 text-[18px] font-semibold text-primary">{available}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">本次练习</dt>
                <dd className="mt-0.5 font-medium">{canStart ? `${actualCount} 题` : "—"}</dd>
              </div>
            </dl>
            <button
              type="button"
              disabled={!canStart}
              onClick={start}
              className="mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 text-[13px] font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-40"
            >
              <Target className="h-4 w-4" /> 开始专项练习
            </button>
          </div>

          <div className="rounded-lg border border-dashed border-border bg-muted/20 p-4 text-[12px] text-muted-foreground">
            <div className="mb-1 flex items-center gap-1.5 font-medium text-foreground">
              <BookOpenCheck className="h-3.5 w-3.5" /> 提示
            </div>
            可同时选择多个知识点专项组合练习；提交后错题自动进入错题本。
          </div>
        </aside>
      </div>
    </PageShell>
  );
}

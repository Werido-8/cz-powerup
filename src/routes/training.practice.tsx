import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  Target,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Circle,
  Clock,
  Layers,
  BookOpenCheck,
} from "lucide-react";
import { PageShell } from "@/components/workbench/PageShell";
import { KNOWLEDGE_CATEGORIES } from "@/lib/mock/data";
import { PageHeader, listActionClass } from "@/components/learning/ui";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/training/practice")({
  component: PracticePage,
  head: () => ({ meta: [{ title: "专项练习 · 题库训练" }] }),
});

function PracticePage() {
  const navigate = useNavigate();
  const [cat, setCat] = useState<string>("AGC");
  const [count, setCount] = useState<number>(10);
  const [diff, setDiff] = useState<"all" | "easy" | "hard">("all");

  const selectedCategory = KNOWLEDGE_CATEGORIES.find((x) => x.key === cat);
  const bankCount = selectedCategory?.questionCount ?? 0;
  const canStart = bankCount > 0;
  const actualCount = Math.min(count, bankCount);

  const start = () => {
    if (!canStart) return;
    navigate({
      to: "/training/session/$id",
      params: { id: `专项练习-${cat}` },
      search: { mode: "practice", filter: cat, count, limit: 0 },
    });
  };

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
        subtitle="按知识点 / 场景定向训练，练后即可加入错题本并复习"
        size="md"
      />

      <div className="grid gap-5 lg:grid-cols-3 lg:items-stretch">
        <section className="rounded-lg border border-border bg-card p-5 lg:col-span-2">
          <div className="mb-3 text-[13px] font-semibold">1 · 选择知识点</div>
          <div className="grid max-h-[min(28rem,55vh)] gap-2.5 overflow-y-auto pr-1 sm:grid-cols-2">
            {KNOWLEDGE_CATEGORIES.map((c) => {
              const active = cat === c.key;
              const n = c.questionCount;
              return (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => setCat(c.key)}
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
                      {n} 题
                    </span>
                  </div>
                  <div className="mt-1 line-clamp-2 text-[11.5px] text-muted-foreground">{c.desc}</div>
                </button>
              );
            })}
          </div>

          <div className="mt-6 mb-3 text-[13px] font-semibold">2 · 难度</div>
          <ToggleGroup
            value={diff}
            onChange={setDiff}
            options={[
              { k: "all", l: "全部" },
              { k: "easy", l: "基础" },
              { k: "hard", l: "进阶" },
            ]}
          />

          <div className="mt-6 mb-3 text-[13px] font-semibold">3 · 题量</div>
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

        {selectedCategory && (
          <PracticeLaunchPanel
            category={selectedCategory}
            count={count}
            actualCount={actualCount}
            diff={diff}
            matchedCount={bankCount}
            canStart={canStart}
            onStart={start}
          />
        )}
      </div>
    </PageShell>
  );
}

function PracticeLaunchPanel({
  category,
  count,
  actualCount,
  diff,
  matchedCount,
  canStart,
  onStart,
}: {
  category: (typeof KNOWLEDGE_CATEGORIES)[number];
  count: number;
  actualCount: number;
  diff: "all" | "easy" | "hard";
  matchedCount: number;
  canStart: boolean;
  onStart: () => void;
}) {
  const diffLabel = { all: "全部", easy: "基础", hard: "进阶" }[diff];

  return (
    <aside className="flex flex-col overflow-hidden rounded-lg border border-border bg-card lg:min-h-full">
      <div className="border-b border-primary/10 bg-gradient-to-br from-primary-soft/70 via-primary-soft/30 to-transparent px-5 py-5">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/15 bg-background/70 px-2.5 py-0.5 text-[10.5px] font-medium text-primary">
          <Target className="h-3 w-3" />
          练习预览
        </div>
        <h3 className="mt-3 text-[17px] font-semibold leading-snug tracking-tight text-foreground">
          {category.label}
        </h3>
        <p className="mt-2 line-clamp-3 text-[12px] leading-relaxed text-muted-foreground">{category.desc}</p>
      </div>

      <div className="grid grid-cols-2 gap-2 p-4">
        <MetricTile icon={Layers} label="本次题量" value={canStart ? `${actualCount} 题` : `${count} 题`} />
        <MetricTile icon={Target} label="难度" value={diffLabel} />
        <MetricTile icon={Clock} label="时限" value="不限时" />
        <MetricTile icon={BookOpenCheck} label="解析" value="提交可见" />
      </div>

      <div className="flex-1 px-4 pb-2">
        <div
          className={cn(
            "rounded-lg border px-3.5 py-3 text-center",
            canStart ? "border-success/25 bg-success-soft/35" : "border-destructive/25 bg-destructive/5",
          )}
        >
          <div className={cn("text-[22px] font-semibold tabular-nums leading-none", canStart ? "text-success" : "text-destructive")}>
            {matchedCount}
          </div>
          <div className="mt-1 text-[11.5px] text-muted-foreground">题库匹配可用</div>
          {canStart && actualCount < count && (
            <div className="mt-1.5 text-[11px] text-muted-foreground">已选 {count} 题，实际抽取 {actualCount} 题</div>
          )}
        </div>

        <ul className="mt-4 space-y-2.5">
          <ReadyItem ok={canStart} label={canStart ? "配置已完成，可以开始" : "当前知识点暂无可用题目"} />
          <ReadyItem ok label="练习结果不计入考核" />
          <ReadyItem ok label="支持随时退出，错题自动收录" />
        </ul>
      </div>

      <div className="mt-auto border-t border-border bg-muted/10 p-4">
        <button
          type="button"
          onClick={onStart}
          disabled={!canStart}
          className={listActionClass(
            "primary",
            "w-full justify-center py-3 text-[13.5px] shadow-sm disabled:opacity-50",
          )}
        >
          <Target className="h-4 w-4" />
          开始专项练习
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </aside>
  );
}

function MetricTile({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Target;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-border/80 bg-muted/15 px-3 py-2.5">
      <div className="flex items-center gap-1 text-[10.5px] text-muted-foreground">
        <Icon className="h-3 w-3 shrink-0 opacity-70" />
        {label}
      </div>
      <div className="mt-1 text-[13px] font-semibold text-foreground">{value}</div>
    </div>
  );
}

function ReadyItem({ ok, label }: { ok: boolean; label: string }) {
  return (
    <li className="flex items-start gap-2 text-[12px] leading-snug text-muted-foreground">
      {ok ? (
        <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" />
      ) : (
        <Circle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-destructive/70" />
      )}
      {label}
    </li>
  );
}

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
    <div className="inline-flex rounded-lg border border-border bg-background p-1 text-[12.5px]">
      {options.map((d) => (
        <button
          key={d.k}
          type="button"
          onClick={() => onChange(d.k)}
          className={cn(
            "rounded-lg px-3 py-1.5 transition-colors",
            value === d.k ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted",
          )}
        >
          {d.l}
        </button>
      ))}
    </div>
  );
}

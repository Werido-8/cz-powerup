import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Target, ChevronRight, BookOpen, Sparkles } from "lucide-react";
import { PageShell } from "@/components/workbench/PageShell";
import { KNOWLEDGE_CATEGORIES, QUESTIONS } from "@/lib/mock/data";

export const Route = createFileRoute("/training/practice")({
  component: PracticePage,
  head: () => ({ meta: [{ title: "专项练习 · 题库训练" }] }),
});

function PracticePage() {
  const navigate = useNavigate();
  const [cat, setCat] = useState<string>("AGC");
  const [count, setCount] = useState<number>(10);
  const [diff, setDiff] = useState<"all" | "easy" | "hard">("all");

  const matched = useMemo(
    () => QUESTIONS.filter((q) => q.knowledgePoints.some((k) => k.includes(cat))),
    [cat],
  );

  const start = () => {
    navigate({
      to: "/training/session/$id",
      params: { id: `专项练习-${cat}` },
      search: { mode: "practice", filter: cat, count, limit: 0 },
    });
  };

  return (
    <PageShell>
      <div className="mb-6 flex items-end justify-between">
        <div>
          <div className="text-[12px] text-muted-foreground">题库训练 / 专项练习</div>
          <h1 className="mt-1 text-[24px] font-semibold tracking-tight">专项练习</h1>
          <p className="mt-1 text-[12.5px] text-muted-foreground">
            按知识点 / 场景定向训练,练后即可加入错题本并复习
          </p>
        </div>
        <Link
          to="/training"
          className="rounded-lg border border-border bg-background px-3 py-2 text-[12.5px] hover:bg-muted"
        >
          返回训练首页
        </Link>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <section className="rounded-lg border border-border bg-card p-5 lg:col-span-2">
          <div className="mb-3 text-[13px] font-semibold">1 · 选择知识点</div>
          <div className="grid gap-2.5 sm:grid-cols-2">
            {KNOWLEDGE_CATEGORIES.map((c) => {
              const active = cat === c.key;
              const n = Math.floor(Math.random() * 500) + 500;
              return (
                <button
                  key={c.key}
                  onClick={() => setCat(c.key)}
                  className={`group rounded-lg border p-3 text-left transition-all ${
                    active
                      ? "border-primary bg-primary-soft shadow-[var(--shadow-card)]"
                      : "border-border bg-background hover:-translate-y-0.5 hover:border-primary/40"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="text-[13.5px] font-medium">{c.label}</div>
                    <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10.5px] text-muted-foreground">
                      {n} 题
                    </span>
                  </div>
                  <div className="mt-1 text-[11.5px] text-muted-foreground">{c.desc}</div>
                </button>
              );
            })}
          </div>

          <div className="mt-6 mb-3 text-[13px] font-semibold">2 · 难度</div>
          <div className="inline-flex rounded-lg border border-border bg-background p-1 text-[12.5px]">
            {(
              [
                { k: "all", l: "全部" },
                { k: "easy", l: "基础" },
                { k: "hard", l: "进阶" },
              ] as const
            ).map((d) => (
              <button
                key={d.k}
                onClick={() => setDiff(d.k)}
                className={`rounded-lg px-3 py-1.5 ${
                  diff === d.k ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
                }`}
              >
                {d.l}
              </button>
            ))}
          </div>

          <div className="mt-6 mb-3 text-[13px] font-semibold">3 · 题量</div>
          <div className="flex flex-wrap items-center gap-2">
            {[5, 10, 15, 20].map((n) => (
              <button
                key={n}
                onClick={() => setCount(n)}
                className={`rounded-lg border px-4 py-2 text-[12.5px] transition-colors ${
                  count === n
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background hover:border-primary/40"
                }`}
              >
                {n} 题
              </button>
            ))}
          </div>
        </section>

        <aside className="rounded-lg border border-border bg-gradient-to-br from-primary-soft/60 to-transparent p-5">
          <div className="inline-flex items-center gap-1.5 text-[12px] font-medium text-primary">
            <Sparkles className="h-3.5 w-3.5" /> 本次练习概览
          </div>
          <div className="mt-3 space-y-3 rounded-lg bg-card p-4">
            <Row k="知识点" v={KNOWLEDGE_CATEGORIES.find((x) => x.key === cat)?.label ?? cat} />
            <Row k="题量" v={`${count} 题`} />
            <Row k="难度" v={{ all: "全部", easy: "基础", hard: "进阶" }[diff]} />
            <Row k="题库匹配" v={`${matched.length} 题可用`} />
            <Row k="模式" v="无限时 · 含解析" />
          </div>
          <button
            onClick={start}
            className="mt-4 inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 text-[13px] font-medium text-primary-foreground hover:bg-primary/90"
          >
            <Target className="h-3.5 w-3.5" /> 开始专项练习
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
          <div className="mt-3 text-[11px] text-muted-foreground">
            · 练习结果不计入考核,可随时退出
          </div>
        </aside>
      </div>

      <h2 className="mt-8 mb-3 text-[15px] font-semibold">该知识点典型题</h2>
      <div className="space-y-2">
        {matched.slice(0, 4).map((q) => (
          <div
            key={q.id}
            className="flex items-start gap-3 rounded-lg border border-border bg-card p-4 transition-all hover:-translate-y-0.5 hover:border-primary/40"
          >
            <span className="mt-0.5 rounded-md bg-primary-soft px-2 py-0.5 text-[10.5px] text-accent-foreground">
              {{ single: "单选", multiple: "多选", judge: "判断", text: "简答" }[q.type]}
            </span>
            <div className="flex-1 text-[13px]">{q.stem}</div>
            {q.relatedDocId && (
              <Link
                to="/learn/doc/$id"
                params={{ id: q.relatedDocId }}
                className="inline-flex items-center gap-1 text-[11.5px] text-primary hover:underline"
              >
                <BookOpen className="h-3 w-3" /> 查依据
              </Link>
            )}
          </div>
        ))}
        {matched.length === 0 && (
          <div className="rounded-lg border border-dashed border-border bg-card/50 p-8 text-center text-[12.5px] text-muted-foreground">
            该知识点暂无题目
          </div>
        )}
      </div>
    </PageShell>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between text-[12.5px]">
      <span className="text-muted-foreground">{k}</span>
      <span className="font-medium">{v}</span>
    </div>
  );
}

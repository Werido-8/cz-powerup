import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { BookOpen, RotateCcw, ChevronRight, Trash2, Check, Filter } from "lucide-react";
import { toast } from "sonner";
import { PageShell } from "@/components/workbench/PageShell";
import { QUESTIONS } from "@/lib/mock/data";
import { useMockStore, type Mastery } from "@/lib/mock/store";

export const Route = createFileRoute("/training/wrong")({
  component: WrongPage,
  head: () => ({ meta: [{ title: "错题本 · 题库训练" }] }),
});

const MASTERY_INTERVAL: Record<Mastery, string> = {
  新增: "当天",
  初步掌握: "1 天",
  需巩固: "3 天",
  基本掌握: "7 天",
  熟练: "15 天",
  长期掌握: "30 天",
};

const MASTERY_COLOR: Record<Mastery, string> = {
  新增: "bg-destructive/10 text-destructive",
  初步掌握: "bg-warning-soft text-warning-foreground",
  需巩固: "bg-warning-soft text-warning-foreground",
  基本掌握: "bg-primary-soft text-accent-foreground",
  熟练: "bg-success-soft text-success",
  长期掌握: "bg-success-soft text-success",
};

const FILTERS: { k: Mastery | "all"; l: string }[] = [
  { k: "all", l: "全部" },
  { k: "新增", l: "新增" },
  { k: "初步掌握", l: "初步掌握" },
  { k: "需巩固", l: "需巩固" },
  { k: "基本掌握", l: "基本掌握" },
  { k: "熟练", l: "熟练" },
  { k: "长期掌握", l: "长期掌握" },
];

function WrongPage() {
  const { state, advanceMastery, removeWrong } = useMockStore();
  const [filter, setFilter] = useState<Mastery | "all">("all");

  const filtered = useMemo(
    () => (filter === "all" ? state.wrong : state.wrong.filter((w) => w.mastery === filter)),
    [state.wrong, filter],
  );

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: state.wrong.length };
    FILTERS.slice(1).forEach(({ k }) => {
      c[k] = state.wrong.filter((w) => w.mastery === k).length;
    });
    return c;
  }, [state.wrong]);

  return (
    <PageShell>
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight">错题本</h1>
          <p className="mt-1 text-[12.5px] text-muted-foreground">
            共 {state.wrong.length} 题待巩固 · 复习间隔根据艾宾浩斯曲线动态调整
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            to="/training/session/$id"
            params={{ id: "错题集中复习" }}
            search={{ mode: "review", filter: "", count: Math.max(1, state.wrong.length), limit: 0 }}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 text-[12.5px] font-medium text-primary-foreground hover:bg-primary/90"
          >
            <RotateCcw className="h-3.5 w-3.5" /> 开始集中复习
          </Link>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2 rounded-lg border border-border bg-card p-3">
        <Filter className="h-3.5 w-3.5 text-muted-foreground" />
        {FILTERS.map((f) => {
          const n = counts[f.k] ?? 0;
          const active = filter === f.k;
          return (
            <button
              key={f.k}
              onClick={() => setFilter(f.k)}
              className={`rounded-full border px-2.5 py-1 text-[11.5px] transition-colors ${
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background text-muted-foreground hover:border-primary/40"
              }`}
            >
              {f.l} <span className={active ? "opacity-80" : "text-muted-foreground/60"}>({n})</span>
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-card/50 p-10 text-center text-[12.5px] text-muted-foreground">
          当前筛选下没有错题
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((w) => {
            const q = QUESTIONS.find((x) => x.id === w.qid);
            if (!q) return null;
            return (
              <div
                key={w.qid}
                className="rounded-lg border border-border bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-[var(--shadow-card)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      <span className={`rounded-md px-2 py-0.5 text-[10.5px] font-medium ${MASTERY_COLOR[w.mastery]}`}>
                        {w.mastery}
                      </span>
                      <span className="text-[10.5px] text-muted-foreground">
                        下次复习间隔 {MASTERY_INTERVAL[w.mastery]}
                      </span>
                    </div>
                    <div className="text-[13.5px] font-medium">{q.stem}</div>
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-2 text-[11.5px] text-muted-foreground">
                      <span>错误 {w.wrongCount} 次</span>
                      <span>·</span>
                      <span>最近错误 {w.lastWrongAt}</span>
                      <span>·</span>
                      <span>{q.knowledgePoints.join(" / ")}</span>
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col gap-2">
                    <Link
                      to="/training/session/$id"
                      params={{ id: `复习-${w.qid}` }}
                      search={{ mode: "review", filter: "", count: 1, limit: 0 }}
                      className="rounded-lg bg-primary px-3 py-1.5 text-[12px] font-medium text-primary-foreground hover:bg-primary/90"
                    >
                      立即复习
                    </Link>
                    <button
                      onClick={() => {
                        advanceMastery(w.qid);
                        toast.success("掌握度已提升");
                      }}
                      className="inline-flex items-center gap-1 rounded-lg border border-success/30 bg-success-soft/40 px-3 py-1.5 text-[11.5px] text-success hover:bg-success-soft"
                    >
                      <Check className="h-3 w-3" /> 已掌握
                    </button>
                    {q.relatedDocId && (
                      <Link
                        to="/learn/doc/$id"
                        params={{ id: q.relatedDocId }}
                        className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-3 py-1.5 text-[11.5px] hover:bg-muted"
                      >
                        <BookOpen className="h-3 w-3" /> 查依据
                      </Link>
                    )}
                    <button
                      onClick={() => {
                        if (confirm("确认从错题本移除该题?")) {
                          removeWrong(w.qid);
                          toast.success("已移除");
                        }
                      }}
                      className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-3 py-1.5 text-[11.5px] text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3" /> 移除
                    </button>
                  </div>
                </div>
                <details className="mt-3">
                  <summary className="cursor-pointer text-[12px] font-medium text-primary">查看解析</summary>
                  <div className="mt-2 space-y-2 rounded-lg bg-muted/40 p-3 text-[12.5px] text-foreground/80">
                    <div>
                      <span className="font-medium">正确答案:</span>{" "}
                      {Array.isArray(q.answer)
                        ? q.answer.join("、")
                        : q.answer === "T"
                          ? "正确"
                          : q.answer === "F"
                            ? "错误"
                            : q.answer}
                    </div>
                    <div>
                      <span className="font-medium">解析:</span> {q.analysis}
                    </div>
                  </div>
                </details>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-6 flex items-center justify-between rounded-lg border border-dashed border-border bg-card/40 p-4 text-[12px] text-muted-foreground">
        <span>错题本由系统自动维护,做错题会被加入,标记「已掌握」可提升间隔。</span>
        <Link to="/training" className="inline-flex items-center gap-1 text-primary hover:underline">
          返回训练首页 <ChevronRight className="h-3 w-3" />
        </Link>
      </div>
    </PageShell>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ChevronRight, TrendingUp, BookMarked, BookOpen, RefreshCw, Check, X } from "lucide-react";
import { PageShell } from "@/components/workbench/PageShell";
import { QUESTIONS } from "@/lib/mock/data";

export const Route = createFileRoute("/training/result/$id")({
  component: ResultPage,
  head: () => ({ meta: [{ title: "答题结果 · 题库训练" }] }),
});

type Saved = {
  wrongIds: string[];
  total: number;
  answers: Record<string, string | string[]>;
  qids: string[];
  elapsed: number;
  mode: "practice" | "exam" | "review";
};

/** 智能考试历史作答的演示数据（无 session 时回退） */
const EXAM_RESULT_MOCKS: Record<string, { score: number; count: number; elapsed: number }> = {
  "exam-复证巩固-20260601": { score: 80, count: 18, elapsed: 1420 },
  "exam-复证巩固-20260510": { score: 70, count: 18, elapsed: 1680 },
  "exam-AGC-20260605": { score: 72, count: 20, elapsed: 1560 },
  "exam-AGC-20260528": { score: 65, count: 20, elapsed: 1740 },
  "exam-PSS-20260608": { score: 85, count: 16, elapsed: 1320 },
  "exam-黑启动-20260606": { score: 78, count: 18, elapsed: 1580 },
  "exam-黑启动-20260520": { score: 68, count: 18, elapsed: 1720 },
  "exam-厂用电-20260603": { score: 92, count: 15, elapsed: 980 },
};

function buildExamResultMock(meta: { score: number; count: number; elapsed: number }): Saved {
  const qids = QUESTIONS.slice(0, meta.count).map((q) => q.id);
  const wrongCount = Math.max(0, Math.round(meta.count * (1 - meta.score / 100)));
  const wrongIds = qids.slice(0, wrongCount);
  return {
    wrongIds,
    total: meta.count,
    answers: {},
    qids,
    elapsed: meta.elapsed,
    mode: "exam",
  };
}

function ResultPage() {
  const { id } = Route.useParams();
  const [data, setData] = useState<Saved>({
    wrongIds: [],
    total: 10,
    answers: {},
    qids: [],
    elapsed: 0,
    mode: "practice",
  });

  useEffect(() => {
    const raw = sessionStorage.getItem(`result-${id}`);
    if (raw) {
      setData(JSON.parse(raw));
      return;
    }
    const mock = EXAM_RESULT_MOCKS[id];
    if (mock) setData(buildExamResultMock(mock));
  }, [id]);

  const correct = data.total - data.wrongIds.length;
  const score = Math.round((correct / data.total) * 100);
  const wrong = QUESTIONS.filter((q) => data.wrongIds.includes(q.id));
  const all = data.qids.map((qid) => QUESTIONS.find((q) => q.id === qid)!).filter(Boolean);

  const fmt = (s: number) => {
    const m = Math.floor(s / 60).toString().padStart(2, "0");
    const sec = (s % 60).toString().padStart(2, "0");
    return `${m}:${sec}`;
  };

  const passed = score >= 60;
  const ringColor = passed ? "from-primary to-[oklch(0.5_0.13_205)]" : "from-warning to-[oklch(0.65_0.18_45)]";

  return (
    <PageShell>
      <div className="mb-6 grid gap-6 rounded-lg border border-border bg-card p-8 shadow-[var(--shadow-card)] md:grid-cols-3">
        <div className="grid place-items-center">
          <div className={`relative grid h-32 w-32 place-items-center rounded-full bg-gradient-to-br ${ringColor} text-white shadow-[var(--shadow-glow)]`}>
            <div className="text-[36px] font-bold leading-none">{score}</div>
            <div className="absolute bottom-7 text-[10px] opacity-80">/ 100</div>
          </div>
          <div className="mt-3 text-[12px] text-muted-foreground">{decodeURIComponent(id)}</div>
          <div
            className={`mt-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
              passed ? "bg-success-soft text-success" : "bg-warning-soft text-warning-foreground"
            }`}
          >
            {passed ? "已通过" : "未达及格"}
          </div>
        </div>
        <div className="md:col-span-2">
          <h1 className="text-[20px] font-semibold">本次答题结果</h1>
          <div className="mt-4 grid grid-cols-3 gap-3">
            <Stat label="正确率" value={`${score}%`} />
            <Stat label="正确 / 总数" value={`${correct} / ${data.total}`} />
            <Stat label="用时" value={fmt(data.elapsed)} />
          </div>
          <div className="mt-4">
            <div className="mb-2 text-[12px] font-medium">薄弱知识点</div>
            <div className="flex flex-wrap gap-2">
              {Array.from(new Set(wrong.flatMap((w) => w.knowledgePoints))).map((k) => (
                <span key={k} className="rounded-full border border-warning/30 bg-warning-soft px-2.5 py-1 text-[11px] text-warning-foreground">
                  {k}
                </span>
              ))}
              {wrong.length === 0 && <span className="text-[12px] text-muted-foreground">无 — 表现优秀!</span>}
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link
              to="/training/wrong"
              className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-2 text-[12.5px] font-medium text-primary-foreground hover:bg-primary/90"
            >
              <BookMarked className="h-3.5 w-3.5" /> 查看错题本
            </Link>
            {wrong.length > 0 && (
              <Link
                to="/training/session/$id"
                params={{ id: `错题再练-${id}` }}
                search={{ mode: "practice", filter: "", count: wrong.length, limit: 0 }}
                className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-3 py-2 text-[12.5px] hover:bg-muted"
              >
                <RefreshCw className="h-3.5 w-3.5" /> 针对错题再练
              </Link>
            )}
            <Link
              to="/training/growth"
              className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-3 py-2 text-[12.5px] hover:bg-muted"
            >
              <TrendingUp className="h-3.5 w-3.5" /> 查看能力成长
            </Link>
          </div>
        </div>
      </div>

      <h2 className="mb-3 text-[15px] font-semibold">逐题解析</h2>
      <div className="space-y-3">
        {all.map((q, i) => {
          const ua = data.answers[q.id];
          const isWrong = data.wrongIds.includes(q.id);
          const fmtAns = (v: string | string[] | undefined) =>
            v == null || v === "" || (Array.isArray(v) && v.length === 0)
              ? "未作答"
              : Array.isArray(v)
                ? v.join("、")
                : v === "T"
                  ? "正确"
                  : v === "F"
                    ? "错误"
                    : v;
          return (
            <div key={q.id} className={`rounded-lg border bg-card p-5 ${isWrong ? "border-destructive/30" : "border-border"}`}>
              <div className="flex items-start gap-3">
                <span
                  className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full text-[10px] font-bold text-white ${
                    isWrong ? "bg-destructive" : "bg-success"
                  }`}
                >
                  {isWrong ? <X className="h-3.5 w-3.5" /> : <Check className="h-3.5 w-3.5" />}
                </span>
                <div className="flex-1">
                  <div className="mb-1 text-[11px] text-muted-foreground">第 {i + 1} 题 · {{ single: "单选", multiple: "多选", judge: "判断", text: "简答" }[q.type]}</div>
                  <div className="text-[13.5px] font-medium leading-relaxed">{q.stem}</div>
                  <div className="mt-3 grid gap-1.5 text-[12.5px]">
                    <div className={isWrong ? "text-destructive" : "text-success"}>
                      你的答案:{fmtAns(ua)}
                    </div>
                    {q.type !== "text" && (
                      <div className="text-success">
                        正确答案:{Array.isArray(q.answer) ? q.answer.join("、") : q.answer === "T" ? "正确" : q.answer === "F" ? "错误" : q.answer}
                      </div>
                    )}
                  </div>
                  <div className="mt-2 rounded-lg bg-muted/40 p-3 text-[12.5px] text-foreground/80">
                    <span className="font-medium">解析:</span> {q.analysis}
                  </div>
                  {q.relatedDocId && (
                    <Link
                      to="/learn/doc/$id"
                      params={{ id: q.relatedDocId }}
                      className="mt-2 inline-flex items-center gap-1 text-[12px] font-medium text-primary hover:underline"
                    >
                      <BookOpen className="h-3 w-3" /> 查看依据资料 <ChevronRight className="h-3 w-3" />
                    </Link>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </PageShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-background p-4">
      <div className="text-[11px] text-muted-foreground">{label}</div>
      <div className="mt-1 text-[20px] font-semibold tabular-nums">{value}</div>
    </div>
  );
}

import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Clock, ChevronLeft, ChevronRight, AlertTriangle, X } from "lucide-react";
import { z } from "zod";
import { PageShell } from "@/components/workbench/PageShell";
import { QUESTIONS, type Question } from "@/lib/mock/data";
import { useMockStore } from "@/lib/mock/store";

const searchSchema = z.object({
  mode: z.enum(["practice", "exam", "review"]).default("practice"),
  filter: z.string().default(""),
  count: z.coerce.number().default(10),
  limit: z.coerce.number().default(0),
});

export const Route = createFileRoute("/training/session/$id")({
  validateSearch: searchSchema,
  component: SessionPage,
  head: () => ({ meta: [{ title: "答题中 · 题库训练" }] }),
});

function SessionPage() {
  const { id } = Route.useParams();
  const { mode, filter, count, limit } = Route.useSearch() as z.infer<typeof searchSchema>;
  const navigate = useNavigate();
  const { addWrong } = useMockStore();

  const questions: Question[] = useMemo(() => {
    let pool = QUESTIONS;
    if (filter) pool = pool.filter((q) => q.knowledgePoints.some((k) => k.includes(filter)));
    if (pool.length === 0) pool = QUESTIONS;
    return pool.slice(0, Math.max(1, count));
  }, [filter, count]);

  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [elapsed, setElapsed] = useState(0);
  const [confirmExit, setConfirmExit] = useState(false);
  const q = questions[idx];

  // Timer
  useEffect(() => {
    const t = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const remaining = limit > 0 ? Math.max(0, limit * 60 - elapsed) : 0;

  const setAns = (val: string | string[]) =>
    setAnswers((a) => ({ ...a, [q.id]: val }));

  const submit = () => {
    const wrongIds: string[] = [];
    questions.forEach((qq) => {
      if (qq.type === "text") return; // 简答不计错
      const a = answers[qq.id];
      const correct = Array.isArray(qq.answer)
        ? Array.isArray(a) && [...a].sort().join() === [...qq.answer].sort().join()
        : a === qq.answer;
      if (!correct) {
        wrongIds.push(qq.id);
        addWrong(qq.id);
      }
    });
    sessionStorage.setItem(
      `result-${id}`,
      JSON.stringify({
        wrongIds,
        total: questions.length,
        answers,
        qids: questions.map((q) => q.id),
        elapsed,
        mode,
      }),
    );
    navigate({ to: "/training/result/$id", params: { id } });
  };

  // Auto-submit when time up (exam mode)
  useEffect(() => {
    if (mode === "exam" && limit > 0 && remaining === 0 && elapsed > 0) submit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining]);

  const fmt = (s: number) => {
    const m = Math.floor(s / 60).toString().padStart(2, "0");
    const sec = (s % 60).toString().padStart(2, "0");
    return `${m}:${sec}`;
  };

  const answered = Object.keys(answers).filter((k) => {
    const v = answers[k];
    return Array.isArray(v) ? v.length > 0 : v != null && v !== "";
  }).length;

  return (
    <PageShell>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card px-5 py-3">
        <div className="flex items-center gap-3">
          <span className="text-[13px] font-medium">{decodeURIComponent(id)}</span>
          <span
            className={`rounded-md px-2 py-0.5 text-[10.5px] font-medium ${
              mode === "exam"
                ? "bg-destructive/10 text-destructive"
                : mode === "review"
                  ? "bg-warning-soft text-warning-foreground"
                  : "bg-primary-soft text-accent-foreground"
            }`}
          >
            {({ practice: "专项练习", exam: "模拟考试", review: "复习" } as const)[mode]}
          </span>
          <span className="rounded-md bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
            {idx + 1} / {questions.length}
          </span>
        </div>
        <div className="flex items-center gap-3">
          {mode === "exam" && limit > 0 ? (
            <div
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-semibold tabular-nums ${
                remaining < 60 ? "bg-destructive/10 text-destructive" : "bg-primary-soft text-accent-foreground"
              }`}
            >
              <Clock className="h-3.5 w-3.5" /> 剩余 {fmt(remaining)}
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 text-[12px] text-muted-foreground tabular-nums">
              <Clock className="h-3.5 w-3.5" /> 用时 {fmt(elapsed)}
            </div>
          )}
          <button
            onClick={() => setConfirmExit(true)}
            className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-2.5 py-1.5 text-[11.5px] text-muted-foreground hover:bg-muted"
          >
            <X className="h-3 w-3" /> 退出
          </button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-4">
        <article className="rounded-lg border border-border bg-card p-6 lg:col-span-3">
          <div className="mb-2 flex items-center gap-2">
            <span className="rounded-md bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
              {{ single: "单选", multiple: "多选", judge: "判断", text: "简答" }[q.type]}
            </span>
            {q.relatedDocTitle && (
              <span className="text-[11px] text-muted-foreground">考点:{q.relatedDocTitle}</span>
            )}
          </div>
          <h2 className="text-[15px] font-medium leading-relaxed">{q.stem}</h2>

          <div className="mt-5 space-y-2">
            {q.type === "judge" ? (
              ["T", "F"].map((k) => {
                const checked = answers[q.id] === k;
                return (
                  <label
                    key={k}
                    className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 text-[13px] transition-colors ${
                      checked ? "border-primary bg-primary-soft" : "border-border bg-background hover:border-primary/40"
                    }`}
                  >
                    <input type="radio" checked={checked} onChange={() => setAns(k)} className="accent-primary" />
                    {k === "T" ? "正确" : "错误"}
                  </label>
                );
              })
            ) : q.type === "text" ? (
              <textarea
                rows={5}
                value={(answers[q.id] as string) ?? ""}
                onChange={(e) => setAns(e.target.value)}
                placeholder="请输入作答…"
                className="w-full resize-none rounded-lg border border-border bg-background p-3 text-[13px] outline-none focus:border-primary"
              />
            ) : (
              q.options?.map((o) => {
                const current = answers[q.id];
                const isMulti = q.type === "multiple";
                const checked = isMulti
                  ? Array.isArray(current) && current.includes(o.key)
                  : current === o.key;
                return (
                  <label
                    key={o.key}
                    className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 text-[13px] transition-colors ${
                      checked ? "border-primary bg-primary-soft" : "border-border bg-background hover:border-primary/40"
                    }`}
                  >
                    <input
                      type={isMulti ? "checkbox" : "radio"}
                      checked={checked}
                      onChange={() => {
                        if (isMulti) {
                          const arr = Array.isArray(current) ? [...current] : [];
                          setAns(arr.includes(o.key) ? arr.filter((x) => x !== o.key) : [...arr, o.key]);
                        } else {
                          setAns(o.key);
                        }
                      }}
                      className="mt-0.5 accent-primary"
                    />
                    <div>
                      <span className="mr-2 font-medium text-foreground">{o.key}.</span>
                      {o.label}
                    </div>
                  </label>
                );
              })
            )}
          </div>

          <div className="mt-6 flex items-center justify-between">
            <button
              disabled={idx === 0}
              onClick={() => setIdx((i) => i - 1)}
              className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-3 py-2 text-[12.5px] disabled:opacity-40"
            >
              <ChevronLeft className="h-3.5 w-3.5" /> 上一题
            </button>
            {idx < questions.length - 1 ? (
              <button
                onClick={() => setIdx((i) => i + 1)}
                className="inline-flex items-center gap-1 rounded-lg bg-primary px-4 py-2 text-[12.5px] font-medium text-primary-foreground hover:bg-primary/90"
              >
                下一题 <ChevronRight className="h-3.5 w-3.5" />
              </button>
            ) : (
              <button
                onClick={submit}
                className="rounded-lg bg-success px-5 py-2 text-[13px] font-medium text-white hover:bg-success/90"
              >
                提交答卷
              </button>
            )}
          </div>
        </article>

        <aside className="space-y-3">
          <div className="rounded-lg border border-border bg-card p-5">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-[12px] font-medium">答题卡</div>
              <span className="text-[10.5px] text-muted-foreground">
                已答 {answered} / {questions.length}
              </span>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {questions.map((qq, i) => {
                const has = answers[qq.id] != null && (Array.isArray(answers[qq.id]) ? (answers[qq.id] as string[]).length : true);
                const current = i === idx;
                return (
                  <button
                    key={qq.id}
                    onClick={() => setIdx(i)}
                    className={`grid h-8 place-items-center rounded-lg text-[11px] font-medium transition-colors ${
                      current
                        ? "bg-primary text-primary-foreground"
                        : has
                          ? "bg-success-soft text-success"
                          : "bg-muted text-muted-foreground hover:bg-muted/70"
                    }`}
                  >
                    {i + 1}
                  </button>
                );
              })}
            </div>
            {mode === "exam" && (
              <button
                onClick={submit}
                className="mt-4 inline-flex w-full items-center justify-center rounded-lg bg-success px-3 py-2 text-[12.5px] font-medium text-white hover:bg-success/90"
              >
                提前交卷
              </button>
            )}
          </div>

          <div className="rounded-lg border border-border bg-card p-4 text-[11.5px] text-muted-foreground">
            <div className="mb-1 font-medium text-foreground">小贴士</div>
            {mode === "exam"
              ? "考试模式下不显示解析,提交后可查看完整解析与错题分布。"
              : "练习模式下,提交后可立即查看正确答案与依据资料链接。"}
          </div>
        </aside>
      </div>

      {confirmExit && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/30 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-[var(--shadow-card-hover)]">
            <div className="inline-flex items-center gap-2 text-[14px] font-semibold">
              <AlertTriangle className="h-4 w-4 text-warning" /> 确认退出本次{({ practice: "练习", exam: "考试", review: "复习" } as const)[mode]}?
            </div>
            <p className="mt-2 text-[12.5px] text-muted-foreground">
              当前进度({answered} / {questions.length})将不会保存。
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setConfirmExit(false)}
                className="rounded-lg border border-border bg-background px-3 py-1.5 text-[12.5px] hover:bg-muted"
              >
                继续答题
              </button>
              <Link
                to="/training"
                className="rounded-lg bg-destructive px-3 py-1.5 text-[12.5px] font-medium text-white hover:opacity-90"
              >
                确认退出
              </Link>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
}

import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Clock, ChevronLeft, ChevronRight, AlertTriangle, Save, X } from "lucide-react";
import { z } from "zod";
import { PageShell } from "@/components/workbench/PageShell";
import { ExamSessionPaperView } from "@/components/exam/exam-session-paper";
import { QUESTIONS, TOPICS, type Question, type QuestionType } from "@/lib/mock/data";
import {
  fallbackExamSessionPaper,
  flattenExamQuestions,
  gradeExamAnswer,
  isExamAnswerFilled,
  resolveExamSessionPaper,
} from "@/lib/mock/exam-session";
import { getQuestionIdsForDoc } from "@/lib/mock/learning-progress";
import { filterPracticeQuestions, type PracticeDifficulty } from "@/lib/mock/practice-filter";
import { useMockStore } from "@/lib/mock/store";
import {
  clearTopicPracticeDraft,
  getTopicQuestions,
  loadTopicPracticeDraft,
  saveTopicPracticeDraft,
  type TopicQuestionItem,
} from "@/lib/mock/topic-practice";

const searchSchema = z.object({
  mode: z.enum(["practice", "exam", "review"]).default("practice"),
  filter: z.string().default(""),
  filters: z.string().default(""),
  types: z.string().default(""),
  diff: z.enum(["all", "easy", "hard"]).default("all"),
  count: z.coerce.number().default(10),
  limit: z.coerce.number().default(0),
  docId: z.string().optional(),
  topicId: z.string().optional(),
});

export const Route = createFileRoute("/training/session/$id")({
  validateSearch: searchSchema,
  component: SessionPage,
  head: () => ({ meta: [{ title: "答题中 · 题库训练" }] }),
});

function SessionPage() {
  const { id } = Route.useParams();
  const { mode, filter, filters, types, diff, count, limit, docId, topicId } = Route.useSearch() as z.infer<
    typeof searchSchema
  >;
  const navigate = useNavigate();
  const { addWrong, recordDocAnswers } = useMockStore();

  const isExamMode = mode === "exam";
  const examPaper = useMemo(() => {
    if (!isExamMode) return null;
    return resolveExamSessionPaper(id) ?? fallbackExamSessionPaper(decodeURIComponent(id), count);
  }, [isExamMode, id, count]);

  const topic = topicId ? TOPICS.find((t) => t.id === topicId) : undefined;
  const isTopicPractice = Boolean(topicId && topic);

  const topicItems: TopicQuestionItem[] = useMemo(() => {
    if (!topic) return [];
    return getTopicQuestions(topic);
  }, [topic]);

  const docTitleByQuestionId = useMemo(() => {
    const map = new Map<string, string>();
    topicItems.forEach((item) => map.set(item.question.id, item.docTitle));
    return map;
  }, [topicItems]);

  const questions: Question[] = useMemo(() => {
    if (isTopicPractice) {
      return topicItems.map((item) => item.question);
    }
    if (docId) {
      const ids = getQuestionIdsForDoc(docId);
      const docQs = ids.map((qid) => QUESTIONS.find((q) => q.id === qid)).filter(Boolean) as Question[];
      return docQs.length > 0 ? docQs : QUESTIONS.slice(0, 3);
    }
    const categoryKeys = filters
      ? filters.split(",").filter(Boolean)
      : filter
        ? [filter]
        : [];
    const typeList = types
      ? (types.split(",").filter(Boolean) as QuestionType[])
      : ([] as QuestionType[]);

    let pool =
      categoryKeys.length > 0 || typeList.length > 0 || diff !== "all"
        ? filterPracticeQuestions({
            categoryKeys,
            types: typeList.length > 0 ? typeList : (["single", "multiple", "judge", "text"] as QuestionType[]),
            diff: diff as PracticeDifficulty,
          })
        : filter
          ? QUESTIONS.filter((q) => q.knowledgePoints.some((k) => k.includes(filter)))
          : QUESTIONS;

    if (pool.length === 0) pool = QUESTIONS;
    return pool.slice(0, Math.max(1, count));
  }, [filter, filters, types, diff, count, docId, isTopicPractice, topicItems]);

  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [examAnswers, setExamAnswers] = useState<Record<string, string | string[]>>({});
  const [elapsed, setElapsed] = useState(0);
  const [confirmExit, setConfirmExit] = useState(false);
  const [draftLoaded, setDraftLoaded] = useState(false);

  const examFlat = useMemo(
    () => (examPaper ? flattenExamQuestions(examPaper.groups) : []),
    [examPaper],
  );
  const examLimitMinutes = examPaper?.duration ?? limit;

  useEffect(() => {
    if (!isTopicPractice || !topicId || draftLoaded) return;
    const draft = loadTopicPracticeDraft(topicId);
    if (draft) {
      setAnswers(draft.answers);
      setIdx(Math.min(draft.currentIndex, Math.max(questions.length - 1, 0)));
    }
    setDraftLoaded(true);
  }, [isTopicPractice, topicId, draftLoaded, questions.length]);

  const q = questions[idx];

  // Timer
  useEffect(() => {
    const t = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const remaining = isExamMode
    ? examLimitMinutes > 0
      ? Math.max(0, examLimitMinutes * 60 - elapsed)
      : 0
    : limit > 0
      ? Math.max(0, limit * 60 - elapsed)
      : 0;

  const setAns = (val: string | string[]) => {
    if (!q) return;
    setAnswers((a) => ({ ...a, [q.id]: val }));
  };

  const setExamAns = (questionId: string, val: string | string[]) => {
    setExamAnswers((a) => ({ ...a, [questionId]: val }));
  };

  const saveDraft = () => {
    if (!topicId) return;
    saveTopicPracticeDraft({
      topicId,
      answers,
      currentIndex: idx,
      savedAt: new Date().toISOString(),
    });
  };

  const submit = () => {
    if (isExamMode && examPaper) {
      const wrongIds: string[] = [];
      examFlat.forEach(({ groupType, question }) => {
        if (groupType === "简答题" || groupType === "案例分析题" || groupType === "填空题") return;
        const a = examAnswers[question.id];
        const correct = gradeExamAnswer(groupType, question.answer, a);
        if (!correct) {
          wrongIds.push(question.id);
          addWrong(question.id);
        }
      });
      sessionStorage.setItem(
        `result-${id}`,
        JSON.stringify({
          wrongIds,
          total: examFlat.length,
          answers: examAnswers,
          qids: examFlat.map((item) => item.question.id),
          elapsed,
          mode,
          paperId: examPaper.employeePaperId,
        }),
      );
      navigate({ to: "/training/result/$id", params: { id } });
      return;
    }

    const wrongIds: string[] = [];
    questions.forEach((qq) => {
      if (qq.type === "text") return;
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
        qids: questions.map((qq) => qq.id),
        elapsed,
        mode,
        topicId,
      }),
    );
    if (isTopicPractice && topicId) {
      const byDoc = new Map<string, string[]>();
      topicItems.forEach((item) => {
        const list = byDoc.get(item.docId) ?? [];
        list.push(item.question.id);
        byDoc.set(item.docId, list);
      });
      byDoc.forEach((qids, did) => recordDocAnswers(did, qids));
      clearTopicPracticeDraft(topicId);
      navigate({
        to: "/training/result/$id",
        params: { id },
        search: { topicId },
      });
      return;
    }
    if (docId && mode === "practice") {
      recordDocAnswers(docId, questions.map((qq) => qq.id));
    }
    navigate({ to: "/training/result/$id", params: { id }, search: docId ? { docId } : undefined });
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

  const answered = isExamMode
    ? examFlat.filter((item) => isExamAnswerFilled(examAnswers[item.question.id])).length
    : Object.keys(answers).filter((k) => {
        const v = answers[k];
        return Array.isArray(v) ? v.length > 0 : v != null && v !== "";
      }).length;

  const sessionTitle = isTopicPractice
    ? (topic?.title ?? "专题练习")
    : isExamMode && examPaper
      ? examPaper.title
      : decodeURIComponent(id);
  const modeLabel = isTopicPractice
    ? "专题练习"
    : ({ practice: "专项练习", exam: "我的考试", review: "复习" } as const)[mode];

  if (isExamMode && examPaper) {
    return (
      <PageShell compact>
        <ExamSessionPaperView
          meta={examPaper}
          groups={examPaper.groups}
          answers={examAnswers}
          onAnswerChange={setExamAns}
          onSubmit={submit}
          onExit={() => setConfirmExit(true)}
          remaining={remaining}
          formatTime={fmt}
        />

        {confirmExit && (
          <ExitConfirmDialog
            mode={mode}
            isTopicPractice={false}
            answered={answered}
            total={examFlat.length}
            topicId={undefined}
            onCancel={() => setConfirmExit(false)}
            onSaveDraft={() => {}}
            onAbandon={() => navigate({ to: "/training/exam" })}
          />
        )}
      </PageShell>
    );
  }

  if (!q) {
    return (
      <PageShell>
        <div className="rounded-lg border border-border bg-card p-10 text-center text-muted-foreground">
          暂无题目可练习
          {topicId && (
            <Link to="/learn/topic/$id" params={{ id: topicId }} className="ml-2 text-primary hover:underline">
              返回专题
            </Link>
          )}
        </div>
      </PageShell>
    );
  }

  const sourceDocTitle = docTitleByQuestionId.get(q.id) ?? q.relatedDocTitle;

  return (
    <PageShell>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card px-5 py-3">
        <div className="flex items-center gap-3">
          <span className="text-[13px] font-medium">{sessionTitle}</span>
          <span
            className={`rounded-md px-2 py-0.5 text-[10.5px] font-medium ${
              mode === "exam"
                ? "bg-destructive/10 text-destructive"
                : mode === "review"
                  ? "bg-warning-soft text-warning-foreground"
                  : "bg-primary-soft text-accent-foreground"
            }`}
          >
            {modeLabel}
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
            {sourceDocTitle && (
              <span className="text-[11px] text-muted-foreground">所属资料：{sourceDocTitle}</span>
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
            {isTopicPractice && (
              <button
                onClick={() => {
                  saveDraft();
                  navigate({ to: "/learn/topic/$id", params: { id: topicId! } });
                }}
                className="mt-4 inline-flex w-full items-center justify-center gap-1 rounded-lg border border-primary/40 bg-primary-soft px-3 py-2 text-[12.5px] font-medium text-accent-foreground hover:bg-primary-soft/80"
              >
                <Save className="h-3.5 w-3.5" />
                暂存练习
              </button>
            )}
          </div>

          <div className="rounded-lg border border-border bg-card p-4 text-[11.5px] text-muted-foreground">
            <div className="mb-1 font-medium text-foreground">小贴士</div>
            {isTopicPractice
              ? "专题汇总练习支持暂存进度，提交后按各资料回写学习进度。"
              : mode === "exam"
                ? "考试模式下不显示解析,提交后可查看完整解析与错题分布。"
                : "练习模式下,提交后可立即查看正确答案与依据资料链接。"}
          </div>
        </aside>
      </div>

      {confirmExit && (
        <ExitConfirmDialog
          mode={mode}
          isTopicPractice={isTopicPractice}
          answered={answered}
          total={questions.length}
          topicId={topicId}
          onCancel={() => setConfirmExit(false)}
          onSaveDraft={() => {
            saveDraft();
            navigate({ to: "/learn/topic/$id", params: { id: topicId! } });
          }}
          onAbandon={() => {
            if (isTopicPractice && topicId) {
              navigate({ to: "/learn/topic/$id", params: { id: topicId } });
            }
          }}
        />
      )}
    </PageShell>
  );
}

function ExitConfirmDialog({
  mode,
  isTopicPractice,
  answered,
  total,
  topicId,
  onCancel,
  onSaveDraft,
  onAbandon,
}: {
  mode: "practice" | "exam" | "review";
  isTopicPractice: boolean;
  answered: number;
  total: number;
  topicId?: string;
  onCancel: () => void;
  onSaveDraft: () => void;
  onAbandon: () => void;
}) {
  const modeName = isTopicPractice ? "练习" : ({ practice: "练习", exam: "考试", review: "复习" } as const)[mode];

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/30 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-[var(--shadow-card-hover)]">
        <div className="inline-flex items-center gap-2 text-[14px] font-semibold">
          <AlertTriangle className="h-4 w-4 text-warning" /> 确认退出本次{modeName}?
        </div>
        <p className="mt-2 text-[12.5px] text-muted-foreground">
          {isTopicPractice
            ? `当前进度（${answered} / ${total}）可选择暂存后退出，或放弃进度。`
            : `当前进度（${answered} / ${total}）将不会保存。`}
        </p>
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <button
            onClick={onCancel}
            className="rounded-lg border border-border bg-background px-3 py-1.5 text-[12.5px] hover:bg-muted"
          >
            继续答题
          </button>
          {isTopicPractice && topicId ? (
            <>
              <button
                onClick={onSaveDraft}
                className="rounded-lg border border-primary/40 bg-primary-soft px-3 py-1.5 text-[12.5px] font-medium text-accent-foreground hover:bg-primary-soft/80"
              >
                暂存并退出
              </button>
              <button
                onClick={onAbandon}
                className="rounded-lg bg-destructive px-3 py-1.5 text-[12.5px] font-medium text-white hover:opacity-90"
              >
                放弃进度
              </button>
            </>
          ) : mode === "exam" ? (
            <Link
              to="/training/exam"
              className="rounded-lg bg-destructive px-3 py-1.5 text-[12.5px] font-medium text-white hover:opacity-90"
            >
              确认退出
            </Link>
          ) : (
            <Link
              to="/training"
              className="rounded-lg bg-destructive px-3 py-1.5 text-[12.5px] font-medium text-white hover:opacity-90"
            >
              确认退出
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

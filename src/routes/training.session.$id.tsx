import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  BookOpenCheck,
  ChevronLeft,
  ChevronRight,
  Clock,
  Flag,
  Layers3,
  Save,
  X,
} from "lucide-react";
import { z } from "zod";
import { PageShell } from "@/components/workbench/PageShell";
import { ExamSessionPaperView } from "@/components/exam/exam-session-paper";
import { DOCS, QUESTIONS, TOPICS, type Question, type QuestionType } from "@/lib/mock/data";
import {
  fallbackExamSessionPaper,
  flattenExamQuestions,
  gradeExamAnswer,
  isExamAnswerFilled,
  resolveExamSessionPaper,
  scoreExamAnswers,
} from "@/lib/mock/exam-session";
import { getQuestionIdsForDoc } from "@/lib/mock/learning-progress";
import { filterPracticeQuestions, type PracticeDifficulty } from "@/lib/mock/practice-filter";
import { useMockStore } from "@/lib/mock/store";
import {
  clearTopicPracticeDraft,
  getTopicQuestions,
  loadTopicPracticeDraft,
  saveDocLastPracticeScore,
  saveTopicPracticeDraft,
  saveTopicPracticeLastScore,
  type TopicQuestionItem,
} from "@/lib/mock/topic-practice";
import { trainingResultStorageKey } from "@/lib/training/result";

const searchSchema = z.object({
  mode: z.enum(["practice", "exam", "review"]).default("practice"),
  filter: z.string().default(""),
  filters: z.string().default(""),
  types: z.string().default(""),
  diff: z.enum(["all", "easy", "hard"]).default("all"),
  count: z.coerce.number().default(10),
  limit: z.coerce.number().default(0),
  passScore: z.coerce.number().default(60),
  docId: z.string().optional(),
  topicId: z.string().optional(),
  title: z.string().optional(),
});

export const Route = createFileRoute("/training/session/$id")({
  validateSearch: searchSchema,
  component: SessionPage,
  head: () => ({ meta: [{ title: "答题中 · 训练中心" }] }),
});

function SessionPage() {
  const { id } = Route.useParams();
  const { mode, filter, filters, types, diff, count, limit, passScore, docId, topicId, title } =
    Route.useSearch() as z.infer<typeof searchSchema>;
  const navigate = useNavigate();
  const { addWrong, recordDocAnswers, startDocPractice } = useMockStore();

  const isExamMode = mode === "exam";
  const examPaper = useMemo(() => {
    if (!isExamMode) return null;
    return (
      resolveExamSessionPaper(id) ??
      fallbackExamSessionPaper(
        title ?? decodeURIComponent(id),
        count,
        limit,
        passScore,
        "个人测评",
        filters ? filters.split(",").filter(Boolean).join(" / ") : filter || "综合能力",
        ({ easy: "易", medium: "中", hard: "难", all: "综合" } as const)[diff],
      )
    );
  }, [isExamMode, id, count, limit, passScore, title, filter, filters, diff]);

  const topic = topicId ? TOPICS.find((t) => t.id === topicId) : undefined;
  const doc = docId ? DOCS.find((item) => item.id === docId) : undefined;
  const isTopicPractice = Boolean(!docId && topicId && topic);

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
      const docQs = ids
        .map((qid) => QUESTIONS.find((q) => q.id === qid))
        .filter(Boolean) as Question[];
      return docQs.length > 0 ? docQs : QUESTIONS.slice(0, 3);
    }
    const categoryKeys = filters ? filters.split(",").filter(Boolean) : filter ? [filter] : [];
    const typeList = types
      ? (types.split(",").filter(Boolean) as QuestionType[])
      : ([] as QuestionType[]);

    let pool =
      categoryKeys.length > 0 || typeList.length > 0 || diff !== "all"
        ? filterPracticeQuestions({
            categoryKeys,
            types:
              typeList.length > 0
                ? typeList
                : (["single", "multiple", "judge", "text"] as QuestionType[]),
            diff: diff as PracticeDifficulty,
          })
        : filter
          ? QUESTIONS.filter((q) => q.knowledgePoints.some((k) => k.includes(filter)))
          : QUESTIONS;

    if (pool.length === 0) pool = QUESTIONS;
    return pool.slice(0, Math.max(1, count));
  }, [filter, filters, types, diff, count, docId, isTopicPractice, topicItems]);

  useEffect(() => {
    if (mode !== "practice") return;
    if (docId) {
      startDocPractice(docId);
      return;
    }
    if (isTopicPractice) {
      topic?.docIds.forEach((id) => startDocPractice(id));
    }
  }, [docId, isTopicPractice, mode, startDocPractice, topic]);

  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [examAnswers, setExamAnswers] = useState<Record<string, string | string[]>>({});
  const [elapsed, setElapsed] = useState(0);
  const [confirmExit, setConfirmExit] = useState(false);
  const [draftLoaded, setDraftLoaded] = useState(false);
  const autoAdvanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  const shouldAutoAdvance = (type: QuestionType) => type !== "multiple" && type !== "text";

  const scheduleAutoAdvance = (type: QuestionType) => {
    if (!shouldAutoAdvance(type) || idx >= questions.length - 1) return;
    if (autoAdvanceTimerRef.current) clearTimeout(autoAdvanceTimerRef.current);
    autoAdvanceTimerRef.current = setTimeout(() => {
      setIdx((currentIndex) => Math.min(questions.length - 1, currentIndex + 1));
      autoAdvanceTimerRef.current = null;
    }, 150);
  };

  useEffect(() => {
    return () => {
      if (autoAdvanceTimerRef.current) clearTimeout(autoAdvanceTimerRef.current);
    };
  }, [idx]);

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
      const resultKind = id.startsWith("正式考试-") ? "formal" : "custom";
      const scoreMode = examPaper.scoreMode;
      sessionStorage.setItem(
        trainingResultStorageKey(id),
        JSON.stringify({
          wrongIds,
          total: examFlat.length,
          answers: examAnswers,
          qids: examFlat.map((item) => item.question.id),
          elapsed,
          mode,
          kind: resultKind,
          title: examPaper.title,
          sourceLabel: resultKind === "formal" ? "正式考试" : "自主组卷",
          submittedAt: new Date().toISOString(),
          passScore: examPaper.passLine,
          durationLimit: examPaper.duration,
          paperId: examPaper.employeePaperId,
          scoreMode,
          totalScore: examPaper.totalScore,
          score:
            scoreMode === "unscored"
              ? undefined
              : scoreExamAnswers(examFlat, examAnswers, wrongIds),
          questions: examFlat.map(({ groupType, question }) => ({
            id: question.id,
            type: groupType,
            stem: question.stem,
            options: question.options?.map((option) => ({
              key: option.key,
              label: option.text,
            })),
            answer: question.answer ?? "",
            knowledge: question.knowledge,
            score: question.score,
          })),
        }),
      );
      navigate({ to: "/training/result/$id", params: { id } });
      return;
    }

    const wrongIds: string[] = [];
    const correctIds: string[] = [];
    questions.forEach((qq) => {
      if (qq.type === "text") return;
      const a = answers[qq.id];
      const correct = Array.isArray(qq.answer)
        ? Array.isArray(a) && [...a].sort().join() === [...qq.answer].sort().join()
        : a === qq.answer;
      if (correct) {
        correctIds.push(qq.id);
      } else {
        wrongIds.push(qq.id);
        addWrong(qq.id);
      }
    });
    sessionStorage.setItem(
      trainingResultStorageKey(id),
      JSON.stringify({
        wrongIds,
        total: questions.length,
        answers,
        qids: questions.map((qq) => qq.id),
        elapsed,
        mode,
        kind: mode === "review" ? "review" : "practice",
        title: title ?? topic?.title ?? doc?.title ?? decodeURIComponent(id),
        sourceLabel: isTopicPractice ? "专题练习" : docId ? "资料内练习" : "专项练习",
        submittedAt: new Date().toISOString(),
        passScore: null,
        durationLimit: limit,
        topicId,
        docId,
        questions: questions.map((question) => ({
          id: question.id,
          type: {
            single: "单选题",
            multiple: "多选题",
            judge: "判断题",
            text: "简答题",
          }[question.type],
          stem: question.stem,
          options: question.options,
          answer: question.answer,
          analysis: question.analysis,
          knowledge: question.knowledgePoints.join(" / "),
        })),
      }),
    );
    if (isTopicPractice && topicId) {
      const correctSet = new Set(correctIds);
      const byDoc = new Map<string, { answeredIds: string[]; correctIds: string[] }>();
      topicItems.forEach((item) => {
        const entry = byDoc.get(item.docId) ?? { answeredIds: [], correctIds: [] };
        entry.answeredIds.push(item.question.id);
        if (correctSet.has(item.question.id)) entry.correctIds.push(item.question.id);
        byDoc.set(item.docId, entry);
      });
      byDoc.forEach(({ answeredIds, correctIds: docCorrectIds }, did) =>
        recordDocAnswers(did, answeredIds, docCorrectIds),
      );
      const gradableTotal = questions.filter((item) => item.type !== "text").length;
      saveTopicPracticeLastScore({
        topicId,
        accuracy: gradableTotal ? Math.round((correctIds.length / gradableTotal) * 100) : 0,
        correct: correctIds.length,
        total: gradableTotal,
        submittedAt: new Date().toISOString(),
      });
      clearTopicPracticeDraft(topicId);
      navigate({
        to: "/training/result/$id",
        params: { id },
        search: { topicId },
      });
      return;
    }
    if (docId && mode === "practice") {
      recordDocAnswers(
        docId,
        questions.map((qq) => qq.id),
        correctIds,
      );
      const gradableTotal = questions.filter((item) => item.type !== "text").length;
      saveDocLastPracticeScore(docId, {
        accuracy: gradableTotal ? Math.round((correctIds.length / gradableTotal) * 100) : 0,
        correct: correctIds.length,
        total: gradableTotal,
      });
    }
    navigate({ to: "/training/result/$id", params: { id }, search: docId ? { docId } : undefined });
  };

  // Auto-submit when time up (exam mode)
  useEffect(() => {
    if (mode === "exam" && limit > 0 && remaining === 0 && elapsed > 0) submit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining]);

  const fmt = (s: number) => {
    const m = Math.floor(s / 60)
      .toString()
      .padStart(2, "0");
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
      : (doc?.title ?? decodeURIComponent(id));
  const displaySessionTitle =
    title ?? (sessionTitle.startsWith("专项练习-") ? "知识点专项练习" : sessionTitle);
  const modeLabel = isTopicPractice
    ? "专题练习"
    : ({ practice: "专项练习", exam: "正式考试", review: "复习" } as const)[mode];

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
            <Link
              to="/learn/topic/$id"
              params={{ id: topicId }}
              className="ml-2 text-primary hover:underline"
            >
              返回专题
            </Link>
          )}
        </div>
      </PageShell>
    );
  }

  const sourceDocTitle = docTitleByQuestionId.get(q.id) ?? q.relatedDocTitle;

  return (
    <PageShell compact>
      <div className="flex h-full min-h-0 flex-col">
        <header className="mb-3 flex shrink-0 flex-wrap items-center justify-between gap-3 rounded-[12px] border border-kb-border bg-white px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="rounded-[6px] bg-primary-soft px-2 py-1 text-[11px] font-semibold text-primary">
              {modeLabel}
            </span>
            <h1 className="truncate text-[16px] font-semibold text-kb-heading">
              {displaySessionTitle}
            </h1>
            <span className="text-[11px] tabular-nums text-kb-muted">
              {idx + 1} / {questions.length}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 text-[12px] tabular-nums text-kb-muted">
              <Clock className="h-4 w-4" /> 用时 {fmt(elapsed)}
            </span>
            <button
              type="button"
              onClick={() => setConfirmExit(true)}
              className="inline-flex min-h-10 items-center gap-1.5 rounded-[8px] border border-kb-border px-3 text-[12px] text-kb-muted transition-colors hover:bg-kb-surface hover:text-kb-heading"
            >
              <X className="h-3.5 w-3.5" /> 退出
            </button>
          </div>
        </header>

        <div className="grid min-h-0 flex-1 gap-4 overflow-y-auto lg:grid-cols-[minmax(0,1fr)_320px] lg:overflow-hidden">
          <article className="flex min-h-[570px] flex-col overflow-hidden rounded-[14px] border border-kb-border bg-white lg:min-h-0">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-kb-border bg-kb-surface/35 px-5 py-3.5 md:px-7">
              <div className="flex flex-wrap items-center gap-2 text-[11.5px] text-kb-muted">
                <span className="font-semibold text-primary">
                  {
                    { single: "单选题", multiple: "多选题", judge: "判断题", text: "简答题" }[
                      q.type
                    ]
                  }
                </span>
                {sourceDocTitle && <span>来源：{sourceDocTitle}</span>}
              </div>
              <span className="text-[11px] text-kb-muted">完成后查看答案与依据资料</span>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-6 md:px-8 md:py-8">
              <div className="mx-auto max-w-5xl">
                <div className="flex items-start gap-4">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[9px] bg-primary text-[13px] font-bold text-white">
                    {idx + 1}
                  </span>
                  <h2 className="pt-1 text-[17px] font-semibold leading-7 text-kb-heading md:text-[18px]">
                    {q.stem}
                  </h2>
                </div>

                <div className="mt-7 grid gap-3">
                  {q.type === "judge" ? (
                    ["T", "F"].map((key) => {
                      const checked = answers[q.id] === key;
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => {
                            setAns(key);
                            scheduleAutoAdvance(q.type);
                          }}
                          aria-pressed={checked}
                          className={`grid min-h-[58px] grid-cols-[34px_1fr] items-center gap-3 rounded-[10px] border px-4 text-left transition-colors ${
                            checked
                              ? "border-primary bg-primary-soft/70"
                              : "border-kb-border bg-kb-surface/35 hover:border-primary/35"
                          }`}
                        >
                          <span
                            className={`grid h-8 w-8 place-items-center rounded-[8px] text-[12px] font-semibold ${
                              checked ? "bg-primary text-white" : "bg-white text-kb-muted"
                            }`}
                          >
                            {key === "T" ? "对" : "错"}
                          </span>
                          <span className="text-[14px] text-kb-body">
                            {key === "T" ? "正确" : "错误"}
                          </span>
                        </button>
                      );
                    })
                  ) : q.type === "text" ? (
                    <textarea
                      rows={7}
                      value={(answers[q.id] as string) ?? ""}
                      onChange={(event) => setAns(event.target.value)}
                      placeholder="请输入你的作答"
                      className="min-h-[190px] w-full resize-y rounded-[10px] border border-kb-border bg-kb-surface/30 p-4 text-[14px] leading-6 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                    />
                  ) : (
                    q.options?.map((option) => {
                      const current = answers[q.id];
                      const multiple = q.type === "multiple";
                      const checked = multiple
                        ? Array.isArray(current) && current.includes(option.key)
                        : current === option.key;
                      return (
                        <button
                          key={option.key}
                          type="button"
                          onClick={() => {
                            if (multiple) {
                              const selected = Array.isArray(current) ? [...current] : [];
                              setAns(
                                selected.includes(option.key)
                                  ? selected.filter((key) => key !== option.key)
                                  : [...selected, option.key],
                              );
                            } else {
                              setAns(option.key);
                              scheduleAutoAdvance(q.type);
                            }
                          }}
                          aria-pressed={checked}
                          className={`grid min-h-[58px] grid-cols-[34px_minmax(0,1fr)] items-center gap-3 rounded-[10px] border px-4 py-3 text-left transition-colors ${
                            checked
                              ? "border-primary bg-primary-soft/70"
                              : "border-kb-border bg-kb-surface/35 hover:border-primary/35 hover:bg-kb-surface/65"
                          }`}
                        >
                          <span
                            className={`grid h-8 w-8 place-items-center rounded-[8px] text-[12px] font-semibold ${
                              checked ? "bg-primary text-white" : "bg-white text-kb-muted"
                            }`}
                          >
                            {option.key}
                          </span>
                          <span className="text-[14px] leading-6 text-kb-body">{option.label}</span>
                        </button>
                      );
                    })
                  )}
                </div>

                <div className="mt-6 flex flex-wrap gap-2">
                  {q.knowledgePoints.map((point) => (
                    <span
                      key={point}
                      className="rounded-[6px] border border-primary/15 bg-primary-soft/35 px-2 py-1 text-[10.5px] text-primary"
                    >
                      {point}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <footer className="flex shrink-0 items-center justify-between border-t border-kb-border px-5 py-4 md:px-7">
              <button
                type="button"
                disabled={idx === 0}
                onClick={() => setIdx((currentIndex) => Math.max(0, currentIndex - 1))}
                className="inline-flex min-h-11 items-center gap-1.5 rounded-[9px] border border-kb-border px-4 text-[13px] font-medium text-kb-body hover:bg-kb-surface disabled:cursor-not-allowed disabled:opacity-35"
              >
                <ChevronLeft className="h-4 w-4" /> 上一题
              </button>
              {idx < questions.length - 1 ? (
                <button
                  type="button"
                  onClick={() => setIdx((currentIndex) => currentIndex + 1)}
                  className="inline-flex min-h-11 items-center gap-1.5 rounded-[9px] bg-primary px-5 text-[13px] font-semibold text-white hover:bg-[#2b91a3]"
                >
                  下一题 <ChevronRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={submit}
                  className="inline-flex min-h-11 items-center gap-1.5 rounded-[9px] bg-success px-5 text-[13px] font-semibold text-white hover:bg-success/90"
                >
                  提交练习
                </button>
              )}
            </footer>
          </article>

          <aside className="flex min-h-0 flex-col overflow-hidden rounded-[14px] border border-kb-border bg-white lg:h-full">
            <div className="border-b border-kb-border bg-[linear-gradient(135deg,#eef9fa_0%,#f8fcfc_100%)] p-5">
              <div className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-2 text-[12px] font-semibold text-kb-heading">
                  <Layers3 className="h-4 w-4 text-primary" /> 本次练习
                </span>
                <span className="text-[12px] tabular-nums text-primary">{fmt(elapsed)}</span>
              </div>
              <dl className="mt-4 grid grid-cols-3 divide-x divide-kb-border rounded-[9px] bg-white/85 py-3 text-center">
                <PracticeMetric value={`${questions.length}`} label="题量" />
                <PracticeMetric value={`${answered}`} label="已答" />
                <PracticeMetric value={`${questions.length - answered}`} label="未答" />
              </dl>
            </div>

            <div className="border-b border-kb-border p-4">
              <div className="mb-3 flex items-center justify-between text-[11px] text-kb-muted">
                <span>答题卡</span>
                <span>点击题号跳转</span>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {questions.map((question, questionIndex) => {
                  const value = answers[question.id];
                  const hasAnswer = Array.isArray(value)
                    ? value.length > 0
                    : value != null && String(value).trim().length > 0;
                  return (
                    <button
                      key={question.id}
                      type="button"
                      onClick={() => setIdx(questionIndex)}
                      aria-current={questionIndex === idx ? "step" : undefined}
                      className={`grid h-9 place-items-center rounded-[7px] text-[11px] font-semibold transition-colors ${
                        questionIndex === idx
                          ? "bg-primary text-white"
                          : hasAnswer
                            ? "bg-success-soft text-success"
                            : "bg-kb-surface text-kb-muted hover:bg-primary-soft hover:text-primary"
                      }`}
                    >
                      {questionIndex + 1}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="border-b border-kb-border p-4">
              <h3 className="flex items-center gap-2 text-[12px] font-semibold text-kb-heading">
                <BookOpenCheck className="h-4 w-4 text-primary" /> 本题聚焦
              </h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {q.knowledgePoints.map((point) => (
                  <span
                    key={point}
                    className="rounded-[6px] bg-kb-surface px-2 py-1 text-[10.5px] text-kb-body"
                  >
                    {point}
                  </span>
                ))}
              </div>
              {sourceDocTitle && (
                <p className="mt-3 text-[11px] leading-5 text-kb-muted">
                  依据资料：{sourceDocTitle}
                </p>
              )}
            </div>

            <div className="mt-auto p-4">
              {isTopicPractice && (
                <button
                  type="button"
                  onClick={() => {
                    saveDraft();
                    navigate({ to: "/learn/topic/$id", params: { id: topicId! } });
                  }}
                  className="mb-2 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-[9px] border border-primary/25 text-[13px] font-semibold text-primary hover:bg-primary-soft/40"
                >
                  <Save className="h-4 w-4" /> 暂存练习
                </button>
              )}
              <button
                type="button"
                onClick={submit}
                className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-[9px] border border-kb-border text-[13px] font-medium text-kb-body hover:bg-kb-surface"
              >
                <Flag className="h-4 w-4" /> 提交当前练习
              </button>
              <p className="mt-2 text-center text-[10.5px] leading-5 text-kb-muted">
                提交后立即查看答案、解析和依据资料
              </p>
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
      </div>
    </PageShell>
  );
}

function PracticeMetric({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <strong className="block text-[18px] tabular-nums text-kb-heading">{value}</strong>
      <span className="text-[10px] text-kb-muted">{label}</span>
    </div>
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
  const modeName = isTopicPractice
    ? "练习"
    : ({ practice: "练习", exam: "考试", review: "复习" } as const)[mode];

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

import { useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  BookOpen,
  Check,
  CheckCircle2,
  CircleHelp,
  ExternalLink,
  Library,
  Save,
  Send,
  Target,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { KbFileTypeIcon } from "@/components/knowledge/ui";
import { PageShell } from "@/components/workbench/PageShell";
import {
  filePracticeTypeLabel,
  getFilePracticeAnalysis,
  getFilePracticeQuestions,
  isPracticeAnswerCorrect,
  isPracticeAnswerFilled,
  type FilePracticeQuestion,
  type FilePracticeQuestionType,
} from "@/lib/knowledge/filePractice";
import { getBaseById, getFileById } from "@/lib/knowledge/model";
import {
  filePracticeDraftKey,
  saveFileLastPracticeScore,
} from "@/lib/knowledge/filePracticeProgress";
import { trainingResultStorageKey } from "@/lib/training/result";
import { cn } from "@/lib/utils";

type PracticeAnswers = Record<string, string | string[]>;

const typeOrder: FilePracticeQuestionType[] = ["single", "multiple", "judge"];

function draftKey(fileId: string) {
  return filePracticeDraftKey(fileId);
}

function QuestionOptions({
  question,
  value,
  submitted,
  onChange,
}: {
  question: FilePracticeQuestion;
  value?: string | string[];
  submitted: boolean;
  onChange: (value: string | string[]) => void;
}) {
  const selected = Array.isArray(value) ? value : value ? [value] : [];
  const correct = Array.isArray(question.answer) ? question.answer : [question.answer];
  const multiple = question.type === "multiple";

  const toggle = (key: string) => {
    if (submitted) return;
    if (!multiple) {
      onChange(key);
      return;
    }
    onChange(
      selected.includes(key) ? selected.filter((item) => item !== key) : [...selected, key].sort(),
    );
  };

  return (
    <div className="mt-3 space-y-1.5">
      {question.options.map((option) => {
        const checked = selected.includes(option.key);
        const isCorrect = submitted && correct.includes(option.key);
        const isWrong = submitted && checked && !correct.includes(option.key);
        return (
          <button
            key={option.key}
            type="button"
            onClick={() => toggle(option.key)}
            className={cn(
              "flex w-full items-start gap-3 rounded-[7px] border px-3 py-2.5 text-left transition-colors",
              isCorrect
                ? "border-success/35 bg-success-soft/60"
                : isWrong
                  ? "border-destructive/30 bg-destructive/5"
                  : checked
                    ? "border-primary/45 bg-primary-soft/70"
                    : "border-[#EDF3F5] bg-white hover:border-primary/25 hover:bg-[#FBFDFD]",
            )}
          >
            <span
              className={cn(
                "mt-0.5 grid h-[18px] w-[18px] shrink-0 place-items-center border transition-colors",
                multiple ? "rounded-[3px]" : "rounded-full",
                checked ? "border-primary bg-primary" : "border-[#B9CED3] bg-white",
              )}
            >
              {checked ? (
                multiple ? (
                  <Check className="h-3 w-3 text-primary-foreground stroke-[2.4]" />
                ) : (
                  <span className="h-2 w-2 rounded-full bg-primary-foreground" />
                )
              ) : null}
            </span>
            <span className="text-[13px] leading-5 text-[#314955]">
              <span
                className={cn(
                  "mr-2 inline-flex h-4 min-w-4 items-center justify-center rounded-[3px] px-1 text-[10.5px] font-semibold",
                  checked ? "bg-primary/15 text-primary" : "bg-[#EAF1F3] text-[#6B7F88]",
                )}
              >
                {option.key}
              </span>
              {option.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function PracticeQuestionCard({
  question,
  number,
  value,
  submitted,
  onChange,
}: {
  question: FilePracticeQuestion;
  number: number;
  value?: string | string[];
  submitted: boolean;
  onChange: (value: string | string[]) => void;
}) {
  const filled = isPracticeAnswerFilled(value);
  const correct = submitted && isPracticeAnswerCorrect(value, question.answer);
  return (
    <article
      id={`file-practice-question-${question.id}`}
      className="scroll-mt-4 border-b border-[#EDF3F5] px-5 py-4 last:border-b-0"
    >
      <div className="flex items-start gap-3">
        <span
          className={cn(
            "mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full text-[10.5px] font-semibold",
            submitted
              ? correct
                ? "bg-success text-white"
                : "bg-destructive/10 text-destructive"
              : filled
                ? "bg-primary text-primary-foreground"
                : "bg-primary-soft text-primary",
          )}
        >
          {String(number).padStart(2, "0")}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[14px] font-medium leading-6 text-[#1F3440]">{question.stem}</p>
          <QuestionOptions
            question={question}
            value={value}
            submitted={submitted}
            onChange={onChange}
          />
          {submitted ? (
            <p
              className={cn(
                "mt-3 text-[10.5px] font-medium",
                correct ? "text-success" : "text-destructive",
              )}
            >
              {correct ? "回答正确" : "回答错误"}
            </p>
          ) : null}
        </div>
      </div>
    </article>
  );
}

export function FileSelfPracticePage({ fileId }: { fileId: string }) {
  const navigate = useNavigate();
  const file = getFileById(fileId);
  const base = file ? getBaseById(file.knowledgeBaseId) : undefined;
  const questions = useMemo(() => (file ? getFilePracticeQuestions(file) : []), [file]);
  const [answers, setAnswers] = useState<PracticeAnswers>({});
  const [savedAt, setSavedAt] = useState<string>();
  const [submitted, setSubmitted] = useState(false);
  const [startedAt] = useState(() => Date.now());

  useEffect(() => {
    if (!file || typeof window === "undefined") return;
    const raw = window.localStorage.getItem(draftKey(file.id));
    if (!raw) return;
    try {
      const draft = JSON.parse(raw) as { answers?: PracticeAnswers; savedAt?: string };
      setAnswers(draft.answers ?? {});
      setSavedAt(draft.savedAt);
    } catch {
      window.localStorage.removeItem(draftKey(file.id));
    }
  }, [file]);

  if (!file) {
    return (
      <PageShell compact wide>
        <div className="grid h-full place-items-center rounded-[12px] border border-border bg-card">
          <div className="text-center">
            <p className="text-[14px] font-medium">未找到关联文件</p>
            <button
              type="button"
              onClick={() => navigate({ to: "/knowledge" })}
              className="mt-3 rounded-[8px] bg-primary px-4 py-2 text-[12px] font-medium text-primary-foreground"
            >
              返回知识总览
            </button>
          </div>
        </div>
      </PageShell>
    );
  }

  const answered = questions.filter((question) =>
    isPracticeAnswerFilled(answers[question.id]),
  ).length;
  const typeCounts = typeOrder
    .map((type) => ({
      type,
      count: questions.filter((question) => question.type === type).length,
    }))
    .filter((item) => item.count > 0);
  const correctCount = submitted
    ? questions.filter((question) => isPracticeAnswerCorrect(answers[question.id], question.answer))
        .length
    : 0;

  const updateAnswer = (id: string, value: string | string[]) => {
    setSubmitted(false);
    setAnswers((current) => ({ ...current, [id]: value }));
  };

  const saveDraft = () => {
    const nextSavedAt = new Date().toISOString();
    window.localStorage.setItem(
      draftKey(file.id),
      JSON.stringify({ answers, savedAt: nextSavedAt }),
    );
    setSavedAt(nextSavedAt);
    toast.success("练习进度已暂存");
  };

  const submit = () => {
    setSubmitted(true);
    window.localStorage.removeItem(draftKey(file.id));
    setSavedAt(undefined);
    const scored = questions.filter((question) =>
      isPracticeAnswerCorrect(answers[question.id], question.answer),
    ).length;
    saveFileLastPracticeScore({
      fileId: file.id,
      accuracy: questions.length ? Math.round((scored / questions.length) * 100) : 0,
      correct: scored,
      total: questions.length,
      submittedAt: new Date().toISOString(),
    });
    const resultId = `资料练习-${file.id}-${Date.now()}`;
    const wrongIds = questions
      .filter((question) => !isPracticeAnswerCorrect(answers[question.id], question.answer))
      .map((question) => question.id);
    sessionStorage.setItem(
      trainingResultStorageKey(resultId),
      JSON.stringify({
        wrongIds,
        total: questions.length,
        answers,
        qids: questions.map((question) => question.id),
        elapsed: Math.max(1, Math.round((Date.now() - startedAt) / 1000)),
        mode: "practice",
        kind: "file",
        title: file.name,
        sourceLabel: "资料内练习",
        submittedAt: new Date().toISOString(),
        passScore: null,
        durationLimit: 0,
        fileId: file.id,
        knowledgeBaseId: file.knowledgeBaseId,
        questions: questions.map((question) => ({
          id: question.id,
          type: filePracticeTypeLabel[question.type],
          stem: question.stem,
          options: question.options,
          answer: question.answer,
          analysis: getFilePracticeAnalysis(question),
          knowledge: question.knowledge,
        })),
      }),
    );
    navigate({ to: "/training/result/$id", params: { id: resultId } });
  };

  const returnToFile = () =>
    navigate({
      to: "/knowledge/file/$fileId",
      params: { fileId: file.id },
      search: { kbId: file.knowledgeBaseId },
    });

  const openFileInNewWindow = () => {
    const params = new URLSearchParams({ kbId: file.knowledgeBaseId });
    window.open(
      `/knowledge/file/${encodeURIComponent(file.id)}?${params.toString()}`,
      "_blank",
      "noopener,noreferrer",
    );
  };

  return (
    <PageShell compact wide>
      <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-[12px] border border-[#DCE8EA] bg-[#F4F9FA] shadow-[0_4px_20px_-12px_rgba(31,52,64,0.12)]">
        <header className="flex h-14 shrink-0 items-center justify-between gap-4 border-b border-[#DCE8EA] bg-white px-4">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={returnToFile}
              className="inline-flex h-9 items-center gap-1.5 rounded-[8px] px-2.5 text-[12.5px] font-medium text-kb-muted transition-colors hover:text-primary"
            >
              <ArrowLeft className="h-4 w-4 stroke-[1.8]" />
              返回资料
            </button>
            <div className="h-5 w-px bg-divider" />
            <span className="rounded-[5px] bg-primary-soft px-2 py-1 text-[10.5px] font-medium text-primary">
              自测练习
            </span>
            <h1 className="truncate text-[15px] font-semibold text-kb-heading">{file.name}</h1>
          </div>
          <div className="flex shrink-0 items-center gap-4 text-[11.5px] text-kb-muted">
            <span>{questions.length} 道题</span>
            <span>不限时间</span>
            <span>
              已答 {answered} / {questions.length}
            </span>
          </div>
        </header>

        <div className="flex min-h-0 flex-1 overflow-hidden">
          <main className="scrollbar-thin min-w-0 flex-1 overflow-y-auto p-3">
            {submitted && (
              <div className="mb-3 flex items-center justify-between rounded-[10px] border border-success/25 bg-success-soft px-4 py-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  <span className="text-[13px] font-medium text-success">
                    本次自测答对 {correctCount} / {questions.length} 题
                  </span>
                </div>
                <span className="text-[11px] text-success/80">本练习不设置及格线</span>
              </div>
            )}

            <div className="space-y-3">
              {typeOrder.map((type) => {
                const group = questions.filter((question) => question.type === type);
                if (group.length === 0) return null;
                return (
                  <section
                    key={type}
                    className="overflow-hidden rounded-[12px] bg-white shadow-[0_2px_12px_-8px_rgba(31,52,64,0.18)]"
                  >
                    <header className="flex items-center gap-2 border-b border-[#EDF3F5] bg-[#FAFCFD] px-5 py-3">
                      <span className="h-4 w-[4px] rounded-[1px] bg-primary" />
                      <h2 className="text-[13.5px] font-semibold text-kb-heading">
                        {filePracticeTypeLabel[type]}
                      </h2>
                      <span className="text-[11.5px] text-kb-muted">共 {group.length} 题</span>
                    </header>
                    {group.map((question) => (
                      <PracticeQuestionCard
                        key={question.id}
                        question={question}
                        number={questions.findIndex((item) => item.id === question.id) + 1}
                        value={answers[question.id]}
                        submitted={submitted}
                        onChange={(value) => updateAnswer(question.id, value)}
                      />
                    ))}
                  </section>
                );
              })}
            </div>
          </main>

          <aside className="scrollbar-thin flex w-[330px] shrink-0 flex-col overflow-y-auto border-l border-[#DCE8EA] bg-white">
            <div className="bg-[#0D96A7] px-4 py-4 text-white">
              <div className="flex items-center gap-1.5 text-[11px] font-medium text-white/85">
                <Target className="h-3.5 w-3.5" />
                自测练习
              </div>
              <h2 className="mt-2 line-clamp-2 text-[15px] font-semibold leading-6">{file.name}</h2>
              <div className="mt-4 grid grid-cols-3 gap-2">
                <InfoMetric value={questions.length} label="题量" />
                <InfoMetric value="不限时" label="时长" />
                <InfoMetric value={answered} label="已答" />
              </div>
            </div>

            <section className="border-b border-divider px-4 py-3.5">
              <div className="mb-2.5 text-[11px] font-medium text-kb-muted">自测信息</div>
              <div className="space-y-3">
                <MetaItem icon={CircleHelp} label="练习方式" value="文件自测" />
                <MetaItem icon={Library} label="所属知识库" value={base?.name ?? "-"} />
              </div>
            </section>

            <section className="border-b border-divider px-4 py-3.5">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[11px] font-medium text-kb-muted">答题卡</span>
                <span className="text-[10.5px] text-kb-muted">
                  已答 {answered} / {questions.length}
                </span>
              </div>
              <div className="grid grid-cols-6 gap-1.5">
                {questions.map((question, index) => {
                  const filled = isPracticeAnswerFilled(answers[question.id]);
                  const correct =
                    submitted && isPracticeAnswerCorrect(answers[question.id], question.answer);
                  return (
                    <button
                      key={question.id}
                      type="button"
                      onClick={() =>
                        document
                          .getElementById(`file-practice-question-${question.id}`)
                          ?.scrollIntoView({ behavior: "smooth", block: "start" })
                      }
                      className={cn(
                        "grid h-8 place-items-center rounded-[6px] text-[10.5px] font-medium transition-colors",
                        submitted
                          ? correct
                            ? "bg-success-soft text-success"
                            : "bg-destructive/8 text-destructive"
                          : filled
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-kb-muted hover:bg-primary-soft",
                      )}
                    >
                      {index + 1}
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="border-b border-divider px-4 py-3.5">
              <div className="mb-2 text-[11px] font-medium text-kb-muted">题型构成</div>
              <div className="space-y-2">
                {typeCounts.map((item) => (
                  <div key={item.type} className="flex items-center justify-between text-[11.5px]">
                    <span className="text-kb-body">{filePracticeTypeLabel[item.type]}</span>
                    <span className="rounded-[5px] bg-kb-surface px-2 py-0.5 tabular-nums text-kb-muted">
                      {item.count} 题
                    </span>
                  </div>
                ))}
              </div>
            </section>

            <section className="border-b border-divider px-4 py-3.5">
              <div className="mb-2.5 flex items-center gap-1.5 text-[11px] font-medium text-kb-muted">
                <BookOpen className="h-3.5 w-3.5 text-primary" />
                关于本资料
              </div>
              <div className="flex items-center gap-2.5">
                <KbFileTypeIcon type={file.type} fileName={file.name} size="sm" />
                <div className="min-w-0 flex-1 truncate text-[12px] font-medium leading-5 text-kb-heading">
                  {file.name}
                </div>
                <button
                  type="button"
                  onClick={openFileInNewWindow}
                  className="inline-flex shrink-0 items-center gap-1 text-[11px] font-medium text-primary transition-colors hover:text-primary/80"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  打开
                </button>
              </div>

              <div className="mt-3">
                <div className="mb-1.5 text-[10.5px] font-medium text-kb-muted">关键字</div>
                {(file.aiKeywords ?? file.tags ?? []).length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {(file.aiKeywords ?? file.tags ?? []).map((tag) => (
                      <span
                        key={tag}
                        className="rounded-[5px] bg-primary-soft/50 px-1.5 py-0.5 text-[10px] text-primary"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] leading-5 text-kb-muted">暂无关键字</p>
                )}
              </div>

              <div className="mt-3">
                <div className="mb-1.5 text-[10.5px] font-medium text-kb-muted">摘要</div>
                <p className="text-[11px] leading-5 text-kb-body">
                  {file.summary ?? "暂无资料摘要"}
                </p>
              </div>
            </section>

            <div className="mt-auto space-y-2 px-4 py-3.5">
              {savedAt && (
                <p className="text-center text-[10px] text-kb-muted">
                  上次暂存：{new Date(savedAt).toLocaleString("zh-CN")}
                </p>
              )}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={saveDraft}
                  className="inline-flex h-9 items-center justify-center gap-1.5 rounded-[8px] border border-primary/25 bg-white text-[11.5px] font-medium text-primary hover:bg-primary-soft/30"
                >
                  <Save className="h-3.5 w-3.5" />
                  暂存练习
                </button>
                <button
                  type="button"
                  onClick={submit}
                  className="inline-flex h-9 items-center justify-center gap-1.5 rounded-[8px] bg-primary text-[11.5px] font-medium text-primary-foreground hover:bg-primary/90 active:scale-[0.98]"
                >
                  <Send className="h-3.5 w-3.5" />
                  直接提交
                </button>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </PageShell>
  );
}

function InfoMetric({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="rounded-[8px] bg-white/14 px-2 py-2 text-center">
      <div className="truncate text-[15px] font-semibold">{value}</div>
      <div className="mt-0.5 text-[9.5px] text-white/75">{label}</div>
    </div>
  );
}

function MetaItem({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Target;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-1.5">
      <Icon className="mt-0.5 h-3 w-3 shrink-0 text-kb-muted" />
      <div className="min-w-0">
        <div className="text-[9.5px] text-kb-muted">{label}</div>
        <div className="mt-0.5 truncate text-[11px] font-medium text-kb-body">{value}</div>
      </div>
    </div>
  );
}

import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Circle,
  ClipboardList,
  FileText,
  PlayCircle,
  RotateCcw,
  Sparkles,
  Star,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  QUESTIONS,
  type LearnStatus,
  type Topic,
} from "@/lib/mock/data";
import { getTopicAdminById } from "@/lib/mock/topicAdmin";
import type { MockState } from "@/lib/mock/store";
import {
  getTopicDocsWithProgress,
  getTopicProgress,
} from "@/lib/mock/learning-progress";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  clearTopicPracticeDraft,
  countDraftAnswers,
  getTopicQuestions,
  hasTopicPracticeDraft,
  loadTopicPracticeDraft,
} from "@/lib/mock/topic-practice";
import { TopicPracticeSheet } from "@/components/learning/topic-practice-sheet";
import { listActionClass } from "@/components/learning/ui";

const TYPE_LABEL = {
  single: "单选",
  multiple: "多选",
  judge: "判断",
  text: "简答",
} as const;

const STATUS_STYLE: Record<LearnStatus, string> = {
  未学: "bg-muted text-muted-foreground",
  学习中: "bg-primary-soft text-accent-foreground",
  已学: "bg-success-soft text-success",
  需复习: "bg-warning-soft text-warning-foreground",
};

const STATUS_ICON: Record<LearnStatus, React.ReactNode> = {
  未学: <Circle className="h-3.5 w-3.5" />,
  学习中: <PlayCircle className="h-3.5 w-3.5" />,
  已学: <CheckCircle2 className="h-3.5 w-3.5" />,
  需复习: <Sparkles className="h-3.5 w-3.5" />,
};

/** 约 3 条资料高度 + 间距 */
const DOC_LIST_MAX_HEIGHT = "max-h-[min(20.5rem,42vh)]";

export function TopicDetailView({
  topic,
  state,
  onToggleFavorite,
  isFavorite,
}: {
  topic: Topic;
  state: MockState;
  onToggleFavorite: () => void;
  isFavorite: boolean;
}) {
  const [practiceOpen, setPracticeOpen] = useState(false);
  const [practiceTick, setPracticeTick] = useState(0);
  const [showRestartConfirm, setShowRestartConfirm] = useState(false);

  const meta = getTopicAdminById(topic.id);
  const docsWithProgress = getTopicDocsWithProgress(topic.id, state);
  const topicProgress = getTopicProgress(topic.id, state);

  const learnedCount = docsWithProgress.filter((d) => d.status === "已学").length;
  const nextDoc = docsWithProgress.find((d) => d.status !== "已学")?.doc ?? docsWithProgress[0]?.doc;

  const topicQuestions = useMemo(() => getTopicQuestions(topic), [topic]);
  const questionIds = useMemo(() => topicQuestions.map((q) => q.question.id), [topicQuestions]);

  const practiceDraft = useMemo(
    () => loadTopicPracticeDraft(topic.id),
    [topic.id, practiceTick],
  );
  const practiceAnswered = countDraftAnswers(practiceDraft, questionIds);
  const hasDraft = hasTopicPracticeDraft(topic.id);
  const practicePercent =
    questionIds.length > 0 ? Math.round((practiceAnswered / questionIds.length) * 100) : 0;

  const typeBreakdown = useMemo(() => {
    const map = new Map<string, number>();
    topicQuestions.forEach(({ question }) => {
      const label = TYPE_LABEL[question.type];
      map.set(label, (map.get(label) ?? 0) + 1);
    });
    return Array.from(map.entries());
  }, [topicQuestions]);

  const docQuestionSummary = useMemo(() => {
    return docsWithProgress.map(({ doc }) => ({
      doc,
      count: QUESTIONS.filter((q) => q.relatedDocId === doc.id).length,
    }));
  }, [docsWithProgress]);

  const knowledgePoints = meta?.knowledgePoints ?? [];

  const refreshPractice = () => setPracticeTick((n) => n + 1);

  return (
    <div className="space-y-5">
      {/* 顶部 */}
      <header className="overflow-hidden rounded-lg border border-border bg-card shadow-[var(--shadow-card)]">
        <div className={cn("h-1 w-full bg-gradient-to-r", topic.cover)} />
        <div className="p-5 sm:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start">
            <div
              className={cn(
                "grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-gradient-to-br text-white shadow-md",
                topic.cover,
              )}
            >
              <BookOpen className="h-7 w-7" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="rounded-md bg-primary-soft px-2 py-0.5 text-[10.5px] font-medium text-accent-foreground">
                  {meta?.specialty ?? topic.role} · {topic.role}岗位
                </span>
                {meta?.scenario && (
                  <span className="rounded-md border border-border px-2 py-0.5 text-[10.5px] text-muted-foreground">
                    {meta.scenario}
                  </span>
                )}
                {topicProgress >= 100 ? (
                  <span className="rounded-md bg-success-soft px-2 py-0.5 text-[10.5px] font-medium text-success">
                    已完成
                  </span>
                ) : topicProgress > 0 ? (
                  <span className="rounded-md bg-primary-soft px-2 py-0.5 text-[10.5px] font-medium text-primary">
                    学习中
                  </span>
                ) : null}
              </div>

              <h1 className="text-[22px] font-semibold tracking-tight text-foreground">{topic.title}</h1>
              <p className="mt-1.5 max-w-3xl text-[13px] leading-relaxed text-muted-foreground">
                {meta?.intro ?? topic.desc}
              </p>

              {meta?.learningGoal && (
                <p className="mt-2 text-[12.5px] text-foreground/80">
                  <span className="font-medium text-foreground">学习目标：</span>
                  {meta.learningGoal}
                </p>
              )}

              <div className="mt-4 grid grid-cols-3 gap-3 sm:max-w-lg">
                <HeaderStat icon={BookOpen} label="资料" value={`${docsWithProgress.length} 份`} />
                <HeaderStat icon={ClipboardList} label="题目" value={`${questionIds.length} 题`} />
                <HeaderStat icon={Users} label="适合岗位" value={topic.role} />
              </div>
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-4 border-t border-divider pt-5 sm:flex-row sm:items-center">
            <div className="min-w-0 flex-1">
              <div className="mb-1.5 flex items-center justify-between text-[11.5px] text-muted-foreground">
                <span>当前进度</span>
                <span className="tabular-nums">
                  {learnedCount}/{docsWithProgress.length} 资料 · {topicProgress}%
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-primary to-primary/70 transition-all"
                  style={{ width: `${topicProgress}%` }}
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2 sm:shrink-0">
              {nextDoc && (
                <Link
                  to="/learn/doc/$id"
                  params={{ id: nextDoc.id }}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-[12.5px] font-medium text-primary-foreground hover:bg-primary/90"
                >
                  <PlayCircle className="h-3.5 w-3.5" />
                  {topicProgress >= 100 ? "回顾资料" : "继续学习"}
                </Link>
              )}
              <button
                type="button"
                onClick={onToggleFavorite}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-lg border px-3.5 py-2 text-[12.5px] font-medium transition-colors",
                  isFavorite
                    ? "border-warning/40 bg-warning-soft text-warning-foreground"
                    : "border-border bg-background hover:border-primary/40",
                )}
              >
                <Star className={cn("h-3.5 w-3.5", isFavorite && "fill-current")} />
                {isFavorite ? "已收藏" : "收藏专题"}
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* 左侧 */}
        <div className="space-y-5 lg:col-span-2">
          <section className="rounded-lg border border-border bg-card p-5 shadow-[var(--shadow-card)]">
            <div className="mb-4 flex items-center justify-between gap-2">
              <h2 className="text-[15px] font-semibold text-foreground">资料清单</h2>
              <span className="text-[11.5px] text-muted-foreground">共 {docsWithProgress.length} 份</span>
            </div>

            <div className={cn("scrollbar-thin space-y-2.5 overflow-y-auto pr-0.5", DOC_LIST_MAX_HEIGHT)}>
              {docsWithProgress.map(({ doc, status }, index) => (
                <article
                  key={doc.id}
                  className="rounded-lg border border-border bg-background p-3.5 transition-colors hover:border-primary/30"
                >
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary-soft text-[12px] font-semibold text-primary">
                      {String(index + 1).padStart(2, "0")}
                    </div>
                    <div className="min-w-0 flex-1">
                      <Link
                        to="/learn/doc/$id"
                        params={{ id: doc.id }}
                        className="line-clamp-2 text-[13.5px] font-medium leading-snug hover:text-primary"
                      >
                        {doc.title}
                      </Link>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                        <span className="rounded bg-muted px-1.5 py-0.5">{doc.docType}</span>
                        <span>{doc.source}</span>
                      </div>
                      <p className="mt-1 line-clamp-1 text-[11px] text-muted-foreground/90">{doc.snippet}</p>
                    </div>
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px]",
                        STATUS_STYLE[status],
                      )}
                    >
                      {STATUS_ICON[status]}
                      {status}
                    </span>
                    <Link
                      to="/learn/doc/$id"
                      params={{ id: doc.id }}
                      className={listActionClass(status === "已学" ? "outline" : "primary")}
                    >
                      <BookOpen className="h-3.5 w-3.5" />
                      {status === "已学" ? "回顾" : status === "学习中" ? "继续" : "开始学习"}
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </article>
              ))}

              {docsWithProgress.length === 0 && (
                <div className="rounded-lg border border-dashed border-border py-10 text-center text-[13px] text-muted-foreground">
                  本专题暂无资料
                </div>
              )}
            </div>
          </section>

          {knowledgePoints.length > 0 && (
            <section className="rounded-lg border border-border bg-card p-5 shadow-[var(--shadow-card)]">
              <h2 className="mb-3 text-[15px] font-semibold text-foreground">重点知识点</h2>
              <div className="grid gap-2.5 sm:grid-cols-2">
                {knowledgePoints.map((kp, i) => (
                  <div
                    key={kp.id}
                    className="rounded-lg border border-divider bg-muted/15 px-3.5 py-3"
                  >
                    <div className="mb-1 flex items-center gap-2">
                      <span className="grid h-5 w-5 place-items-center rounded bg-primary-soft text-[10px] font-bold text-primary">
                        {i + 1}
                      </span>
                      <span className="text-[13px] font-medium text-foreground">{kp.title}</span>
                    </div>
                    <p className="line-clamp-2 text-[12px] leading-relaxed text-muted-foreground">
                      {kp.summary}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* 右侧 */}
        <aside className="space-y-4">
          <div className="rounded-lg border border-border bg-card p-5 shadow-[var(--shadow-card)]">
            <div className="mb-3 flex items-center gap-2 text-[13px] font-semibold text-foreground">
              <TrendingUp className="h-4 w-4 text-primary" />
              专题进度
            </div>
            <div className="space-y-2.5 text-[12.5px]">
              <ProgressRow label="完成度" value={`${topicProgress}%`} highlight />
              <ProgressRow label="已学资料" value={`${learnedCount} / ${docsWithProgress.length}`} />
              <ProgressRow label="关联题进度" value={`${practiceAnswered} / ${questionIds.length}`} />
            </div>
            <div className="mt-4 rounded-lg bg-primary-soft/60 p-3 text-[12px]">
              <div className="font-medium text-foreground">建议下一步</div>
              <div className="mt-1 text-muted-foreground">
                {nextDoc && topicProgress < 100
                  ? `继续学习《${nextDoc.title.length > 18 ? `${nextDoc.title.slice(0, 18)}…` : nextDoc.title}》`
                  : practiceAnswered < questionIds.length
                    ? "完成专题汇总练习，巩固所学内容"
                    : "资料与练习均已完成，可随时回顾"}
              </div>
            </div>
          </div>

          {questionIds.length > 0 && (
            <div className="flex min-h-[280px] flex-col rounded-lg border border-border bg-card p-5 shadow-[var(--shadow-card)]">
              <div className="mb-3 flex items-center gap-2 text-[13px] font-semibold text-foreground">
                <ClipboardList className="h-4 w-4 text-primary" />
                关联练习
              </div>

              <p className="text-[12px] leading-relaxed text-muted-foreground">
                汇总本专题全部 {questionIds.length} 道关联题，按资料分组在完整卷面中作答。支持暂存进度，下次继续。
              </p>

              <div className="mt-4 rounded-lg border border-divider bg-muted/15 p-3">
                <div className="mb-2 flex items-center justify-between text-[11.5px]">
                  <span className="text-muted-foreground">练习完成度</span>
                  <span className="font-semibold tabular-nums text-primary">{practicePercent}%</span>
                </div>
                <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${practicePercent}%` }}
                  />
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {typeBreakdown.map(([label, count]) => (
                    <span
                      key={label}
                      className="rounded-md border border-border bg-card px-2 py-0.5 text-[10.5px] text-muted-foreground"
                    >
                      {label} {count}
                    </span>
                  ))}
                </div>
              </div>

              <ul className="mt-3 flex-1 space-y-2 overflow-y-auto pr-0.5">
                {docQuestionSummary
                  .filter((d) => d.count > 0)
                  .map(({ doc, count }) => (
                    <li
                      key={doc.id}
                      className="flex items-center gap-2 rounded-md border border-divider/80 bg-background px-2.5 py-2 text-[11.5px]"
                    >
                      <FileText className="h-3.5 w-3.5 shrink-0 text-primary" />
                      <span className="min-w-0 flex-1 truncate text-foreground">{doc.title}</span>
                      <span className="shrink-0 tabular-nums text-muted-foreground">{count} 题</span>
                    </li>
                  ))}
              </ul>

              {practiceDraft?.savedAt && (
                <p className="mt-3 text-[11px] text-muted-foreground">
                  上次暂存：{new Date(practiceDraft.savedAt).toLocaleString("zh-CN", {
                    month: "numeric",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              )}

              <div className="mt-4 space-y-2">
                {hasDraft ? (
                  <button
                    type="button"
                    onClick={() => setPracticeOpen(true)}
                    className="inline-flex w-full items-center justify-center gap-1 rounded-lg bg-primary px-3 py-2.5 text-[12.5px] font-medium text-primary-foreground hover:bg-primary/90"
                  >
                    <Target className="h-3.5 w-3.5" />
                    继续练习（{practiceAnswered}/{questionIds.length}）
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setPracticeOpen(true)}
                    className="inline-flex w-full items-center justify-center gap-1 rounded-lg bg-primary px-3 py-2.5 text-[12.5px] font-medium text-primary-foreground hover:bg-primary/90"
                  >
                    <PlayCircle className="h-3.5 w-3.5" />
                    开始练习
                  </button>
                )}
                {hasDraft && (
                  <button
                    type="button"
                    onClick={() => setShowRestartConfirm(true)}
                    className="inline-flex w-full items-center justify-center gap-1 rounded-lg border border-border px-3 py-2 text-[12px] text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    重新练习
                  </button>
                )}
              </div>
            </div>
          )}
        </aside>
      </div>

      <TopicPracticeSheet
        topic={topic}
        open={practiceOpen}
        onOpenChange={setPracticeOpen}
        onSaved={refreshPractice}
      />

      <AlertDialog open={showRestartConfirm} onOpenChange={setShowRestartConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认重新练习？</AlertDialogTitle>
            <AlertDialogDescription>
              重新练习将清空当前专题的所有作答记录与暂存进度，此操作不可恢复。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                clearTopicPracticeDraft(topic.id);
                refreshPractice();
                setShowRestartConfirm(false);
                setPracticeOpen(true);
              }}
            >
              确认清空并开始
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div>
        <Link
          to="/learn"
          className="inline-flex items-center gap-1 text-[12.5px] text-muted-foreground hover:text-primary"
        >
          <ChevronLeft className="h-3.5 w-3.5" /> 返回专题列表
        </Link>
      </div>
    </div>
  );
}

function HeaderStat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof BookOpen;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/20 px-3 py-2">
      <span className="text-primary">
        <Icon className="h-3.5 w-3.5" />
      </span>
      <div className="min-w-0">
        <div className="text-[10.5px] text-muted-foreground">{label}</div>
        <div className="truncate text-[12.5px] font-semibold text-foreground">{value}</div>
      </div>
    </div>
  );
}

function ProgressRow({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn("font-semibold tabular-nums", highlight ? "text-primary" : "text-foreground")}>
        {value}
      </span>
    </div>
  );
}

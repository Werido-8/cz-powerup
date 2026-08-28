import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  BookOpen,
  ClipboardList,
  Layers,
  Lightbulb,
  PlayCircle,
  RotateCcw,
  Target,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CardBatchPager } from "@/components/learning/ui";
import { type Topic } from "@/lib/mock/data";
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
  getTopicPracticeSessionId,
  getTopicQuestions,
  loadTopicPracticeDraft,
  loadTopicPracticeLastScore,
} from "@/lib/mock/topic-practice";
import { MaterialList } from "@/components/learning/topic-material-list";

// ─── Design tokens ──────────────────────────────────────────────────────────
const C = {
  primary: "#1498A8",
  primaryDark: "#0D8FA0",
  primarySoft: "#EAF7F9",
  border: "#DCE8EA",
  divider: "#EDF3F5",
  text: "#102A43",
  textSub: "#1F3440",
  textMuted: "#607681",
  textWeak: "#91A3AA",
  bg: "#F5FAFB",
  shadow: "0 8px 24px rgba(31,52,64,0.04)",
} as const;

const cardBase =
  "rounded-[14px] border bg-white" as const;
const cardShadow = { boxShadow: C.shadow } as const;
const cardStyle = {
  borderColor: C.border,
  ...cardShadow,
} as const;

const KP_PAGE_SIZE = 4;

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
  const [showRestartConfirm, setShowRestartConfirm] = useState(false);
  const [kpPage, setKpPage] = useState(1);
  const navigate = useNavigate();

  const meta = getTopicAdminById(topic.id);
  const docsWithProgress = getTopicDocsWithProgress(topic.id, state);
  const topicProgress = getTopicProgress(topic.id, state);

  const topicQuestions = useMemo(() => getTopicQuestions(topic), [topic]);
  const questionIds = useMemo(() => topicQuestions.map((q) => q.question.id), [topicQuestions]);

  const practiceDraft = useMemo(
    () => loadTopicPracticeDraft(topic.id),
    [topic.id],
  );
  const practiceAnswered = countDraftAnswers(practiceDraft, questionIds);
  const hasDraft = practiceAnswered > 0;
  const lastScore = loadTopicPracticeLastScore(topic.id);

  const knowledgePoints = meta?.knowledgePoints ?? [];
  const kpTotalPages = Math.max(1, Math.ceil(knowledgePoints.length / KP_PAGE_SIZE));
  const safeKpPage = Math.min(kpPage, kpTotalPages);
  const kpStartIndex = (safeKpPage - 1) * KP_PAGE_SIZE;
  const pageKnowledgePoints = knowledgePoints.slice(kpStartIndex, kpStartIndex + KP_PAGE_SIZE);

  useEffect(() => {
    setKpPage(1);
  }, [topic.id, knowledgePoints.length]);

  useEffect(() => {
    if (kpPage > kpTotalPages) {
      setKpPage(kpTotalPages);
    }
  }, [kpPage, kpTotalPages]);
  const positionTags = meta?.positions ?? (topic.role ? [topic.role] : []);
  const isPublished = meta?.status === "已发布";
  const isLearning = topicProgress > 0 && topicProgress < 100;
  const isDone = topicProgress >= 100;

  const openTopicPractice = () => {
    navigate({
      to: "/training/session/$id",
      params: { id: getTopicPracticeSessionId(topic.id) },
      search: {
        mode: "practice",
        filter: "",
        count: questionIds.length,
        limit: 0,
        topicId: topic.id,
        title: topic.title,
      },
    });
  };

  // 专业/科目 fallback
  const specialty = meta?.specialty ?? topic.role ?? "—";

  return (
    <div className="flex min-h-0 flex-col gap-4">
      <div
        className={cn(cardBase, "relative overflow-hidden")}
        style={{
          ...cardStyle,
          background:
            "linear-gradient(128deg, rgba(234,247,249,0.55) 0%, rgba(255,255,255,0.96) 42%, #ffffff 100%)",
        }}
      >
        <div className="relative z-[1] flex flex-wrap items-start gap-4 px-5 py-4">
          <div
            className="grid h-11 w-11 shrink-0 place-items-center rounded-[12px]"
            style={{ background: `linear-gradient(135deg, ${C.primary} 0%, ${C.primaryDark} 100%)` }}
          >
            <BookOpen className="h-5 w-5 text-white" strokeWidth={1.75} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-[20px] font-bold leading-tight tracking-tight" style={{ color: C.text }}>
                {topic.title}
              </h1>
              {(isLearning || isDone) && (
                <span
                  className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium"
                  style={{ background: C.primarySoft, color: C.primary }}
                >
                  {isDone ? "已完成资料" : "学习中"}
                </span>
              )}
              {!isPublished && meta?.status && (
                <span
                  className="inline-flex items-center rounded-full border px-2 py-0.5 text-[11px]"
                  style={{ borderColor: C.border, color: C.textMuted }}
                >
                  {meta.status}
                </span>
              )}
            </div>
            <p className="mt-1.5 line-clamp-1 text-[13px] leading-5" style={{ color: "#425B66" }}>
              {meta?.intro ?? topic.desc}
            </p>
            {meta?.learningGoal ? (
              <p className="mt-1 line-clamp-1 text-[12.5px]" style={{ color: C.textMuted }}>
                <span className="font-medium" style={{ color: C.textSub }}>学习目标：</span>
                {meta.learningGoal}
              </p>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center gap-1.5 text-[11.5px]" style={{ color: C.textMuted }}>
            <span className="rounded-md bg-white/80 px-2 py-1 ring-1 ring-[#DCE8EA]">{specialty}</span>
            {positionTags.slice(0, 2).map((item) => (
              <span key={item} className="rounded-md bg-[#EAF7F9] px-2 py-1 text-[#1498A8]">
                {item}
              </span>
            ))}
            <span className="rounded-md bg-white/80 px-2 py-1 ring-1 ring-[#DCE8EA]">
              {docsWithProgress.length} 份资料
            </span>
            <span className="rounded-md bg-white/80 px-2 py-1 ring-1 ring-[#DCE8EA]">
              {questionIds.length} 题
            </span>
            <span className="rounded-md bg-white/80 px-2 py-1 ring-1 ring-[#DCE8EA]">
              {knowledgePoints.length} 个知识点
            </span>
          </div>
        </div>
      </div>

      {/* ── 下方主体区域 ── */}
      <div className="grid min-h-[640px] items-stretch gap-4" style={{ gridTemplateColumns: "1.45fr 0.55fr" }}>
        {/* 左：资料清单 */}
        <section className={cn(cardBase, "flex min-h-0 flex-col")} style={cardStyle}>
          {/* 卡片头 */}
          <div
            className="flex items-center gap-2.5 px-6 py-4"
            style={{ borderBottom: `1px solid ${C.divider}` }}
          >
            <span
              className="grid h-7 w-7 shrink-0 place-items-center rounded-lg"
              style={{ background: C.primarySoft, color: C.primary }}
            >
              <Layers className="h-4 w-4" />
            </span>
            <h2 className="text-[16px] font-semibold" style={{ color: C.textSub }}>
              资料清单
            </h2>
            <span className="ml-auto text-[12px]" style={{ color: C.textMuted }}>
              共 {docsWithProgress.length} 份
            </span>
          </div>

          {/* 列表内容（固定高度可滚动） */}
          <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto">
            <MaterialList items={docsWithProgress} />
          </div>
        </section>

        {/* 右：重点知识点 + 关联练习 */}
        <aside className="flex h-full min-h-0 flex-col gap-3">
          {/* 重点知识点 */}
          {knowledgePoints.length > 0 && (
            <section className={cn(cardBase, "flex shrink-0 flex-col")} style={cardStyle}>
              <div
                className="flex items-center gap-2 px-4 py-2.5"
                style={{ borderBottom: `1px solid ${C.divider}` }}
              >
                <span
                  className="grid h-6 w-6 shrink-0 place-items-center rounded-md"
                  style={{ background: C.primarySoft, color: C.primary }}
                >
                  <Lightbulb className="h-3.5 w-3.5" />
                </span>
                <h2 className="text-[15px] font-semibold" style={{ color: C.textSub }}>
                  重点知识点
                </h2>
                <span className="ml-auto text-[11.5px]" style={{ color: C.textMuted }}>
                  共 {knowledgePoints.length} 条
                </span>
              </div>
              <div
                key={safeKpPage}
                className="grid grid-cols-2 gap-2 p-3 animate-in fade-in duration-300"
              >
                {pageKnowledgePoints.map((kp, i) => (
                  <div
                    key={kp.id}
                    className="group rounded-lg px-2.5 py-2 transition-colors"
                    style={{
                      border: `1px solid ${C.border}`,
                      background: "#FAFCFD",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLDivElement).style.borderColor = C.primary + "55";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLDivElement).style.borderColor = C.border;
                    }}
                  >
                    <div className="mb-1 flex items-center gap-1.5">
                      <span
                        className="grid h-5 w-5 shrink-0 place-items-center rounded text-[10px] font-bold"
                        style={{ background: C.primarySoft, color: C.primary }}
                      >
                        {kpStartIndex + i + 1}
                      </span>
                      <span className="line-clamp-1 text-[13px] font-semibold" style={{ color: C.text }}>
                        {kp.title}
                      </span>
                    </div>
                    <p
                      className="line-clamp-1 text-[11px] leading-snug"
                      style={{ color: C.textMuted }}
                    >
                      {kp.summary}
                    </p>
                  </div>
                ))}
              </div>

              {kpTotalPages > 1 && (
                <CardBatchPager
                  page={safeKpPage}
                  totalPages={kpTotalPages}
                  totalItems={knowledgePoints.length}
                  pageSize={KP_PAGE_SIZE}
                  unitLabel="条"
                  onPageChange={setKpPage}
                  compact
                  className="px-3 pb-2.5"
                />
              )}
            </section>
          )}

          {questionIds.length > 0 && (
            <section
              className={cn(cardBase, "flex min-h-0 flex-1 flex-col")}
              style={cardStyle}
            >
              <div
                className="flex items-center gap-2 px-4 py-3"
                style={{ borderBottom: `1px solid ${C.divider}` }}
              >
                <span
                  className="grid h-7 w-7 shrink-0 place-items-center rounded-lg"
                  style={{ background: C.primarySoft, color: C.primary }}
                >
                  <ClipboardList className="h-4 w-4" />
                </span>
                <h2 className="text-[15px] font-semibold" style={{ color: C.textSub }}>
                  关联练习
                </h2>
                <span
                  className="ml-auto inline-flex items-center rounded-full px-2 py-0.5 text-[11.5px] font-medium"
                  style={{ background: C.primarySoft, color: C.primary }}
                >
                  {questionIds.length} 题
                </span>
              </div>

              <div className="flex min-h-0 flex-1 flex-col gap-4 px-4 py-4">
                <p className="text-[13px] leading-relaxed" style={{ color: C.textMuted }}>
                  学完资料后可用本题包自测。本次做完会给出正确率，作答结束即重置；上次分数会保留，不作为专题考核。
                  {hasDraft && practiceDraft?.savedAt && (
                    <span className="mt-1 block text-[11.5px] text-[#91A3AA]">
                      本次未完成，暂存于{" "}
                      {new Date(practiceDraft.savedAt).toLocaleString("zh-CN", {
                        month: "numeric",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  )}
                </p>

                <div
                  className="grid grid-cols-2 overflow-hidden rounded-xl"
                  style={{ border: `1px solid ${C.border}` }}
                >
                  <div
                    className="px-3.5 py-3"
                    style={{ borderRight: `1px solid ${C.divider}` }}
                  >
                    <div className="text-[11px]" style={{ color: C.textWeak }}>
                      上次正确率
                    </div>
                    <div className="mt-1 text-[18px] font-semibold tabular-nums" style={{ color: C.primary }}>
                      {lastScore ? `${lastScore.accuracy}%` : "—"}
                    </div>
                    <div className="mt-0.5 text-[10.5px]" style={{ color: C.textWeak }}>
                      {lastScore
                        ? `${lastScore.correct}/${lastScore.total} 题正确`
                        : "还没有完成记录"}
                    </div>
                  </div>
                  <div className="px-3.5 py-3">
                    <div className="text-[11px]" style={{ color: C.textWeak }}>
                      {hasDraft ? "本次已作答" : "本次练习"}
                    </div>
                    <div className="mt-1 text-[18px] font-semibold tabular-nums" style={{ color: C.text }}>
                      {hasDraft ? (
                        <>
                          {practiceAnswered}
                          <span className="text-[12px] font-medium text-[#91A3AA]">
                            {" "}/ {questionIds.length}
                          </span>
                        </>
                      ) : (
                        <span className="text-[15px] font-medium" style={{ color: C.textMuted }}>
                          未开始
                        </span>
                      )}
                    </div>
                    <div className="mt-0.5 text-[10.5px]" style={{ color: C.textWeak }}>
                      做完后重置，仅展示本次结果
                    </div>
                  </div>
                </div>

                <div className="mt-auto space-y-2">
                  <button
                    type="button"
                    onClick={openTopicPractice}
                    className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-full py-2.5 text-[13px] font-medium text-white shadow-sm transition-colors"
                    style={{ background: C.primary }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = C.primaryDark; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = C.primary; }}
                  >
                    {hasDraft ? (
                      <>
                        <span className="grid h-5 w-5 place-items-center rounded-full bg-white/20">
                          <Target className="h-3.5 w-3.5" />
                        </span>
                        继续练习
                      </>
                    ) : (
                      <>
                        <span className="grid h-5 w-5 place-items-center rounded-full bg-white/20">
                          <PlayCircle className="h-3.5 w-3.5" />
                        </span>
                        开始练习
                      </>
                    )}
                  </button>

                  {hasDraft && (
                    <button
                      type="button"
                      onClick={() => setShowRestartConfirm(true)}
                      className="flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-full border py-2 text-[12px] transition-colors"
                      style={{ borderColor: C.border, color: C.textMuted, background: "transparent" }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = C.primarySoft; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      重新练习
                    </button>
                  )}
                </div>
              </div>
            </section>
          )}
        </aside>
      </div>

      <AlertDialog open={showRestartConfirm} onOpenChange={setShowRestartConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>再练一次？</AlertDialogTitle>
            <AlertDialogDescription>
              将清空本次未提交的作答。上次正确率会保留，专题学习进度不会按本次成绩考核。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                clearTopicPracticeDraft(topic.id);
                setShowRestartConfirm(false);
                openTopicPractice();
              }}
            >
              确认清空并开始
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  BookOpen,
  Briefcase,
  ClipboardList,
  FileText,
  GraduationCap,
  Layers,
  Lightbulb,
  PlayCircle,
  RotateCcw,
  Star,
  Target,
  Users,
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
  const practicePercent =
    questionIds.length > 0 ? Math.round((practiceAnswered / questionIds.length) * 100) : 0;

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
  const scenario = meta?.scenario ?? "—";

  return (
    <div className="space-y-5">
      {/* ── 顶部一体化卡片 ── */}
      <div
        className={cn(cardBase, "relative overflow-hidden")}
        style={{
          ...cardStyle,
          background:
            "linear-gradient(128deg, rgba(234,247,249,0.72) 0%, rgba(234,247,249,0.28) 36%, #ffffff 68%, #ffffff 100%)",
        }}
      >
        <TopicHeroCardDecor />
        <div className="relative z-[1] grid grid-cols-[1fr_1fr]">
          {/* 左：专题简介 */}
          <div
            className="relative flex flex-col p-6"
          >
            <div
              className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary-soft/35 via-primary-soft/10 to-transparent"
              aria-hidden
            />
            <div className="relative z-[1]">
            {/* 图标 + 标签 + 标题 */}
            <div className="flex gap-4">
              <div
                className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[14px]"
                style={{ background: `linear-gradient(135deg, ${C.primary} 0%, ${C.primaryDark} 100%)` }}
              >
                <BookOpen className="h-7 w-7 text-white" strokeWidth={1.75} />
              </div>

              <div className="min-w-0 flex-1">
                <div className="mb-2 flex flex-wrap items-center gap-1.5">
                  {(isLearning || isDone) && (
                    <span
                      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[12px] font-medium"
                      style={{ background: C.primarySoft, color: C.primary }}
                    >
                      {isDone ? "已完成" : "学习中"}
                    </span>
                  )}

                  {!isPublished && meta?.status && (
                    <span
                      className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-[12px]"
                      style={{ borderColor: C.border, color: C.textMuted }}
                    >
                      {meta.status}
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <h1
                    className="text-[30px] font-bold leading-tight tracking-tight"
                    style={{ color: C.text }}
                  >
                    {topic.title}
                  </h1>

                </div>
              </div>
            </div>

            <p className="mt-4 text-[14px] leading-[1.7]" style={{ color: "#425B66" }}>
              {meta?.intro ?? topic.desc}
            </p>

            {meta?.learningGoal && (
              <p className="mt-3.5 text-[14px] leading-[1.7]" style={{ color: C.textSub }}>
                <span className="font-semibold" style={{ color: C.textSub }}>学习目标：</span>
                {meta.learningGoal}
              </p>
            )}
            </div>
          </div>

          {/* 右：学习概况 */}
          <div className="relative flex flex-col justify-center p-6">
            <div
              className="pointer-events-none absolute inset-0 bg-gradient-to-bl from-primary-soft/20 via-transparent to-transparent"
              aria-hidden
            />
            <div className="relative z-[1]">
            <div className="flex min-h-0 flex-1 items-center">
              <div
                className="min-w-0 flex-1 overflow-hidden rounded-xl"
              >
                <MetaGrid
                  specialty={specialty}
                  scenario={scenario}
                  positions={positionTags}
                  docCount={docsWithProgress.length}
                  questionCount={questionIds.length}
                  knowledgeCount={knowledgePoints.length}
                />
              </div>
            </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 下方主体区域 ── */}
      <div className="grid items-stretch gap-5" style={{ gridTemplateColumns: "1fr 0.58fr" }}>
        {/* 左：资料清单 */}
        <section className={cn(cardBase, "flex h-full min-h-0 flex-col")} style={cardStyle}>
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
          <div
            className="scrollbar-thin flex-1 overflow-y-auto"
            style={{ maxHeight: "calc(5 * 76px + 0.5rem)" }}
          >
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
                  学完资料后，用本专题关联题检验掌握程度。
                  {hasDraft && practiceDraft?.savedAt && (
                    <span className="mt-1 block text-[11.5px] text-[#91A3AA]">
                      上次暂存于{" "}
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
                      已作答
                    </div>
                    <div className="mt-1 text-[18px] font-semibold tabular-nums" style={{ color: C.text }}>
                      {practiceAnswered}
                      <span className="text-[12px] font-medium text-[#91A3AA]">
                        {" "}/ {questionIds.length}
                      </span>
                    </div>
                  </div>
                  <div className="px-3.5 py-3">
                    <div className="text-[11px]" style={{ color: C.textWeak }}>
                      完成度
                    </div>
                    <div className="mt-1 text-[18px] font-semibold tabular-nums" style={{ color: C.primary }}>
                      {practicePercent}%
                    </div>
                  </div>
                </div>

                <div>
                  <div
                    className="h-1.5 overflow-hidden rounded-full"
                    style={{ background: "#EDF3F5" }}
                  >
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{ width: `${practicePercent}%`, background: C.primary }}
                    />
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

// ─── 顶部一体化卡片背景装饰 ───────────────────────────────────────────────
function TopicHeroCardDecor() {
  return (
    <>
      {/* 顶部整体光晕 */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-primary-soft/45 to-transparent"
        aria-hidden
      />

      {/* 左侧大光斑 */}
      <div
        className="pointer-events-none absolute -left-10 top-1/2 h-52 w-52 -translate-y-1/2 rounded-full bg-primary/[0.08]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute left-8 bottom-2 h-28 w-28 rounded-full bg-primary/[0.05]"
        aria-hidden
      />

      {/* 右侧光斑（对齐概览卡 StatCardDecor，尺度放大） */}
      <div
        className="pointer-events-none absolute -right-8 -top-10 h-40 w-40 rounded-full bg-primary/[0.1]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute right-20 top-8 h-24 w-24 rounded-full bg-primary/[0.06]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute right-6 top-24 h-14 w-14 rounded-full bg-primary/[0.04]"
        aria-hidden
      />

      {/* 左下书本线稿 */}
      <svg
        className="pointer-events-none absolute bottom-3 left-6 h-24 w-24 text-primary/[0.07]"
        viewBox="0 0 96 96"
        fill="none"
        aria-hidden
      >
        <path
          d="M22 24h34a5 5 0 015 5v38a5 5 0 01-5 5H22a5 5 0 01-5-5V29a5 5 0 015-5z"
          stroke="currentColor"
          strokeWidth="1.4"
        />
        <path d="M56 24v48h10a5 5 0 005-5V29a5 5 0 00-5-5h-10" stroke="currentColor" strokeWidth="1.4" />
        <path d="M30 36h20M30 46h16M30 56h12" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
      </svg>

      {/* 右下同心圆线稿 */}
      <svg
        className="pointer-events-none absolute bottom-0 right-0 h-32 w-32 text-primary/[0.08]"
        viewBox="0 0 96 96"
        fill="none"
        aria-hidden
      >
        <circle cx="72" cy="72" r="26" stroke="currentColor" strokeWidth="1.2" />
        <circle cx="72" cy="72" r="16" stroke="currentColor" strokeWidth="0.9" strokeDasharray="3 3" />
        <circle cx="72" cy="72" r="6" stroke="currentColor" strokeWidth="0.8" />
      </svg>

      {/* 右上弧线装饰 */}
      <svg
        className="pointer-events-none absolute -right-2 top-4 h-20 w-20 text-primary/[0.06]"
        viewBox="0 0 80 80"
        fill="none"
        aria-hidden
      >
        <path
          d="M8 56a36 36 0 0136-36"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinecap="round"
        />
        <path
          d="M20 56a24 24 0 0124-24"
          stroke="currentColor"
          strokeWidth="0.9"
          strokeLinecap="round"
          strokeDasharray="3 3"
        />
      </svg>
    </>
  );
}

// ─── 元数据栅格（2×3，带网格线） ───────────────────────────────────────────
const META_ITEMS = [
  { key: "specialty", label: "所属专业", icon: <GraduationCap className="h-4 w-4" /> },
  { key: "scenario", label: "业务科目", icon: <Briefcase className="h-4 w-4" /> },
  { key: "positions", label: "适用岗位", icon: <Users className="h-4 w-4" /> },
  { key: "doc", label: "资料", icon: <FileText className="h-4 w-4" /> },
  { key: "question", label: "题目", icon: <ClipboardList className="h-4 w-4" /> },
  { key: "knowledge", label: "知识点", icon: <Lightbulb className="h-4 w-4" /> },
] as const;

function MetaGrid({
  specialty,
  scenario,
  positions,
  docCount,
  questionCount,
  knowledgeCount,
}: {
  specialty: string;
  scenario: string;
  positions: string[];
  docCount: number;
  questionCount: number;
  knowledgeCount: number;
}) {
  const values: Record<string, React.ReactNode> = {
    specialty,
    scenario,
    positions: (
      <div className="flex flex-wrap gap-1">
        {positions.length > 0
          ? positions.map((p) => (
              <span
                key={p}
                className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium"
                style={{ background: "#EAF7F9", color: "#1498A8" }}
              >
                {p}
              </span>
            ))
          : <span style={{ color: "#91A3AA" }}>—</span>
        }
      </div>
    ),
    doc: `${docCount} 节`,
    question: `${questionCount} 题`,
    knowledge: `${knowledgeCount} 条`,
  };

  return (
    <div className="grid h-full grid-cols-2">
      {META_ITEMS.map((item, i) => {
        const isRightCol = i % 2 === 1;
        const isLastRow = i >= META_ITEMS.length - 2;

        return (
          <div
            key={item.key}
            className="flex items-center gap-3 px-3.5 py-3"
            style={{
              borderBottom: !isLastRow ? `1px solid #EDF3F5` : undefined,
              borderLeft: isRightCol ? `1px solid #EDF3F5` : undefined,
            }}
          >
            {/* 图标框 */}
            <div
              className="grid h-8 w-8 shrink-0 place-items-center rounded-lg"
              style={{ background: "#EAF7F9", color: "#1498A8" }}
            >
              {item.icon}
            </div>
            {/* 标签 + 值 */}
            <div className="min-w-0 flex-1">
              <div className="text-[11px]" style={{ color: "#91A3AA" }}>
                {item.label}
              </div>
              <div className="mt-0.5 text-[13px] font-semibold" style={{ color: "#1F3440" }}>
                {typeof values[item.key] === "string" ? (
                  <span className="line-clamp-1">{values[item.key]}</span>
                ) : (
                  values[item.key]
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import {
  ChevronRight,
  ChevronLeft,
  ClipboardList,
  Sparkles,
  Star,
  Target,
  PlayCircle,
  CheckCircle2,
  Circle,
  Clock,
  Users,
  BookOpen,
  MessageSquareText,
  StickyNote,
  TrendingUp,
} from "lucide-react";
import { PageShell } from "@/components/workbench/PageShell";
import { TOPICS, QUESTIONS, type LearnStatus } from "@/lib/mock/data";
import { useMockStore } from "@/lib/mock/store";
import {
  getTopicProgress,
  getTopicDocsWithProgress,
  getDocPracticeSessionId,
} from "@/lib/mock/learning-progress";
import { toast } from "sonner";

export const Route = createFileRoute("/learn/topic/$id")({
  loader: ({ params }) => {
    const topic = TOPICS.find((t) => t.id === params.id);
    if (!topic) throw notFound();
    return { topic };
  },
  component: TopicPage,
  notFoundComponent: () => (
    <PageShell>
      <div className="rounded-lg border border-border bg-card p-10 text-center text-muted-foreground">
        未找到该专题,
        <Link to="/learn" className="ml-1 text-primary hover:underline">
          返回专题列表
        </Link>
      </div>
    </PageShell>
  ),
  errorComponent: ({ error }) => (
    <PageShell>
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-destructive">
        载入出错: {error.message}
      </div>
    </PageShell>
  ),
});

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

function TopicPage() {
  const { topic } = Route.useLoaderData();
  const { state, toggleFavorite } = useMockStore();
  const docsWithProgress = getTopicDocsWithProgress(topic.id, state);
  const topicProgress = getTopicProgress(topic.id, state);
  const fav = state.favorites.includes(`topic:${topic.id}`);

  const learnedCount = docsWithProgress.filter((d) => d.status === "已学").length;
  const inProgressCount = docsWithProgress.filter((d) => d.status === "学习中").length;
  const estimatedMin = docsWithProgress.length * 8;
  const nextDoc = docsWithProgress.find((d) => d.status !== "已学")?.doc ?? docsWithProgress[0]?.doc;

  const relatedQ = QUESTIONS.filter((q) =>
    topic.docIds.some((id) => q.relatedDocId === id),
  );
  const kpSet = new Set<string>();
  relatedQ.forEach((q) => q.knowledgePoints.forEach((k) => kpSet.add(k)));
  const knowledgePoints = Array.from(kpSet).slice(0, 8);

  const totalQuestions = relatedQ.length;
  const answeredQuestions = docsWithProgress.reduce((n, d) => n + d.answeredCount, 0);

  const recentNotes = state.notes
    .filter((n) => n.docId && topic.docIds.includes(n.docId))
    .slice(0, 3);

  const suggestedQuestions = [
    `${topic.title}的核心要点有哪些?`,
    `${topic.title}中常见易错点是什么?`,
  ];

  return (
    <PageShell>
      {/* Breadcrumb */}
      <nav className="mb-4 flex items-center gap-1 text-[12px] text-muted-foreground">
        <Link to="/learn" className="hover:text-primary">
          知识学习
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="hover:text-primary">专题学习</span>
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground">{topic.title}</span>
      </nav>

      {/* Header */}
      <div className="mb-6 rounded-lg border border-border bg-card p-6 shadow-[var(--shadow-card)]">
        <div className="flex flex-wrap items-start gap-5">
          <div
            className={`grid h-14 w-14 shrink-0 place-items-center rounded-lg bg-gradient-to-br ${topic.cover} text-white shadow-md`}
          >
            <BookOpen className="h-7 w-7" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <span className="rounded-md bg-primary-soft px-2 py-0.5 text-[10.5px] font-medium text-accent-foreground">
                {topic.role} 岗位
              </span>
              <span className="rounded-md border border-border bg-background px-2 py-0.5 text-[10.5px] text-muted-foreground">
                难度 · 入门
              </span>
              {topicProgress > 0 && topicProgress < 100 && (
                <span className="rounded-md bg-primary-soft px-2 py-0.5 text-[10.5px] font-medium text-accent-foreground">
                  学习中
                </span>
              )}
            </div>
            <h1 className="text-[22px] font-semibold tracking-tight">{topic.title}</h1>
            <p className="mt-1.5 max-w-3xl text-[13px] text-muted-foreground">{topic.desc}</p>
            <div className="mt-4 grid grid-cols-2 gap-4 text-[12px] sm:grid-cols-4">
              <Stat icon={<BookOpen className="h-3.5 w-3.5" />} label="资料" value={`${docsWithProgress.length} 份`} />
              <Stat icon={<ClipboardList className="h-3.5 w-3.5" />} label="题目" value={`${totalQuestions} 题`} />
              <Stat icon={<Clock className="h-3.5 w-3.5" />} label="预计时长" value={`${estimatedMin} 分钟`} />
              <Stat icon={<Users className="h-3.5 w-3.5" />} label="适合岗位" value={topic.role} />
            </div>
          </div>
        </div>

        {/* Progress + actions */}
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <div className="min-w-[200px] flex-1">
            <div className="mb-1.5 flex items-center justify-between text-[11.5px] text-muted-foreground">
              <span>当前进度</span>
              <span>
                {learnedCount}/{docsWithProgress.length} 资料 · {topicProgress}%
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary to-primary/70"
                style={{ width: `${topicProgress}%` }}
              />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {nextDoc && (
              <Link
                to="/learn/doc/$id"
                params={{ id: nextDoc.id }}
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-[12.5px] font-medium text-primary-foreground hover:bg-primary/90"
              >
                <PlayCircle className="h-3.5 w-3.5" /> 继续学习
              </Link>
            )}
            {nextDoc && totalQuestions > 0 && (
              <Link
                to="/training/session/$id"
                params={{ id: getDocPracticeSessionId(nextDoc.id) }}
                search={{ mode: "practice", docId: nextDoc.id, topicId: topic.id, filter: "", count: 0, limit: 0 }}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3.5 py-2 text-[12.5px] font-medium hover:border-primary/40"
              >
                <Target className="h-3.5 w-3.5" /> 关联练习 ({answeredQuestions}/{totalQuestions})
              </Link>
            )}
            <button
              onClick={() => {
                toggleFavorite(`topic:${topic.id}`);
                toast.success(fav ? "已取消收藏" : "已收藏到个人沉淀");
              }}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3.5 py-2 text-[12.5px] font-medium transition-colors ${
                fav
                  ? "border-warning/40 bg-warning-soft text-warning-foreground"
                  : "border-border bg-background hover:border-primary/40"
              }`}
            >
              <Star className={`h-3.5 w-3.5 ${fav ? "fill-current" : ""}`} />
              {fav ? "已收藏" : "收藏专题"}
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* LEFT MAIN */}
        <div className="space-y-6 lg:col-span-2">
          {/* Doc list */}
          <section className="rounded-lg border border-border bg-card p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-[15px] font-semibold">资料清单</h2>
              <span className="text-[11.5px] text-muted-foreground">共 {docsWithProgress.length} 份 · 题目跟文档走</span>
            </div>
            <div className="space-y-2.5">
              {docsWithProgress.map(({ doc: d, status, questionCount, answeredCount }, i) => (
                <div
                  key={d.id}
                  className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-background p-3.5 transition-all hover:border-primary/40 hover:shadow-[var(--shadow-card)]"
                >
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary-soft text-[12px] font-semibold text-accent-foreground">
                    {String(i + 1).padStart(2, "0")}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13.5px] font-medium">{d.title}</div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                      <span className="rounded bg-muted px-1.5 py-0.5">{d.docType}</span>
                      <span>· {d.source}</span>
                      <span>· 关联题 {questionCount}{questionCount > 0 ? `（已答 ${answeredCount}）` : ""}</span>
                    </div>
                  </div>
                  <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] ${STATUS_STYLE[status as LearnStatus] ?? STATUS_STYLE["未学"]}`}>
                    {STATUS_ICON[status as LearnStatus] ?? STATUS_ICON["未学"]}
                    {status}
                  </span>
                  <Link
                    to="/learn/doc/$id"
                    params={{ id: d.id }}
                    className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-[12px] font-medium text-primary-foreground hover:bg-primary/90"
                  >
                    {status === "已学" ? "回顾" : status === "学习中" ? "继续" : "开始学习"}
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              ))}
              {docsWithProgress.length === 0 && (
                <div className="rounded-lg border border-dashed border-border p-6 text-center text-[12.5px] text-muted-foreground">
                  本专题暂无资料
                </div>
              )}
            </div>
          </section>

          {/* Knowledge points */}
          {knowledgePoints.length > 0 && (
            <section className="rounded-lg border border-border bg-card p-5">
              <h2 className="mb-3 text-[15px] font-semibold">重点知识点</h2>
              <div className="flex flex-wrap gap-2">
                {knowledgePoints.map((k) => (
                  <span
                    key={k}
                    className="rounded-full border border-primary/30 bg-primary-soft px-3 py-1 text-[12px] text-accent-foreground"
                  >
                    {k}
                  </span>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* RIGHT SIDEBAR */}
        <aside className="space-y-4">
          {/* Progress card */}
          <div className="rounded-lg border border-border bg-card p-5">
            <div className="mb-3 flex items-center gap-2 text-[13px] font-semibold">
              <TrendingUp className="h-4 w-4 text-primary" /> 专题进度
            </div>
            <div className="space-y-2.5 text-[12.5px]">
              <ProgressRow label="完成度" value={`${topicProgress}%`} highlight />
              <ProgressRow label="已学资料" value={`${learnedCount} / ${docsWithProgress.length}`} />
              <ProgressRow label="学习中" value={`${inProgressCount}`} />
              <ProgressRow label="关联题进度" value={`${answeredQuestions} / ${totalQuestions}`} />
            </div>
            <div className="mt-4 rounded-lg bg-primary-soft p-3 text-[12px] text-accent-foreground">
              <div className="font-medium">建议下一步</div>
              <div className="mt-1 text-foreground/80">
                {nextDoc ? `继续学习《${nextDoc.title}》` : "全部资料已学完,建议进入题库训练"}
              </div>
            </div>
          </div>

          {/* Related training */}
          <div className="rounded-lg border border-border bg-card p-5">
            <div className="mb-2 flex items-center gap-2 text-[13px] font-semibold">
              <ClipboardList className="h-4 w-4 text-primary" /> 关联题库
            </div>
            <p className="text-[12px] text-muted-foreground">
              本专题已准备 {topic.questionCount} 道题,涵盖单选、多选、判断与简答。
            </p>
            {knowledgePoints.length > 0 && (
              <div className="mt-2 text-[11.5px] text-muted-foreground">
                高频知识点:{knowledgePoints.slice(0, 4).join(" · ")}
              </div>
            )}
            <Link
              to="/training/practice"
              search={{
                filters:
                  topic.id === "t-agc"
                    ? "AGC"
                    : topic.id === "t-op"
                      ? "主变停役"
                      : topic.id === "t-fault"
                        ? "差动保护"
                        : topic.id === "t-newbie"
                          ? "厂站规程"
                          : undefined,
              }}
              className="mt-3 inline-flex w-full items-center justify-center gap-1 rounded-lg bg-primary px-3 py-2 text-[12.5px] font-medium text-primary-foreground hover:bg-primary/90"
            >
              开始专项练习 <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {/* 本期暂不开放：智能问答
          <div className="rounded-lg border border-border bg-card p-5">
            <div className="mb-2 flex items-center gap-2 text-[13px] font-semibold">
              <MessageSquareText className="h-4 w-4 text-primary" /> 相关问答
            </div>
            <div className="space-y-2">
              {suggestedQuestions.map((q) => (
                <Link
                  key={q}
                  to="/chat"
                  search={{ prefill: q }}
                  className="block rounded-lg border border-border bg-background p-2.5 text-[12px] hover:border-primary/40"
                >
                  {q} →
                </Link>
              ))}
            </div>
          </div>
          */}

          {/* Recent notes */}
          <div className="rounded-lg border border-border bg-card p-5">
            <div className="mb-2 flex items-center gap-2 text-[13px] font-semibold">
              <StickyNote className="h-4 w-4 text-primary" /> 最近笔记
            </div>
            {recentNotes.length > 0 ? (
              <div className="space-y-2">
                {recentNotes.map((n) => (
                  <div key={n.id} className="rounded-lg border border-border bg-background p-2.5">
                    <div className="truncate text-[12.5px] font-medium">{n.title}</div>
                    <div className="mt-0.5 line-clamp-2 text-[11.5px] text-muted-foreground">{n.body}</div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[12px] text-muted-foreground">
                还没有相关笔记,阅读资料时可随时记录。
              </p>
            )}
            <Link
              to="/assets"
              className="mt-3 inline-flex items-center gap-1 text-[12px] text-primary hover:underline"
            >
              查看全部笔记 <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
        </aside>
      </div>

      {/* Back link */}
      <div className="mt-6">
        <Link
          to="/learn"
          className="inline-flex items-center gap-1 text-[12.5px] text-muted-foreground hover:text-primary"
        >
          <ChevronLeft className="h-3.5 w-3.5" /> 返回专题列表
        </Link>
      </div>
    </PageShell>
  );
}

function Stat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2">
      <span className="text-primary">{icon}</span>
      <div className="min-w-0">
        <div className="text-[10.5px] text-muted-foreground">{label}</div>
        <div className="truncate text-[12.5px] font-semibold">{value}</div>
      </div>
    </div>
  );
}

function ProgressRow({
  label,
  value,
  highlight,
  warn,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  warn?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span
        className={`font-semibold ${
          highlight ? "text-primary" : warn ? "text-warning-foreground" : "text-foreground"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

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
import { TOPICS, DOCS, QUESTIONS, type LearnStatus } from "@/lib/mock/data";
import { useMockStore } from "@/lib/mock/store";
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
  const docs = DOCS.filter((d) => topic.docIds.includes(d.id));
  const fav = state.favorites.includes(`topic:${topic.id}`);

  // Derived stats
  const learnedCount = docs.filter((d) => d.status === "已学").length;
  const reviewCount = docs.filter((d) => d.status === "需复习").length;
  const inProgressCount = docs.filter((d) => d.status === "学习中").length;
  const estimatedMin = docs.length * 8;

  // Continue learning target = first non-学过 doc
  const nextDoc = docs.find((d) => d.status !== "已学") ?? docs[0];

  // Related questions
  const relatedQ = QUESTIONS.filter((q) =>
    docs.some((d) => d.id === q.relatedDocId),
  );
  const kpSet = new Set<string>();
  relatedQ.forEach((q) => q.knowledgePoints.forEach((k) => kpSet.add(k)));
  const knowledgePoints = Array.from(kpSet).slice(0, 8);

  // Learning path steps (derived from docType buckets)
  const stepDefs = [
    {
      key: "基础",
      title: "Step 1 · 基础概念",
      desc: "理解专题相关的术语、范围与目标",
      types: ["规程标准"],
    },
    {
      key: "依据",
      title: "Step 2 · 规程依据",
      desc: "掌握规程、细则与厂站规定的关键条款",
      types: ["两细则/考核", "厂站资料"],
    },
    {
      key: "案例",
      title: "Step 3 · 典型操作 / 案例",
      desc: "通过标准化操作和复盘案例巩固应用",
      types: ["典型操作", "故障处置", "历史案例", "厂家SOP"],
    },
  ];
  const steps = stepDefs.map((s) => {
    const items = docs.filter((d) => s.types.includes(d.docType));
    const done = items.filter((d) => d.status === "已学").length;
    const status: "未开始" | "进行中" | "已完成" =
      items.length === 0
        ? "未开始"
        : done === items.length
        ? "已完成"
        : done > 0 || items.some((d) => d.status === "学习中")
        ? "进行中"
        : "未开始";
    return { ...s, items, done, status };
  });
  const trainStep = {
    key: "训练",
    title: "Step 4 · 题库训练",
    desc: `${topic.questionCount} 道题,巩固重点知识点`,
    items: [],
    done: 0,
    status: "未开始" as const,
  };

  // Recent notes for docs in topic
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
              {topic.progress > 0 && topic.progress < 100 && (
                <span className="rounded-md bg-primary-soft px-2 py-0.5 text-[10.5px] font-medium text-accent-foreground">
                  学习中
                </span>
              )}
            </div>
            <h1 className="text-[22px] font-semibold tracking-tight">{topic.title}</h1>
            <p className="mt-1.5 max-w-3xl text-[13px] text-muted-foreground">{topic.desc}</p>
            <div className="mt-4 grid grid-cols-2 gap-4 text-[12px] sm:grid-cols-4">
              <Stat icon={<BookOpen className="h-3.5 w-3.5" />} label="资料" value={`${docs.length} 份`} />
              <Stat icon={<ClipboardList className="h-3.5 w-3.5" />} label="题目" value={`${topic.questionCount} 题`} />
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
                {learnedCount}/{docs.length} 资料 · {topic.progress}%
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary to-primary/70"
                style={{ width: `${topic.progress}%` }}
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
            <Link
              to="/training/practice"
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3.5 py-2 text-[12.5px] font-medium hover:border-primary/40"
            >
              <Target className="h-3.5 w-3.5" /> 开始专题训练
            </Link>
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
          {/* Learning path */}
          <section className="rounded-lg border border-border bg-card p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-[15px] font-semibold">学习路径</h2>
              <span className="text-[11.5px] text-muted-foreground">按顺序推进,逐步形成完整知识链路</span>
            </div>
            <ol className="relative space-y-3 border-l border-dashed border-border pl-6">
              {[...steps, trainStep].map((s, i) => (
                <li key={s.key} className="relative">
                  <span
                    className={`absolute -left-[31px] grid h-6 w-6 place-items-center rounded-full text-[11px] font-semibold ${
                      s.status === "已完成"
                        ? "bg-success text-success-foreground"
                        : s.status === "进行中"
                        ? "bg-primary text-primary-foreground"
                        : "border border-border bg-background text-muted-foreground"
                    }`}
                  >
                    {i + 1}
                  </span>
                  <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-background p-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-[13.5px] font-semibold">{s.title}</h3>
                        <span
                          className={`rounded-md px-1.5 py-0.5 text-[10.5px] ${
                            s.status === "已完成"
                              ? "bg-success-soft text-success"
                              : s.status === "进行中"
                              ? "bg-primary-soft text-accent-foreground"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {s.status}
                        </span>
                      </div>
                      <p className="mt-0.5 text-[12px] text-muted-foreground">{s.desc}</p>
                      {s.items.length > 0 && (
                        <div className="mt-1.5 text-[11.5px] text-muted-foreground">
                          资料 {s.items.length} · 已完成 {s.done}
                        </div>
                      )}
                    </div>
                    {s.key === "训练" ? (
                      <Link
                        to="/training/practice"
                        className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-[12px] font-medium text-primary-foreground hover:bg-primary/90"
                      >
                        开始训练 <ChevronRight className="h-3.5 w-3.5" />
                      </Link>
                    ) : s.items[0] ? (
                      <Link
                        to="/learn/doc/$id"
                        params={{ id: s.items[0].id }}
                        className="inline-flex items-center gap-1 rounded-lg border border-border bg-card px-3 py-1.5 text-[12px] font-medium hover:border-primary/40"
                      >
                        {s.status === "进行中" ? "继续" : "开始本步骤"}
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Link>
                    ) : (
                      <span className="text-[11.5px] text-muted-foreground">暂无资料</span>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </section>

          {/* Doc list */}
          <section className="rounded-lg border border-border bg-card p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-[15px] font-semibold">资料清单</h2>
              <span className="text-[11.5px] text-muted-foreground">共 {docs.length} 份</span>
            </div>
            <div className="space-y-2.5">
              {docs.map((d, i) => (
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
                      <span>· 约 8 分钟</span>
                      {d.body.some((b) => b.highlight) && (
                        <span className="text-warning-foreground">· 含重点标注</span>
                      )}
                      <span>· 关联题 {QUESTIONS.filter((q) => q.relatedDocId === d.id).length}</span>
                    </div>
                  </div>
                  <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] ${STATUS_STYLE[d.status]}`}>
                    {STATUS_ICON[d.status]}
                    {d.status}
                  </span>
                  <Link
                    to="/learn/doc/$id"
                    params={{ id: d.id }}
                    className="inline-flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-[12px] font-medium text-primary-foreground hover:bg-primary/90"
                  >
                    {d.status === "已学" ? "复习" : d.status === "学习中" ? "继续" : "开始学习"}
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              ))}
              {docs.length === 0 && (
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
              <ProgressRow label="完成度" value={`${topic.progress}%`} highlight />
              <ProgressRow label="已学资料" value={`${learnedCount} / ${docs.length}`} />
              <ProgressRow label="学习中" value={`${inProgressCount}`} />
              <ProgressRow label="待复习" value={`${reviewCount}`} warn={reviewCount > 0} />
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
              className="mt-3 inline-flex w-full items-center justify-center gap-1 rounded-lg bg-primary px-3 py-2 text-[12.5px] font-medium text-primary-foreground hover:bg-primary/90"
            >
              开始专项练习 <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {/* Related Q&A */}
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

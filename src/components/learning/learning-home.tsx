import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BookOpen,
  Check,
  ChevronRight,
  CircleUserRound,
  Clock3,
  FileQuestion,
  FileText,
  Grid2X2,
  History,
  Layers3,
  MessageSquareText,
  RefreshCcw,
  Star,
} from "lucide-react";
import { LearningPageShell } from "@/components/learning/learning-breadcrumb";
import { PageHeader } from "@/components/learning/ui";
import { DOCS } from "@/lib/mock/data";
import { CHAT_FAVORITES, ENRICHED_TOPICS } from "@/lib/mock/learning-hub";
import {
  CONTRIBUTION_STATUS_STYLE,
  QUESTION_CONTRIBUTIONS,
} from "@/lib/mock/my-question-contributions";
import { useMockStore } from "@/lib/mock/store";
import { cn } from "@/lib/utils";

const topicCards = [
  {
    id: "t-newbie",
    tags: ["运行", "典型操作", "知识普及"],
  },
  {
    id: "t-agc",
    tags: ["涉网", "调度", "知识普及"],
  },
  {
    id: "t-inspect",
    tags: ["运维", "检修", "规范标准"],
  },
] as const;

const entryItems = [
  {
    title: "专题学习",
    description: "浏览可学习专题",
    icon: Layers3,
    tone: "teal" as const,
    to: "/learn" as const,
    search: { tab: "topic" as const },
  },
  {
    title: "全部资料",
    description: "查看全部学习资料",
    icon: FileText,
    tone: "slate" as const,
    to: "/learn" as const,
    search: { tab: "materials" as const },
  },
  {
    title: "最近更新",
    description: "查看最近一个月更新",
    icon: Clock3,
    tone: "slate" as const,
    to: "/learn/updates" as const,
    search: undefined,
  },
  {
    title: "个人沉淀",
    description: "查看收藏与个人笔记",
    icon: CircleUserRound,
    tone: "slate" as const,
    to: "/assets" as const,
    search: undefined,
  },
] as const;

const recommendedDocIds = ["d1", "d2", "d5"] as const;

const updates = [
  {
    title: "故障复盘专题",
    label: "新增专题",
    date: "5月26日",
    viewed: false,
    tone: "orange",
    to: "/learn/topic/$id" as const,
    id: "t-fault",
  },
  {
    title: "继电保护装置配置原则",
    label: "资料更新",
    date: "5月20日",
    viewed: true,
    tone: "blue",
    to: "/learn/doc/$id" as const,
    id: "d5",
  },
  {
    title: "调度纪律与合规",
    label: "资料更新",
    date: "5月14日",
    viewed: false,
    tone: "green",
    to: "/learn/topic/$id" as const,
    id: "t-dispatch",
  },
  {
    title: "AGC 考核条款解读",
    label: "资料更新",
    date: "5月12日",
    viewed: false,
    tone: "blue",
    to: "/learn/doc/$id" as const,
    id: "d1",
  },
  {
    title: "新员工入门包",
    label: "专题更新",
    date: "5月8日",
    viewed: true,
    tone: "orange",
    to: "/learn/topic/$id" as const,
    id: "t-newbie",
  },
] as const;

function ViewAllLink({
  to,
  search,
}: {
  to: "/learn" | "/assets" | "/learn/submissions";
  search?: { tab: "materials" | "fav" };
}) {
  const className =
    "inline-flex min-h-8 items-center gap-1 text-[12px] font-medium text-primary hover:text-[#267f8f]";
  if (to === "/learn") {
    return (
      <Link to="/learn" search={search} className={className}>
        查看全部 <ChevronRight className="h-3.5 w-3.5" />
      </Link>
    );
  }
  if (to === "/assets") {
    return (
      <Link to="/assets" search={search} className={className}>
        查看全部 <ChevronRight className="h-3.5 w-3.5" />
      </Link>
    );
  }
  return (
    <Link to="/learn/submissions" className={className}>
      查看全部 <ChevronRight className="h-3.5 w-3.5" />
    </Link>
  );
}

function CardHeading({
  icon: Icon,
  title,
  subtitle,
  action,
}: {
  icon: typeof Layers3;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-8 items-start justify-between gap-4">
      <div className="flex min-w-0 items-start gap-2.5 ">
        <Icon className="mt-0.5 h-[18px] w-[18px] shrink-0 text-primary" aria-hidden />
        <div className="min-w-0">
          <h2 className="text-[15px] font-semibold leading-5 text-kb-heading">{title}</h2>
          {subtitle && <p className="mt-0.5 text-[11.5px] text-kb-muted">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

function LearningEntry() {
  const rowClass =
    "group grid min-h-0 grid-cols-[36px_minmax(0,1fr)_20px] items-center gap-2.5 rounded-[10px] px-2 transition-colors hover:bg-[#f4f9fa] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/35";

  return (
    <section className="flex h-full min-h-0 flex-col rounded-[16px] border border-kb-border bg-white p-3.5 shadow-[0_10px_30px_rgba(24,76,86,0.035)]">
      <CardHeading icon={Grid2X2} title="学习入口" />
      <nav
        className="mt-1 grid min-h-0 flex-1 grid-rows-4 overflow-hidden"
        aria-label="学习功能入口"
      >
        {entryItems.map((item) => {
          const Icon = item.icon;
          const body = (
            <>
              <span
                className={cn(
                  "grid h-8 w-8 place-items-center rounded-[10px]",
                  item.tone === "teal"
                    ? "bg-[#e4f5f7] text-primary"
                    : "bg-[#edf2f4] text-[#5b7480]",
                )}
              >
                <Icon className="h-[18px] w-[18px]" aria-hidden />
              </span>
              <span className="min-w-0">
                <strong className="block truncate text-[13px] font-semibold leading-5 text-kb-heading">
                  {item.title}
                </strong>
                <span className="mt-px block truncate text-[11px] leading-4 text-kb-muted">
                  {item.description}
                </span>
              </span>
              <ChevronRight
                className="h-4 w-4 text-kb-muted transition-transform group-hover:translate-x-0.5 group-hover:text-primary"
                aria-hidden
              />
            </>
          );
          if (item.to === "/learn") {
            return (
              <Link key={item.title} to="/learn" search={item.search} className={rowClass}>
                {body}
              </Link>
            );
          }
          if (item.to === "/learn/updates") {
            return (
              <Link key={item.title} to="/learn/updates" className={rowClass}>
                {body}
              </Link>
            );
          }
          return (
            <Link key={item.title} to="/assets" className={rowClass}>
              {body}
            </Link>
          );
        })}
      </nav>
    </section>
  );
}

function RecentHero({ hasRecentBrowse }: { hasRecentBrowse: boolean }) {
  return (
    <article className="relative flex h-full min-h-[220px] overflow-hidden rounded-[16px] border border-[#cfe4e8] bg-white p-5 shadow-[0_14px_40px_rgba(24,77,87,0.045)] xl:min-h-0">
      <div className="pointer-events-none absolute inset-y-0 right-0 w-[42%] bg-[radial-gradient(circle_at_70%_40%,rgba(52,155,172,.10),transparent_66%)]" />
      <div className="pointer-events-none absolute -right-10 -top-20 h-52 w-52 rounded-full border-[30px] border-primary/[0.055]" />
      <div
        className="pointer-events-none absolute bottom-3 right-16 hidden h-24 w-40 opacity-50 lg:block"
        aria-hidden
      >
        <span className="absolute left-0 top-12 h-2.5 w-2.5 rounded-full bg-primary/25" />
        <span className="absolute left-[70px] top-1 h-2.5 w-2.5 rounded-full bg-primary/20" />
        <span className="absolute right-1 top-[70px] h-2.5 w-2.5 rounded-full bg-primary/25" />
        <span className="absolute left-2 top-[51px] h-px w-[72px] -rotate-[32deg] bg-primary/20" />
        <span className="absolute left-[76px] top-[27px] h-px w-[88px] rotate-[27deg] bg-primary/20" />
      </div>

      <div className="relative flex w-full min-w-0 flex-col">
        <span className="inline-flex w-fit items-center gap-2 rounded-full border border-primary/15 bg-white/85 px-3 py-1 text-[12px] font-semibold text-primary">
          <Clock3 className="h-3.5 w-3.5" aria-hidden /> 最近浏览
        </span>
        {hasRecentBrowse ? (
          <>
            <h2 className="mt-3.5 text-[24px] font-bold tracking-[-0.035em] text-kb-heading xl:text-[26px]">
              继电保护装置配置原则
            </h2>
            <p className="mt-1.5 text-[13px] text-kb-muted">· 2小时前浏览</p>
            {/* <p className="mt-3 text-[13px] text-[#607782]">上次浏览至第 28 页</p> */}
            <Link
              to="/learn/doc/$id"
              params={{ id: "d5" }}
              className="mt-auto inline-flex min-h-11 w-fit items-center gap-2 rounded-[10px] bg-primary px-5 text-[13.5px] font-semibold text-white shadow-[0_9px_22px_rgba(52,155,172,.22)] transition hover:-translate-y-0.5 hover:bg-[#2c91a2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35 focus-visible:ring-offset-2 motion-reduce:transform-none"
            >
              继续查看 <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </>
        ) : (
          <>
            <h2 className="mt-3.5 text-[24px] font-bold tracking-[-0.035em] text-kb-heading xl:text-[26px]">
              暂无最近浏览
            </h2>
            <p className="mt-2 max-w-xl text-[13px] leading-6 text-kb-muted">
              选择一个专题或学习资料开始学习，浏览记录将在这里展示，方便下次继续查看。
            </p>
            <div className="mt-auto flex flex-wrap gap-3">
              <Link
                to="/learn"
                search={{ tab: "topic" }}
                className="inline-flex min-h-11 items-center gap-2 rounded-[10px] bg-primary px-5 text-[13.5px] font-semibold text-white shadow-[0_9px_22px_rgba(52,155,172,.22)] transition hover:-translate-y-0.5 hover:bg-[#2c91a2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35 focus-visible:ring-offset-2 motion-reduce:transform-none"
              >
                浏览专题 <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
              <Link
                to="/learn"
                search={{ tab: "materials" }}
                className="inline-flex min-h-11 items-center rounded-[10px] border border-kb-border bg-white px-5 text-[13.5px] font-medium text-kb-body transition hover:border-primary/35 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              >
                查看全部资料
              </Link>
            </div>
          </>
        )}
      </div>
    </article>
  );
}

function TopicRecommendations() {
  return (
    <section className="flex h-full min-h-0 flex-col rounded-[16px] border border-kb-border bg-white p-4">
      <CardHeading
        icon={Layers3}
        title="可学专题"
        subtitle="围绕岗位与专业选择专题"
        action={
          <Link
            to="/learn"
            search={{ tab: "topic" }}
            className="inline-flex min-h-8 items-center gap-1 text-[12px] font-medium text-primary hover:text-[#267f8f]"
          >
            查看全部 <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        }
      />
      <div className="mt-2 grid min-h-0 flex-1 gap-3 md:grid-cols-3">
        {topicCards.map((card) => {
          const topic = ENRICHED_TOPICS.find((item) => item.id === card.id);
          if (!topic) return null;
          return (
            <Link
              key={topic.id}
              to="/learn/topic/$id"
              params={{ id: topic.id }}
              className="group flex min-h-[128px] flex-col rounded-[13px] border border-kb-border bg-white p-3 transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-[0_10px_25px_rgba(28,85,96,.06)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 motion-reduce:transform-none xl:min-h-0"
            >
              <h3 className="text-[14.5px] font-semibold text-kb-heading group-hover:text-primary">
                {topic.title}
              </h3>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {card.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-[5px] bg-[#e8f6f8] px-2 py-0.5 text-[10.5px] text-[#328da0]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <p className="mt-2 line-clamp-2 text-[11.5px] leading-5 text-kb-muted">
                {topic.desc}
              </p>
              <div className="mt-auto flex items-center justify-between gap-3 pt-3 text-[11.5px] text-kb-muted">
                <span className="flex items-center gap-3">
                  <span className="inline-flex items-center gap-1">
                    <BookOpen className="h-3.5 w-3.5" />
                    资料 {topic.docCount}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Check className="h-3.5 w-3.5" />
                    练习 {topic.questionCount}
                  </span>
                </span>
                <span className="inline-flex shrink-0 items-center gap-1 font-medium text-primary">
                  查看专题 <ChevronRight className="h-3.5 w-3.5" />
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function RecentUpdates() {
  return (
    <section
      id="recent-updates"
      className="flex h-full min-h-0 flex-col rounded-[16px] border border-kb-border bg-white p-3.5"
    >
      <CardHeading
        icon={RefreshCcw}
        title="最近更新"
        action={
          <Link
            to="/learn/updates"
            className="inline-flex min-h-8 items-center gap-1 text-[12px] font-medium text-primary hover:text-[#267f8f]"
          >
            查看全部 <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        }
      />
      <div className="mt-1 grid min-h-0 flex-1 grid-rows-5 divide-y divide-kb-border">
        {updates.map((item) => (
          <Link
            key={item.title}
            to={item.to}
            params={{ id: item.id }}
            className="group grid min-h-0 grid-cols-[26px_minmax(0,1fr)_64px_58px_48px] items-center gap-2 text-[11.5px] transition-colors hover:bg-[#f6fafb] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/30"
          >
            <span
              className={cn(
                "grid h-6 w-6 place-items-center rounded-[6px]",
                item.tone === "orange"
                  ? "bg-[#fff1e4] text-[#ef8e32]"
                  : item.tone === "blue"
                    ? "bg-[#edf3ff] text-[#4586ee]"
                    : "bg-[#e9f8f0] text-[#28ae6c]",
              )}
            >
              {item.tone === "orange" ? (
                <Layers3 className="h-3.5 w-3.5" />
              ) : (
                <FileText className="h-3.5 w-3.5" />
              )}
            </span>
            <strong className="truncate font-semibold text-kb-heading group-hover:text-primary">
              {item.title}
            </strong>
            <span
              className={cn(
                "justify-self-start rounded-[5px] px-1.5 py-0.5 text-[10px]",
                item.tone === "orange"
                  ? "bg-[#fff1e4] text-[#e78529]"
                  : "bg-[#edf3ff] text-[#4682dc]",
              )}
            >
              {item.label}
            </span>
            <span className="text-kb-muted">{item.date}</span>
            <span className={item.viewed ? "text-kb-muted" : "font-medium text-[#546c76]"}>
              {item.viewed ? "已查看" : "未查看"}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

function RecommendedMaterials() {
  const docs = recommendedDocIds
    .map((id) => DOCS.find((doc) => doc.id === id))
    .filter((doc): doc is NonNullable<typeof doc> => Boolean(doc));

  return (
    <section className="flex h-full min-h-0 flex-col rounded-[16px] border border-kb-border bg-white p-3.5">
      <CardHeading
        icon={FileText}
        title="推荐知识资料"
        action={<ViewAllLink to="/learn" search={{ tab: "materials" }} />}
      />
      {docs.length ? (
        <div className="mt-1 flex min-h-0 flex-1 flex-col">
          {docs.map((doc) => (
            <Link
              key={doc.id}
              to="/learn/doc/$id"
              params={{ id: doc.id }}
              className="group flex min-h-0 flex-1 items-center gap-2.5 px-1 py-1 transition-colors hover:bg-[#f6fafb] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/30"
            >
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-primary-soft text-primary">
                <FileText className="h-4 w-4" aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] font-medium text-kb-heading group-hover:text-primary">
                  {doc.title}
                </span>
                <span className="mt-px block truncate text-[11px] text-kb-muted">
                  {doc.docType}
                </span>
              </span>
            </Link>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-[12px] text-kb-muted">暂无推荐资料。</p>
      )}
    </section>
  );
}

function RecentFavorites() {
  const { state } = useMockStore();
  const favoriteDocs = state.favorites
    .map((id) => DOCS.find((doc) => doc.id === id))
    .filter((doc): doc is NonNullable<typeof doc> => Boolean(doc))
    .map((doc) => ({
      key: `doc-${doc.id}`,
      title: doc.title,
      kind: "资料",
      to: "/learn/doc/$id" as const,
      id: doc.id,
    }));
  const favoriteChats = CHAT_FAVORITES.map((item) => ({
    key: item.id,
    title: item.question,
    kind: "问答",
    to: "/assets" as const,
    id: undefined,
  }));
  const items = [...favoriteDocs, ...favoriteChats].slice(0, 3);

  return (
    <section className="flex h-full min-h-0 flex-col rounded-[16px] border border-kb-border bg-white p-3.5">
      <CardHeading
        icon={Star}
        title="个人沉淀"
        action={<ViewAllLink to="/assets" search={{ tab: "fav" }} />}
      />
      {items.length ? (
        <div className="mt-1 flex min-h-0 flex-1 flex-col">
          {items.map((item) => {
            const body = (
              <>
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-[#edf2f4] text-[#5b7480]">
                  {item.kind === "问答" ? (
                    <MessageSquareText className="h-4 w-4" aria-hidden />
                  ) : (
                    <Star className="h-4 w-4" aria-hidden />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-medium text-kb-heading group-hover:text-primary">
                    {item.title}
                  </span>
                  <span className="mt-px block text-[11px] text-kb-muted">{item.kind}</span>
                </span>
              </>
            );
            if (item.to === "/learn/doc/$id" && item.id) {
              return (
                <Link
                  key={item.key}
                  to="/learn/doc/$id"
                  params={{ id: item.id }}
                  className="group flex min-h-0 flex-1 items-center gap-2.5 px-1 py-1 transition-colors hover:bg-[#f6fafb] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/30"
                >
                  {body}
                </Link>
              );
            }
            return (
              <Link
                key={item.key}
                to="/assets"
                search={{ tab: "fav" }}
                className="group flex min-h-0 flex-1 items-center gap-2.5 px-1 py-1 transition-colors hover:bg-[#f6fafb] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/30"
              >
                {body}
              </Link>
            );
          })}
        </div>
      ) : (
        <p className="mt-3 text-[12px] text-kb-muted">还没有收藏内容。</p>
      )}
    </section>
  );
}

function RecentSubmissions() {
  const items = QUESTION_CONTRIBUTIONS.filter((item) => item.status !== "草稿").slice(0, 3);

  return (
    <section className="flex h-full min-h-0 flex-col rounded-[16px] border border-kb-border bg-white p-3.5">
      <CardHeading
        icon={FileQuestion}
        title="我提交的题目"
        action={<ViewAllLink to="/learn/submissions" />}
      />
      {items.length ? (
        <div className="mt-1 flex min-h-0 flex-1 flex-col">
          {items.map((item) => (
            <Link
              key={item.id}
              to="/learn/doc/$id"
              params={{ id: item.docId }}
              className="group flex min-h-0 flex-1 items-center gap-2 px-1 py-1 transition-colors hover:bg-[#f6fafb] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/30"
            >
              <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-kb-heading group-hover:text-primary">
                {item.stem}
              </span>
              <span
                className={cn(
                  "shrink-0 rounded-[5px] px-1.5 py-0.5 text-[10px]",
                  CONTRIBUTION_STATUS_STYLE[item.status],
                )}
              >
                {item.status}
              </span>
            </Link>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-[12px] text-kb-muted">还没有提交题目。</p>
      )}
    </section>
  );
}

export function LearningHome() {
  const { state } = useMockStore();

  return (
    <LearningPageShell className="[&_h1]:font-semibold">
      <PageHeader
        title="学习首页"
        subtitle="聚合最近浏览、可学专题、推荐资料与个人沉淀，快速继续学习。"
        size="md"
        className="mb-2 shrink-0"
        action={
          <Link
            to="/training/records"
            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-kb-border bg-white px-4 text-[13px] font-medium text-kb-body shadow-[0_4px_16px_rgba(22,65,74,.04)] transition hover:border-primary/35 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          >
            <History className="h-4 w-4" /> 学习记录
          </Link>
        }
      />

      <div className="scrollbar-thin flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto xl:overflow-hidden">
        <section className="grid gap-3 xl:min-h-0 xl:flex-[1.08] xl:grid-cols-[minmax(0,1.58fr)_minmax(410px,.98fr)]">
          <RecentHero hasRecentBrowse={state.recentDocs.length > 0} />
          <LearningEntry />
        </section>

        <section className="grid min-h-0 gap-3 xl:flex-[1.06] xl:grid-cols-[minmax(0,1.58fr)_minmax(410px,.98fr)]">
          <TopicRecommendations />
          <RecentUpdates />
        </section>

        <section className="grid min-h-0 gap-3 xl:flex-[0.86] xl:grid-cols-3">
          <RecommendedMaterials />
          <RecentFavorites />
          <RecentSubmissions />
        </section>
      </div>
    </LearningPageShell>
  );
}

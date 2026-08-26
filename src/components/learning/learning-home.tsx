import { Link } from "@tanstack/react-router";
import {
  ArrowUp,
  BookOpen,
  Check,
  ChevronRight,
  CircleUserRound,
  Clock3,
  FileQuestion,
  FileText,
  FolderOpen,
  Grid2X2,
  History,
  Layers3,
  MessageSquareText,
  Play,
  RefreshCcw,
  Sparkles,
  Star,
} from "lucide-react";
import learningGridLandscape from "@/assets/learning-grid-landscape.png";
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

const recommendedDocIds = ["d1", "d2", "d5", "d6", "d8"] as const;

const learningMetrics = [
  {
    label: "可学专题",
    value: "18",
    delta: "2",
    icon: Layers3,
    tone: "teal" as const,
  },
  {
    label: "可学资料",
    value: "136",
    delta: "12",
    icon: FileText,
    tone: "blue" as const,
  },
  {
    label: "本周学习时长",
    value: "2.6",
    suffix: "h",
    delta: "0.6h",
    icon: History,
    tone: "violet" as const,
  },
] as const;

const PENDING_REVIEW_COUNT = QUESTION_CONTRIBUTIONS.filter((item) => item.status === "待审核").length;

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
  const cardClass =
    "group grid min-h-[88px] min-w-0 grid-cols-[36px_minmax(0,1fr)_16px] items-center gap-x-2.5 rounded-[12px] border border-[#e8eef0] bg-[#fafcfd] p-2.5 transition-colors hover:border-primary/25 hover:bg-[#f4f9fa] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35";

  return (
    <section className="flex h-full min-h-0 flex-col rounded-[16px] border border-kb-border bg-white p-3.5 shadow-[0_8px_24px_rgba(24,76,86,0.035)]">
      <CardHeading icon={Grid2X2} title="学习入口" subtitle="常用功能快捷入口" />
      <nav
        className="mt-2 grid min-h-0 flex-1 grid-cols-2 grid-rows-2 gap-2"
        aria-label="学习功能入口"
      >
        {entryItems.map((item) => {
          const Icon = item.icon;
          const body = (
            <>
              <span
                className={cn(
                  "grid h-8 w-8 shrink-0 place-items-center rounded-[9px]",
                  item.tone === "teal"
                    ? "bg-[#e4f5f7] text-primary"
                    : "bg-[#edf2f4] text-[#5b7480]",
                )}
              >
                <Icon className="h-[18px] w-[18px]" aria-hidden />
              </span>
              <span className="min-w-0 overflow-hidden">
                <span className="block text-[13px] font-semibold leading-5 text-kb-heading group-hover:text-primary">
                  {item.title}
                </span>
                <span className="mt-0.5 block text-[11px] leading-4 text-kb-muted line-clamp-2">
                  {item.description}
                </span>
              </span>
              <ChevronRight
                className="h-4 w-4 shrink-0 self-center text-kb-muted transition-transform group-hover:translate-x-0.5 group-hover:text-primary"
                aria-hidden
              />
            </>
          );
          if (item.to === "/learn") {
            return (
              <Link key={item.title} to="/learn" search={item.search} className={cardClass}>
                {body}
              </Link>
            );
          }
          if (item.to === "/learn/updates") {
            return (
              <Link key={item.title} to="/learn/updates" className={cardClass}>
                {body}
              </Link>
            );
          }
          return (
            <Link key={item.title} to="/assets" className={cardClass}>
              {body}
            </Link>
          );
        })}
      </nav>
    </section>
  );
}

function LearningOverview() {
  return (
    <section className="relative flex h-full min-h-[260px] flex-col overflow-hidden rounded-[16px] border border-kb-border bg-white p-4 shadow-[0_8px_24px_rgba(24,76,86,0.035)] xl:min-h-0">
      <CardHeading icon={Grid2X2} title="学习总览" />

      <div className="relative mt-2.5 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
        {learningMetrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <article
              key={metric.label}
              className="flex min-h-[104px] items-start gap-3 rounded-[13px] border border-[#e4eef0] bg-white/92 p-3 shadow-[0_5px_18px_rgba(33,83,93,0.025)]"
            >
              <span
                className={cn(
                  "grid h-9 w-9 shrink-0 place-items-center rounded-[11px]",
                  metric.tone === "teal"
                    ? "bg-[#e5f6f7] text-primary"
                    : metric.tone === "blue"
                      ? "bg-[#eaf3ff] text-[#3689e8]"
                      : "bg-[#efefff] text-[#7770ef]",
                )}
              >
                <Icon className="h-[18px] w-[18px]" aria-hidden />
              </span>
              <div className="min-w-0">
                <p className="truncate text-[11.5px] text-kb-muted">{metric.label}</p>
                <p className="mt-1 flex items-baseline gap-1 text-[26px] font-bold leading-none tracking-[-0.04em] text-kb-heading">
                  <span>{metric.value}</span>
                  {"suffix" in metric && metric.suffix ? (
                    <span className="text-[12px] font-medium tracking-normal text-kb-muted">
                      {metric.suffix}
                    </span>
                  ) : null}
                </p>
                {metric.delta ? (
                  <p className="mt-2 flex items-center gap-1 text-[10.5px] text-kb-muted">
                    较上周
                    <span className="inline-flex items-center font-semibold text-primary">
                      <ArrowUp className="h-3 w-3" aria-hidden />
                      {metric.delta}
                    </span>
                  </p>
                ) : null}
              </div>
            </article>
          );
        })}
      </div>

      <div className="relative mt-2.5 flex items-center gap-3 text-[11.5px] text-kb-muted">
        <span className="h-px min-w-6 flex-1 bg-gradient-to-r from-transparent to-kb-border" />
        <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
          <Sparkles className="h-3.5 w-3.5 text-primary" aria-hidden />
          持续学习是成长的阶梯，积累每一次进步，成就更专业的自己！
        </span>
        <span className="h-px min-w-6 flex-1 bg-gradient-to-r from-kb-border to-transparent" />
      </div>

      <div className="relative mt-auto flex flex-wrap items-end gap-2.5 pt-2.5">
        <Link
          to="/learn"
          search={{ tab: "topic" }}
          className="inline-flex min-h-10 items-center gap-2 whitespace-nowrap rounded-[9px] bg-primary px-5 text-[13px] font-semibold text-white shadow-[0_8px_18px_rgba(52,155,172,.2)] transition hover:-translate-y-0.5 hover:bg-[#2c91a2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35 focus-visible:ring-offset-2 active:translate-y-px motion-reduce:transform-none"
        >
          <Play className="h-4 w-4 fill-current" aria-hidden />
          进入专题学习
        </Link>
        <Link
          to="/learn"
          search={{ tab: "materials" }}
          className="inline-flex min-h-10 items-center gap-2 whitespace-nowrap rounded-[9px] border border-[#b7cbd0] bg-white px-5 text-[13px] font-medium text-kb-body transition hover:border-primary/45 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 active:translate-y-px"
        >
          <FolderOpen className="h-4 w-4 text-primary" aria-hidden />
          浏览全部资料
        </Link>
      </div>

      <img
        src={learningGridLandscape}
        alt=""
        aria-hidden
        className="pointer-events-none absolute bottom-0 right-0 hidden h-[104px] w-[45%] object-cover object-right-bottom opacity-55 lg:block"
        style={{marginBottom: '-20px'}}
      />
    </section>
  );
}
function HeaderActions() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {PENDING_REVIEW_COUNT > 0 ? (
        <Link
          to="/learn/submissions"
          className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[#f5d9b8] bg-[#fff8ee] px-4 text-[13px] font-medium text-[#c07a1a] transition hover:border-[#e8b56a] hover:bg-[#fff3e0] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/50"
        >
          <FileQuestion className="h-4 w-4" aria-hidden />
          {PENDING_REVIEW_COUNT} 条题目待审核
        </Link>
      ) : null}
      <Link
        to="/training/records"
        className="inline-flex min-h-11 items-center gap-2 rounded-full border border-kb-border bg-white px-4 text-[13px] font-medium text-kb-body shadow-[0_4px_16px_rgba(22,65,74,.04)] transition hover:border-primary/35 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
      >
        <History className="h-4 w-4" aria-hidden />
        学习记录
      </Link>
    </div>
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
  // 3条
  const docs = recommendedDocIds.slice(0, 3)
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
  return (
    <LearningPageShell className="[&_h1]:font-semibold">
      <PageHeader
        title="学习首页"
        subtitle="聚合电力行业学习资料与专题，助力知识提升与能力成长。"
        size="md"
        className="mb-2 shrink-0"
        action={<HeaderActions />}
      />

      <div className="scrollbar-thin flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto xl:overflow-hidden">
        <section className="grid gap-3 xl:min-h-0 xl:flex-[1.08] xl:grid-cols-[minmax(0,1.65fr)_minmax(320px,.92fr)]">
          <LearningOverview />
          <LearningEntry />
        </section>

        <section className="grid min-h-0 gap-3 xl:flex-[1.06] xl:grid-cols-[minmax(0,1.35fr)_minmax(420px,1fr)]">
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

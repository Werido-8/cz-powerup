import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BookOpen,
  Check,
  ChevronRight,
  CircleUserRound,
  ClipboardList,
  Clock3,
  FileQuestion,
  FileText,
  Grid2X2,
  History,
  Layers3,
  MessageSquareText,
  NotebookPen,
  PencilLine,
  RefreshCcw,
  Star,
} from "lucide-react";
import { PageHeader } from "@/components/learning/ui";
import { PageShell } from "@/components/workbench/PageShell";
import { ENRICHED_TOPICS } from "@/lib/mock/learning-hub";
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
    tone: "teal",
    search: { tab: "topic" as const },
  },
  {
    title: "全部资料",
    description: "查看全部学习资料",
    icon: FileText,
    tone: "slate",
    search: { tab: "materials" as const },
  },
] as const;

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
] as const;

const personalStats = [
  { label: "收藏资料", value: 12, icon: Star, tone: "blue", tab: "fav" as const },
  { label: "收藏问答", value: 8, icon: MessageSquareText, tone: "green", tab: "qa" as const },
  { label: "收藏错题", value: 15, icon: FileQuestion, tone: "orange", tab: "fav" as const },
  { label: "个人笔记", value: 6, icon: NotebookPen, tone: "indigo", tab: "note" as const },
] as const;

const statTone = {
  blue: "bg-[#eaf4ff] text-[#397fe8]",
  green: "bg-[#e7f8ef] text-[#22ad68]",
  orange: "bg-[#fff1e4] text-[#e88a2d]",
  indigo: "bg-[#edf2ff] text-[#477ee7]",
} as const;

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
      <div className="flex min-w-0 items-start gap-2.5">
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
  return (
    <section className="flex min-h-0 flex-col rounded-[16px] border border-kb-border bg-white p-4 shadow-[0_10px_30px_rgba(24,76,86,0.035)]">
      <CardHeading icon={Grid2X2} title="学习入口" />
      <nav
        className="mt-1 min-h-0 flex-1 overflow-hidden rounded-[12px] border border-kb-border"
        aria-label="学习功能入口"
      >
        {entryItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.title}
              to="/learn"
              search={item.search}
              className="group grid min-h-[58px] grid-cols-[40px_minmax(0,1fr)_24px] items-center gap-3 border-b border-kb-border px-3.5 transition-colors last:border-b-0 hover:bg-[#f4f9fa] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/35"
            >
              <span
                className={cn(
                  "grid h-9 w-9 place-items-center rounded-[10px]",
                  item.tone === "teal"
                    ? "bg-[#e4f5f7] text-primary"
                    : "bg-[#edf2f4] text-[#5b7480]",
                )}
              >
                <Icon className="h-5 w-5" aria-hidden />
              </span>
              <span className="min-w-0">
                <strong className="block text-[13.5px] font-semibold text-kb-heading">
                  {item.title}
                </strong>
                <span className="mt-0.5 block text-[11.5px] text-kb-muted">{item.description}</span>
              </span>
              <ChevronRight
                className="h-4 w-4 text-kb-muted transition-transform group-hover:translate-x-0.5 group-hover:text-primary"
                aria-hidden
              />
            </Link>
          );
        })}
        <Link
          to="/learn/updates"
          className="group grid min-h-[58px] grid-cols-[40px_minmax(0,1fr)_24px] items-center gap-3 border-b border-kb-border px-3.5 transition-colors hover:bg-[#f4f9fa] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/35"
        >
          <span className="grid h-9 w-9 place-items-center rounded-[10px] bg-[#edf2f4] text-[#5b7480]">
            <Clock3 className="h-5 w-5" aria-hidden />
          </span>
          <span className="min-w-0">
            <strong className="block text-[13.5px] font-semibold text-kb-heading">最近更新</strong>
            <span className="mt-0.5 block text-[11.5px] text-kb-muted">查看最近一个月更新</span>
          </span>
          <ChevronRight
            className="h-4 w-4 text-kb-muted transition-transform group-hover:translate-x-0.5 group-hover:text-primary"
            aria-hidden
          />
        </Link>
        <Link
          to="/assets"
          className="group grid min-h-[58px] grid-cols-[40px_minmax(0,1fr)_24px] items-center gap-3 px-3.5 transition-colors hover:bg-[#f4f9fa] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/35"
        >
          <span className="grid h-9 w-9 place-items-center rounded-[10px] bg-[#edf2f4] text-[#5b7480]">
            <CircleUserRound className="h-5 w-5" aria-hidden />
          </span>
          <span className="min-w-0">
            <strong className="block text-[13.5px] font-semibold text-kb-heading">个人沉淀</strong>
            <span className="mt-0.5 block text-[11.5px] text-kb-muted">查看收藏与个人笔记</span>
          </span>
          <ChevronRight
            className="h-4 w-4 text-kb-muted transition-transform group-hover:translate-x-0.5 group-hover:text-primary"
            aria-hidden
          />
        </Link>
      </nav>
    </section>
  );
}

function RecentHero({ hasRecentBrowse }: { hasRecentBrowse: boolean }) {
  return (
    <article className="relative flex min-h-[286px] overflow-hidden rounded-[16px] border border-[#cfe4e8] bg-white p-6 shadow-[0_14px_40px_rgba(24,77,87,0.045)] xl:min-h-0">
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
            <h2 className="mt-5 text-[27px] font-bold tracking-[-0.035em] text-kb-heading xl:text-[30px]">
              继电保护装置配置原则
            </h2>
            <p className="mt-2 text-[13px] text-kb-muted">来自：继电保护专题强化 · 2小时前浏览</p>
            <p className="mt-5 text-[13px] text-[#607782]">上次浏览至第 28 页</p>
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
            <h2 className="mt-5 text-[27px] font-bold tracking-[-0.035em] text-kb-heading xl:text-[30px]">
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
    <section className="flex min-h-0 flex-col rounded-[16px] border border-kb-border bg-white p-4">
      <CardHeading icon={Layers3} title="可学专题" subtitle="围绕岗位与专业选择专题" />
      <div className="mt-2 grid min-h-0 flex-1 gap-3 md:grid-cols-3">
        {topicCards.map((card) => {
          const topic = ENRICHED_TOPICS.find((item) => item.id === card.id);
          if (!topic) return null;
          return (
            <Link
              key={topic.id}
              to="/learn/topic/$id"
              params={{ id: topic.id }}
              className="group flex min-h-[166px] flex-col rounded-[13px] border border-kb-border bg-white p-3.5 transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-[0_10px_25px_rgba(28,85,96,.06)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 motion-reduce:transform-none xl:min-h-0"
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
    <section id="recent-updates" className="rounded-[16px] border border-kb-border bg-white p-3.5">
      <CardHeading
        icon={RefreshCcw}
        title="最近一个月更新"
        action={
          <Link
            to="/learn/updates"
            className="inline-flex min-h-8 items-center gap-1 text-[12px] font-medium text-primary hover:text-[#267f8f]"
          >
            查看全部 <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        }
      />
      <div className="mt-1 divide-y divide-kb-border">
        {updates.map((item) => (
          <Link
            key={item.title}
            to={item.to}
            params={{ id: item.id }}
            className="group grid min-h-[31px] grid-cols-[26px_minmax(0,1fr)_64px_58px_48px] items-center gap-2 text-[11.5px] transition-colors hover:bg-[#f6fafb] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/30"
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

function PersonalOverview() {
  return (
    <section className="rounded-[16px] border border-kb-border bg-white px-3 py-2">
      <CardHeading
        icon={Star}
        title="个人沉淀"
        action={
          <Link
            to="/assets"
            className="inline-flex min-h-8 items-center gap-1 text-[12px] font-medium text-primary hover:text-[#267f8f]"
          >
            进入个人沉淀 <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        }
      />
      <div className="mt-1 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {personalStats.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              to="/assets"
              search={{ tab: item.tab }}
              className="flex min-h-[56px] items-center gap-2.5 rounded-[10px] border border-kb-border px-2.5 transition hover:border-primary/25 hover:bg-[#f7fbfb] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
            >
              <span
                className={cn(
                  "grid h-9 w-9 shrink-0 place-items-center rounded-[10px]",
                  statTone[item.tone],
                )}
              >
                <Icon className="h-[18px] w-[18px]" aria-hidden />
              </span>
              <span className="min-w-0">
                <span className="block truncate text-[10.5px] text-kb-muted">{item.label}</span>
                <strong className="mt-0.5 block text-[21px] leading-none text-kb-heading">
                  {item.value}
                </strong>
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function PracticeOverview() {
  const metrics = [
    { label: "已作答", value: 86, icon: ClipboardList, tone: "bg-[#e6f5f7] text-primary" },
    { label: "答对", value: 68, icon: Check, tone: "bg-[#e8f8eb] text-[#14aa50]" },
    { label: "待巩固", value: 18, icon: PencilLine, tone: "bg-[#fff1e4] text-[#ef8b27]" },
  ];
  return (
    <section className="grid gap-4 rounded-[16px] border border-kb-border bg-white p-4 lg:grid-cols-[minmax(430px,.9fr)_minmax(0,1.1fr)]">
      <div>
        <CardHeading icon={ClipboardList} title="练习概览" />
        <div className="mt-1 grid grid-cols-3 gap-3">
          {metrics.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.label}
                className="flex min-h-[66px] items-center gap-3 rounded-[11px] border border-kb-border px-3"
              >
                <span
                  className={cn(
                    "grid h-10 w-10 shrink-0 place-items-center rounded-full",
                    item.tone,
                  )}
                >
                  <Icon className="h-5 w-5" />
                </span>
                <span>
                  <span className="block text-[11px] text-kb-muted">{item.label}</span>
                  <strong className="mt-0.5 block text-[21px] leading-none text-kb-heading">
                    {item.value}
                  </strong>
                </span>
              </div>
            );
          })}
        </div>
      </div>
      <div>
        <h2 className="min-h-10 text-[13px] font-semibold leading-5 text-kb-heading">
          最近练习来源
        </h2>
        <div className="mt-1 space-y-0.5">
          <Link
            to="/learn/topic/$id"
            params={{ id: "t-agc" }}
            className="group grid min-h-8 grid-cols-[22px_minmax(0,1fr)_60px_18px] items-center gap-2 text-[12px] text-kb-muted hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          >
            <FileText className="h-4 w-4 text-[#3c91f0]" />
            <span className="truncate">专题练习 · AGC 与两细则专项</span>
            <span>5月24日</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
          <Link
            to="/learn/doc/$id"
            params={{ id: "d5" }}
            className="group grid min-h-8 grid-cols-[22px_minmax(0,1fr)_60px_18px] items-center gap-2 text-[12px] text-kb-muted hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          >
            <FileText className="h-4 w-4 text-[#3c91f0]" />
            <span className="truncate">资料练习 · 继电保护装置配置原则</span>
            <span>5月22日</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}

export function LearningHome() {
  const { state } = useMockStore();

  return (
    <PageShell compact>
      <div className="flex h-full min-h-0 w-full flex-col [&_h1]:font-semibold">
        <PageHeader
          title="学习首页"
          subtitle="聚合最近浏览、可学专题与个人沉淀，快速继续学习。"
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
          <section className="grid gap-3 xl:min-h-0 xl:flex-[1.16] xl:grid-cols-[minmax(0,1.58fr)_minmax(410px,.98fr)]">
            <RecentHero hasRecentBrowse={state.recentDocs.length > 0} />
            <LearningEntry />
          </section>

          <section className="grid gap-3 xl:min-h-0 xl:flex-[1.03] xl:grid-cols-[minmax(0,1.58fr)_minmax(410px,.98fr)]">
            <TopicRecommendations />
            <div className="grid min-h-0 gap-3 sm:grid-cols-2 xl:grid-cols-1 xl:grid-rows-[1fr_auto]">
              <RecentUpdates />
              <PersonalOverview />
            </div>
          </section>

          <div className="shrink-0">
            <PracticeOverview />
          </div>
        </div>
      </div>
    </PageShell>
  );
}

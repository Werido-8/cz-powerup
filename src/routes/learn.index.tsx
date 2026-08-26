import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { z } from "zod";
import {
  ArrowRight,
  BookOpen,
  BookOpenCheck,
  ChevronRight,
  FileText,
  Layers3,
  LayoutGrid,
  List,
  ListChecks,
  Search,
} from "lucide-react";
import { PageShell } from "@/components/workbench/PageShell";
import { LearningHome } from "@/components/learning/learning-home";
import { RecentTopicAccess } from "@/components/learning/recent-topic-access";
import { CardBatchPager, PageHeader, TableListPager } from "@/components/learning/ui";
import { DOCS, DOC_TYPES, type Doc } from "@/lib/mock/data";
import { ENRICHED_TOPICS, type EnrichedTopic } from "@/lib/mock/learning-hub";
import {
  getEffectiveDocStatus,
  getTopicLearningStatus,
  getTopicProgress,
  type DocReadStatus,
} from "@/lib/mock/learning-progress";
import { useMockStore, type MockState } from "@/lib/mock/store";
import { cn } from "@/lib/utils";

const learnSearchSchema = z.object({
  /** all / mine 仅用于兼容既有链接，页面统一展示为学习资料。 */
  tab: z.enum(["topic", "materials", "all", "mine"]).optional().catch(undefined),
});

export const Route = createFileRoute("/learn/")({
  validateSearch: learnSearchSchema,
  component: LearnPage,
  head: () => ({ meta: [{ title: "学习首页 · 涉网运行能力智能提升平台" }] }),
});

type TabKey = "topic" | "materials";
type TopicViewMode = "card" | "list";
type SpecialtyKey =
  | "all"
  | "operation"
  | "electrical"
  | "relay"
  | "grid"
  | "boiler"
  | "turbine"
  | "chemistry";

const TABS: { key: TabKey; label: string; icon: typeof Layers3 }[] = [
  { key: "topic", label: "专题学习", icon: Layers3 },
  { key: "materials", label: "学习资料", icon: BookOpen },
];

const SPECIALTIES: {
  key: SpecialtyKey;
  label: string;
  matches: (topic: EnrichedTopic) => boolean;
}[] = [
  { key: "all", label: "全部专题", matches: () => true },
  {
    key: "operation",
    label: "运行值班",
    matches: (topic) => topic.roleTags.includes("运行") || topic.id === "t-newbie",
  },
  {
    key: "electrical",
    label: "电气专业",
    matches: (topic) =>
      topic.roleTags.some((tag) => ["电气", "典型操作", "故障处置"].includes(tag)) ||
      ["t-op", "t-meter"].includes(topic.id),
  },
  {
    key: "relay",
    label: "继电保护",
    matches: (topic) => topic.roleTags.includes("继保") || topic.id === "t-relay",
  },
  {
    key: "grid",
    label: "涉网与调度",
    matches: (topic) => topic.roleTags.some((tag) => ["涉网", "调度"].includes(tag)),
  },
  { key: "boiler", label: "锅炉专业", matches: (topic) => topic.roleTags.includes("锅炉") },
  { key: "turbine", label: "汽机专业", matches: (topic) => topic.roleTags.includes("汽机") },
  { key: "chemistry", label: "化学专业", matches: (topic) => topic.roleTags.includes("化学") },
];

const STATUS_DOT_STYLE: Record<DocReadStatus, string> = {
  未学: "bg-kb-muted/60",
  学习中: "bg-primary",
  已学: "bg-success",
};

/** 一行 4 张，默认展示 3 行。 */
const TOPIC_CARD_PAGE_SIZE = 12;
const TOPIC_LIST_PAGE_SIZE = 20;
/** 专题列表演示进度。真实学习记录存在时始终优先使用真实数据。 */
const TOPIC_PROGRESS_MOCK_IDS = new Set(["t-newbie", "t-op", "t-fault", "t-agc", "t-safety"]);

const TOPIC_VISUALS = {
  teal: {
    accent: "bg-primary",
    icon: "bg-primary text-white",
  },
  blue: {
    accent: "bg-blue-500",
    icon: "bg-blue-50 text-blue-600",
  },
  amber: {
    accent: "bg-amber-500",
    icon: "bg-amber-50 text-amber-600",
  },
} as const;

function LearnPage() {
  const navigate = useNavigate();
  const search = useSearch({ from: "/learn/" });
  const { state } = useMockStore();
  const searchTab: TabKey =
    search.tab === "materials" || search.tab === "all" || search.tab === "mine"
      ? "materials"
      : "topic";
  const [tab, setTab] = useState<TabKey>(searchTab);
  const [query, setQuery] = useState("");
  const [specialty, setSpecialty] = useState<SpecialtyKey>("all");
  const [docType, setDocType] = useState<string>("all");

  useEffect(() => setTab(searchTab), [searchTab]);

  const switchTab = (next: TabKey) => {
    setTab(next);
    setQuery("");
    navigate({ to: "/learn", search: { tab: next }, replace: true });
  };

  if (!search.tab) return <LearningHome />;

  return (
    <PageShell compact>
      <div className="flex h-full min-h-0 w-full flex-col [&_h1]:font-semibold">
        <div className="shrink-0">
          <PageHeader
            title="知识学习"
            subtitle="继续当前学习，或按岗位与任务选择经过审核的专题和资料。"
            size="md"
            className="mb-2"
          />

          <nav
            className="mb-3 flex min-h-9 items-end justify-between gap-2 border-b border-kb-border sm:justify-start sm:gap-6"
            aria-label="知识学习分类"
          >
            {TABS.map((item) => {
              const active = item.key === tab;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => switchTab(item.key)}
                  className={cn(
                    "relative inline-flex min-h-9 items-center gap-1.5 whitespace-nowrap px-0.5 text-[13px] font-medium transition-colors sm:gap-2 sm:px-1 sm:text-[14px]",
                    active ? "text-primary" : "text-kb-muted hover:text-kb-heading",
                  )}
                  aria-current={active ? "page" : undefined}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                  {active && <span className="absolute inset-x-0 bottom-[-1px] h-0.5 bg-primary" />}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="min-h-0 flex-1 overflow-hidden">
          {tab === "topic" ? (
            <TopicWorkspace
              query={query}
              onQueryChange={setQuery}
              specialty={specialty}
              onSpecialtyChange={setSpecialty}
              state={state}
            />
          ) : (
            <MaterialWorkspace
              query={query}
              onQueryChange={setQuery}
              docType={docType}
              onDocTypeChange={setDocType}
              state={state}
            />
          )}
        </div>
      </div>
    </PageShell>
  );
}

function TopicWorkspace({
  query,
  onQueryChange,
  specialty,
  onSpecialtyChange,
  state,
}: {
  query: string;
  onQueryChange: (value: string) => void;
  specialty: SpecialtyKey;
  onSpecialtyChange: (value: SpecialtyKey) => void;
  state: MockState;
}) {
  const [viewMode, setViewMode] = useState<TopicViewMode>("card");
  const [page, setPage] = useState(1);
  const [listPageSize, setListPageSize] = useState(TOPIC_LIST_PAGE_SIZE);
  const activeSpecialty = SPECIALTIES.find((item) => item.key === specialty) ?? SPECIALTIES[0];
  const filteredTopics = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return ENRICHED_TOPICS.filter((topic) => {
      if (!activeSpecialty.matches(topic)) return false;
      if (!normalized) return true;
      return [topic.title, topic.desc, ...topic.roleTags].some((value) =>
        value.toLowerCase().includes(normalized),
      );
    });
  }, [activeSpecialty, query]);
  const pageSize = viewMode === "card" ? TOPIC_CARD_PAGE_SIZE : listPageSize;
  const totalPages = Math.max(1, Math.ceil(filteredTopics.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageTopics = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filteredTopics.slice(start, start + pageSize);
  }, [filteredTopics, pageSize, safePage]);

  useEffect(() => setPage(1), [query, specialty, viewMode]);
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const resetTopicFilters = () => {
    onQueryChange("");
    onSpecialtyChange("all");
  };

  return (
    <div className="grid h-full min-h-0 gap-3 lg:grid-cols-[214px_minmax(0,1fr)]">
      <aside className="hidden min-h-0 lg:flex lg:flex-col lg:gap-2.5">
        <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-kb-border bg-white p-2 shadow-[var(--shadow-card)]">
          <div className="shrink-0 px-2 pb-1.5 pt-0.5 text-[14px] font-semibold text-kb-heading">
            专业分类
          </div>
          <div className="min-h-0 flex-1 space-y-0.5 overflow-y-auto scrollbar-thin">
            {SPECIALTIES.map((item) => {
              const active = item.key === specialty;
              const count = ENRICHED_TOPICS.filter(item.matches).length;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => onSpecialtyChange(item.key)}
                  aria-pressed={active}
                  className={cn(
                    "flex min-h-8 w-full items-center justify-between rounded-[3px] px-2.5 text-left text-[12px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25",
                    active ? "bg-primary text-white shadow-sm" : "text-kb-body hover:bg-kb-surface",
                  )}
                >
                  <span>{item.label}</span>
                  <span
                    className={cn(
                      "min-w-6 rounded-full px-1.5 py-0.5 text-center text-[11px] tabular-nums",
                      active ? "bg-white/90 text-primary" : "bg-kb-surface text-kb-muted",
                    )}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="mt-2 shrink-0 border-t border-kb-border px-2 pb-0.5 pt-2 text-[11px] leading-4 text-kb-muted">
            专题资料由培训老师从知识库筛选，并在发布前完成人工确认。
          </div>
        </section>
        <RecentTopicAccess state={state} className="shrink-0" />
      </aside>

      <main className="flex min-h-0 min-w-0 flex-col">
        <div className="-mx-1 mb-2 flex shrink-0 gap-2 overflow-x-auto px-1 pb-1 lg:hidden">
          {SPECIALTIES.map((item) => {
            const active = item.key === specialty;
            const count = ENRICHED_TOPICS.filter(item.matches).length;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => onSpecialtyChange(item.key)}
                aria-pressed={active}
                className={cn(
                  "flex h-8 shrink-0 items-center gap-2 rounded-full border px-3 text-[12px] transition-colors",
                  active
                    ? "border-primary bg-primary text-white"
                    : "border-kb-border bg-white text-kb-body",
                )}
              >
                <span>{item.label}</span>
                <span className={cn("tabular-nums", active ? "text-white/75" : "text-kb-muted")}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
        <RecentTopicAccess state={state} limit={1} className="mb-2 shrink-0 lg:hidden" />

        <div className="mb-2.5 flex shrink-0 flex-wrap items-center justify-between gap-2">
          <h2 className="text-[15px] font-medium text-kb-heading">
            {activeSpecialty.label}
            <span className="ml-2 text-[12px] font-normal text-kb-muted">
              共 {filteredTopics.length} 个可学习专题
            </span>
          </h2>
          <div className="flex w-full items-center gap-2 sm:w-auto">
            <label className="relative block min-w-0 flex-1 sm:w-[280px] sm:flex-none">
              <span className="sr-only">搜索专题</span>
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-kb-muted" />
              <input
                value={query}
                onChange={(event) => onQueryChange(event.target.value)}
                placeholder="搜索专题或专业关键词"
                className="h-8 w-full rounded-md border border-kb-border bg-white pl-9 pr-3 text-[13px] text-kb-heading outline-none placeholder:text-kb-muted focus:border-primary/60 focus:ring-2 focus:ring-primary/10"
              />
            </label>
            <TopicViewToggle value={viewMode} onChange={setViewMode} />
          </div>
        </div>

        {filteredTopics.length ? (
          viewMode === "card" ? (
            <>
              <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto pr-0.5">
                <div className="grid min-h-full content-start gap-2.5 p-0.5 md:grid-cols-2 xl:h-full xl:grid-cols-4 xl:auto-rows-[minmax(8rem,15rem)]">
                  {pageTopics.map((topic) => (
                    <TopicCard key={topic.id} topic={topic} state={state} />
                  ))}
                </div>
              </div>
              {totalPages > 1 && (
                <CardBatchPager
                  page={safePage}
                  totalPages={totalPages}
                  totalItems={filteredTopics.length}
                  pageSize={TOPIC_CARD_PAGE_SIZE}
                  unitLabel="个专题"
                  onPageChange={setPage}
                  compact
                  className="mt-2 shrink-0 rounded-lg border border-kb-border bg-white px-3 py-1"
                />
              )}
            </>
          ) : (
            <section
              className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-kb-border bg-white shadow-[var(--shadow-card)]"
              aria-label="专题列表"
            >
              <div className="hidden min-h-8 shrink-0 grid-cols-[minmax(0,1fr)_88px_132px_108px] items-center gap-4 border-b border-kb-border bg-kb-surface/55 px-4 text-[11px] font-medium text-kb-muted lg:grid">
                <span>专题信息</span>
                <span>学习进度</span>
                <span>学习内容</span>
                <span className="text-right">操作</span>
              </div>
              <div className="scrollbar-thin min-h-0 flex-1 divide-y divide-kb-border/80 overflow-y-auto">
                {pageTopics.map((topic) => (
                  <TopicListRow key={topic.id} topic={topic} state={state} />
                ))}
              </div>
              <TableListPager
                page={safePage}
                totalPages={totalPages}
                totalItems={filteredTopics.length}
                pageSize={listPageSize}
                onPageChange={setPage}
                onPageSizeChange={(nextPageSize) => {
                  setListPageSize(nextPageSize);
                  setPage(1);
                }}
              />
            </section>
          )
        ) : (
          <EmptyResult
            title="没有找到匹配专题"
            description="可以更换专业分类或缩短搜索关键词。"
            actionLabel="清除筛选"
            onAction={resetTopicFilters}
          />
        )}
      </main>
    </div>
  );
}

function TopicViewToggle({
  value,
  onChange,
}: {
  value: TopicViewMode;
  onChange: (value: TopicViewMode) => void;
}) {
  const options = [
    { value: "card" as const, label: "卡片", icon: LayoutGrid },
    { value: "list" as const, label: "列表", icon: List },
  ];

  return (
    <div
      className="inline-flex shrink-0 rounded-md border border-kb-border bg-white p-0.5"
      role="group"
      aria-label="专题展示方式"
    >
      {options.map((option) => {
        const active = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            aria-pressed={active}
            aria-label={`${option.label}模式`}
            className={cn(
              "inline-flex h-8 min-w-[34px] items-center justify-center gap-1.5 rounded px-2 text-[12px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25 sm:min-w-[64px]",
              active ? "bg-primary-soft text-primary" : "text-kb-muted hover:text-kb-heading",
            )}
          >
            <option.icon className="h-4 w-4" />
            <span className="hidden sm:inline">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function TopicCard({ topic, state }: { topic: EnrichedTopic; state: MockState }) {
  const progress = getTopicDisplayProgress(topic, state);
  const status = getTopicDisplayStatus(topic, state, progress);
  const actionLabel = getTopicActionLabel(status);
  const visual = getTopicVisual(topic);

  return (
    <Link
      to="/learn/topic/$id"
      params={{ id: topic.id }}
      className="group relative flex h-full min-h-32 min-w-0 flex-col overflow-hidden rounded-lg border border-kb-border bg-white px-3 py-2.5 shadow-[var(--shadow-card)] transition-[transform,border-color,box-shadow] duration-200 ease-out hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-[var(--shadow-card-hover)] motion-reduce:hover:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25"
    >
      <span className={cn("absolute left-0 top-0 h-0.5 w-8 rounded-br-full", visual.accent)} />
      <div className="flex min-w-0 flex-wrap gap-1">
        {topic.roleTags.slice(0, 2).map((tag) => (
          <span
            key={tag}
            className="rounded border border-primary/20 bg-primary-soft/60 px-1.5 py-px text-[10px] text-primary"
          >
            {tag}
          </span>
        ))}
        <TopicLearningStatusTag status={status} />
      </div>
      <h3 className="mt-1.5 text-[14px] font-normal leading-5 tracking-[-0.01em] text-kb-heading">
        {topic.title}
      </h3>
      <p className="mt-1 text-[12px] leading-5 text-kb-muted">{topic.desc}</p>
      <div className="mt-auto flex items-center justify-between gap-2 pt-2">
        <div className="flex items-center gap-2.5 text-[11px] text-kb-muted">
          <span className="inline-flex items-center gap-1">
            <BookOpen className="h-3.5 w-3.5" />
            资料{" "}
            <strong className="font-medium tabular-nums text-kb-heading">{topic.docCount}</strong>
          </span>
          <span className="inline-flex items-center gap-1">
            <ListChecks className="h-3.5 w-3.5" />
            练习{" "}
            <strong className="font-medium tabular-nums text-kb-heading">
              {topic.questionCount}
            </strong>
          </span>
        </div>
        <span className="inline-flex shrink-0 items-center gap-0.5 text-[12px] font-medium text-primary">
          {actionLabel}
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  );
}

function TopicListRow({ topic, state }: { topic: EnrichedTopic; state: MockState }) {
  const progress = getTopicDisplayProgress(topic, state);
  const status = getTopicDisplayStatus(topic, state, progress);
  const visual = getTopicVisual(topic);

  return (
    <Link
      to="/learn/topic/$id"
      params={{ id: topic.id }}
      className="group relative grid min-h-[76px] gap-3 px-4 py-2.5 transition-colors hover:bg-kb-surface/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/25 lg:grid-cols-[minmax(0,1fr)_88px_132px_108px] lg:items-center lg:gap-4"
    >
      <span className={cn("absolute bottom-3 left-0 top-3 w-0.5 rounded-r-full", visual.accent)} />
      <div className="flex min-w-0 items-start gap-3">
        <span
          className={cn(
            "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md",
            visual.icon,
          )}
        >
          <BookOpenCheck className="h-[18px] w-[18px]" />
        </span>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <h3 className="mr-1 text-[14px] font-semibold text-kb-heading">{topic.title}</h3>
            {topic.roleTags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="rounded border border-primary/20 bg-primary-soft/60 px-1.5 py-0.5 text-[10.5px] text-primary"
              >
                {tag}
              </span>
            ))}
          </div>
          <p className="mt-1 line-clamp-1 text-[12px] leading-5 text-kb-muted">{topic.desc}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 lg:block">
        <span className="text-[11px] text-kb-muted lg:hidden">学习进度</span>
        <TopicProgressCircle progress={progress} compact />
      </div>
      <div className="flex items-center gap-4 text-[11.5px] text-kb-muted lg:block lg:space-y-1.5">
        <span className="flex items-center gap-1.5">
          <BookOpen className="h-3.5 w-3.5" />
          资料{" "}
          <strong className="font-medium tabular-nums text-kb-heading">{topic.docCount}</strong>
        </span>
        <span className="flex items-center gap-1.5">
          <ListChecks className="h-3.5 w-3.5" />
          练习{" "}
          <strong className="font-medium tabular-nums text-kb-heading">
            {topic.questionCount}
          </strong>
        </span>
      </div>
      <div className="flex items-center justify-between gap-3 lg:justify-end">
        <span className="text-[11px] text-kb-muted lg:hidden">{getTopicStatusLabel(status)}</span>
        <span className="inline-flex min-h-8 items-center gap-1 text-[12px] font-medium text-primary">
          {getTopicActionLabel(status)}
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  );
}

function TopicProgressCircle({
  progress,
  compact = false,
}: {
  progress: number;
  compact?: boolean;
}) {
  const label = progress > 0 ? `${progress}%` : "未开始";
  return (
    <span className={cn("inline-flex shrink-0 flex-col items-center", compact ? "gap-0" : "gap-1")}>
      <span
        className={cn(
          "inline-flex items-center justify-center rounded-full p-1",
          compact ? "h-11 w-11" : "h-14 w-14",
        )}
        style={{
          background: `conic-gradient(var(--primary) ${progress * 3.6}deg, var(--kb-preview-bg) 0deg)`,
        }}
        role="img"
        aria-label={`学习进度 ${label}`}
      >
        <span
          className={cn(
            "inline-flex h-full w-full items-center justify-center rounded-full bg-white text-center font-medium tabular-nums whitespace-nowrap text-kb-body",
            compact ? "text-[9px]" : "text-[11px]",
          )}
        >
          {label}
        </span>
      </span>
      {!compact && <span className="text-[10px] leading-none text-kb-muted">学习进度</span>}
    </span>
  );
}

function TopicLearningStatusTag({ status }: { status: DocReadStatus }) {
  const styles =
    status === "已学"
      ? "border-success/20 bg-success-soft text-success"
      : status === "学习中"
        ? "border-primary/20 bg-primary-soft text-primary"
        : "border-kb-border bg-kb-surface text-kb-muted";

  return (
    <span className={cn("rounded border px-1.5 py-px text-[10px]", styles)}>
      {getTopicStatusLabel(status)}
    </span>
  );
}

function getTopicDisplayProgress(topic: EnrichedTopic, state: MockState) {
  const actualProgress = getTopicProgress(topic.id, state);
  if (actualProgress > 0) return actualProgress;
  return TOPIC_PROGRESS_MOCK_IDS.has(topic.id) ? topic.progress : 0;
}

function getTopicDisplayStatus(topic: EnrichedTopic, state: MockState, progress: number) {
  const actualStatus = getTopicLearningStatus(topic.id, state);
  if (actualStatus !== "未学" || progress === 0) return actualStatus;
  return progress >= 100 ? "已学" : "学习中";
}

function getTopicVisual(topic: EnrichedTopic) {
  if (topic.roleTags.some((tag) => ["继保", "故障处置"].includes(tag))) {
    return TOPIC_VISUALS.amber;
  }
  if (topic.roleTags.some((tag) => ["电气", "调度", "涉网", "典型操作"].includes(tag))) {
    return TOPIC_VISUALS.blue;
  }
  return TOPIC_VISUALS.teal;
}

function getTopicActionLabel(status: DocReadStatus) {
  return status === "已学" ? "复习专题" : status === "学习中" ? "继续学习" : "开始学习";
}

function getTopicStatusLabel(status: DocReadStatus) {
  return status === "已学" ? "已学习" : status === "学习中" ? "学习中" : "未学习";
}

function MaterialWorkspace({
  query,
  onQueryChange,
  docType,
  onDocTypeChange,
  state,
}: {
  query: string;
  onQueryChange: (value: string) => void;
  docType: string;
  onDocTypeChange: (value: string) => void;
  state: MockState;
}) {
  const [statusFilter, setStatusFilter] = useState<DocReadStatus | "all">("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const docs = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return DOCS.map((doc) => ({ doc, status: getEffectiveDocStatus(doc.id, state) })).filter(
      ({ doc, status }) => {
        if (docType !== "all" && doc.docType !== docType) return false;
        if (statusFilter !== "all" && status !== statusFilter) return false;
        if (!normalized) return true;
        return [doc.title, doc.snippet, doc.source, doc.equipment, ...doc.highlight].some((value) =>
          value.toLowerCase().includes(normalized),
        );
      },
    );
  }, [docType, query, state, statusFilter]);
  const totalPages = Math.max(1, Math.ceil(docs.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageDocs = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return docs.slice(start, start + pageSize);
  }, [docs, pageSize, safePage]);

  useEffect(() => setPage(1), [query, docType, statusFilter]);
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const resetMaterialFilters = () => {
    onQueryChange("");
    onDocTypeChange("all");
    setStatusFilter("all");
  };

  return (
    <section className="flex h-full min-h-0 flex-col">
      <div className="mb-2.5 flex shrink-0 flex-wrap items-center justify-between gap-2">
        <h2 className="text-[15px] font-medium text-kb-heading">
          学习资料
          <span className="ml-2 text-[12px] font-normal text-kb-muted">
            按关键词、类型和学习状态查找
          </span>
        </h2>
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
          <label className="relative min-w-0 flex-1 sm:w-[280px] sm:flex-none">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-kb-muted" />
            <input
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder="搜索资料、设备或知识点"
              className="h-8 w-full rounded-md border border-kb-border bg-white pl-9 pr-3 text-[13px] outline-none placeholder:text-kb-muted focus:border-primary/60 focus:ring-2 focus:ring-primary/10"
            />
          </label>
          <select
            value={docType}
            onChange={(event) => onDocTypeChange(event.target.value)}
            className="h-8 rounded-md border border-kb-border bg-white px-3 text-[13px] text-kb-body outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/10"
            aria-label="资料类型"
          >
            <option value="all">全部类型</option>
            {DOC_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as DocReadStatus | "all")}
            className="h-8 rounded-md border border-kb-border bg-white px-3 text-[13px] text-kb-body outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/10"
            aria-label="学习状态"
          >
            <option value="all">全部状态</option>
            <option value="未学">未学</option>
            <option value="学习中">学习中</option>
            <option value="已学">已学</option>
          </select>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-kb-border bg-white">
        <div className="sticky top-0 z-10 hidden min-h-8 shrink-0 grid-cols-[minmax(0,1fr)_140px_130px_150px] items-center border-b border-divider bg-kb-table-head/80 px-5 text-[11px] text-kb-muted lg:grid">
          <span>资料名称</span>
          <span>类型</span>
          <span>来源</span>
          <span className="text-right">状态与操作</span>
        </div>
        {docs.length ? (
          <>
            <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto">
              {pageDocs.map(({ doc, status }) => (
                <MaterialRow key={doc.id} doc={doc} status={status} />
              ))}
            </div>
            <TableListPager
              page={safePage}
              totalPages={totalPages}
              totalItems={docs.length}
              pageSize={pageSize}
              onPageChange={setPage}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setPage(1);
              }}
            />
          </>
        ) : (
          <EmptyResult
            title="没有找到匹配资料"
            description="当前搜索、资料类型和学习状态组合下没有结果。"
            actionLabel="清除筛选"
            onAction={resetMaterialFilters}
          />
        )}
      </div>
    </section>
  );
}

function MaterialRow({ doc, status }: { doc: Doc; status: DocReadStatus }) {
  return (
    <Link
      to="/learn/doc/$id"
      params={{ id: doc.id }}
      className="group grid min-h-[64px] grid-cols-1 gap-3 border-b border-divider px-5 py-2.5 transition-colors last:border-b-0 hover:bg-primary-soft/15 lg:grid-cols-[minmax(0,1fr)_140px_130px_150px] lg:items-center"
    >
      <div className="flex min-w-0 items-start gap-3">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-primary-soft text-primary">
          <FileText className="h-4 w-4" />
        </span>
        <span className="min-w-0">
          <span className="block truncate text-[13.5px] font-medium text-kb-heading">
            {doc.title}
          </span>
          <span className="mt-0.5 block line-clamp-1 text-[11.5px] text-kb-muted">
            {doc.snippet}
          </span>
        </span>
      </div>
      <span className="text-[12px] text-kb-body max-lg:hidden">{doc.docType}</span>
      <span className="text-[12px] text-kb-muted max-lg:hidden">{doc.source}</span>
      <span className="flex items-center justify-between gap-3 lg:justify-end">
        <LearningStatus status={status} />
        <span className="text-[11.5px] text-primary">
          {status === "未学" ? "开始学习" : status === "已学" ? "回顾资料" : "继续学习"}
        </span>
        <ChevronRight className="h-4 w-4 text-kb-muted transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
      </span>
    </Link>
  );
}

function LearningStatus({ status, label = status }: { status: DocReadStatus; label?: string }) {
  return (
    <span className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap text-[10.5px] text-kb-muted">
      <span className={cn("h-1.5 w-1.5 rounded-full", STATUS_DOT_STYLE[status])} />
      {label}
    </span>
  );
}

function EmptyResult({
  title,
  description,
  actionLabel,
  onAction,
}: {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="grid min-h-0 flex-1 place-items-center px-6 text-center">
      <div>
        <div className="text-[14px] font-medium text-kb-heading">{title}</div>
        <div className="mt-1 text-[12px] text-kb-muted">{description}</div>
        {actionLabel && onAction && (
          <button
            type="button"
            onClick={onAction}
            className="mt-3 rounded-md border border-kb-border px-3 py-1.5 text-[12px] font-medium text-primary hover:bg-primary-soft"
          >
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  );
}

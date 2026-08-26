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
import { toast } from "sonner";
import {
  FileListRefreshButton,
  FileListSortButton,
} from "@/components/knowledge/workbench/KnowledgeFileTable";
import type { KnowledgeFile, KnowledgeSortBy } from "@/lib/knowledge/types";
import { LearningHome } from "@/components/learning/learning-home";
import { LearningBreadcrumb, LearningPageShell } from "@/components/learning/learning-breadcrumb";
import { RecentTopicAccess } from "@/components/learning/recent-topic-access";
import {
  ActionButton,
  CardBatchPager,
  FilterComboSelect,
  PageHeader,
  TableListPager,
} from "@/components/learning/ui";
import { DOCS, DOC_TYPES, type Doc } from "@/lib/mock/data";
import {
  getLearningMaterialFileByDocId,
  getLearningMaterialFiles,
} from "@/lib/learning/material-files";
import { buildFileDetailSearch } from "@/lib/knowledge/searchNav";
import { ENRICHED_TOPICS, type EnrichedTopic } from "@/lib/mock/learning-hub";
import {
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

const MATERIAL_SORT_OPTIONS: { value: KnowledgeSortBy; label: string }[] = [
  { value: "updated", label: "更新时间" },
  { value: "name", label: "资料名称" },
];

/** 一行 4 张，默认展示 3 行。 */
const TOPIC_CARD_PAGE_SIZE = 12;
const TOPIC_LIST_PAGE_SIZE = 20;
/** 专题列表演示进度。真实学习记录存在时始终优先使用真实数据。 */
const TOPIC_PROGRESS_MOCK_IDS = new Set(["t-newbie", "t-op", "t-fault", "t-agc", "t-safety"]);
/** 卡片上仅提示近期有资料/结构变更的专题，不展示学习状态。 */
const UPDATED_TOPIC_IDS = new Set(
  [...ENRICHED_TOPICS]
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
    .slice(0, 3)
    .map((topic) => topic.id),
);

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
    <LearningPageShell className="[&_h1]:font-semibold">
      <div className="shrink-0">
        <LearningBreadcrumb
          current="knowledge"
          trail={[{ label: tab === "materials" ? "学习资料" : "专题学习" }]}
        />
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
          />
        )}
      </div>
    </LearningPageShell>
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
  const [queryDraft, setQueryDraft] = useState(query);
  const [specialtyDraft, setSpecialtyDraft] = useState(specialty);
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
  useEffect(() => setQueryDraft(query), [query]);
  useEffect(() => setSpecialtyDraft(specialty), [specialty]);

  const applyTopicQuery = () => {
    onQueryChange(queryDraft.trim());
    onSpecialtyChange(specialtyDraft);
  };

  const resetTopicFilters = () => {
    setQueryDraft("");
    setSpecialtyDraft("all");
    onQueryChange("");
    onSpecialtyChange("all");
  };

  return (
    <div className="grid h-full min-h-0 gap-3 lg:grid-cols-[214px_minmax(0,1fr)]">
      <aside className="hidden min-h-0 lg:flex lg:flex-col lg:gap-2.5">
        <section className="flex min-h-0 flex-[7] flex-col overflow-hidden rounded-lg border border-kb-border bg-white p-2 shadow-[var(--shadow-card)]">
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
        </section>
        <RecentTopicAccess
          state={state}
          limit={5}
          className="flex min-h-0 min-h-[168px] flex-[3] flex-col overflow-hidden"
        />
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

        <div className="mb-2.5 shrink-0 space-y-2">
          <h2 className="text-[15px] font-medium text-kb-heading">
            {activeSpecialty.label}
            <span className="ml-2 text-[12px] font-normal text-kb-muted">
              共 {filteredTopics.length} 个可学习专题
            </span>
          </h2>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <form
              className="flex min-w-0 flex-1 flex-wrap items-center gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                applyTopicQuery();
              }}
            >
              <label className="relative block min-w-0 flex-1 sm:max-w-[280px] sm:flex-none sm:w-[240px]">
                <span className="sr-only">搜索专题</span>
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-kb-muted" />
                <input
                  value={queryDraft}
                  onChange={(event) => setQueryDraft(event.target.value)}
                  placeholder="搜索专题或专业关键词"
                  className="h-8 w-full rounded-md border border-kb-border bg-white pl-9 pr-3 text-[13px] text-kb-heading outline-none placeholder:text-kb-muted focus:border-primary/60 focus:ring-2 focus:ring-primary/10"
                />
              </label>

              {
                specialtyDraft == "all" && (
                  <FilterComboSelect
                    options={SPECIALTIES.map((item) => ({ value: item.key, label: item.label }))}
                    value={specialtyDraft}
                    onChange={(value) => setSpecialtyDraft(value as SpecialtyKey)}
                    placeholder="选择专业"
                    searchPlaceholder="筛选专业"
                    className="h-8 min-h-8 min-w-[132px] rounded-md"
                  />
                )
              }

              
              <ActionButton type="submit" className="h-8 rounded-md px-3.5">
                <Search className="h-3.5 w-3.5" aria-hidden />
                查询
              </ActionButton>
            </form>
            <TopicViewToggle value={viewMode} onChange={setViewMode} />
          </div>
        </div>

        {filteredTopics.length ? (
          viewMode === "card" ? (
            <>
              <div className="min-h-0 flex-1 overflow-y-auto pr-0.5 xl:overflow-hidden">
                <div className="grid content-start gap-2 p-0.5 md:grid-cols-2 md:auto-rows-fr xl:h-full xl:grid-cols-4 xl:grid-rows-3 xl:content-stretch">
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
                  className="mt-1.5 shrink-0 rounded-lg border border-kb-border bg-white px-3 py-0.5"
                />
              )}
            </>
          ) : (
            <section
              className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-kb-border bg-white"
              aria-label="专题列表"
            >
              <div className="hidden min-h-8 shrink-0 grid-cols-[minmax(0,1fr)_148px_64px_64px_72px_108px] items-center border-b border-divider bg-kb-table-head/80 px-5 text-[11px] text-kb-muted lg:grid">
                <span>专题</span>
                <span>标签</span>
                <span>资料</span>
                <span>练习</span>
                <span>进度</span>
                <span className="text-right">操作</span>
              </div>
              <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto">
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
  const visual = getTopicVisual(topic);
  const updatedLabel = formatTopicUpdatedAt(topic.updatedAt);

  return (
    <Link
      to="/learn/topic/$id"
      params={{ id: topic.id }}
      className="group relative flex h-full min-h-0 min-w-0 flex-col overflow-hidden rounded-lg border border-kb-border bg-white shadow-[var(--shadow-card)] transition-[transform,border-color,box-shadow] duration-200 ease-out hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-[var(--shadow-card-hover)] motion-reduce:hover:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25"
    >
      <span className={cn("absolute left-0 top-0 h-0.5 w-8 rounded-br-full", visual.accent)} />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-2 px-3.5 pb-2 pt-2.5">
        <div className="flex min-w-0 items-start justify-between gap-2">
          <div className="flex min-w-0 flex-wrap gap-1">
            {topic.roleTags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="rounded border border-primary/20 bg-primary-soft/60 px-1.5 py-px text-[12px] text-primary"
              >
                {tag}
              </span>
            ))}
            {isTopicUpdated(topic) && <TopicUpdatedTag />}
          </div>
          <span className="shrink-0 pt-px text-[10.5px] leading-4 text-kb-muted">
            {updatedLabel}
          </span>
        </div>
        <div className="flex min-w-0 items-start gap-2.5" style={{ marginTop: "10px" }}>
          <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary-soft text-primary">
            <BookOpenCheck className="h-4 w-4" aria-hidden />
          </span>
          <div className="min-w-0">
            <h3 className="text-[14px] font-semibold leading-5 tracking-[-0.01em] text-kb-heading">
              {topic.title}
            </h3>
            <p className="mt-0.5 line-clamp-2 text-[12px] leading-[18px] text-kb-muted">
              {topic.desc}
            </p>
          </div>
        </div>
        <div className="mt-auto flex items-center gap-2" style={{ marginBottom: "8px" }}>
          <span
            className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-kb-surface"
            aria-hidden
          >
            <span
              className="block h-full rounded-full bg-primary"
              style={{ width: `${Math.min(100, progress)}%` }}
            />
          </span>
          <span className="shrink-0 text-[10.5px] tabular-nums text-kb-muted">
            {progress > 0 ? `${progress}%` : "未开始"}
          </span>
        </div>
      </div>
      <div className="flex items-center justify-between gap-2 border-t border-kb-border/80 bg-kb-surface/45 px-3.5 py-1.5">
        <div className="flex min-w-0 items-center gap-2.5 text-[11px] text-kb-muted">
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
          进入专题
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  );
}

function TopicListRow({ topic, state }: { topic: EnrichedTopic; state: MockState }) {
  const progress = getTopicDisplayProgress(topic, state);
  const status = getTopicDisplayStatus(topic, state, progress);

  return (
    <Link
      to="/learn/topic/$id"
      params={{ id: topic.id }}
      className="group grid min-h-[48px] grid-cols-1 gap-2 border-b border-divider px-5 py-2 transition-colors last:border-b-0 hover:bg-primary-soft/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/25 lg:grid-cols-[minmax(0,1fr)_148px_64px_64px_72px_108px] lg:items-center"
    >
      <div className="min-w-0">
        <h3 className="truncate text-[13.5px] font-medium text-kb-heading">{topic.title}</h3>
        <p className="mt-0.5 line-clamp-1 text-[11.5px] text-kb-muted">{topic.desc}</p>
      </div>
      <div className="flex min-w-0 flex-wrap items-center gap-1">
        <span className="mr-1 text-[11px] text-kb-muted lg:hidden">标签</span>
        {topic.roleTags.slice(0, 2).map((tag) => (
          <span
            key={tag}
            className="rounded border border-primary/20 bg-primary-soft/60 px-1.5 py-px text-[12px] text-primary"
          >
            {tag}
          </span>
        ))}
        {isTopicUpdated(topic) && <TopicUpdatedTag />}
      </div>
      <span className="text-[12px] tabular-nums text-kb-body">
        <span className="mr-1 text-[11px] text-kb-muted lg:hidden">资料</span>
        {topic.docCount}
      </span>
      <span className="text-[12px] tabular-nums text-kb-body">
        <span className="mr-1 text-[11px] text-kb-muted lg:hidden">练习</span>
        {topic.questionCount}
      </span>
      <span className="text-[12px] tabular-nums text-kb-muted">
        <span className="mr-1 lg:hidden">进度</span>
        {progress > 0 ? `${progress}%` : "未开始"}
      </span>
      <span className="flex items-center justify-between gap-3 lg:justify-end">
        <span className="inline-flex items-center gap-1 text-[12px] font-medium text-primary">
          {getTopicActionLabel(status)}
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </span>
      </span>
    </Link>
  );
}

function TopicUpdatedTag() {
  return (
    <span className="rounded border border-amber-200 bg-amber-50 px-1.5 py-px text-[12px] text-amber-700">
      专题更新
    </span>
  );
}

function isTopicUpdated(topic: EnrichedTopic) {
  return UPDATED_TOPIC_IDS.has(topic.id);
}

function formatTopicUpdatedAt(value: string) {
  const parsed = Date.parse(value);
  if (!parsed) return "近期更新";
  return `${new Date(parsed).toLocaleDateString("zh-CN", { month: "numeric", day: "numeric" })} 更新`;
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

function MaterialWorkspace({
  query,
  onQueryChange,
  docType,
  onDocTypeChange,
}: {
  query: string;
  onQueryChange: (value: string) => void;
  docType: string;
  onDocTypeChange: (value: string) => void;
}) {
  const [queryDraft, setQueryDraft] = useState(query);
  const [docTypeDraft, setDocTypeDraft] = useState(docType);
  const [sortBy, setSortBy] = useState<KnowledgeSortBy>("updated");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const materialFiles = useMemo(() => getLearningMaterialFiles(), []);
  const docs = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const filtered = DOCS.filter((doc) => {
      if (docType !== "all" && doc.docType !== docType) return false;
      if (!normalized) return true;
      return [doc.title, doc.snippet, doc.source, doc.equipment, ...doc.highlight].some((value) =>
        value.toLowerCase().includes(normalized),
      );
    });
    return [...filtered].sort((left, right) => {
      if (sortBy === "name") return left.title.localeCompare(right.title, "zh-CN");
      return right.updatedAt.localeCompare(left.updatedAt);
    });
  }, [docType, query, sortBy]);
  const totalPages = Math.max(1, Math.ceil(docs.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageDocs = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return docs.slice(start, start + pageSize);
  }, [docs, pageSize, safePage]);

  useEffect(() => setPage(1), [query, docType, sortBy]);
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);
  useEffect(() => setQueryDraft(query), [query]);
  useEffect(() => setDocTypeDraft(docType), [docType]);

  const applyMaterialQuery = () => {
    onQueryChange(queryDraft.trim());
    onDocTypeChange(docTypeDraft);
  };

  const resetMaterialFilters = () => {
    setQueryDraft("");
    setDocTypeDraft("all");
    onQueryChange("");
    onDocTypeChange("all");
  };

  return (
    <section className="flex h-full min-h-0 flex-col">
      <div className="mb-2.5 flex shrink-0 flex-wrap items-center justify-between gap-2">
        <form
          className="flex min-w-0 flex-1 flex-wrap items-center gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            applyMaterialQuery();
          }}
        >
          <label className="relative min-w-0 flex-1 sm:max-w-[280px] sm:flex-none sm:w-[240px]">
            <span className="sr-only">搜索资料</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-kb-muted" />
            <input
              value={queryDraft}
              onChange={(event) => setQueryDraft(event.target.value)}
              placeholder="搜索资料、设备或知识点"
              className="h-9 w-full rounded-md border border-kb-border bg-white pl-9 pr-3 text-[13px] outline-none placeholder:text-kb-muted focus:border-primary/60 focus:ring-2 focus:ring-primary/10"
            />
          </label>
          <FilterComboSelect
            options={[
              { value: "all", label: "全部类型" },
              ...DOC_TYPES.map((type) => ({ value: type, label: type })),
            ]}
            value={docTypeDraft}
            onChange={setDocTypeDraft}
            placeholder="全部类型"
            searchPlaceholder="筛选类型"
            className="h-9 min-h-9 min-w-[132px] rounded-md"
          />
          <ActionButton type="submit" className="h-9 rounded-md px-3.5">
            <Search className="h-3.5 w-3.5" aria-hidden />
            查询
          </ActionButton>
        </form>
        <div className="flex shrink-0 items-center gap-2">
          <FileListSortButton
            value={sortBy}
            onChange={setSortBy}
            options={MATERIAL_SORT_OPTIONS}
            ariaLabel="知识排序"
          />
          <FileListRefreshButton
            onClick={() => {
              applyMaterialQuery();
              setPage(1);
              toast.message("列表已刷新");
            }}
          />
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-kb-border bg-white">
        <div className="sticky top-0 z-10 hidden min-h-8 shrink-0 grid-cols-[minmax(0,1fr)_140px_130px_96px] items-center border-b border-divider bg-kb-table-head/80 px-5 text-[11px] text-kb-muted lg:grid">
          <span>资料名称</span>
          <span>类型</span>
          <span>来源</span>
          <span className="text-right">操作</span>
        </div>
        {docs.length ? (
          <>
            <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto">
              {pageDocs.map((doc) => (
                <MaterialRow key={doc.id} doc={doc} materialFiles={materialFiles} />
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
            description="当前搜索和资料类型组合下没有结果。"
            actionLabel="清除筛选"
            onAction={resetMaterialFilters}
          />
        )}
      </div>
    </section>
  );
}

function MaterialRow({ doc, materialFiles }: { doc: Doc; materialFiles: KnowledgeFile[] }) {
  const file = getLearningMaterialFileByDocId(doc.id);
  if (!file) return null;

  return (
    <Link
      to="/knowledge/file/$fileId"
      params={{ fileId: file.id }}
      search={buildFileDetailSearch(file, {
        resultFiles: materialFiles,
        context: "learning-materials",
        from: "/learn?tab=materials",
      })}
      className="group grid min-h-[64px] grid-cols-1 gap-3 border-b border-divider px-5 py-2.5 transition-colors last:border-b-0 hover:bg-primary-soft/15 lg:grid-cols-[minmax(0,1fr)_140px_130px_96px] lg:items-center"
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
      <span className="flex items-center justify-end gap-1 text-[11.5px] text-primary">
        开始学习
        <ChevronRight className="h-4 w-4 text-kb-muted transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
      </span>
    </Link>
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

import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  GraduationCap,
  Layers,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  List,
  FileText,
  Calendar,
  Tag,
  Wrench,
  AlertTriangle,
  Activity,
  Users,
  Clock,
  PlayCircle,
  Brain,
  MessageSquare,
  Star,
  Flame,
  type LucideIcon,
} from "lucide-react";
import { PageShell } from "@/components/workbench/PageShell";
import { DOCS, DOC_TYPES, type LearnStatus } from "@/lib/mock/data";
import {
  CONTINUE_LEARNING,
  LEARNING_STATS,
  ENRICHED_TOPICS,
  RECENT_MATERIALS,
  DOC_READ_INSIGHTS_BY_ID,
} from "@/lib/mock/learning-hub";
import {
  PageHeader,
  SectionHeader,
  OverviewStatCard,
  ModuleTabs,
  ModulePanel,
  SearchBar,
  PillSelect,
  TopicCard,
  ListCard,
  Tag as UiTag,
  ProgressBar,
  EmptyState,
  listActionClass,
  learningBtnRadius,
  HeroOverviewCard,
  HeroOverviewBody,
  HeroActionRail,
  TableListPager,
  TABLE_PAGE_SIZE_DEFAULT,
} from "@/components/learning/ui";
import { getTopicHeaderTheme } from "@/components/learning/topic-art";
import {
  TodayActivityCard,
  SpacedReviewPanel,
  TodayReviewHeroCard,
} from "@/components/learning/spaced-review";
import {
  DocCardReadMeta,
  DocReadingHeatDashboard,
} from "@/components/learning/doc-reading-insights";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/learn/")({
  component: LearnPage,
  head: () => ({ meta: [{ title: "知识学习 · 涉网运行能力智能提升平台" }] }),
});

const STATUS_STYLE: Record<LearnStatus, string> = {
  未学: "bg-muted text-muted-foreground",
  学习中: "bg-primary-soft text-accent-foreground",
  已学: "bg-muted text-foreground",
  需复习: "bg-warning-soft text-warning-foreground",
};

const STATUS_LABEL: Record<LearnStatus, string> = {
  未学: "未学习",
  学习中: "学习中",
  已学: "已学习",
  需复习: "需复习",
};

const TOPIC_ICONS: Record<string, LucideIcon> = {
  "t-newbie": Users,
  "t-op": Wrench,
  "t-fault": AlertTriangle,
  "t-agc": Activity,
};

type TabKey = "topic" | "all" | "mine" | "review" | "recent";
type AllDocsSubView = "list" | "heat";

const LEARN_TABS: { key: TabKey; label: string; desc: string; icon: typeof Layers }[] = [
  { key: "topic", label: "专题学习", desc: "按专题浏览资料与练习", icon: Layers },
  { key: "all", label: "全部资料", desc: "规程、案例全库", icon: BookOpen },
  { key: "mine", label: "我的学习", desc: "进行中与需复习资料", icon: GraduationCap },
  { key: "review", label: "复习计划", desc: "艾宾浩斯间隔复习与待办", icon: Brain },
  { key: "recent", label: "最近更新", desc: "最新入库与学习动态", icon: Clock },
];

const LEARN_TAB_FILTERS: Record<TabKey, { value: string; label: string }[]> = {
  topic: [{ value: "all", label: "全部" }],
  all: [{ value: "all", label: "全部" }, ...DOC_TYPES.map((t) => ({ value: t, label: t }))],
  mine: [{ value: "all", label: "全部" }, ...DOC_TYPES.map((t) => ({ value: t, label: t }))],
  review: [{ value: "all", label: "全部" }],
  recent: [
    { value: "all", label: "全部" },
    { value: "规程", label: "规程" },
    // { value: "SOP", label: "SOP" },
    { value: "案例", label: "案例" },
    { value: "通知", label: "通知" },
  ],
};

const SEARCH_PLACEHOLDERS: Record<TabKey, string> = {
  topic: "搜索专题或资料",
  all: "搜索规程、案例、知识点、SOP",
  mine: "搜索我的学习资料",
  review: "搜索复习项",
  recent: "搜索最近更新资料",
};

const LEARN_TABLE_CARD_CLASS = "overflow-hidden rounded-md";
const LEARN_TABLE_HEAD_CLASS =
  "sticky top-0 z-10 bg-muted/95 text-[11.5px] text-muted-foreground backdrop-blur-sm";
const LEARN_TABLE_TH_CLASS = "px-5 py-3 text-left font-medium";

function LearnPage() {
  const [tab, setTab] = useState<TabKey>("topic");
  const [searchInput, setSearchInput] = useState("");
  const [appliedQuery, setAppliedQuery] = useState("");
  const [tabFilters, setTabFilters] = useState<Record<TabKey, string>>({
    topic: "all",
    all: "all",
    mine: "all",
    review: "all",
    recent: "all",
  });
  const [view, setView] = useState<"card" | "table">("card");
  const [allSubView, setAllSubView] = useState<AllDocsSubView>("list");

  const activeFilter = tabFilters[tab];
  const setActiveFilter = (value: string) => {
    setTabFilters((prev) => ({ ...prev, [tab]: value }));
  };

  const setTabAndReset = (t: TabKey) => {
    setTab(t);
    setSearchInput("");
    setAppliedQuery("");
    setAllSubView("list");
  };

  const handleSearch = () => {
    setAppliedQuery(searchInput.trim());
  };

  const filteredDocs = useMemo(
    () =>
      DOCS.filter(
        (d) =>
          (activeFilter === "all" || d.docType === activeFilter) &&
          (!appliedQuery ||
            d.title.includes(appliedQuery) ||
            d.highlight.some((h) => h.includes(appliedQuery))),
      ),
    [activeFilter, appliedQuery],
  );

  const myDocs = useMemo(
    () => DOCS.filter((d) => d.status === "学习中" || d.status === "需复习"),
    [],
  );

  const filteredMyDocs = useMemo(
    () =>
      myDocs.filter(
        (d) =>
          (activeFilter === "all" || d.docType === activeFilter) &&
          (!appliedQuery ||
            d.title.includes(appliedQuery) ||
            d.highlight.some((h) => h.includes(appliedQuery))),
      ),
    [myDocs, activeFilter, appliedQuery],
  );

  const filteredTopics = useMemo(() => {
    if (!appliedQuery) return ENRICHED_TOPICS;
    return ENRICHED_TOPICS.filter(
      (t) =>
        t.title.includes(appliedQuery) ||
        t.desc.includes(appliedQuery) ||
        t.roleTags.some((r) => r.includes(appliedQuery)),
    );
  }, [appliedQuery]);

  const filteredRecentMaterials = useMemo(() => {
    return RECENT_MATERIALS.filter((m) => {
      const doc = DOCS.find((d) => d.id === m.docId);
      if (!doc) return false;
      if (appliedQuery && !doc.title.includes(appliedQuery) && !m.topicTitle.includes(appliedQuery))
        return false;
      if (activeFilter !== "all" && m.typeLabel !== activeFilter) return false;
      return true;
    });
  }, [appliedQuery, activeFilter]);

  return (
    <PageShell>
      <PageHeader title="知识学习" />

      {/* 学习状态区：左栏继续学习 + 今日复习，右栏三张小卡 */}
      <section className="mb-6 grid gap-4 lg:grid-cols-[1.35fr_1fr]">
        <div className="grid gap-3 sm:grid-cols-[1.15fr_0.85fr]">
          <HeroOverviewCard
            action={
              <HeroActionRail
                label="继续阅读"
                icon={BookOpen}
                variant="primary"
                to="/learn/doc/$id"
                params={{ id: CONTINUE_LEARNING.lastDocId }}
              />
            }
          >
            <HeroOverviewBody>
              <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-background/80 px-2.5 py-1 text-[11px] font-medium text-primary">
                <PlayCircle className="h-3.5 w-3.5" />
                继续学习
              </div>
              <h2 className="mt-3 text-[18px] font-semibold leading-snug text-foreground">
                {CONTINUE_LEARNING.topicTitle}
              </h2>
              <p className="mt-1.5 text-[13px] text-muted-foreground">
                上次学习到：{CONTINUE_LEARNING.lastDocTitle}
              </p>
              <div className="mt-4 max-w-md">
                <div className="mb-1.5 flex justify-between text-[12px] text-muted-foreground">
                  <span>专题进度</span>
                  <span className="font-medium tabular-nums text-foreground">
                    {CONTINUE_LEARNING.progress}%
                  </span>
                </div>
                <ProgressBar value={CONTINUE_LEARNING.progress} />
              </div>
            </HeroOverviewBody>
          </HeroOverviewCard>

          <TodayReviewHeroCard onViewPlan={() => setTabAndReset("review")} />
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
          <OverviewStatCard
            label="已学专题"
            value={LEARNING_STATS.learnedTopics}
            hint={`共 ${ENRICHED_TOPICS.length} 个专题`}
            detail={`进行中：${CONTINUE_LEARNING.topicTitle}`}
            icon={<Layers className="h-[18px] w-[18px]" />}
            tint={0}
            emphasis="primary"
          />
          <OverviewStatCard
            label="已读资料"
            value={LEARNING_STATS.readDocs}
            hint={`库内 ${DOCS.length} 份资料`}
            detail={`最近：${CONTINUE_LEARNING.lastDocTitle.slice(0, 12)}…`}
            icon={<BookOpen className="h-[18px] w-[18px]" />}
            tint={1}
          />
          <TodayActivityCard className="col-span-2 lg:col-span-1" />
        </div>
      </section>

      {/* Tab 面板 */}
      <section className="mb-6">
        <ModulePanel>
          <ModuleTabs
            compact
            tabs={LEARN_TABS.map((t) => ({
              key: t.key,
              label: t.label,
              desc: t.desc,
              icon: <t.icon className="h-4 w-4" />,
            }))}
            value={tab}
            onChange={setTabAndReset}
          />

          {tab !== "review" && tab !== "topic" && !(tab === "all" && allSubView === "heat") && (
            <div className="flex flex-col gap-3 border-b border-divider px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex min-w-0 flex-1 flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:items-center">
                <SearchBar
                  value={searchInput}
                  onChange={setSearchInput}
                  onSearch={handleSearch}
                  placeholder={SEARCH_PLACEHOLDERS[tab]}
                />
                {LEARN_TAB_FILTERS[tab].length > 1 && (
                  <PillSelect
                    options={LEARN_TAB_FILTERS[tab]}
                    value={activeFilter}
                    onChange={setActiveFilter}
                  />
                )}
              </div>
              <div className="flex shrink-0 flex-wrap items-center gap-2">
                {tab === "all" && allSubView === "list" && (
                  <button
                    type="button"
                    onClick={() => setAllSubView("heat")}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1.5 text-[12px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
                      learningBtnRadius,
                    )}
                  >
                    <Flame className="h-3.5 w-3.5" />
                    阅读热度
                  </button>
                )}
                {(tab === "all" || tab === "mine") && allSubView === "list" && (
                  <ViewToggle view={view} setView={setView} />
                )}
              </div>
            </div>
          )}

          <div className={cn(tab === "all" && allSubView === "heat" ? "p-0" : "p-4")}>
            {tab === "topic" && (
              <section>
                <SectionHeader
                  title=""
                  subtitle="每个专题包含资料、题目与场景练习，可一键进入学习或生成训练题"
                />
                {filteredTopics.length === 0 ? (
                  <EmptyState description="暂无匹配的专题" />
                ) : (
                  <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
                    {filteredTopics.map((t) => {
                      const Icon = TOPIC_ICONS[t.id] ?? BookOpen;
                      return (
                        <Link
                          key={t.id}
                          to="/learn/topic/$id"
                          params={{ id: t.id }}
                          className="block"
                        >
                          <TopicCard
                            title={t.title}
                            desc={t.desc}
                            roleTags={t.roleTags}
                            docCount={t.docCount}
                            questionCount={t.questionCount}
                            scenarioCount={t.scenarioCount}
                            scenarioLabel={t.scenarioLabel}
                            progress={t.progress}
                            updatedAt={t.updatedAt}
                            icon={<Icon className="h-5 w-5" />}
                            headerTheme={getTopicHeaderTheme(t.id)}
                            action={
                              <span
                                className={cn(
                                  "inline-flex w-full items-center justify-center gap-1 border border-primary/20 bg-primary-soft/50 px-3 py-2 text-[12.5px] font-medium text-accent-foreground transition-colors group-hover:bg-primary group-hover:text-primary-foreground",
                                  learningBtnRadius,
                                )}
                              >
                                进入学习 <ChevronRight className="h-3.5 w-3.5" />
                              </span>
                            }
                          />
                        </Link>
                      );
                    })}
                  </div>
                )}
              </section>
            )}

            {tab === "all" && allSubView === "heat" && (
              <DocReadingHeatDashboard onBack={() => setAllSubView("list")} />
            )}

            {tab === "all" && allSubView === "list" && (
              <AllDocsPanel docs={filteredDocs} view={view} showReadMeta />
            )}

            {tab === "mine" && (
              <AllDocsPanel docs={filteredMyDocs} view={view} actionLabel="继续学习" />
            )}

            {tab === "review" && <SpacedReviewPanel embedded />}

            {tab === "recent" && (
              <section>
                <SectionHeader title="最近更新" subtitle="按更新时间排序的资料列表" />
                {filteredRecentMaterials.length === 0 ? (
                  <EmptyState description="暂无符合条件的资料" />
                ) : (
                  <RecentMaterialsList materials={filteredRecentMaterials} />
                )}
              </section>
            )}
          </div>
        </ModulePanel>
      </section>
    </PageShell>
  );
}

function RecentMaterialsList({ materials }: { materials: typeof RECENT_MATERIALS }) {
  return (
    <ListCard className={LEARN_TABLE_CARD_CLASS}>
      <div className="max-h-[min(32rem,60vh)] overflow-y-auto">
        <table className="w-full text-[13px]">
          <thead className={LEARN_TABLE_HEAD_CLASS}>
            <tr>
              <th className={LEARN_TABLE_TH_CLASS}>标题</th>
              <th className={LEARN_TABLE_TH_CLASS}>文件类型</th>
              <th className={LEARN_TABLE_TH_CLASS}>文件性质</th>
              <th className={LEARN_TABLE_TH_CLASS}>关联专题</th>
              <th className={LEARN_TABLE_TH_CLASS}>更新时间</th>
              <th className={LEARN_TABLE_TH_CLASS}>学习状态</th>
              <th className={cn(LEARN_TABLE_TH_CLASS, "text-right")}>操作</th>
            </tr>
          </thead>
          <tbody>
            {materials.map((m) => {
              const doc = DOCS.find((d) => d.id === m.docId);
              if (!doc) return null;
              return (
                <tr
                  key={m.docId}
                  className="border-t border-divider transition-colors hover:bg-muted/30"
                >
                  <td className="px-5 py-3">
                    <Link
                      to="/learn/doc/$id"
                      params={{ id: doc.id }}
                      className="font-medium hover:text-primary"
                    >
                      {doc.title}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-muted-foreground">{m.typeLabel}</td>
                  <td className="px-5 py-3 text-muted-foreground">{doc.source}</td>
                  <td className="px-5 py-3 text-muted-foreground">{m.topicTitle}</td>
                  <td className="px-5 py-3 tabular-nums text-muted-foreground">{m.updatedAt}</td>
                  <td className="px-5 py-3">
                    <span className={`rounded-md px-2 py-0.5 text-[11px] ${STATUS_STYLE[m.status]}`}>
                      {STATUS_LABEL[m.status]}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex flex-wrap justify-end gap-1.5">
                      <Link to="/learn/doc/$id" params={{ id: doc.id }} className={listActionClass("text")}>
                        <BookOpen className="h-3.5 w-3.5" />
                        阅读
                      </Link>
                      <Link
                        to="/chat"
                        search={{ prefill: `请基于资料《${doc.title}》总结要点` }}
                        className={listActionClass("text")}
                      >
                        <MessageSquare className="h-3.5 w-3.5" />
                        提问
                      </Link>
                      <Link to="/assets" search={{ tab: "fav" }} className={listActionClass("text")}>
                        <Star className="h-3.5 w-3.5" />
                        收藏
                      </Link>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </ListCard>
  );
}

function AllDocsPanel({
  docs,
  view,
  actionLabel = "开始学习",
  showReadMeta = false,
}: {
  docs: typeof DOCS;
  view: "card" | "table";
  actionLabel?: string;
  showReadMeta?: boolean;
}) {
  if (docs.length === 0) {
    return <EmptyState description="暂无符合条件的资料" />;
  }
  return view === "card" ? (
    <DocCardGrid docs={docs} actionLabel={actionLabel} showReadMeta={showReadMeta} />
  ) : (
    <DocList docs={docs} actionLabel={actionLabel} showReadMeta={showReadMeta} />
  );
}

function ViewToggle({
  view,
  setView,
  className,
}: {
  view: "card" | "table";
  setView: (v: "card" | "table") => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-1 rounded-md border border-border bg-card p-1",
        className,
      )}
    >
      <button
        type="button"
        onClick={() => setView("card")}
        className={cn(
          "inline-flex items-center gap-1 px-2 py-1 text-[11.5px] transition-colors",
          learningBtnRadius,
          view === "card"
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:bg-muted",
        )}
      >
        <LayoutGrid className="h-3.5 w-3.5" /> 卡片
      </button>
      <button
        type="button"
        onClick={() => setView("table")}
        className={cn(
          "inline-flex items-center gap-1 px-2 py-1 text-[11.5px] transition-colors",
          learningBtnRadius,
          view === "table"
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:bg-muted",
        )}
      >
        <List className="h-3.5 w-3.5" /> 表格
      </button>
    </div>
  );
}

const TYPE_ACCENT = "bg-primary-soft/50 text-primary";
const CARD_PAGE_SIZE = 6;

function DocList({
  docs,
  actionLabel = "开始学习",
  showReadMeta = false,
}: {
  docs: typeof DOCS;
  actionLabel?: string;
  showReadMeta?: boolean;
}) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(TABLE_PAGE_SIZE_DEFAULT);
  const totalPages = Math.max(1, Math.ceil(docs.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const pageDocs = docs.slice(startIndex, startIndex + pageSize);

  useEffect(() => {
    setPage(1);
  }, [docs]);

  useEffect(() => {
    setPage(1);
  }, [pageSize]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  return (
    <ListCard className={LEARN_TABLE_CARD_CLASS}>
      <div className="max-h-[min(32rem,60vh)] overflow-y-auto">
        <table className="w-full text-[13px]">
          <thead className={LEARN_TABLE_HEAD_CLASS}>
            <tr>
              <th className={LEARN_TABLE_TH_CLASS}>标题</th>
              <th className={LEARN_TABLE_TH_CLASS}>文件类型</th>
              <th className={LEARN_TABLE_TH_CLASS}>文件性质</th>
              {showReadMeta && <th className={LEARN_TABLE_TH_CLASS}>近7日阅读</th>}
              <th className={LEARN_TABLE_TH_CLASS}>学习状态</th>
              <th className={cn(LEARN_TABLE_TH_CLASS, "text-right")}>操作</th>
            </tr>
          </thead>
          <tbody>
            {pageDocs.map((d) => (
              <tr key={d.id} className="border-t border-divider transition-colors hover:bg-muted/30">
                <td className="px-5 py-3">
                  <Link
                    to="/learn/doc/$id"
                    params={{ id: d.id }}
                    className="font-medium hover:text-primary"
                  >
                    {d.title}
                  </Link>
                </td>
                <td className="px-5 py-3 text-muted-foreground">{d.docType}</td>
                <td className="px-5 py-3 text-muted-foreground">{d.source}</td>
                {showReadMeta && (
                  <td className="px-5 py-3 tabular-nums text-muted-foreground">
                    {DOC_READ_INSIGHTS_BY_ID[d.id] ? (
                      <span className="inline-flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {DOC_READ_INSIGHTS_BY_ID[d.id].readers7d} 人
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                )}
                <td className="px-5 py-3">
                  <span className={`rounded-md px-2 py-0.5 text-[11px] ${STATUS_STYLE[d.status]}`}>
                    {d.status}
                  </span>
                </td>
                <td className="px-5 py-3 text-right">
                  <Link to="/learn/doc/$id" params={{ id: d.id }} className={listActionClass("text")}>
                    <BookOpen className="h-3.5 w-3.5" />
                    {actionLabel}
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <TableListPager
        page={safePage}
        totalPages={totalPages}
        totalItems={docs.length}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
      />
    </ListCard>
  );
}

function DocCardPager({
  page,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}) {
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalItems);

  return (
    <div className="relative mt-2 pt-6" style={{ paddingTop: "5px" }}>
      <div
        className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-border to-transparent"
        aria-hidden
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="shrink-0 text-[12px] tabular-nums text-muted-foreground">
          第 <span className="font-medium text-foreground">{start}–{end}</span> 份，共{" "}
          <span className="font-medium text-foreground">{totalItems}</span> 份
        </p>

        <div className="flex items-center justify-center gap-2 sm:justify-end">
          <button
            type="button"
            onClick={() => onPageChange(page - 1)}
            disabled={page === 1}
            aria-label="上一批"
            className={cn(
              "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors",
              "hover:border-primary/30 hover:bg-muted hover:text-foreground",
              "disabled:pointer-events-none disabled:opacity-35",
            )}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <div
            className="flex items-center gap-1.5 rounded-full border border-border/80 bg-muted/30 px-2.5 py-1.5"
            role="tablist"
            aria-label="快速跳转批次"
          >
            {Array.from({ length: totalPages }).map((_, index) => {
              const pageNumber = index + 1;
              const active = pageNumber === page;
              return (
                <button
                  key={pageNumber}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  aria-label={`第 ${pageNumber} 批`}
                  title={`第 ${pageNumber} 批`}
                  onClick={() => onPageChange(pageNumber)}
                  className={cn(
                    "rounded-full transition-all duration-200",
                    active
                      ? "h-2 w-6 bg-primary shadow-[0_0_0_2px_hsl(var(--primary)/0.15)]"
                      : "h-2 w-2 bg-muted-foreground/25 hover:scale-125 hover:bg-primary/45",
                  )}
                />
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => onPageChange(page + 1)}
            disabled={page === totalPages}
            aria-label="下一批"
            className={cn(
              "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors",
              "hover:border-primary/30 hover:bg-muted hover:text-foreground",
              "disabled:pointer-events-none disabled:opacity-35",
            )}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

function DocCardGrid({
  docs,
  actionLabel = "开始学习",
  showReadMeta = false,
}: {
  docs: typeof DOCS;
  actionLabel?: string;
  showReadMeta?: boolean;
}) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(docs.length / CARD_PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const startIndex = (safePage - 1) * CARD_PAGE_SIZE;
  const pageDocs = docs.slice(startIndex, startIndex + CARD_PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [docs]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const goToPage = (nextPage: number) => {
    setPage(nextPage);
  };

  return (
    <div className="space-y-4">
      <div
        key={safePage}
        className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3 animate-in fade-in duration-300"
      >
        {pageDocs.map((d) => {
          return (
            <Link
              key={d.id}
              to="/learn/doc/$id"
              params={{ id: d.id }}
              className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)] transition-colors hover:border-primary/30"
            >
              <div
                className={`relative flex h-16 items-center justify-between px-4 ${TYPE_ACCENT}`}
              >
                <div className="inline-flex items-center gap-1.5 rounded-md bg-card/90 px-2 py-0.5 text-[10.5px] font-medium text-foreground">
                  <Tag className="h-3 w-3 text-primary" /> {d.docType}
                </div>
                <FileText className="h-7 w-7 text-primary/60" />
              </div>
              <div className="flex flex-1 flex-col p-5">
                <h3 className="line-clamp-2 min-h-[40px] text-[15px] font-semibold leading-snug group-hover:text-primary">
                  {d.title}
                </h3>
                <p className="mt-2 line-clamp-2 text-[12.5px] leading-relaxed text-muted-foreground">
                  {d.snippet}
                </p>
                <div className="mt-3 flex flex-wrap gap-1">
                  {d.highlight.slice(0, 3).map((h) => (
                    <UiTag key={h}>{h}</UiTag>
                  ))}
                </div>
                {showReadMeta && <DocCardReadMeta docId={d.id} relatedCount={d.related?.length} />}
                <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px] text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <Layers className="h-3 w-3" /> {d.source}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Wrench className="h-3 w-3" /> {d.equipment}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> {d.updatedAt}
                  </span>
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-divider pt-3">
                  <span className={`rounded-md px-2 py-0.5 text-[11px] ${STATUS_STYLE[d.status]}`}>
                    {d.status}
                  </span>
                  <span className="inline-flex items-center text-[12.5px] font-medium text-primary">
                    {actionLabel} <ChevronRight className="ml-0.5 h-3.5 w-3.5" />
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {totalPages > 1 && (
        <DocCardPager
          page={safePage}
          totalPages={totalPages}
          totalItems={docs.length}
          pageSize={CARD_PAGE_SIZE}
          onPageChange={goToPage}
        />
      )}
    </div>
  );
}

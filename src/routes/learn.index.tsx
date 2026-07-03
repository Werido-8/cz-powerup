import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
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
  Flame,
  Star,
  FlaskConical,
  Shield,
  ClipboardCheck,
  AlertCircle,
  Gauge,
  Zap,
  Layers3,
  PlusCircle,
  type LucideIcon,
} from "lucide-react";
import { PageShell } from "@/components/workbench/PageShell";
import { DOCS, DOC_TYPES, type LearnStatus } from "@/lib/mock/data";
import {
  ENRICHED_TOPICS,
  RECENT_UPDATES,
  RECENT_UPDATE_KIND_LABEL,
  DOC_READ_INSIGHTS_BY_ID,
  type EnrichedTopic,
  type RecentUpdateItem,
  type RecentUpdateKind,
} from "@/lib/mock/learning-hub";
import { getEffectiveDocStatus } from "@/lib/mock/learning-progress";
import {
  PageHeader,
  OverviewStatCard,
  SectionHeader,
  ModuleTabs,
  ModulePanel,
  SearchBar,
  AdaptiveFilterSelect,
  TopicCard,
  ListCard,
  Tag as UiTag,
  EmptyState,
  listActionClass,
  learningBtnRadius,
  TableListPager,
  TABLE_PAGE_SIZE_DEFAULT,
  CardBatchPager,
} from "@/components/learning/ui";
import { getTopicHeaderTheme } from "@/components/learning/topic-art";
// 本期暂不开放：复习计划
// import { DocReviewSimpleList } from "@/components/learning/spaced-review";
import { LearnRecentOverviewCard } from "@/components/learning/learn-recent-overview";
import { useMockStore } from "@/lib/mock/store";
import {
  DocCardReadMeta,
} from "@/components/learning/doc-reading-insights";
import {
  getDocIdsWithReturnedContributions,
  getReturnedContributionCount,
  getReturnedCountByDoc,
} from "@/lib/mock/my-question-contributions";
import { cn } from "@/lib/utils";

const learnSearchSchema = z.object({
  tab: z.enum(["topic", "all", "mine", "recent"]).optional().catch(undefined),
  filter: z.string().optional().catch(undefined),
});

export const Route = createFileRoute("/learn/")({
  validateSearch: learnSearchSchema,
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
  "t-chem": FlaskConical,
  "t-boiler": Flame,
  "t-relay": Shield,
  "t-dispatch": Zap,
  "t-safety": ClipboardCheck,
  "t-inspect": ClipboardCheck,
  "t-net": Activity,
  "t-meter": Gauge,
  "t-turbine": Gauge,
};

const TOPIC_ROLE_FILTERS = [
  "运行",
  "继保",
  "涉网",
  "调度",
  "典型操作",
  "故障处置",
  "化学",
  "锅炉",
  "汽机",
  "电气",
  "检修",
] as const;

type TabKey = "topic" | "all" | "mine" | "recent";

const LEARN_TABS: { key: TabKey; label: string; desc: string; icon: typeof Layers }[] = [
  { key: "topic", label: "专题学习", desc: "按专题浏览资料与练习", icon: Layers },
  { key: "all", label: "全部资料", desc: "规程、案例全库", icon: BookOpen },
  { key: "mine", label: "我的学习资料", desc: "已阅读资料与学习进度", icon: GraduationCap },
  { key: "recent", label: "最近更新", desc: "近期新增或更新的专题与资料", icon: Clock },
];

const LEARN_TAB_FILTERS: Record<TabKey, { value: string; label: string }[]> = {
  topic: [
    { value: "all", label: "全部" },
    ...TOPIC_ROLE_FILTERS.map((role) => ({ value: role, label: role })),
  ],
  all: [{ value: "all", label: "全部" }, ...DOC_TYPES.map((t) => ({ value: t, label: t }))],
  mine: [
    { value: "all", label: "全部" },
    ...DOC_TYPES.map((t) => ({ value: t, label: t })),
    { value: "pending_questions", label: "待改题目" },
  ],
  recent: [
    { value: "all", label: "全部" },
    { value: "topic_new", label: "新增专题" },
    { value: "topic_updated", label: "专题更新" },
    { value: "doc_new", label: "新增资料" },
    { value: "doc_version", label: "版本更新" },
  ],
};

const SEARCH_PLACEHOLDERS: Record<TabKey, string> = {
  topic: "搜索专题名称、简介或岗位标签",
  all: "搜索规程、案例、知识点、SOP",
  mine: "搜索我的学习资料",
  recent: "搜索专题、资料或更新说明",
};

const LEARN_TABLE_CARD_CLASS = "overflow-hidden rounded-md";
const LEARN_TABLE_HEAD_CLASS =
  "sticky top-0 z-10 bg-muted/95 text-[11.5px] text-muted-foreground backdrop-blur-sm";
const LEARN_TABLE_TH_CLASS = "px-5 py-3 text-left font-medium";
const TOPIC_CARD_PAGE_SIZE = 8;

function LearnPage() {
  const { state, updateDocProgress } = useMockStore();
  const navigate = useNavigate();
  const search = useSearch({ from: "/learn/" });
  const [tab, setTab] = useState<TabKey>(search.tab ?? "topic");
  const [searchInput, setSearchInput] = useState("");
  const [appliedQuery, setAppliedQuery] = useState("");
  const [tabFilters, setTabFilters] = useState<Record<TabKey, string>>({
    topic: "all",
    all: "all",
    mine: "all",
    recent: "all",
  });
  const [view, setView] = useState<"card" | "table">("card");
  /** 演示用：第三格概览在「资料库 / 待修改题目」间切换；auto 跟随真实退回数 */
  const [overviewPreview, setOverviewPreview] = useState<"auto" | "library" | "pending">("auto");

  const activeFilter = tabFilters[tab];
  const setActiveFilter = (value: string) => {
    setTabFilters((prev) => ({ ...prev, [tab]: value }));
  };

  useEffect(() => {
    if (search.tab) setTab(search.tab);
    if (search.tab === "mine" && search.filter) {
      setTabFilters((prev) => ({ ...prev, mine: search.filter! }));
    }
  }, [search.tab, search.filter]);

  const setTabAndReset = (t: TabKey) => {
    setTab(t);
    setSearchInput("");
    setAppliedQuery("");
    navigate({ to: "/learn", search: { tab: t }, replace: true });
  };

  const pendingQuestionCount = getReturnedContributionCount();
  const docIdsWithPending = useMemo(() => getDocIdsWithReturnedContributions(), []);

  const showPendingOverview =
    overviewPreview === "pending" ||
    (overviewPreview === "auto" && pendingQuestionCount > 0);

  const displayPendingCount =
    overviewPreview === "pending" && pendingQuestionCount === 0 ? 2 : pendingQuestionCount;

  const goToPendingMine = () => {
    setTab("mine");
    setTabFilters((prev) => ({ ...prev, mine: "pending_questions" }));
    setSearchInput("");
    setAppliedQuery("");
    navigate({
      to: "/learn",
      search: { tab: "mine", filter: "pending_questions" },
      replace: true,
    });
  };

  const toggleOverviewSlot = () => {
    setOverviewPreview((prev) => {
      const showingPending =
        prev === "pending" || (prev === "auto" && pendingQuestionCount > 0);
      return showingPending ? "library" : "pending";
    });
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
    () => DOCS.filter((d) => d.status === "学习中" || d.status === "已学" || d.status === "需复习"),
    [],
  );

  const filteredMyDocs = useMemo(() => {
    let list = myDocs;
    if (activeFilter === "pending_questions") {
      list = list.filter((d) => docIdsWithPending.includes(d.id));
    } else if (activeFilter !== "all") {
      list = list.filter((d) => d.docType === activeFilter);
    }
    if (appliedQuery) {
      list = list.filter(
        (d) =>
          d.title.includes(appliedQuery) ||
          d.highlight.some((h) => h.includes(appliedQuery)),
      );
    }
    return list;
  }, [myDocs, activeFilter, appliedQuery, docIdsWithPending]);

  const filteredTopics = useMemo(() => {
    return ENRICHED_TOPICS.filter((t) => {
      if (activeFilter !== "all" && !t.roleTags.includes(activeFilter)) return false;
      if (!appliedQuery) return true;
      return (
        t.title.includes(appliedQuery) ||
        t.desc.includes(appliedQuery) ||
        t.roleTags.some((r) => r.includes(appliedQuery))
      );
    });
  }, [appliedQuery, activeFilter]);

  const filteredRecentUpdates = useMemo(() => {
    return RECENT_UPDATES.filter((item) => {
      if (activeFilter !== "all" && item.kind !== activeFilter) return false;
      if (!appliedQuery) return true;
      const q = appliedQuery;
      return (
        item.title.includes(q) ||
        (item.summary?.includes(q) ?? false) ||
        (item.topicTitle?.includes(q) ?? false)
      );
    });
  }, [appliedQuery, activeFilter]);

  const topicsInProgress = useMemo(
    () => ENRICHED_TOPICS.filter((t) => t.progress > 0 && t.progress < 100).length,
    [],
  );

  const pillOptions = useMemo(() => {
    const base = LEARN_TAB_FILTERS[tab];
    if (tab !== "mine" || pendingQuestionCount === 0) return base;
    return base.map((o) =>
      o.value === "pending_questions"
        ? { ...o, label: `待改题目 (${pendingQuestionCount})` }
        : o,
    );
  }, [tab, pendingQuestionCount]);

  return (
    <PageShell>
      <PageHeader
        title="知识学习"
        subtitle="按专题系统学习规程与案例，积累岗位专业能力"
      />

      {/* 学习概览：第三格为资料库 / 待修改题目互斥；点击卡片主体可演示切换 */}
      <section className="mb-5 flex flex-nowrap items-stretch gap-3">
        <OverviewStatCard
          className="min-w-0 flex-[1_1_0%]"
          label="专题总数"
          value={ENRICHED_TOPICS.length}
          hint="全部学习专题"
          detail={`覆盖 ${ENRICHED_TOPICS.length} 个能力专题`}
          icon={<Layers className="h-[18px] w-[18px]" />}
          tint={0}
          emphasis="primary"
        />
        <OverviewStatCard
          className="min-w-0 flex-[1_1_0%]"
          label="正在学习"
          value={topicsInProgress}
          hint="进度进行中"
          detail={
            topicsInProgress > 0
              ? "可从最近阅读继续"
              : "选择下方专题开始学习"
          }
          icon={<GraduationCap className="h-[18px] w-[18px]" />}
          tint={1}
          emphasis="primary"
        />
        {showPendingOverview ? (
          <OverviewStatCard
            className="min-w-0 flex-[1_1_0%]"
            label="待修改题目"
            value={displayPendingCount}
            hint="审核退回待处理"
            detail={
              pendingQuestionCount > 0
                ? "点击跳转我的学习资料"
                : "演示：点击卡片切换为资料库"
            }
            icon={<AlertCircle className="h-[18px] w-[18px]" />}
            tint={2}
            emphasis="remind"
            onClick={toggleOverviewSlot}
            onDetailClick={pendingQuestionCount > 0 ? goToPendingMine : undefined}
          />
        ) : (
          <OverviewStatCard
            className="min-w-0 flex-[1_1_0%]"
            label="资料库"
            value={DOCS.length}
            hint="可学资料总量"
            detail={
              overviewPreview !== "auto"
                ? "演示：点击卡片切换为待修改题目"
                : "规程 / 案例 / 通知"
            }
            icon={<FileText className="h-[18px] w-[18px]" />}
            tint={2}
            emphasis="primary"
            onClick={toggleOverviewSlot}
          />
        )}
        <LearnRecentOverviewCard className="min-w-0 flex-[2.4_1_0%]" state={state} />
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

          <div className="flex flex-col gap-3 border-b border-divider px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex min-w-0 flex-1 flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:items-center">
                <SearchBar
                  value={searchInput}
                  onChange={setSearchInput}
                  onSearch={handleSearch}
                  placeholder={SEARCH_PLACEHOLDERS[tab]}
                />
                {pillOptions.length > 1 && (
                  <AdaptiveFilterSelect
                    options={pillOptions}
                    value={activeFilter}
                    onChange={setActiveFilter}
                    comboPlaceholder={
                      tab === "topic" ? "全部岗位" : tab === "recent" ? "全部更新" : "全部类型"
                    }
                    comboSearchPlaceholder={
                      tab === "topic"
                        ? "搜索岗位或专业标签"
                        : tab === "recent"
                          ? "搜索更新类型"
                          : "搜索资料类型"
                    }
                  />
                )}
              </div>
              <div className="flex shrink-0 flex-wrap items-center gap-2">
                {(tab === "all" || tab === "mine" || tab === "topic") && (
                  <ViewToggle view={view} setView={setView} />
                )}
              </div>
            </div>

          <div className="p-4">
            {tab === "topic" && (
              <section>
                <SectionHeader
                  title=""
                  subtitle="每个专题包含资料、题目与场景练习，可一键进入学习或生成训练题"
                />
                {topicsInProgress === 0 &&
                  !appliedQuery &&
                  activeFilter === "all" &&
                  filteredTopics.length > 0 && (
                  <div className="mb-4 rounded-lg border border-dashed border-border bg-muted/20 px-4 py-3 text-[13px] text-muted-foreground">
                    您还没有正在学习的专题，选择下方专题开始学习吧。
                  </div>
                )}
                <TopicPanel topics={filteredTopics} view={view} />
              </section>
            )}

            {tab === "all" && (
              <AllDocsPanel docs={filteredDocs} view={view} showReadMeta />
            )}

            {tab === "mine" && (
              <div className="space-y-6">
                {activeFilter === "pending_questions" && pendingQuestionCount > 0 && (
                  <div className="rounded-lg border border-destructive/25 bg-destructive/5 px-4 py-3 text-[13px] text-destructive/90">
                    以下资料有题目被审核退回,请点击进入资料页修改后重新提交。
                  </div>
                )}
                <AllDocsPanel
                  docs={filteredMyDocs}
                  view={view}
                  showContributionMeta
                  emptyDescription={
                    activeFilter === "pending_questions"
                      ? "暂无待修改的题目,继续保持"
                      : "暂无符合条件的资料"
                  }
                />
                {/* 本期暂不开放：复习计划 <DocReviewSimpleList /> */}
              </div>
            )}

            {tab === "recent" && (
              <section>
                <SectionHeader
                  title="最近更新"
                  subtitle="展示近期新增或更新的专题与学习资料，可按类型筛选"
                />
                {filteredRecentUpdates.length === 0 ? (
                  <EmptyState description="暂无符合条件的更新记录" />
                ) : (
                  <RecentUpdatesList
                    items={filteredRecentUpdates}
                    state={state}
                    onAddToLearning={(docId) => {
                      updateDocProgress(docId, { readStatus: "学习中" });
                      toast.success("已加入我的学习资料");
                    }}
                  />
                )}
              </section>
            )}
          </div>
        </ModulePanel>
      </section>
    </PageShell>
  );
}

const UPDATE_KIND_STYLE: Record<RecentUpdateKind, string> = {
  topic_new: "bg-primary-soft text-primary",
  topic_updated: "bg-accent/15 text-accent-foreground",
  doc_new: "bg-success-soft text-success",
  doc_version: "bg-warning-soft text-warning-foreground",
};

function RecentUpdatesList({
  items,
  state,
  onAddToLearning,
}: {
  items: RecentUpdateItem[];
  state: ReturnType<typeof useMockStore>["state"];
  onAddToLearning: (docId: string) => void;
}) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(TABLE_PAGE_SIZE_DEFAULT);
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const pageItems = items.slice(startIndex, startIndex + pageSize);

  useEffect(() => {
    setPage(1);
  }, [items]);

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
      <div className="max-h-[min(36rem,65vh)] overflow-y-auto">
        <table className="w-full text-[13px]">
          <thead className={LEARN_TABLE_HEAD_CLASS}>
            <tr>
              <th className={LEARN_TABLE_TH_CLASS}>标题</th>
              <th className={LEARN_TABLE_TH_CLASS}>更新类型</th>
              <th className={LEARN_TABLE_TH_CLASS}>关联专题</th>
              <th className={LEARN_TABLE_TH_CLASS}>文件类型</th>
              <th className={LEARN_TABLE_TH_CLASS}>更新时间</th>
              <th className={cn(LEARN_TABLE_TH_CLASS, "text-right")}>操作</th>
            </tr>
          </thead>
          <tbody>
            {pageItems.map((item) => {
              const isTopic = item.kind === "topic_new" || item.kind === "topic_updated";
              const docStatus =
                item.docId != null ? getEffectiveDocStatus(item.docId, state) : null;
              const inLearning = docStatus === "学习中" || docStatus === "已学";

              return (
                <tr
                  key={item.id}
                  className="border-t border-divider transition-colors hover:bg-muted/30"
                >
                  <td className="px-5 py-3">
                    {isTopic && item.topicId ? (
                      <Link
                        to="/learn/topic/$id"
                        params={{ id: item.topicId }}
                        className="font-medium hover:text-primary"
                      >
                        {item.title}
                      </Link>
                    ) : item.docId ? (
                      <Link
                        to="/learn/doc/$id"
                        params={{ id: item.docId }}
                        className="font-medium hover:text-primary"
                      >
                        {item.title}
                      </Link>
                    ) : (
                      <span className="font-medium">{item.title}</span>
                    )}
                    {item.summary && (
                      <div className="mt-0.5 line-clamp-1 text-[11.5px] text-muted-foreground">
                        {item.summary}
                      </div>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium",
                        UPDATE_KIND_STYLE[item.kind],
                      )}
                    >
                      {item.kind.startsWith("topic") ? (
                        <Layers3 className="h-3 w-3" />
                      ) : (
                        <FileText className="h-3 w-3" />
                      )}
                      {RECENT_UPDATE_KIND_LABEL[item.kind]}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-muted-foreground">
                    {item.topicTitle ? (
                      item.topicId ? (
                        <Link
                          to="/learn/topic/$id"
                          params={{ id: item.topicId }}
                          className="hover:text-primary"
                        >
                          {item.topicTitle}
                        </Link>
                      ) : (
                        item.topicTitle
                      )
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-5 py-3 text-muted-foreground">{item.typeLabel ?? "—"}</td>
                  <td className="px-5 py-3 tabular-nums text-muted-foreground">{item.updatedAt}</td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex flex-wrap justify-end gap-1.5">
                      {isTopic && item.topicId ? (
                        <Link
                          to="/learn/topic/$id"
                          params={{ id: item.topicId }}
                          className={listActionClass("text")}
                        >
                          <BookOpen className="h-3.5 w-3.5" />
                          进入专题
                        </Link>
                      ) : item.docId ? (
                        <>
                          <Link
                            to="/learn/doc/$id"
                            params={{ id: item.docId }}
                            className={listActionClass("text")}
                          >
                            <BookOpen className="h-3.5 w-3.5" />
                            {inLearning ? "继续学习" : "阅读"}
                          </Link>
                          {!inLearning && (
                            <button
                              type="button"
                              onClick={() => onAddToLearning(item.docId!)}
                              className={listActionClass("text")}
                            >
                              <PlusCircle className="h-3.5 w-3.5" />
                              加入学习
                            </button>
                          )}
                        </>
                      ) : null}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <TableListPager
        page={safePage}
        totalPages={totalPages}
        totalItems={items.length}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
      />
    </ListCard>
  );
}

function AllDocsPanel({
  docs,
  view,
  actionLabel = "开始学习",
  showReadMeta = false,
  showContributionMeta = false,
  emptyDescription = "暂无符合条件的资料",
}: {
  docs: typeof DOCS;
  view: "card" | "table";
  actionLabel?: string;
  showReadMeta?: boolean;
  showContributionMeta?: boolean;
  emptyDescription?: string;
}) {
  if (docs.length === 0) {
    return <EmptyState description={emptyDescription} />;
  }
  return view === "card" ? (
    <DocCardGrid
      docs={docs}
      actionLabel={actionLabel}
      showReadMeta={showReadMeta}
      showContributionMeta={showContributionMeta}
    />
  ) : (
    <DocList
      docs={docs}
      actionLabel={actionLabel}
      showReadMeta={showReadMeta}
      showContributionMeta={showContributionMeta}
    />
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

function topicEnterAction() {
  return (
    <span
      className={cn(
        "inline-flex w-full items-center justify-center gap-1 border border-primary/20 bg-primary-soft/50 px-3 py-2 text-[12.5px] font-medium text-accent-foreground transition-colors group-hover:bg-primary group-hover:text-primary-foreground",
        learningBtnRadius,
      )}
    >
      进入学习 <ChevronRight className="h-3.5 w-3.5" />
    </span>
  );
}

function TopicPanel({ topics, view }: { topics: EnrichedTopic[]; view: "card" | "table" }) {
  if (topics.length === 0) {
    return <EmptyState description="暂无匹配的专题，可浏览全部资料自由检索" />;
  }
  return view === "card" ? <TopicCardGrid topics={topics} /> : <TopicTable topics={topics} />;
}

function TopicCardGrid({ topics }: { topics: EnrichedTopic[] }) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(topics.length / TOPIC_CARD_PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const startIndex = (safePage - 1) * TOPIC_CARD_PAGE_SIZE;
  const pageTopics = topics.slice(startIndex, startIndex + TOPIC_CARD_PAGE_SIZE);

  useEffect(() => {
    setPage(1);
  }, [topics]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  return (
    <div className="space-y-4">
      <div
        key={safePage}
        className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4 animate-in fade-in duration-300"
      >
        {pageTopics.map((t) => {
          const Icon = TOPIC_ICONS[t.id] ?? BookOpen;
          return (
            <Link
              key={t.id}
              to="/learn/topic/$id"
              params={{ id: t.id }}
              className="group block"
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
                action={topicEnterAction()}
              />
            </Link>
          );
        })}
      </div>

      {totalPages > 1 && (
        <CardBatchPager
          page={safePage}
          totalPages={totalPages}
          totalItems={topics.length}
          pageSize={TOPIC_CARD_PAGE_SIZE}
          onPageChange={setPage}
        />
      )}
    </div>
  );
}

function TopicTable({ topics }: { topics: EnrichedTopic[] }) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(TABLE_PAGE_SIZE_DEFAULT);
  const totalPages = Math.max(1, Math.ceil(topics.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const pageTopics = topics.slice(startIndex, startIndex + pageSize);

  useEffect(() => {
    setPage(1);
  }, [topics]);

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
              <th className={LEARN_TABLE_TH_CLASS}>专题名称</th>
              <th className={LEARN_TABLE_TH_CLASS}>岗位标签</th>
              <th className={LEARN_TABLE_TH_CLASS}>资料</th>
              <th className={LEARN_TABLE_TH_CLASS}>题目</th>
              <th className={LEARN_TABLE_TH_CLASS}>学习进度</th>
              <th className={LEARN_TABLE_TH_CLASS}>更新时间</th>
              <th className={cn(LEARN_TABLE_TH_CLASS, "text-right")}>操作</th>
            </tr>
          </thead>
          <tbody>
            {pageTopics.map((t) => (
              <tr key={t.id} className="border-t border-divider transition-colors hover:bg-muted/30">
                <td className="px-5 py-3">
                  <Link
                    to="/learn/topic/$id"
                    params={{ id: t.id }}
                    className="font-medium hover:text-primary"
                  >
                    {t.title}
                  </Link>
                  <div className="mt-0.5 line-clamp-1 text-[11.5px] text-muted-foreground">{t.desc}</div>
                </td>
                <td className="px-5 py-3">
                  <div className="flex flex-wrap gap-1">
                    {t.roleTags.map((tag) => (
                      <UiTag key={tag}>{tag}</UiTag>
                    ))}
                  </div>
                </td>
                <td className="px-5 py-3 tabular-nums text-muted-foreground">{t.docCount}</td>
                <td className="px-5 py-3 tabular-nums text-muted-foreground">{t.questionCount}</td>
                <td className="px-5 py-3 tabular-nums text-muted-foreground">{t.progress}%</td>
                <td className="px-5 py-3 tabular-nums text-muted-foreground">{t.updatedAt ?? "—"}</td>
                <td className="px-5 py-3 text-right">
                  <Link to="/learn/topic/$id" params={{ id: t.id }} className={listActionClass("text")}>
                    <BookOpen className="h-3.5 w-3.5" />
                    进入学习
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
        totalItems={topics.length}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
      />
    </ListCard>
  );
}

function DocList({
  docs,
  actionLabel = "开始学习",
  showReadMeta = false,
  showContributionMeta = false,
}: {
  docs: typeof DOCS;
  actionLabel?: string;
  showReadMeta?: boolean;
  showContributionMeta?: boolean;
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
            {pageDocs.map((d) => {
              const pendingCount = showContributionMeta ? getReturnedCountByDoc(d.id) : 0;
              const rowAction =
                pendingCount > 0 ? "处理待改题目" : actionLabel === "开始学习" ? "继续学习" : actionLabel;
              return (
              <tr key={d.id} className="border-t border-divider transition-colors hover:bg-muted/30">
                <td className="px-5 py-3">
                  <Link
                    to="/learn/doc/$id"
                    params={{ id: d.id }}
                    search={pendingCount > 0 ? { focus: "contributions" } : undefined}
                    className="font-medium hover:text-primary"
                  >
                    {d.title}
                  </Link>
                  {pendingCount > 0 && (
                    <div className="mt-1 inline-flex items-center gap-1 rounded-md bg-destructive/10 px-1.5 py-0.5 text-[10.5px] font-medium text-destructive">
                      <AlertCircle className="h-3 w-3" />
                      {pendingCount} 题待改
                    </div>
                  )}
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
                  <Link
                    to="/learn/doc/$id"
                    params={{ id: d.id }}
                    search={pendingCount > 0 ? { focus: "contributions" } : undefined}
                    className={listActionClass("text")}
                  >
                    <BookOpen className="h-3.5 w-3.5" />
                    {rowAction}
                  </Link>
                </td>
              </tr>
            );
            })}
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

function DocCardGrid({
  docs,
  actionLabel = "开始学习",
  showReadMeta = false,
  showContributionMeta = false,
}: {
  docs: typeof DOCS;
  actionLabel?: string;
  showReadMeta?: boolean;
  showContributionMeta?: boolean;
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
          const pendingCount = showContributionMeta ? getReturnedCountByDoc(d.id) : 0;
          const cardAction = pendingCount > 0 ? "处理待改题目" : actionLabel === "开始学习" ? "继续学习" : actionLabel;
          return (
            <Link
              key={d.id}
              to="/learn/doc/$id"
              params={{ id: d.id }}
              search={pendingCount > 0 ? { focus: "contributions" } : undefined}
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
                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-divider pt-3">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className={`rounded-md px-2 py-0.5 text-[11px] ${STATUS_STYLE[d.status]}`}>
                      {d.status}
                    </span>
                    {pendingCount > 0 && (
                      <span className="inline-flex items-center gap-0.5 rounded-md bg-destructive/10 px-2 py-0.5 text-[10.5px] font-medium text-destructive">
                        <AlertCircle className="h-3 w-3" />
                        {pendingCount} 题待改
                      </span>
                    )}
                  </div>
                  <span
                    className={cn(
                      "inline-flex items-center text-[12.5px] font-medium",
                      pendingCount > 0 ? "text-destructive" : "text-primary",
                    )}
                  >
                    {cardAction} <ChevronRight className="ml-0.5 h-3.5 w-3.5" />
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {totalPages > 1 && (
        <CardBatchPager
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

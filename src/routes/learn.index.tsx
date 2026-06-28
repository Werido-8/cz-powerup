import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  BookOpen,
  GraduationCap,
  Layers,
  ChevronRight,
  LayoutGrid,
  List,
  FileText,
  Building2,
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
  type LucideIcon,
} from "lucide-react";
import { PageShell } from "@/components/workbench/PageShell";
import { DOCS, DOC_TYPES, type LearnStatus } from "@/lib/mock/data";
import {
  CONTINUE_LEARNING,
  LEARNING_STATS,
  ENRICHED_TOPICS,
  RECENT_MATERIALS,
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
} from "@/components/learning/ui";
import { getTopicHeaderTheme } from "@/components/learning/topic-art";
import { TodayActivityCard, SpacedReviewPanel, TodayReviewHeroCard } from "@/components/learning/spaced-review";
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

const LEARN_TABS: { key: TabKey; label: string; desc: string; icon: typeof Layers }[] = [
  { key: "topic", label: "专题学习", desc: "按专题浏览资料与练习", icon: Layers },
  { key: "all", label: "全部资料", desc: "规程、案例与 SOP 全库", icon: BookOpen },
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
    { value: "SOP", label: "SOP" },
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

const RECENT_LIST_GRID =
  "md:grid md:grid-cols-[minmax(0,2.2fr)_0.55fr_minmax(0,1.1fr)_0.8fr_0.7fr_minmax(128px,1fr)] md:items-center md:gap-3";

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

  const activeFilter = tabFilters[tab];
  const setActiveFilter = (value: string) => {
    setTabFilters((prev) => ({ ...prev, [tab]: value }));
  };

  const setTabAndReset = (t: TabKey) => {
    setTab(t);
    setSearchInput("");
    setAppliedQuery("");
  };

  const handleSearch = () => {
    setAppliedQuery(searchInput.trim());
  };

  const filteredDocs = useMemo(
    () =>
      DOCS.filter(
        (d) =>
          (activeFilter === "all" || d.docType === activeFilter) &&
          (!appliedQuery || d.title.includes(appliedQuery) || d.highlight.some((h) => h.includes(appliedQuery))),
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
          (!appliedQuery || d.title.includes(appliedQuery) || d.highlight.some((h) => h.includes(appliedQuery))),
      ),
    [myDocs, activeFilter, appliedQuery],
  );

  const filteredTopics = useMemo(() => {
    if (!appliedQuery) return ENRICHED_TOPICS;
    return ENRICHED_TOPICS.filter(
      (t) => t.title.includes(appliedQuery) || t.desc.includes(appliedQuery) || t.roleTags.some((r) => r.includes(appliedQuery)),
    );
  }, [appliedQuery]);

  const filteredRecentMaterials = useMemo(() => {
    return RECENT_MATERIALS.filter((m) => {
      const doc = DOCS.find((d) => d.id === m.docId);
      if (!doc) return false;
      if (appliedQuery && !doc.title.includes(appliedQuery) && !m.topicTitle.includes(appliedQuery)) return false;
      if (activeFilter !== "all" && m.typeLabel !== activeFilter) return false;
      return true;
    });
  }, [appliedQuery, activeFilter]);

  return (
    <PageShell>
      <PageHeader
        title="知识学习"
        subtitle="专题学习 + 资料浏览 + 学习状态 + 训练 / 问答 / 沉淀联动"
      />

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
            tabs={LEARN_TABS.map((t) => ({
              key: t.key,
              label: t.label,
              desc: t.desc,
              icon: <t.icon className="h-4 w-4" />,
            }))}
            value={tab}
            onChange={setTabAndReset}
          />

          {tab !== "review" && tab !== "topic" && (
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
              {(tab === "all" || tab === "mine") && <ViewToggle view={view} setView={setView} />}
            </div>
          )}

          <div className="p-4">
      {tab === "topic" && (
        <section>
          <SectionHeader title="专题学习" subtitle="每个专题包含资料、题目与场景练习，可一键进入学习或生成训练题" />
          {filteredTopics.length === 0 ? (
            <EmptyState description="暂无匹配的专题" />
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
              {filteredTopics.map((t) => {
                const Icon = TOPIC_ICONS[t.id] ?? BookOpen;
                return (
                  <Link key={t.id} to="/learn/topic/$id" params={{ id: t.id }} className="block">
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
                        <span className={cn("inline-flex w-full items-center justify-center gap-1 border border-primary/20 bg-primary-soft/50 px-3 py-2 text-[12.5px] font-medium text-accent-foreground transition-colors group-hover:bg-primary group-hover:text-primary-foreground", learningBtnRadius)}>
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

      {tab === "all" && (
        <AllDocsPanel docs={filteredDocs} view={view} />
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
    <ListCard>
      <div
        className={`hidden border-b border-divider px-5 py-3 text-[11.5px] font-medium text-muted-foreground ${RECENT_LIST_GRID}`}
      >
        <span>资料标题</span>
        <span>类型</span>
        <span>关联专题</span>
        <span>更新时间</span>
        <span>学习状态</span>
        <span className="text-right">操作</span>
      </div>
      {materials.map((m) => {
        const doc = DOCS.find((d) => d.id === m.docId);
        if (!doc) return null;
        return (
          <div
            key={m.docId}
            className={`border-t border-divider px-5 py-4 transition-colors first:border-t-0 hover:bg-muted/20 ${RECENT_LIST_GRID}`}
          >
            <div className="min-w-0 text-[14px] font-medium leading-snug text-foreground">{doc.title}</div>
            <UiTag variant="outline" className="w-fit">
              {m.typeLabel}
            </UiTag>
            <span className="truncate text-[12.5px] text-muted-foreground">{m.topicTitle}</span>
            <span className="text-[12.5px] tabular-nums text-muted-foreground">{m.updatedAt}</span>
            <span
              className={`inline-flex w-fit rounded-md px-2 py-0.5 text-[11px] ${STATUS_STYLE[m.status]}`}
            >
              {STATUS_LABEL[m.status]}
            </span>
            <div className="flex flex-wrap justify-start gap-1.5 md:justify-end">
              <Link to="/learn/doc/$id" params={{ id: doc.id }} className={listActionClass()}>
                <BookOpen className="h-3.5 w-3.5" />
                阅读
              </Link>
              <Link
                to="/chat"
                search={{ prefill: `请基于资料《${doc.title}》总结要点` }}
                className={listActionClass()}
              >
                <MessageSquare className="h-3.5 w-3.5" />
                提问
              </Link>
              <Link to="/assets" search={{ tab: "fav" }} className={listActionClass("soft")}>
                <Star className="h-3.5 w-3.5" />
                收藏
              </Link>
            </div>
          </div>
        );
      })}
    </ListCard>
  );
}

function AllDocsPanel({
  docs,
  view,
  actionLabel = "开始学习",
}: {
  docs: typeof DOCS;
  view: "card" | "table";
  actionLabel?: string;
}) {
  if (docs.length === 0) {
    return <EmptyState description="暂无符合条件的资料" />;
  }
  return view === "card" ? (
    <DocCardGrid docs={docs} actionLabel={actionLabel} />
  ) : (
    <DocList docs={docs} actionLabel={actionLabel} />
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
    <div className={cn("flex items-center gap-1 rounded-md border border-border bg-card p-1", className)}>
      <button
        type="button"
        onClick={() => setView("card")}
        className={cn(
          "inline-flex items-center gap-1 px-2 py-1 text-[11.5px] transition-colors",
          learningBtnRadius,
          view === "card" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted",
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
          view === "table" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted",
        )}
      >
        <List className="h-3.5 w-3.5" /> 表格
      </button>
    </div>
  );
}

function DocList({ docs, actionLabel = "开始学习" }: { docs: typeof DOCS; actionLabel?: string }) {
  return (
    <ListCard>
      <table className="w-full text-[13px]">
        <thead className="bg-muted/40 text-[11.5px] text-muted-foreground">
          <tr>
            <th className="px-5 py-3 text-left font-medium">标题</th>
            <th className="px-5 py-3 text-left font-medium">类型</th>
            <th className="px-5 py-3 text-left font-medium">厂站</th>
            <th className="px-5 py-3 text-left font-medium">学习状态</th>
            <th className="px-5 py-3 text-right font-medium">操作</th>
          </tr>
        </thead>
        <tbody>
          {docs.map((d) => (
            <tr key={d.id} className="border-t border-divider transition-colors hover:bg-muted/30">
              <td className="px-5 py-3">
                <Link to="/learn/doc/$id" params={{ id: d.id }} className="font-medium hover:text-primary">
                  {d.title}
                </Link>
              </td>
              <td className="px-5 py-3 text-muted-foreground">{d.docType}</td>
              <td className="px-5 py-3 text-muted-foreground">{d.plant}</td>
              <td className="px-5 py-3">
                <span className={`rounded-md px-2 py-0.5 text-[11px] ${STATUS_STYLE[d.status]}`}>
                  {d.status}
                </span>
              </td>
              <td className="px-5 py-3 text-right">
                <Link to="/learn/doc/$id" params={{ id: d.id }} className={listActionClass()}>
                  <BookOpen className="h-3.5 w-3.5" />
                  {actionLabel}
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </ListCard>
  );
}

const TYPE_ACCENT = "bg-primary-soft/50 text-primary";

function DocCardGrid({ docs, actionLabel = "开始学习" }: { docs: typeof DOCS; actionLabel?: string }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {docs.map((d) => {
        return (
          <Link
            key={d.id}
            to="/learn/doc/$id"
            params={{ id: d.id }}
            className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)] transition-colors hover:border-primary/30"
          >
            <div className={`relative flex h-16 items-center justify-between px-4 ${TYPE_ACCENT}`}>
              <div className="inline-flex items-center gap-1.5 rounded-md bg-card/90 px-2 py-0.5 text-[10.5px] font-medium text-foreground">
                <Tag className="h-3 w-3 text-primary" /> {d.docType}
              </div>
              <FileText className="h-7 w-7 text-primary/60" />
            </div>
            <div className="flex flex-1 flex-col p-5">
              <h3 className="line-clamp-2 min-h-[40px] text-[15px] font-semibold leading-snug group-hover:text-primary">
                {d.title}
              </h3>
              <p className="mt-2 line-clamp-2 text-[12.5px] leading-relaxed text-muted-foreground">{d.snippet}</p>
              <div className="mt-3 flex flex-wrap gap-1">
                {d.highlight.slice(0, 3).map((h) => (
                  <UiTag key={h}>{h}</UiTag>
                ))}
              </div>
              <div className="mt-3 flex items-center gap-3 text-[11.5px] text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <Building2 className="h-3 w-3" /> {d.plant}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Calendar className="h-3 w-3" /> {d.updatedAt}
                </span>
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-divider pt-3">
                <span className={`rounded-md px-2 py-0.5 text-[11px] ${STATUS_STYLE[d.status]}`}>{d.status}</span>
                <span className="inline-flex items-center text-[12.5px] font-medium text-primary">
                  {actionLabel} <ChevronRight className="ml-0.5 h-3.5 w-3.5" />
                </span>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

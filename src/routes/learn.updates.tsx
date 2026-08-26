import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, Clock3, FileText, Layers3, Search } from "lucide-react";
import { PageHeader } from "@/components/learning/ui";
import { PageShell } from "@/components/workbench/PageShell";
import {
  ENRICHED_TOPICS,
  RECENT_UPDATES,
  RECENT_UPDATE_KIND_LABEL,
  type RecentUpdateItem,
} from "@/lib/mock/learning-hub";
import { useMockStore } from "@/lib/mock/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/learn/updates")({
  component: LearningUpdatesPage,
  head: () => ({ meta: [{ title: "最近更新 · 涉网运行能力智能提升平台" }] }),
});

type UpdateFilter = "all" | "topic" | "doc" | "unread";

const VIEWED_UPDATE_KEY = "ai-grid-viewed-learning-updates";
const DEFAULT_VIEWED_IDS = ["ru-2", "ru-4"];

const FILTERS: { value: UpdateFilter; label: string }[] = [
  { value: "all", label: "全部更新" },
  { value: "topic", label: "专题更新" },
  { value: "doc", label: "资料更新" },
  { value: "unread", label: "未查看" },
];

function formatDate(value: string) {
  const date = new Date(`${value}T00:00:00`);
  return `${date.getMonth() + 1}月${date.getDate()}日`;
}

function getTopicTitle(item: RecentUpdateItem) {
  if (item.topicTitle) return item.topicTitle;
  return ENRICHED_TOPICS.find((topic) => topic.id === item.topicId)?.title ?? "-";
}

function readSavedViewedIds() {
  if (typeof window === "undefined") return [] as string[];
  try {
    const value = JSON.parse(localStorage.getItem(VIEWED_UPDATE_KEY) ?? "[]");
    return Array.isArray(value) ? value.filter((id): id is string => typeof id === "string") : [];
  } catch {
    return [] as string[];
  }
}

function LearningUpdatesPage() {
  const { state } = useMockStore();
  const [filter, setFilter] = useState<UpdateFilter>("all");
  const [query, setQuery] = useState("");
  const [viewedIds, setViewedIds] = useState<Set<string>>(() => new Set(DEFAULT_VIEWED_IDS));

  useEffect(() => {
    const recentlyBrowsedDocIds = new Set(state.recentDocs.map((item) => item.docId));
    const browsedUpdateIds = RECENT_UPDATES.filter(
      (item) => item.docId && recentlyBrowsedDocIds.has(item.docId),
    ).map((item) => item.id);
    setViewedIds(new Set([...DEFAULT_VIEWED_IDS, ...readSavedViewedIds(), ...browsedUpdateIds]));
  }, [state.recentDocs]);

  const markViewed = (id: string) => {
    setViewedIds((current) => {
      const next = new Set(current).add(id);
      localStorage.setItem(VIEWED_UPDATE_KEY, JSON.stringify([...next]));
      return next;
    });
  };

  const filteredItems = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return RECENT_UPDATES.filter((item) => {
      const viewed = viewedIds.has(item.id);
      if (filter === "topic" && !item.kind.startsWith("topic_")) return false;
      if (filter === "doc" && !item.kind.startsWith("doc_")) return false;
      if (filter === "unread" && viewed) return false;
      if (!keyword) return true;
      return [item.title, item.summary, item.topicTitle, getTopicTitle(item)]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(keyword));
    });
  }, [filter, query, viewedIds]);

  return (
    <PageShell compact>
      <div className="flex h-full min-h-0 w-full flex-col">
        <nav aria-label="页面导航" className="mb-1 flex shrink-0 items-center gap-1 text-[12px]">
          <Link
            to="/learn"
            className="inline-flex min-h-8 items-center gap-0.5 text-kb-muted transition-colors hover:text-primary"
          >
            <ChevronLeft className="h-3.5 w-3.5" aria-hidden />
            学习首页
          </Link>
          <ChevronRight className="h-3 w-3 text-kb-muted/35" aria-hidden />
          <span className="text-kb-body">最近更新</span>
        </nav>

        <PageHeader
          title="最近更新"
          subtitle="查看最近一个月新增或发生变化的专题与学习资料。"
          size="md"
          className="mb-3 shrink-0"
        />

        <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[14px] border border-kb-border bg-white shadow-[var(--shadow-card)]">
          <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-kb-border px-4 py-3">
            <div
              className="flex flex-wrap gap-1 rounded-[8px] bg-kb-surface p-1"
              aria-label="更新类型筛选"
            >
              {FILTERS.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setFilter(item.value)}
                  aria-pressed={filter === item.value}
                  className={cn(
                    "min-h-8 rounded-[6px] px-3 text-[12px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
                    filter === item.value
                      ? "bg-white text-primary shadow-sm"
                      : "text-kb-muted hover:text-kb-heading",
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <label className="relative block w-full sm:w-[300px]">
              <span className="sr-only">搜索更新内容</span>
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-kb-muted" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="搜索专题、资料或更新内容"
                className="h-9 w-full rounded-[8px] border border-kb-border bg-white pl-9 pr-3 text-[12.5px] text-kb-heading outline-none placeholder:text-kb-muted focus:border-primary/50 focus:ring-2 focus:ring-primary/10"
              />
            </label>
          </div>

          <div className="hidden min-h-9 shrink-0 grid-cols-[minmax(0,1.6fr)_110px_minmax(150px,.8fr)_100px_90px_90px] items-center gap-4 border-b border-kb-border bg-kb-table-head/70 px-5 text-[11px] font-medium text-kb-muted lg:grid">
            <span>更新内容</span>
            <span>更新类型</span>
            <span>所属专题</span>
            <span>更新时间</span>
            <span>查看状态</span>
            <span className="text-right">操作</span>
          </div>

          <div className="scrollbar-thin min-h-0 flex-1 divide-y divide-kb-border/80 overflow-y-auto">
            {filteredItems.length ? (
              filteredItems.map((item) => (
                <UpdateRow
                  key={item.id}
                  item={item}
                  viewed={viewedIds.has(item.id)}
                  onOpen={() => markViewed(item.id)}
                />
              ))
            ) : (
              <div className="grid min-h-[280px] place-items-center px-6 text-center">
                <div>
                  <Clock3 className="mx-auto h-9 w-9 text-primary/35" aria-hidden />
                  <h2 className="mt-3 text-[15px] font-semibold text-kb-heading">没有匹配的更新</h2>
                  <p className="mt-1.5 text-[12.5px] text-kb-muted">
                    可以切换更新类型或调整搜索关键词。
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="flex min-h-11 shrink-0 items-center justify-between border-t border-kb-border px-5 text-[11.5px] text-kb-muted">
            <span>最近一个月</span>
            <span>共 {filteredItems.length} 条更新</span>
          </div>
        </section>
      </div>
    </PageShell>
  );
}

function UpdateRow({
  item,
  viewed,
  onOpen,
}: {
  item: RecentUpdateItem;
  viewed: boolean;
  onOpen: () => void;
}) {
  const isTopic = item.kind.startsWith("topic_");
  const content = (
    <>
      <div className="flex min-w-0 items-start gap-3">
        <span
          className={cn(
            "grid h-9 w-9 shrink-0 place-items-center rounded-[9px]",
            isTopic ? "bg-[#fff1e4] text-[#e78a2e]" : "bg-[#eaf3ff] text-[#4385eb]",
          )}
        >
          {isTopic ? (
            <Layers3 className="h-[18px] w-[18px]" />
          ) : (
            <FileText className="h-[18px] w-[18px]" />
          )}
        </span>
        <span className="min-w-0">
          <strong className="block truncate text-[13px] font-semibold text-kb-heading group-hover:text-primary">
            {item.title}
          </strong>
          <span className="mt-0.5 block truncate text-[11.5px] text-kb-muted">
            {item.summary ?? "查看更新详情"}
          </span>
        </span>
      </div>
      <span>
        <span
          className={cn(
            "inline-flex rounded-[5px] px-2 py-1 text-[10.5px] font-medium",
            isTopic ? "bg-[#fff1e4] text-[#c76e1e]" : "bg-[#edf3ff] text-[#3f78c9]",
          )}
        >
          {RECENT_UPDATE_KIND_LABEL[item.kind]}
        </span>
      </span>
      <span className="truncate text-[12px] text-kb-body">{getTopicTitle(item)}</span>
      <span className="text-[12px] tabular-nums text-kb-muted">{formatDate(item.updatedAt)}</span>
      <span className={cn("text-[12px]", viewed ? "text-kb-muted" : "font-medium text-primary")}>
        {viewed ? "已查看" : "未查看"}
      </span>
      <span className="flex items-center justify-end gap-1 text-[12px] font-medium text-primary">
        查看 <ChevronRight className="h-3.5 w-3.5" />
      </span>
    </>
  );

  const className =
    "group grid min-h-[68px] grid-cols-1 gap-2 px-5 py-3 transition-colors hover:bg-primary-soft/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/30 lg:grid-cols-[minmax(0,1.6fr)_110px_minmax(150px,.8fr)_100px_90px_90px] lg:items-center lg:gap-4 lg:py-2";

  if (item.docId) {
    return (
      <Link to="/learn/doc/$id" params={{ id: item.docId }} onClick={onOpen} className={className}>
        {content}
      </Link>
    );
  }

  return (
    <Link
      to="/learn/topic/$id"
      params={{ id: item.topicId ?? "t-agc" }}
      onClick={onOpen}
      className={className}
    >
      {content}
    </Link>
  );
}

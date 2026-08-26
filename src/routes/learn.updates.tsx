import { useEffect, useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Clock3, Eye, FileText, Layers3, Search } from "lucide-react";
import { toast } from "sonner";
import { KbFilterCombo } from "@/components/knowledge/ui";
import {
  FileListRefreshButton,
  FileListSortButton,
} from "@/components/knowledge/workbench/KnowledgeFileTable";
import { LearningBreadcrumb, LearningPageShell } from "@/components/learning/learning-breadcrumb";
import { PageHeader, TABLE_PAGE_SIZE_DEFAULT, TableListPager } from "@/components/learning/ui";
import {
  ENRICHED_TOPICS,
  RECENT_UPDATES,
  RECENT_UPDATE_KIND_LABEL,
  type RecentUpdateItem,
} from "@/lib/mock/learning-hub";
import type { KnowledgeSortBy } from "@/lib/knowledge/types";
import { useMockStore } from "@/lib/mock/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/learn/updates")({
  component: LearningUpdatesPage,
  head: () => ({ meta: [{ title: "最近更新 · 涉网运行能力智能提升平台" }] }),
});

type UpdateFilter = "all" | "topic" | "doc" | "unread";
type TimeFilter = "all" | "7d" | "30d";

const VIEWED_UPDATE_KEY = "ai-grid-viewed-learning-updates";
const DEFAULT_VIEWED_IDS = ["ru-2", "ru-4"];

const FILTER_OPTIONS: { value: UpdateFilter; label: string }[] = [
  { value: "all", label: "全部更新" },
  { value: "topic", label: "专题更新" },
  { value: "doc", label: "资料更新" },
  { value: "unread", label: "未查看" },
];

const TIME_OPTIONS: { value: TimeFilter; label: string }[] = [
  { value: "all", label: "全部时间" },
  { value: "7d", label: "近 7 天" },
  { value: "30d", label: "近 30 天" },
];

const SORT_OPTIONS: { value: KnowledgeSortBy; label: string }[] = [
  { value: "updated", label: "更新时间" },
  { value: "status", label: "更新类型" },
  { value: "name", label: "名称" },
];

const DEMO_NOW = new Date("2026-07-03T12:00:00");

function inTimeRange(item: RecentUpdateItem, range: TimeFilter) {
  if (range === "all") return true;
  const date = new Date(`${item.updatedAt}T00:00:00`);
  const days = range === "7d" ? 7 : 30;
  return DEMO_NOW.getTime() - date.getTime() <= days * 24 * 60 * 60 * 1000;
}

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

function sortUpdates(items: RecentUpdateItem[], sortBy: KnowledgeSortBy) {
  return [...items].sort((a, b) => {
    if (sortBy === "status") {
      return RECENT_UPDATE_KIND_LABEL[a.kind].localeCompare(RECENT_UPDATE_KIND_LABEL[b.kind], "zh");
    }
    if (sortBy === "name") return a.title.localeCompare(b.title, "zh");
    return b.updatedAt.localeCompare(a.updatedAt);
  });
}

function LearningUpdatesPage() {
  const { state } = useMockStore();
  const navigate = useNavigate();
  const [draftFilter, setDraftFilter] = useState<UpdateFilter>("all");
  const [draftTimeRange, setDraftTimeRange] = useState<TimeFilter>("all");
  const [draftQuery, setDraftQuery] = useState("");
  const [filter, setFilter] = useState<UpdateFilter>("all");
  const [timeRange, setTimeRange] = useState<TimeFilter>("all");
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState<KnowledgeSortBy>("updated");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(TABLE_PAGE_SIZE_DEFAULT);
  const [refreshSeed, setRefreshSeed] = useState(0);
  const [viewedIds, setViewedIds] = useState<Set<string>>(() => new Set(DEFAULT_VIEWED_IDS));

  useEffect(() => {
    const recentlyBrowsedDocIds = new Set(state.recentDocs.map((item) => item.docId));
    const browsedUpdateIds = RECENT_UPDATES.filter(
      (item) => item.docId && recentlyBrowsedDocIds.has(item.docId),
    ).map((item) => item.id);
    setViewedIds(new Set([...DEFAULT_VIEWED_IDS, ...readSavedViewedIds(), ...browsedUpdateIds]));
  }, [state.recentDocs, refreshSeed]);

  const markViewed = (id: string) => {
    setViewedIds((current) => {
      const next = new Set(current).add(id);
      localStorage.setItem(VIEWED_UPDATE_KEY, JSON.stringify([...next]));
      return next;
    });
  };

  const applyQuery = () => {
    setFilter(draftFilter);
    setTimeRange(draftTimeRange);
    setQuery(draftQuery);
    setPage(1);
  };

  const filteredItems = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    const matched = RECENT_UPDATES.filter((item) => {
      const viewed = viewedIds.has(item.id);
      if (filter === "topic" && !item.kind.startsWith("topic_")) return false;
      if (filter === "doc" && !item.kind.startsWith("doc_")) return false;
      if (filter === "unread" && viewed) return false;
      if (!inTimeRange(item, timeRange)) return false;
      if (!keyword) return true;
      return [item.title, item.summary, item.topicTitle, getTopicTitle(item)]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(keyword));
    });
    return sortUpdates(matched, sortBy);
  }, [filter, query, sortBy, timeRange, viewedIds]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageRows = filteredItems.slice((safePage - 1) * pageSize, safePage * pageSize);

  const openItem = (item: RecentUpdateItem) => {
    markViewed(item.id);
    if (item.docId) {
      void navigate({ to: "/learn/doc/$id", params: { id: item.docId } });
      return;
    }
    void navigate({ to: "/learn/topic/$id", params: { id: item.topicId ?? "t-agc" } });
  };

  return (
    <LearningPageShell>
      <LearningBreadcrumb current="updates" />
      <PageHeader
        title="最近更新"
        subtitle="查看最近一个月新增或发生变化的专题与学习资料。"
        size="md"
        className="mb-3 shrink-0"
      />

      <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[12px] border border-kb-border bg-white">
        <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-[#e8eef1] bg-[#FAFCFD] px-3.5 py-2.5">
          <div className="flex h-9 min-w-[220px] max-w-[320px] flex-1 items-center gap-2 rounded-[8px] border border-border bg-card px-3 transition-colors focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/20">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
            <input
              value={draftQuery}
              onChange={(event) => setDraftQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") applyQuery();
              }}
              placeholder="搜索专题、资料或更新内容"
              className="min-w-0 flex-1 border-0 bg-transparent text-[13px] leading-normal outline-none placeholder:text-muted-foreground"
            />
          </div>
          <KbFilterCombo
            value={draftFilter}
            onChange={(value) => setDraftFilter(value as UpdateFilter)}
            placeholder="全部更新"
            options={FILTER_OPTIONS}
          />
          <KbFilterCombo
            value={draftTimeRange}
            onChange={(value) => setDraftTimeRange(value as TimeFilter)}
            placeholder="全部时间"
            options={TIME_OPTIONS}
          />
          <button
            type="button"
            onClick={applyQuery}
            className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-[8px] bg-primary px-3.5 text-[13px] font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Search className="h-3.5 w-3.5" aria-hidden />
            查询
          </button>
          <div className="ml-auto flex items-center gap-2">
            <FileListRefreshButton
              onClick={() => {
                setRefreshSeed((value) => value + 1);
                toast.message("列表已刷新");
              }}
            />
            <FileListSortButton
              value={sortBy}
              onChange={(next) => {
                setSortBy(next);
                setPage(1);
              }}
              options={SORT_OPTIONS}
              ariaLabel="排序"
            />
          </div>
        </div>

        {pageRows.length === 0 ? (
          <div className="grid min-h-0 flex-1 place-items-center px-6 text-center">
            <div>
              <Clock3 className="mx-auto h-8 w-8 text-kb-muted/45" />
              <h2 className="mt-3 text-[14px] font-medium text-kb-heading">没有匹配的更新</h2>
              <p className="mt-1 text-[12px] text-kb-muted">调整筛选条件后再试。</p>
              <button
                type="button"
                onClick={() => {
                  setDraftFilter("all");
                  setDraftTimeRange("all");
                  setDraftQuery("");
                  setFilter("all");
                  setTimeRange("all");
                  setQuery("");
                  setPage(1);
                }}
                className="mt-3 text-[12.5px] font-medium text-primary hover:text-primary/80"
              >
                清空筛选
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="scrollbar-thin min-h-0 flex-1 overflow-auto">
              <table className="w-full min-w-[840px] table-fixed text-left text-[12.5px]">
                <thead className="sticky top-0 z-10 bg-kb-table-head text-[11px] font-medium text-kb-muted">
                  <tr>
                    <th className="w-[42%] px-4 py-3 font-medium">更新内容</th>
                    <th className="w-[16%] px-3 py-3 font-medium">更新类型</th>
                    <th className="w-[14%] px-3 py-3 font-medium">更新时间</th>
                    <th className="w-[14%] px-3 py-3 font-medium">查看状态</th>
                    <th className="w-[14%] px-4 py-3 text-right font-medium">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((item) => {
                    const isTopic = item.kind.startsWith("topic_");
                    const viewed = viewedIds.has(item.id);
                    return (
                      <tr
                        key={item.id}
                        onClick={() => openItem(item)}
                        className="cursor-pointer border-t border-divider align-middle transition-colors hover:bg-kb-surface/35"
                      >
                        <td className="px-4 py-3.5">
                          <div className="flex min-w-0 items-center gap-3">
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
                            <span className="truncate font-medium text-kb-heading">{item.title}</span>
                          </div>
                        </td>
                        <td className="px-3 py-3.5">
                          <span
                            className={cn(
                              "inline-flex rounded-[5px] px-2 py-1 text-[10.5px] font-medium",
                              isTopic ? "bg-[#fff1e4] text-[#c76e1e]" : "bg-[#edf3ff] text-[#3f78c9]",
                            )}
                          >
                            {RECENT_UPDATE_KIND_LABEL[item.kind]}
                          </span>
                        </td>
                        <td className="px-3 py-3.5 tabular-nums text-kb-muted">
                          {formatDate(item.updatedAt)}
                        </td>
                        <td
                          className={cn(
                            "px-3 py-3.5",
                            viewed ? "text-kb-muted" : "font-medium text-primary",
                          )}
                        >
                          {viewed ? "已查看" : "未查看"}
                        </td>
                        <td
                          className="px-4 py-3.5 text-right"
                          onClick={(event) => event.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={() => openItem(item)}
                            className="inline-flex min-h-9 items-center gap-1 rounded-[6px] px-2 text-[12px] font-medium text-primary transition-colors hover:bg-primary-soft/40 hover:text-primary/80"
                          >
                            <Eye className="h-3.5 w-3.5 stroke-[1.8]" />
                            查看
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="shrink-0">
              <TableListPager
                page={safePage}
                totalPages={totalPages}
                totalItems={filteredItems.length}
                pageSize={pageSize}
                onPageChange={setPage}
                onPageSizeChange={(size) => {
                  setPageSize(size);
                  setPage(1);
                }}
              />
            </div>
          </>
        )}
      </section>
    </LearningPageShell>
  );
}

import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { FileSearch, RotateCcw, Search } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { TrainingPageFrame } from "@/components/learning/training-breadcrumb";
import {
  PRACTICE_RECORDS,
  getVisiblePracticeRecords,
  type PracticeRecord,
} from "@/lib/mock/learning-hub";
import {
  PageHeader,
  ModulePanel,
  ListCard,
  RecordRow,
  TRAINING_RECORDS_GRID,
  listActionClass,
  EmptyState,
  TableListPager,
  TABLE_PAGE_SIZE_DEFAULT,
} from "@/components/learning/ui";
import { KbFilterCombo } from "@/components/knowledge/ui";
import {
  FileListRefreshButton,
  FileListSortButton,
} from "@/components/knowledge/workbench/KnowledgeFileTable";
import type { KnowledgeSortBy } from "@/lib/knowledge/types";
import { cn } from "@/lib/utils";

const SOURCE_OPTIONS = [
  { value: "all", label: "全部来源" },
  { value: "资料练习", label: "资料练习" },
  { value: "专项练习", label: "专项练习" },
  { value: "专题练习", label: "专题练习" },
  { value: "自主组卷", label: "自主组卷" },
  { value: "错题本", label: "错题本" },
] as const;

type SourceFilter = (typeof SOURCE_OPTIONS)[number]["value"];

const SORT_OPTIONS: { value: KnowledgeSortBy; label: string }[] = [
  { value: "updated", label: "完成时间" },
  { value: "name", label: "练习名称" },
  { value: "status", label: "正确率" },
  { value: "size", label: "错题数" },
];

const searchSchema = z.object({
  source: z
    .enum(["all", "资料练习", "专项练习", "专题练习", "自主组卷", "错题本"])
    .default("all")
    .catch("all"),
  q: z.string().optional().catch(""),
});

export const Route = createFileRoute("/training/records")({
  validateSearch: searchSchema,
  component: PracticeRecordsPage,
  head: () => ({ meta: [{ title: "练习记录 · 训练中心" }] }),
});

function normalizeSource(source: string): string {
  if (source === "知识学习生成" || source === "资料练习") return "资料练习";
  if (source === "自主考试" || source === "模拟考试" || source === "自主组卷") return "自主组卷";
  return source;
}

function matchSource(record: PracticeRecord, filter: SourceFilter) {
  if (filter === "all") return true;
  return normalizeSource(record.source) === filter;
}

function sortRecords(items: PracticeRecord[], sortBy: KnowledgeSortBy) {
  const list = [...items];
  if (sortBy === "name") {
    return list.sort((a, b) => a.title.localeCompare(b.title, "zh-CN"));
  }
  if (sortBy === "status") {
    return list.sort((a, b) => b.accuracy - a.accuracy);
  }
  if (sortBy === "size") {
    return list.sort((a, b) => b.wrongCount - a.wrongCount);
  }
  return list;
}

function PracticeRecordsPage() {
  const navigate = useNavigate();
  const { source: sourceFilter, q: keywordFromUrl = "" } = Route.useSearch();
  const [draftKeyword, setDraftKeyword] = useState(keywordFromUrl);
  const [draftSource, setDraftSource] = useState<SourceFilter>(sourceFilter);
  const [keyword, setKeyword] = useState(keywordFromUrl);
  const [source, setSource] = useState<SourceFilter>(sourceFilter);
  const [sortBy, setSortBy] = useState<KnowledgeSortBy>("updated");
  const [refreshSeed, setRefreshSeed] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(TABLE_PAGE_SIZE_DEFAULT);

  const allRecords = useMemo(
    () => getVisiblePracticeRecords(PRACTICE_RECORDS),
    [refreshSeed],
  );

  const filtered = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    const matched = allRecords.filter((r) => {
      if (!matchSource(r, source)) return false;
      if (!kw) return true;
      return [r.title, normalizeSource(r.source), r.source].some((field) =>
        field.toLowerCase().includes(kw),
      );
    });
    return sortRecords(matched, sortBy);
  }, [allRecords, source, keyword, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageRecords = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  const applyQuery = () => {
    setKeyword(draftKeyword);
    setSource(draftSource);
    setPage(1);
    navigate({
      to: "/training/records",
      search: {
        source: draftSource,
        ...(draftKeyword.trim() ? { q: draftKeyword.trim() } : {}),
      },
      replace: true,
    });
  };

  return (
    <TrainingPageFrame current="records">
      <PageHeader
        title="练习记录"
        subtitle="查看历次练习与考试结果，支持再练一次"
        size="md"
        className="mb-3 shrink-0"
      />

      <ModulePanel className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-[#e8eef1] bg-[#FAFCFD] px-3.5 py-2.5">
          <form
            className="flex min-w-0 flex-1 flex-wrap items-center gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              applyQuery();
            }}
          >
            <div className="flex h-9 min-w-[240px] max-w-[360px] flex-1 items-center gap-2 rounded-[8px] border border-border bg-card px-3 transition-colors focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/20">
              <Search className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
              <input
                value={draftKeyword}
                onChange={(event) => setDraftKeyword(event.target.value)}
                placeholder="搜索练习名称"
                aria-label="搜索练习名称"
                className="min-w-0 flex-1 border-0 bg-transparent text-[13px] leading-normal outline-none placeholder:text-muted-foreground"
              />
            </div>
            <KbFilterCombo
              value={draftSource}
              onChange={(value) => setDraftSource(value as SourceFilter)}
              placeholder="全部来源"
              options={[...SOURCE_OPTIONS]}
            />
            <button
              type="submit"
              className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-[8px] bg-primary px-3.5 text-[13px] font-medium text-white hover:bg-primary/90"
            >
              <Search className="h-3.5 w-3.5" /> 查询
            </button>
          </form>
          <div className="ml-auto flex items-center gap-2">
            <span className="text-[12px] text-muted-foreground">共 {filtered.length} 条</span>
            <FileListRefreshButton
              onClick={() => {
                setRefreshSeed((n) => n + 1);
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

        <div key={refreshSeed} className="scrollbar-thin min-h-0 flex-1 overflow-auto p-4">
          {filtered.length === 0 ? (
            <EmptyState
              title="暂无练习记录"
              description="完成专项练习、错题复习或考试后，记录将显示在这里"
              action={
                <Link
                  to="/training/practice"
                  className="inline-flex items-center gap-1 rounded-lg bg-primary px-4 py-2 text-[13px] font-medium text-primary-foreground hover:bg-primary/90"
                >
                  去专项练习
                </Link>
              }
            />
          ) : (
            <ListCard>
              <div
                className={cn(
                  "hidden border-b border-divider px-5 py-3 text-[11.5px] font-medium text-muted-foreground lg:grid lg:items-center lg:gap-4",
                  TRAINING_RECORDS_GRID,
                )}
              >
                <span>练习名称</span>
                <span>来源</span>
                <span>完成时间</span>
                <span>正确率</span>
                <span>错题数</span>
                <span className="text-right">操作</span>
              </div>
              {pageRecords.map((r) => (
                <RecordRow
                  key={r.id}
                  cells={[
                    r.title,
                    normalizeSource(r.source),
                    r.completedAt,
                    `${r.accuracy}%`,
                    `错题 ${r.wrongCount}`,
                  ]}
                  actions={
                    <>
                      <Link
                        to="/training/result/$id"
                        params={{ id: r.id }}
                        className={listActionClass()}
                      >
                        <FileSearch className="h-3.5 w-3.5" />
                        查看结果
                      </Link>
                      <Link
                        to="/training/session/$id"
                        params={{ id: `再练-${r.id}` }}
                        search={{
                          mode: "practice",
                          filter: r.filter,
                          count: r.questionCount,
                          limit: 0,
                        }}
                        className={listActionClass("primary")}
                      >
                        <RotateCcw className="h-3.5 w-3.5" />
                        再练一次
                      </Link>
                    </>
                  }
                />
              ))}
            </ListCard>
          )}
        </div>
        {filtered.length > 0 && (
          <div className="shrink-0">
            <TableListPager
              page={safePage}
              totalPages={totalPages}
              pageSize={pageSize}
              totalItems={filtered.length}
              onPageChange={setPage}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setPage(1);
              }}
            />
          </div>
        )}
      </ModulePanel>
    </TrainingPageFrame>
  );
}

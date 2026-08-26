import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, FileSearch, RotateCcw } from "lucide-react";
import { PageShell } from "@/components/workbench/PageShell";
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
  PillSelect,
  listActionClass,
  EmptyState,
  TableListPager,
  TABLE_PAGE_SIZE_DEFAULT,
} from "@/components/learning/ui";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/training/records")({
  component: PracticeRecordsPage,
  head: () => ({ meta: [{ title: "练习记录 · 训练中心" }] }),
});

const SOURCE_OPTIONS = [
  { value: "all", label: "全部来源" },
  { value: "专项练习", label: "专项练习" },
  { value: "错题本", label: "错题本" },
  { value: "模拟考试", label: "自主组卷" },
  { value: "考试", label: "正式考试" },
];

function matchSource(record: PracticeRecord, filter: string) {
  if (filter === "all") return true;
  if (filter === "考试") return record.source.includes("考试");
  return record.source === filter;
}

function PracticeRecordsPage() {
  const [sourceFilter, setSourceFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(TABLE_PAGE_SIZE_DEFAULT);

  const allRecords = useMemo(() => getVisiblePracticeRecords(PRACTICE_RECORDS), []);

  const filtered = useMemo(
    () => allRecords.filter((r) => matchSource(r, sourceFilter)),
    [allRecords, sourceFilter],
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageRecords = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  const handleSourceChange = (value: string) => {
    setSourceFilter(value);
    setPage(1);
  };

  return (
    <PageShell>
      <nav aria-label="页面导航" className="mb-2 flex items-center gap-1 text-[12px]">
        <Link
          to="/training"
          className="inline-flex items-center gap-0.5 text-muted-foreground transition-colors hover:text-primary"
        >
          <ChevronLeft className="h-3.5 w-3.5" aria-hidden />
          训练中心
        </Link>
        <ChevronRight className="h-3 w-3 text-muted-foreground/30" aria-hidden />
        <span className="text-foreground/70">练习记录</span>
      </nav>

      <PageHeader title="练习记录" subtitle="查看历次练习与考试结果，支持再练一次" size="md" />
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <PillSelect options={SOURCE_OPTIONS} value={sourceFilter} onChange={handleSourceChange} />
        <span className="text-[12px] text-muted-foreground">共 {filtered.length} 条记录</span>
      </div>

      <ModulePanel>
        <div className="p-4">
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
            <>
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
                      r.source,
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
            </>
          )}
        </div>
      </ModulePanel>
    </PageShell>
  );
}

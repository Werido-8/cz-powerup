import { useEffect, useMemo, useState } from "react";
import { KbDataTable, KbDataTableRow, KbEmptyState, KbStatusTag } from "@/components/knowledge/ui";
import { TABLE_PAGE_SIZE_DEFAULT, TableListPager } from "@/components/learning/ui";
import { getChapterLabel } from "@/lib/file-compare/data";
import { DIFF_TYPE_META } from "@/lib/file-compare/meta";
import type { DiffItem } from "@/lib/file-compare/types";
import { DiffTypeDot } from "./DiffTypeIndicators";

const GRID = "grid-cols-[64px_minmax(200px,1.5fr)_96px_minmax(160px,1fr)_110px_92px_92px]";

const TYPE_TONE = {
  added: "success",
  removed: "danger",
  modified: "warning",
  moved: "accent",
} as const;

/** 变更清单页签：完整差异表格 + 系统分页器 */
export function ChangeListPanel({
  diffs,
  onOpenDiff,
}: {
  diffs: DiffItem[];
  onOpenDiff: (diff: DiffItem) => void;
}) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(TABLE_PAGE_SIZE_DEFAULT);

  const totalPages = Math.max(1, Math.ceil(diffs.length / pageSize));
  const safePage = Math.min(page, totalPages);

  useEffect(() => {
    setPage(1);
  }, [diffs.length, pageSize]);

  const rows = useMemo(
    () => diffs.slice((safePage - 1) * pageSize, safePage * pageSize),
    [diffs, safePage, pageSize],
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto">
        <KbDataTable
          variant="flat"
          minWidth={GRID}
          header={
            <>
              <span>序号</span>
              <span>差异标题</span>
              <span>类型</span>
              <span>所属章节</span>
              <span>条款 / 表号</span>
              <span className="text-right">基准页</span>
              <span className="text-right">更新页</span>
            </>
          }
          empty={
            <KbEmptyState
              title="没有符合条件的变更"
              description="请调整章节或差异类型筛选条件后重试。"
            />
          }
        >
          {rows.map((diff) => (
            <KbDataTableRow
              key={diff.id}
              variant="flat"
              className={GRID}
              onClick={() => onOpenDiff(diff)}
            >
              <span className="text-[12.5px] tabular-nums text-kb-muted">
                {String(diff.seq).padStart(2, "0")}
              </span>
              <span className="min-w-0 pr-4">
                <span className="block truncate font-medium text-kb-heading">{diff.title}</span>
                <span className="mt-0.5 block truncate text-[11.5px] text-kb-muted">
                  {diff.description}
                </span>
              </span>
              <span>
                <KbStatusTag tone={TYPE_TONE[diff.type]} variant="outline" className="gap-1">
                  <DiffTypeDot type={diff.type} className="h-[13px] w-[13px] bg-transparent" />
                  {DIFF_TYPE_META[diff.type].label}
                </KbStatusTag>
              </span>
              <span className="truncate text-[12.5px] text-kb-body">
                {getChapterLabel(diff.chapterId)}
              </span>
              <span className="truncate text-[12.5px] tabular-nums text-kb-body">
                {diff.clause}
              </span>
              <span className="text-right text-[12.5px] tabular-nums text-kb-muted">
                {diff.basePage}
              </span>
              <span className="text-right text-[12.5px] tabular-nums text-kb-muted">
                {diff.targetPage}
              </span>
            </KbDataTableRow>
          ))}
        </KbDataTable>
      </div>

      {diffs.length > pageSize && (
        <div className="shrink-0">
          <TableListPager
            page={safePage}
            totalPages={totalPages}
            totalItems={diffs.length}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        </div>
      )}
    </div>
  );
}

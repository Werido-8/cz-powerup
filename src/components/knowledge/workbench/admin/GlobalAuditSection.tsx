import { useRouter } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  KbDataTable,
  KbDataTableRow,
  KbEmptyState,
  KbTableCellFile,
  KbTableCellUser,
} from "@/components/knowledge/ui";
import { TABLE_PAGE_SIZE_DEFAULT, TableListPager } from "@/components/learning/ui";
import { openFileDetailInNewTab } from "@/lib/knowledge/searchNav";
import type { KnowledgeFile } from "@/lib/knowledge/types";

const GRID = "grid-cols-[minmax(240px,1.4fr)_minmax(140px,1fr)_100px_120px] min-w-[720px]";

export function GlobalAuditSection({
  files,
  embedded = false,
}: {
  files: KnowledgeFile[];
  embedded?: boolean;
}) {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(TABLE_PAGE_SIZE_DEFAULT);

  useEffect(() => {
    setPage(1);
  }, [files.length, pageSize]);

  const totalPages = Math.max(1, Math.ceil(files.length / pageSize) || 1);
  const safePage = Math.min(page, totalPages);
  const pagedFiles = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return files.slice(start, start + pageSize);
  }, [files, pageSize, safePage]);

  return (
    <div className={embedded ? "flex min-h-0 flex-1 flex-col" : undefined}>
      <div className={embedded ? "min-h-0 flex-1 overflow-x-auto" : undefined}>
        <KbDataTable
          variant="flat"
          minWidth={GRID}
          className={embedded ? "border-0 shadow-none" : undefined}
          header={
            <>
              <span>文件名</span>
              <span>所属个人库</span>
              <span>上传人</span>
              <span>更新时间</span>
            </>
          }
          empty={
            <KbEmptyState
              title="暂无个人库文件"
              description="超级管理员可在此审计全部用户的个人知识库文件。"
            />
          }
        >
          {pagedFiles.map((file) => (
            <KbDataTableRow
              key={file.id}
              variant="flat"
              className={GRID}
              onClick={() => openFileDetailInNewTab(router, file)}
            >
              <KbTableCellFile name={file.name} type={file.type ?? "pdf"} size="sm" nameWeight="normal" />
              <span className="truncate text-kb-muted">{file.knowledgeBaseName ?? "—"}</span>
              <KbTableCellUser name={file.uploaderName ?? "—"} />
              <span className="tabular-nums text-kb-muted">{file.updatedAt ?? "—"}</span>
            </KbDataTableRow>
          ))}
        </KbDataTable>
      </div>

      {files.length > 0 && (
        <TableListPager
          page={safePage}
          totalPages={totalPages}
          totalItems={files.length}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setPage(1);
          }}
        />
      )}
    </div>
  );
}

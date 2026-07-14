import {
  KbDataTable,
  KbDataTableRow,
  KbEmptyState,
  KbTableCellFile,
  KbTableCellUser,
} from "@/components/knowledge/ui";
import type { KnowledgeFile } from "@/lib/knowledge/types";

const GRID = "grid-cols-[minmax(240px,1.4fr)_minmax(140px,1fr)_100px_120px] min-w-[720px]";

export function GlobalAuditSection({
  files,
  embedded = false,
}: {
  files: KnowledgeFile[];
  embedded?: boolean;
}) {
  return (
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
        {files.map((file) => (
          <KbDataTableRow key={file.id} variant="flat" className={GRID}>
            <KbTableCellFile name={file.name} type={file.type ?? "pdf"} size="sm" nameWeight="normal" />
            <span className="truncate text-kb-muted">{file.knowledgeBaseName ?? "—"}</span>
            <KbTableCellUser name={file.uploaderName ?? "—"} />
            <span className="tabular-nums text-kb-muted">{file.updatedAt ?? "—"}</span>
          </KbDataTableRow>
        ))}
      </KbDataTable>
    </div>
  );
}

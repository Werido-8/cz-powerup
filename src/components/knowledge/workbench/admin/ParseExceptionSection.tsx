import { CheckCircle2, Loader2, RefreshCw, ScrollText, Trash2, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  KbDataTable,
  KbDataTableRow,
  KbDrawer,
  KbEmptyState,
  KbFilterPills,
  KbIconTextButton,
  KbPageContent,
  KbPageHeader,
  KbStatusTag,
  KbTableCellFile,
} from "@/components/knowledge/ui";
import { SearchInput, TABLE_PAGE_SIZE_DEFAULT, TableListPager } from "@/components/learning/ui";
import type { ParseException } from "@/lib/knowledge/types";
import { cn } from "@/lib/utils";
import { FileListCheckbox } from "../FileListCheckbox";
import { useFileSelection } from "../useFileSelection";

const GRID =
  "grid-cols-[36px_minmax(240px,1.5fr)_minmax(140px,1fr)_100px_150px_minmax(220px,auto)] min-w-[960px]";

export function ParseExceptionSection({
  items,
  embedded = false,
}: {
  items: ParseException[];
  embedded?: boolean;
}) {
  const [rows, setRows] = useState(items);
  const [query, setQuery] = useState("");
  const [baseFilter, setBaseFilter] = useState("all");
  const [submitterFilter, setSubmitterFilter] = useState("all");
  const [logItem, setLogItem] = useState<ParseException | null>(null);
  const [batchLoading, setBatchLoading] = useState<"retry" | "delete" | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(TABLE_PAGE_SIZE_DEFAULT);

  const selection = useFileSelection();

  useEffect(() => {
    setRows(items);
  }, [items]);

  const baseOptions = useMemo(() => {
    const names = Array.from(new Set(rows.map((item) => item.knowledgeBaseName)));
    return [
      { value: "all", label: "全部知识库" },
      ...names.map((name) => ({ value: name, label: name })),
    ];
  }, [rows]);

  const submitterOptions = useMemo(() => {
    const names = Array.from(
      new Set(rows.map((item) => item.uploaderName).filter(Boolean) as string[]),
    );
    return [{ value: "all", label: "全部提交人" }, ...names.map((n) => ({ value: n, label: n }))];
  }, [rows]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((item) => {
      if (baseFilter !== "all" && item.knowledgeBaseName !== baseFilter) return false;
      if (submitterFilter !== "all" && item.uploaderName !== submitterFilter) return false;
      if (!q) return true;
      return (
        item.fileName.toLowerCase().includes(q) ||
        item.knowledgeBaseName.toLowerCase().includes(q) ||
        item.uploaderName?.toLowerCase().includes(q) ||
        item.reason.toLowerCase().includes(q)
      );
    });
  }, [baseFilter, query, rows, submitterFilter]);

  useEffect(() => {
    setPage(1);
  }, [baseFilter, query, submitterFilter, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize) || 1);
  const safePage = Math.min(page, totalPages);
  const pagedItems = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, pageSize, safePage]);

  const pageIds = useMemo(() => pagedItems.map((item) => item.id), [pagedItems]);
  const allPageSelected = pageIds.length > 0 && pageIds.every((id) => selection.isSelected(id));
  const somePageSelected = pageIds.some((id) => selection.isSelected(id));

  useEffect(() => {
    selection.clear();
  }, [baseFilter, query, submitterFilter]);

  const removeRows = useCallback(
    (ids: string[]) => {
      const idSet = new Set(ids);
      setRows((previous) => previous.filter((item) => !idSet.has(item.id)));
      selection.clear();
    },
    [selection],
  );

  const handleRetry = useCallback((item: ParseException) => {
    toast.success(`已重新发起「${item.fileName}」的解析`);
  }, []);

  const handleDelete = useCallback(
    (item: ParseException) => {
      if (typeof window !== "undefined" && !window.confirm("确认逻辑删除该异常文件？")) return;
      removeRows([item.id]);
      toast.success("文件已标记删除");
    },
    [removeRows],
  );

  const handleBatchRetry = useCallback(async () => {
    const ids = selection.selectedArray;
    if (ids.length === 0) return;
    setBatchLoading("retry");
    try {
      toast.success(`已发起 ${ids.length} 个文件的批量重试`);
      selection.clear();
    } finally {
      setBatchLoading(null);
    }
  }, [selection]);

  const handleBatchDelete = useCallback(async () => {
    const ids = selection.selectedArray;
    if (ids.length === 0) return;
    const confirmed =
      typeof window === "undefined" ||
      window.confirm(`确认逻辑删除选中的 ${ids.length} 个异常文件？`);
    if (!confirmed) return;
    setBatchLoading("delete");
    try {
      removeRows(ids);
      toast.success(`已删除 ${ids.length} 个异常文件`);
    } finally {
      setBatchLoading(null);
    }
  }, [removeRows, selection.selectedArray]);

  const isBatchMode = selection.selectedCount > 0;

  const toolbar = (
    <div
      className={cn(
        "relative flex min-h-[52px] flex-wrap items-center justify-between gap-3 border-b border-[#E8F0F2] px-4 py-3",
        isBatchMode && "bg-[rgba(52,155,172,0.055)]",
        isBatchMode &&
          "before:absolute before:bottom-2 before:left-0 before:top-2 before:w-[3px] before:rounded-r-[3px] before:bg-primary",
      )}
    >
      {isBatchMode ? (
        <>
          <div className="flex min-w-0 items-center gap-2 pl-2 text-[14px] leading-[22px] text-[#526670]">
            <CheckCircle2 className="h-[18px] w-[18px] shrink-0 text-primary" strokeWidth={1.8} />
            <span className="truncate whitespace-nowrap">
              已选择{" "}
              <strong className="mx-1 font-semibold text-primary">
                {selection.selectedCount}
              </strong>{" "}
              个文件
            </span>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <BatchIconButton
              icon={RefreshCw}
              label="批量重试"
              onClick={handleBatchRetry}
              loading={batchLoading === "retry"}
              disabled={Boolean(batchLoading)}
              variant="primary"
            />
            <BatchIconButton
              icon={Trash2}
              label="批量删除"
              onClick={handleBatchDelete}
              loading={batchLoading === "delete"}
              disabled={Boolean(batchLoading)}
              variant="danger"
            />
            <span className="mx-1 h-5 w-px bg-[#d8e2e7]" aria-hidden />
            <button
              type="button"
              onClick={selection.clear}
              disabled={Boolean(batchLoading)}
              aria-label="取消选择"
              title="取消选择"
              className="grid h-8 w-8 place-items-center rounded-[8px] text-[#637781] transition-colors hover:bg-white/80 hover:text-primary disabled:opacity-50"
            >
              <X className="h-4 w-4 stroke-[1.8]" />
            </button>
          </div>
        </>
      ) : (
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="搜索文件名 / 提交人 / 异常原因"
            className="h-9 min-w-[200px] max-w-[280px] flex-1 !rounded-[8px] py-0"
          />
          <KbFilterPills
            label="知识库"
            value={baseFilter}
            onChange={setBaseFilter}
            options={baseOptions}
          />
          <KbFilterPills
            label="提交人"
            value={submitterFilter}
            onChange={setSubmitterFilter}
            options={submitterOptions}
          />
        </div>
      )}
    </div>
  );

  const table = (
    <KbDataTable
      variant="flat"
      minWidth={GRID}
      className={embedded ? "border-0 shadow-none" : undefined}
      header={
        <>
          <span className="flex items-center justify-center">
            <FileListCheckbox
              checked={allPageSelected}
              indeterminate={!allPageSelected && somePageSelected}
              onCheckedChange={(checked) => selection.toggleAll(pageIds, checked)}
              aria-label="全选当前列表"
            />
          </span>
          <span>文件名</span>
          <span>所属知识库</span>
          <span>提交人</span>
          <span>上传时间</span>
          <span className="text-right">操作</span>
        </>
      }
      empty={<KbEmptyState title="暂无解析异常" description="解析失败文件会在这里集中处理。" />}
    >
      {pagedItems.map((item) => {
        const selected = selection.isSelected(item.id);
        return (
          <KbDataTableRow key={item.id} variant="flat" className={GRID} selected={selected}>
            <span
              className="flex items-center justify-center"
              onClick={(event) => event.stopPropagation()}
            >
              <FileListCheckbox
                checked={selected}
                onCheckedChange={() => selection.toggle(item.id)}
                aria-label={`选择 ${item.fileName}`}
              />
            </span>
            <KbTableCellFile
              name={item.fileName}
              nameWeight="normal"
              type={item.fileName.endsWith(".pdf") ? "pdf" : "xlsx"}
            />
            <span className="truncate text-kb-muted">{item.knowledgeBaseName}</span>
            <span className="truncate text-kb-muted">{item.uploaderName ?? "—"}</span>
            <span className="text-kb-muted">{item.uploadedAt}</span>
            <span className="flex items-center justify-end gap-1">
              <KbIconTextButton
                icon={RefreshCw}
                label="重试"
                className="text-primary hover:bg-primary-soft/60 [&>svg]:text-primary"
                onClick={() => handleRetry(item)}
              />
              <KbIconTextButton
                icon={ScrollText}
                label="查看日志"
                className="text-[#2F6FB0] hover:bg-[#F1F7FF] [&>svg]:text-[#2F6FB0]"
                onClick={() => setLogItem(item)}
              />
              <KbIconTextButton
                icon={Trash2}
                label="删除"
                variant="danger-text"
                onClick={() => handleDelete(item)}
              />
            </span>
          </KbDataTableRow>
        );
      })}
    </KbDataTable>
  );

  const content = (
    <>
      {toolbar}
      <div className="min-h-0 flex-1 overflow-x-auto">{table}</div>

      {filtered.length > 0 && (
        <TableListPager
          page={safePage}
          totalPages={totalPages}
          totalItems={filtered.length}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setPage(1);
          }}
        />
      )}

      <KbDrawer
        open={Boolean(logItem)}
        title="解析日志"
        subtitle={logItem?.fileName}
        onClose={() => setLogItem(null)}
      >
        {logItem && (
          <div className="space-y-4 text-[13px]">
            <div className="flex items-center gap-2">
              <KbStatusTag tone="danger">解析异常</KbStatusTag>
              <span className="text-kb-muted">{logItem.uploadedAt}</span>
            </div>
            <div>
              <div className="text-[12px] font-medium text-kb-muted">失败原因</div>
              <div className="mt-1 text-kb-body">{logItem.reason}</div>
            </div>
            <div>
              <div className="mb-1 text-[12px] font-medium text-kb-muted">解析日志</div>
              <pre className="max-h-[360px] overflow-auto rounded-[8px] border border-divider bg-[#0F1F26] p-3 text-[12px] leading-relaxed text-[#B8D4DC]">
{`[${logItem.uploadedAt}] 开始解析 ${logItem.fileName}
[stage] 文件读取 ... ok (${logItem.fileSize ?? "-"})
[stage] 内容抽取 ...
[error] ${logItem.reason}
[hint] 可在处理后点击「重试」重新解析。`}
              </pre>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <KbIconTextButton
                icon={RefreshCw}
                label="重试解析"
                variant="primary-light"
                onClick={() => {
                  handleRetry(logItem);
                  setLogItem(null);
                }}
              />
            </div>
          </div>
        )}
      </KbDrawer>
    </>
  );

  if (embedded) {
    return <div className="flex min-h-0 flex-1 flex-col">{content}</div>;
  }

  return (
    <KbPageContent>
      <KbPageHeader
        label="异常处理"
        title="解析异常"
        description="展示解析失败文件，支持查看失败原因、重试解析和日志排查。"
      />
      <div className="overflow-hidden rounded-[12px] border border-divider bg-white">
        {content}
      </div>
    </KbPageContent>
  );
}

function BatchIconButton({
  icon: Icon,
  label,
  onClick,
  loading,
  disabled,
  variant = "default",
}: {
  icon: typeof RefreshCw;
  label: string;
  onClick: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: "default" | "primary" | "danger";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      className={cn(
        "inline-flex h-8 items-center gap-1.5 rounded-[8px] px-2.5 text-[13px] font-medium transition-colors",
        "disabled:cursor-not-allowed disabled:opacity-50",
        variant === "primary" &&
          "border border-primary/20 bg-primary-soft/60 text-primary hover:bg-primary hover:text-primary-foreground",
        variant === "danger" && "text-[#d83a40] hover:bg-[rgba(216,58,64,0.08)]",
        variant === "default" && "text-[#344a55] hover:bg-white/80 hover:text-primary",
      )}
    >
      {loading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin stroke-[1.8]" />
      ) : (
        <Icon className="h-3.5 w-3.5 stroke-[1.8]" />
      )}
      {label}
    </button>
  );
}

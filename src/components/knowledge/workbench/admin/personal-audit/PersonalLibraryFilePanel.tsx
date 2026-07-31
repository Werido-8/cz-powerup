import { useRouter } from "@tanstack/react-router";
import {
  Download,
  Eye,
  Files,
  Library,
  MoreHorizontal,
  RotateCcw,
  Trash2,
  UserRound,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { SearchInput, TABLE_PAGE_SIZE_DEFAULT, TableListPager } from "@/components/learning/ui";
import {
  KnowledgeBaseIcon,
  KbDataTable,
  KbDataTableRow,
  KbEmptyState,
  KbFilterPills,
  KbStatusTag,
  KbTableCellFile,
} from "@/components/knowledge/ui";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { FileListCheckbox } from "@/components/knowledge/workbench/FileListCheckbox";
import { useFileSelection } from "@/components/knowledge/workbench/useFileSelection";
import { getFileById } from "@/lib/knowledge/model";
import {
  fetchPersonalLibraryFiles,
  getPersonalLibraryAggregateStats,
  getPersonalLibrarySummary,
  listPersonalLibraries,
  listPersonalLibraryOwners,
  personalAuditParseLabel,
  personalAuditParseTone,
  personalAuditStatusLabel,
  personalAuditStatusTone,
  type PersonalAuditParseStatus,
  type PersonalAuditStatus,
  type PersonalLibraryFile,
} from "@/lib/knowledge/personalLibraryAudit";
import { openFileDetailInNewTab } from "@/lib/knowledge/searchNav";
import type { KnowledgeFile } from "@/lib/knowledge/types";
import { cn } from "@/lib/utils";

const GRID =
  "grid-cols-[36px_minmax(200px,1.6fr)_minmax(120px,1fr)_88px_128px_88px_80px_minmax(160px,auto)] gap-x-3 min-w-[980px]";

const PARSE_OPTIONS = [
  { value: "all", label: "全部解析状态" },
  { value: "parsed", label: "已解析" },
  { value: "failed", label: "解析异常" },
] as const;

const AUDIT_OPTIONS = [
  { value: "all", label: "全部审核状态" },
  { value: "approved", label: "通过" },
  { value: "rejected", label: "驳回" },
] as const;

type LoadState = "idle" | "loading" | "error" | "success";

function resolveStoreFiles(items: PersonalLibraryFile[]): KnowledgeFile[] {
  return items
    .map((item) => getFileById(item.id))
    .filter((file): file is KnowledgeFile => Boolean(file));
}

export function PersonalLibraryFilePanel() {
  const router = useRouter();

  const [keyword, setKeyword] = useState("");
  const [ownerId, setOwnerId] = useState("all");
  const [filterLibraryId, setFilterLibraryId] = useState("all");
  const [parseStatus, setParseStatus] = useState("all");
  const [auditStatus, setAuditStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(TABLE_PAGE_SIZE_DEFAULT);
  const [files, setFiles] = useState<PersonalLibraryFile[]>([]);
  const [loadState, setLoadState] = useState<LoadState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const selection = useFileSelection();
  const clearSelection = selection.clear;
  const owners = useMemo(() => listPersonalLibraryOwners(), []);
  // 所属个人库与所属用户联动：选中用户只列出其个人库，全部用户则列出全部库
  const libraries = useMemo(
    () => listPersonalLibraries({ ownerId: ownerId !== "all" ? ownerId : undefined }),
    [ownerId],
  );

  const isAllLibraries = filterLibraryId === "all";
  const summary = useMemo(() => {
    if (!isAllLibraries) return getPersonalLibrarySummary(filterLibraryId);
    if (ownerId !== "all") {
      const stats = getPersonalLibraryAggregateStats(ownerId);
      const ownerName = owners.find((item) => item.id === ownerId)?.name;
      return {
        title: ownerName ? `${ownerName}的个人库文件` : "个人库文件",
        fileCount: stats.fileCount,
        totalSize: stats.totalSize,
        libraryCount: libraries.length,
        ownerName,
      };
    }
    return getPersonalLibrarySummary("all");
  }, [filterLibraryId, isAllLibraries, ownerId, owners, libraries.length]);

  // 切换用户后，若当前库不属于该用户则回退到「全部个人库」
  useEffect(() => {
    if (filterLibraryId === "all") return;
    const stillValid = libraries.some((library) => library.id === filterLibraryId);
    if (!stillValid) setFilterLibraryId("all");
  }, [libraries, filterLibraryId]);

  useEffect(() => {
    setPage(1);
  }, [keyword, ownerId, filterLibraryId, parseStatus, auditStatus, pageSize]);

  useEffect(() => {
    clearSelection();
  }, [keyword, ownerId, filterLibraryId, parseStatus, auditStatus, clearSelection]);

  useEffect(() => {
    const controller = new AbortController();
    setLoadState("loading");
    setErrorMessage(null);

    void fetchPersonalLibraryFiles(
      {
        libraryId: "all",
        keyword,
        ownerId: ownerId !== "all" ? ownerId : undefined,
        filterLibraryId: filterLibraryId !== "all" ? filterLibraryId : undefined,
        parseStatus: parseStatus as PersonalAuditParseStatus | "all",
        auditStatus: auditStatus as PersonalAuditStatus | "all",
      },
      controller.signal,
    )
      .then((result) => {
        setFiles(result);
        setLoadState("success");
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setFiles([]);
        setLoadState("error");
        setErrorMessage(error instanceof Error ? error.message : "加载失败");
      });

    return () => controller.abort();
  }, [keyword, ownerId, filterLibraryId, parseStatus, auditStatus]);

  const totalPages = Math.max(1, Math.ceil(files.length / pageSize) || 1);
  const safePage = Math.min(page, totalPages);
  const pagedFiles = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return files.slice(start, start + pageSize);
  }, [files, pageSize, safePage]);

  const pageIds = useMemo(() => pagedFiles.map((item) => item.id), [pagedFiles]);
  const allPageSelected = pageIds.length > 0 && pageIds.every((id) => selection.isSelected(id));
  const somePageSelected = pageIds.some((id) => selection.isSelected(id));

  const resetFilters = () => {
    setKeyword("");
    setOwnerId("all");
    setFilterLibraryId("all");
    setParseStatus("all");
    setAuditStatus("all");
    setPage(1);
  };

  const hasActiveFilters =
    Boolean(keyword.trim()) ||
    ownerId !== "all" ||
    filterLibraryId !== "all" ||
    parseStatus !== "all" ||
    auditStatus !== "all";

  const handlePreview = (file: PersonalLibraryFile) => {
    const storeFile = getFileById(file.id);
    if (!storeFile) {
      toast.message("该演示文件暂未接入详情数据");
      return;
    }
    const resultFiles = resolveStoreFiles(files);
    openFileDetailInNewTab(router, storeFile, {
      query: keyword.trim() || undefined,
      searchMode: "filename",
      // 详情页左侧列表沿用当前审计查询结果
      resultFiles: resultFiles.length > 0 ? resultFiles : [storeFile],
      scope: "personal-all",
    });
  };

  const handleDownload = (file: PersonalLibraryFile) => {
    toast.message(`开始下载「${file.fileName}」`);
  };

  const handleDelete = (file: PersonalLibraryFile) => {
    const confirmed =
      typeof window === "undefined" ||
      window.confirm(`确认删除文件「${file.fileName}」？该操作不可恢复。`);
    if (!confirmed) return;
    setFiles((previous) => previous.filter((item) => item.id !== file.id));
    selection.clear();
    toast.success("文件已删除");
  };

  const emptyTitle =
    loadState === "error" ? "加载失败" : hasActiveFilters ? "无匹配文件" : "暂无个人库文件";

  const emptyDescription =
    loadState === "error"
      ? (errorMessage ?? "请稍后重试")
      : hasActiveFilters
        ? "请调整筛选条件后重试"
        : "超级管理员可在此审计个人知识库文件。";

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-white">
      <div className="shrink-0 px-5 pt-4 pb-3">
        <div className="flex items-start gap-3">
          {isAllLibraries ? (
            <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-[9px] bg-primary-soft text-primary">
              <Library className="h-4 w-4 stroke-[1.8]" />
            </span>
          ) : (
            <KnowledgeBaseIcon size="sm" className="mt-0.5 h-9 w-9 rounded-[9px]" />
          )}
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-[15px] font-semibold text-kb-heading">{summary.title}</h2>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              {!isAllLibraries && summary.ownerName ? (
                <SummaryMetaTag icon={UserRound} tone="accent">
                  所属用户 {summary.ownerName}
                </SummaryMetaTag>
              ) : null}
              <SummaryMetaTag icon={Files} tone="info">
                {summary.fileCount} 个文件
              </SummaryMetaTag>
              {isAllLibraries ? (
                <SummaryMetaTag icon={Library} tone="accent">
                  {summary.libraryCount} 个个人库
                </SummaryMetaTag>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-b border-[#E8F0F2] px-4 py-3">
        <SearchInput
          value={keyword}
          onChange={setKeyword}
          placeholder="搜索文件名 / 上传人"
          className="h-9 min-w-[200px] max-w-[280px] flex-1 !rounded-[8px] py-0"
        />
        <KbFilterPills
          label="所属用户"
          value={ownerId}
          onChange={(next) => {
            setOwnerId(next);
            setFilterLibraryId("all");
          }}
          options={[
            { value: "all", label: "全部用户" },
            ...owners.map((owner) => ({ value: owner.id, label: owner.name })),
          ]}
        />
        <KbFilterPills
          label="所属个人库"
          value={filterLibraryId}
          onChange={setFilterLibraryId}
          options={[
            { value: "all", label: "全部个人库" },
            ...libraries.map((library) => ({
              value: library.id,
              label: library.name,
            })),
          ]}
        />
        <KbFilterPills
          label="解析状态"
          value={parseStatus}
          onChange={setParseStatus}
          options={[...PARSE_OPTIONS]}
        />
        <KbFilterPills
          label="审核状态"
          value={auditStatus}
          onChange={setAuditStatus}
          options={[...AUDIT_OPTIONS]}
        />
        <button
          type="button"
          onClick={resetFilters}
          className="inline-flex h-9 items-center gap-1 px-2 text-[12.5px] text-kb-muted transition-colors hover:text-primary"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          重置
        </button>
      </div>

      <div className="relative min-h-0 flex-1 overflow-auto scrollbar-thin">
        {loadState === "loading" ? (
          <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-0.5 overflow-hidden bg-primary/10">
            <div className="h-full w-1/3 animate-pulse bg-primary/60" />
          </div>
        ) : null}

        <KbDataTable
          variant="flat"
          minWidth={GRID}
          className="border-0 shadow-none"
          header={
            <>
              <span className="flex items-center justify-center">
                <FileListCheckbox
                  checked={allPageSelected}
                  indeterminate={!allPageSelected && somePageSelected}
                  onCheckedChange={(checked) => selection.toggleAll(pageIds, checked)}
                  aria-label="全选当前页"
                />
              </span>
              <span>文件名</span>
              <span>所属个人库</span>
              <span>上传人</span>
              <span>上传时间</span>
              <span>解析状态</span>
              <span>审核状态</span>
              <span className="text-right">操作</span>
            </>
          }
          empty={
            loadState === "loading" ? (
              <div className="px-5 py-16 text-center text-[13px] text-kb-muted">加载中…</div>
            ) : (
              <KbEmptyState title={emptyTitle} description={emptyDescription} />
            )
          }
        >
          {loadState !== "loading" && loadState !== "error"
            ? pagedFiles.map((file) => {
                const selected = selection.isSelected(file.id);
                return (
                  <KbDataTableRow
                    key={file.id}
                    variant="flat"
                    selected={selected}
                    className={cn(GRID, "min-h-[48px] py-1 text-[12.5px]")}
                  >
                    <span
                      className="flex items-center justify-center"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <FileListCheckbox
                        checked={selected}
                        onCheckedChange={() => selection.toggle(file.id)}
                        aria-label={`选择 ${file.fileName}`}
                      />
                    </span>
                    <TooltipProvider delayDuration={300}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="min-w-0">
                            <KbTableCellFile
                              name={file.fileName}
                              type={file.fileType}
                              size="sm"
                              nameWeight="normal"
                              className="py-1"
                            />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent
                          side="top"
                          className="max-w-[360px] bg-[#2f424d] text-[12px]"
                        >
                          {file.fileName}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <span className="truncate text-kb-muted">{file.libraryName}</span>
                    <span className="truncate text-kb-muted">{file.uploaderName}</span>
                    <span className="tabular-nums text-kb-muted">{file.uploadTime}</span>
                    <span>
                      <KbStatusTag
                        tone={personalAuditParseTone(file.parseStatus)}
                        variant="outline"
                        className="h-[20px] px-2 text-[11px]"
                      >
                        {personalAuditParseLabel(file.parseStatus)}
                      </KbStatusTag>
                    </span>
                    <span>
                      <KbStatusTag
                        tone={personalAuditStatusTone(file.auditStatus)}
                        variant="outline"
                        className="h-[20px] px-2 text-[11px]"
                      >
                        {personalAuditStatusLabel(file.auditStatus)}
                      </KbStatusTag>
                    </span>
                    <span
                      className="flex flex-nowrap items-center justify-end gap-2 whitespace-nowrap"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <AuditFileLinkAction
                        icon={Eye}
                        label="预览"
                        onClick={() => handlePreview(file)}
                      />
                      <AuditFileLinkAction
                        icon={Download}
                        label="下载"
                        onClick={() => handleDownload(file)}
                      />
                      <AuditFileMoreMenu onDelete={() => handleDelete(file)} />
                    </span>
                  </KbDataTableRow>
                );
              })
            : null}
        </KbDataTable>
      </div>

      {files.length > 0 && loadState === "success" ? (
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
      ) : null}
    </div>
  );
}

function SummaryMetaTag({
  children,
  icon: Icon,
  tone = "accent",
}: {
  children: ReactNode;
  icon: typeof Files;
  tone?: "accent" | "info";
}) {
  return (
    <span
      className={cn(
        "inline-flex h-[22px] items-center gap-1 rounded-full px-2 text-[11.5px] font-medium leading-none",
        tone === "accent" && "bg-primary-soft text-primary ring-1 ring-inset ring-primary/20",
        tone === "info" && "bg-[#EAF4FF] text-[#2F6FB0] ring-1 ring-inset ring-[#C7DDF5]",
      )}
    >
      <Icon className="h-3 w-3 shrink-0 stroke-[1.8]" />
      {children}
    </span>
  );
}

function AuditFileLinkAction({
  icon: Icon,
  label,
  onClick,
}: {
  icon: typeof Eye;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap px-0.5 py-0.5 text-[12px] text-muted-foreground transition-colors hover:text-primary"
    >
      <Icon className="h-3.5 w-3.5 shrink-0 stroke-[1.8]" />
      <span className="whitespace-nowrap">{label}</span>
    </button>
  );
}

/** 对齐知识总览：更多菜单内放红色删除 */
function AuditFileMoreMenu({ onDelete }: { onDelete: () => void }) {
  const [open, setOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = () => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  };
  const openNow = () => {
    clearTimer();
    setOpen(true);
  };
  const closeSoon = () => {
    clearTimer();
    timer.current = setTimeout(() => setOpen(false), 160);
  };
  const hoverProps = { onMouseEnter: openNow, onMouseLeave: closeSoon };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen} modal={false}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          {...hoverProps}
          className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap px-0.5 py-0.5 text-[12px] text-muted-foreground transition-colors hover:text-primary data-[state=open]:text-primary"
        >
          <MoreHorizontal className="h-3.5 w-3.5 shrink-0 stroke-[1.8]" />
          <span className="whitespace-nowrap">更多</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="min-w-[140px]"
        onCloseAutoFocus={(e) => e.preventDefault()}
        {...hoverProps}
      >
        <DropdownMenuItem
          className="text-[12.5px] text-destructive focus:text-destructive"
          onClick={onDelete}
        >
          <Trash2 className="h-3.5 w-3.5 stroke-[1.8]" />
          删除
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

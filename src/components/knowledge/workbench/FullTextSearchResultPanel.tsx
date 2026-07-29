import {
  ChevronLeft,
  ChevronRight,
  CircleOff,
  Download,
  ExternalLink,
  Eye,
  MoreHorizontal,
  Pencil,
  Star,
  StarOff,
  Trash2,
} from "lucide-react";
import { useRouter } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { KbEmptyState, KbFileTypeIcon, KbHighlightText, KbStatusTag } from "@/components/knowledge/ui";
import { getFileMatchChunks } from "@/lib/knowledge/fulltextSearch";
import { getBaseById, isEmployee, isFileEnabled } from "@/lib/knowledge/model";
import { removeStoreFiles, updateStoreFile } from "@/lib/knowledge/store";
import type { KnowledgeFile } from "@/lib/knowledge/types";
import { openFileDetailInNewTab, type FileDetailSearchScope } from "@/lib/knowledge/searchNav";
import { cn } from "@/lib/utils";

const LEFT_PAGE_SIZE = 8;

function formatFileDate(value?: string) {
  if (!value) return "-";
  const datePart = value.trim().split(/\s+/)[0];
  return datePart || value;
}

function FileMetaLine({ file, showLibrary }: { file: KnowledgeFile; showLibrary: boolean }) {
  const date = formatFileDate(file.updatedAt);

  if (showLibrary && file.knowledgeBaseName) {
    return (
      <span className="inline-flex min-w-0 max-w-full items-center gap-1.5 truncate">
        <span className="truncate">{file.knowledgeBaseName}</span>
        <span className="shrink-0 text-kb-muted/45" aria-hidden>
          ·
        </span>
        <span className="shrink-0 tabular-nums">{date}</span>
      </span>
    );
  }

  return <span className="tabular-nums">{date}</span>;
}

function useHoverMenu(closeDelay = 160) {
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
    timer.current = setTimeout(() => setOpen(false), closeDelay);
  };

  return { open, setOpen, hoverProps: { onMouseEnter: openNow, onMouseLeave: closeSoon } };
}

/**
 * 全文检索结果的「文件列表 + 命中内容」双栏展示。
 * 仅在搜索模式为「全文」且已输入关键词时启用，不影响原有列表/卡片视图与「文件名」搜索的展示。
 */
export function FullTextSearchResultPanel({
  files,
  query,
  showLibrary = false,
  scope,
  onToggleEnabled,
  className,
}: {
  files: KnowledgeFile[];
  query: string;
  /** 是否展示「所属库」信息：仅在聚合/全部视图下需要 */
  showLibrary?: boolean;
  /** 汇总视图来源时传入，用于在文件详情页构建"退出检索"的返回目标 */
  scope?: FileDetailSearchScope;
  onToggleEnabled?: (file: KnowledgeFile, enabled: boolean) => void;
  className?: string;
}) {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [selectedFileId, setSelectedFileId] = useState<string | undefined>(files[0]?.id);

  const openFile = (file: KnowledgeFile) => {
    openFileDetailInNewTab(router, file, {
      query,
      searchMode: "fulltext",
      resultFiles: files,
      scope,
    });
  };

  const totalPages = Math.max(1, Math.ceil(files.length / LEFT_PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pagedFiles = useMemo(() => {
    const start = (safePage - 1) * LEFT_PAGE_SIZE;
    return files.slice(start, start + LEFT_PAGE_SIZE);
  }, [files, safePage]);

  useEffect(() => {
    setPage(1);
  }, [files]);

  useEffect(() => {
    if (files.length === 0) {
      setSelectedFileId(undefined);
      return;
    }
    if (!pagedFiles.some((file) => file.id === selectedFileId)) {
      setSelectedFileId(pagedFiles[0]?.id);
    }
  }, [pagedFiles, files.length, selectedFileId]);

  const selectedFile = files.find((file) => file.id === selectedFileId);
  const chunks = useMemo(
    () => (selectedFile ? getFileMatchChunks(selectedFile, query) : []),
    [selectedFile, query],
  );

  if (files.length === 0) {
    return (
      <div className={cn("flex min-h-0 flex-1 items-center justify-center", className)}>
        <KbEmptyState
          title="未找到相关内容"
          description="调整全文检索关键词后再试。"
        />
      </div>
    );
  }

  return (
    <div className={cn("flex min-h-0 flex-1 overflow-hidden border-t border-divider", className)}>
      <div className="flex w-[360px] shrink-0 flex-col border-r border-divider bg-[#FAFCFD]">
        <div className="flex h-11 shrink-0 items-center justify-between border-b border-divider px-4">
          <span className="text-[13px] font-semibold text-kb-heading">相关文件</span>
          <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
            {files.length}
          </span>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto scrollbar-thin py-1.5">
          {pagedFiles.map((file) => (
            <FullTextFileRow
              key={file.id}
              file={file}
              query={query}
              showLibrary={showLibrary}
              selected={file.id === selectedFileId}
              onSelect={() => setSelectedFileId(file.id)}
              onOpen={openFile}
              onToggleEnabled={onToggleEnabled}
            />
          ))}
        </div>

        {totalPages > 1 && (
          <SimplePager page={safePage} totalPages={totalPages} onPageChange={setPage} />
        )}
      </div>

      <div className="flex min-h-0 flex-1 flex-col bg-white">
        {selectedFile ? (
          <>
            <div className="flex h-11 shrink-0 items-center justify-between gap-3 border-b border-divider px-4">
              <div className="flex min-w-0 items-center gap-1.5">
                <span className="truncate text-[13px] font-semibold text-kb-heading" title={selectedFile.name}>
                  {selectedFile.name}
                </span>
                {!isFileEnabled(selectedFile) && (
                  <KbStatusTag tone="neutral" className="h-[18px] shrink-0 px-1.5 text-[10.5px]">
                    已停用
                  </KbStatusTag>
                )}
              </div>
              <button
                type="button"
                onClick={() => openFile(selectedFile)}
                className="inline-flex shrink-0 cursor-pointer items-center gap-1 whitespace-nowrap text-[12px] font-medium text-primary transition-colors hover:text-primary/80"
              >
                打开文件预览
                <ExternalLink className="h-3.5 w-3.5 stroke-[1.8]" />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto scrollbar-thin p-4">
              {chunks.length === 0 ? (
                <KbEmptyState title="暂无相关内容片段" description="该文件未找到与关键词匹配的分块。" />
              ) : (
                <div className="space-y-2">
                  {chunks.map((chunk) => (
                    <article
                      key={chunk.id}
                      className="rounded-[8px] border border-divider bg-card px-3 py-2.5"
                    >
                      <p className="line-clamp-2 text-[12.5px] leading-[1.5] text-kb-body">
                        <KbHighlightText text={chunk.text} keyword={chunk.keyword} />
                      </p>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex min-h-0 flex-1 items-center justify-center">
            <KbEmptyState title="请选择左侧文件" description="选择一个文件查看命中的相关内容。" />
          </div>
        )}
      </div>
    </div>
  );
}

function FullTextFileRow({
  file,
  query,
  showLibrary,
  selected,
  onSelect,
  onOpen,
  onToggleEnabled,
}: {
  file: KnowledgeFile;
  query: string;
  showLibrary: boolean;
  selected: boolean;
  onSelect: () => void;
  onOpen: (file: KnowledgeFile) => void;
  onToggleEnabled?: (file: KnowledgeFile, enabled: boolean) => void;
}) {
  const hitCount = useMemo(() => getFileMatchChunks(file, query).length, [file, query]);
  const enabled = isFileEnabled(file);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpen(file)}
      onMouseEnter={onSelect}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") onOpen(file);
      }}
      className={cn(
        "group relative flex cursor-pointer flex-col gap-1.5 border-b border-divider/70 px-4 py-3 text-left transition-colors",
        selected ? "bg-primary-soft" : "hover:bg-muted/50",
      )}
    >
      {selected && (
        <span
          className="absolute left-0 top-1/2 h-[60%] w-[3px] -translate-y-1/2 rounded-r-full bg-primary"
          aria-hidden
        />
      )}
      <div className="flex min-w-0 items-center gap-2.5">
        <KbFileTypeIcon type={file.type} fileName={file.name} size="sm" className="shrink-0" />
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-1.5">
              <span
                className={cn(
                  "truncate text-[13.5px] leading-5",
                  selected ? "font-medium text-accent-foreground" : "font-medium text-kb-heading",
                )}
                title={file.name}
              >
                {file.name}
              </span>
              {!enabled && (
                <KbStatusTag tone="neutral" className="h-[17px] shrink-0 px-1.5 text-[10px]">
                  已停用
                </KbStatusTag>
              )}
            </div>

            <div
              className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
              onClick={(event) => event.stopPropagation()}
            >
              <FullTextFileRowActions file={file} onOpen={onOpen} onToggleEnabled={onToggleEnabled} />
            </div>
          </div>

          <div className="mt-1 flex min-w-0 items-center justify-between gap-3 text-[11.5px] leading-4 text-muted-foreground">
            <div className="min-w-0 flex-1 truncate">
              <FileMetaLine file={file} showLibrary={showLibrary} />
            </div>
            <span className="shrink-0 whitespace-nowrap">
              命中<span className="mx-0.5 text-[12.5px] font-semibold text-primary">{hitCount}</span>处
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function FullTextFileRowActions({
  file,
  onOpen,
  onToggleEnabled,
}: {
  file: KnowledgeFile;
  onOpen: (file: KnowledgeFile) => void;
  onToggleEnabled?: (file: KnowledgeFile, enabled: boolean) => void;
}) {
  const { open, setOpen, hoverProps } = useHoverMenu();
  const employee = isEmployee();
  const canManageFile = !employee || getBaseById(file.knowledgeBaseId)?.scope === "personal";
  const enabled = isFileEnabled(file);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen} modal={false}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="更多操作"
          {...hoverProps}
          className={cn(
            "grid h-6 w-6 place-items-center rounded-[6px] text-muted-foreground transition-colors",
            "hover:bg-muted hover:text-foreground data-[state=open]:bg-muted data-[state=open]:text-primary",
          )}
        >
          <MoreHorizontal className="h-3.5 w-3.5 stroke-[1.8]" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="min-w-[140px]"
        onCloseAutoFocus={(e) => e.preventDefault()}
        {...hoverProps}
      >
        <DropdownMenuItem className="text-[12.5px]" onClick={() => onOpen(file)}>
          <Eye className="h-3.5 w-3.5 stroke-[1.8]" />
          预览
        </DropdownMenuItem>
        {canManageFile && file.canEdit !== false && (
          <DropdownMenuItem className="text-[12.5px]" onClick={() => toast.message("打开编辑")}>
            <Pencil className="h-3.5 w-3.5 stroke-[1.8]" />
            编辑
          </DropdownMenuItem>
        )}
        {file.canDownload !== false && (
          <DropdownMenuItem className="text-[12.5px]" onClick={() => toast.message("开始下载文件")}>
            <Download className="h-3.5 w-3.5 stroke-[1.8]" />
            下载
          </DropdownMenuItem>
        )}
        <DropdownMenuItem
          className="text-[12.5px]"
          onClick={() => {
            updateStoreFile(file.id, { favorite: !file.favorite });
            toast.success(file.favorite ? "已取消收藏" : "已收藏");
          }}
        >
          {file.favorite ? (
            <StarOff className="h-3.5 w-3.5 stroke-[1.8]" />
          ) : (
            <Star className="h-3.5 w-3.5 stroke-[1.8]" />
          )}
          {file.favorite ? "取消收藏" : "收藏"}
        </DropdownMenuItem>
        {canManageFile && onToggleEnabled && (
          <DropdownMenuItem
            className="text-[12.5px]"
            onClick={() => onToggleEnabled(file, !enabled)}
          >
            <CircleOff className="h-3.5 w-3.5 stroke-[1.8]" />
            {enabled ? "停用" : "启用"}
          </DropdownMenuItem>
        )}
        {canManageFile && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-[12.5px] text-destructive focus:text-destructive"
              onClick={() => {
                if (window.confirm(`确认删除文件「${file.name}」？该操作不可恢复。`)) {
                  removeStoreFiles([file.id]);
                  toast.success("文件已删除");
                }
              }}
            >
              <Trash2 className="h-3.5 w-3.5 stroke-[1.8]" />
              删除
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function SimplePager({
  page,
  totalPages,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  const pages = useMemo(() => {
    const maxVisible = 5;
    if (totalPages <= maxVisible) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const start = Math.max(1, Math.min(page - 2, totalPages - maxVisible + 1));
    return Array.from({ length: maxVisible }, (_, i) => start + i);
  }, [page, totalPages]);

  return (
    <div className="flex shrink-0 items-center justify-center gap-1 border-t border-divider py-2">
      <button
        type="button"
        aria-label="上一页"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        className="grid h-6 w-6 place-items-center rounded-[6px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-35"
      >
        <ChevronLeft className="h-3.5 w-3.5 stroke-[1.8]" />
      </button>
      {pages.map((p) => (
        <button
          key={p}
          type="button"
          onClick={() => onPageChange(p)}
          className={cn(
            "grid h-6 min-w-6 place-items-center rounded-[6px] px-1 text-[11.5px] font-medium transition-colors",
            p === page
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-muted hover:text-foreground",
          )}
        >
          {p}
        </button>
      ))}
      <button
        type="button"
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        className="inline-flex h-6 items-center gap-0.5 rounded-[6px] px-1.5 text-[11.5px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-35"
      >
        下一页
        <ChevronRight className="h-3.5 w-3.5 stroke-[1.8]" />
      </button>
    </div>
  );
}
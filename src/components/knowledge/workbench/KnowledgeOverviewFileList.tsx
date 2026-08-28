import {
  Download,
  Eye,
  ArrowUpDown,
  LayoutGrid,
  List,
  MoreHorizontal,
  Pencil,
  RefreshCw,
  Trash2,
  CircleOff,
  FileEdit,
  FolderInput,
  History,
  Pin,
  PinOff,
  Star,
  StarOff,
  Info,
  Loader2,
  TriangleAlert,
  Upload,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useRef, useState, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { KbDataTable, KbDataTableRow, KbTableCellFile } from "@/components/knowledge/ui";
import { fileListParseStatus, fileListParseStatusLabel } from "@/lib/knowledge/status";
import { getBaseById, isEmployee, isFileEnabled } from "@/lib/knowledge/model";
import { removeStoreFiles, updateStoreFile } from "@/lib/knowledge/store";
import { kbFileTypeConfig } from "@/lib/knowledge/tokens";
import type { KnowledgeFile, KnowledgeParseStatus, KnowledgeSortBy } from "@/lib/knowledge/types";
import { cn } from "@/lib/utils";
import { FileListCheckbox } from "./FileListCheckbox";
import { SimilarFileHintBadge, shouldShowSimilarFileHint } from "./SimilarFileHintBadge";

/** 文件名占主份，时间/上传人等共享剩余宽度，避免文件名过宽、右侧列挤在一起 */
const GRID_OVERVIEW_MANAGE =
  "grid-cols-[36px_minmax(180px,1.8fr)_76px_84px_72px_minmax(148px,1fr)_minmax(88px,0.65fr)_220px] min-w-[900px]";
const GRID_OVERVIEW =
  "grid-cols-[36px_minmax(180px,1.8fr)_76px_84px_minmax(148px,1fr)_minmax(88px,0.65fr)_220px] min-w-[820px]";
const GRID_ALL_LIBRARY_MANAGE =
  "grid-cols-[36px_minmax(160px,1.5fr)_72px_80px_minmax(100px,0.9fr)_72px_minmax(140px,0.85fr)_minmax(80px,0.55fr)_220px] min-w-[1020px]";
const GRID_ALL_LIBRARY =
  "grid-cols-[36px_minmax(160px,1.5fr)_72px_80px_minmax(100px,0.9fr)_minmax(140px,0.85fr)_minmax(80px,0.55fr)_220px] min-w-[940px]";
const GRID_WITH_LIB_MANAGE =
  "grid-cols-[36px_minmax(160px,1.5fr)_72px_80px_minmax(100px,0.9fr)_72px_minmax(140px,0.85fr)_minmax(80px,0.55fr)_220px] min-w-[980px]";
const GRID_WITH_LIB =
  "grid-cols-[36px_minmax(160px,1.5fr)_72px_80px_minmax(100px,0.9fr)_minmax(140px,0.85fr)_minmax(80px,0.55fr)_220px] min-w-[900px]";
const GRID_NO_LIB_MANAGE =
  "grid-cols-[36px_minmax(180px,1.8fr)_76px_84px_72px_minmax(148px,1fr)_minmax(88px,0.65fr)_220px] min-w-[880px]";
const GRID_NO_LIB =
  "grid-cols-[36px_minmax(180px,1.8fr)_76px_84px_minmax(148px,1fr)_minmax(88px,0.65fr)_220px] min-w-[800px]";

export type FileViewMode = "list" | "card";

export type FileListSelection = {
  isSelected: (id: string) => boolean;
  onToggle: (id: string) => void;
  onToggleAll: (ids: string[], checked: boolean) => void;
  pageIds: string[];
};

export const FILE_LIST_SORT_OPTIONS: { value: KnowledgeSortBy; label: string }[] = [
  { value: "updated", label: "上传时间" },
  { value: "size", label: "文件大小" },
  { value: "name", label: "文件名称" },
];

/** 悬浮即展开的菜单：进入触发/内容区保持打开，移出短暂延时后关闭 */
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

  return {
    open,
    setOpen,
    hoverProps: { onMouseEnter: openNow, onMouseLeave: closeSoon },
  };
}

export function FileViewModeToggle({
  value,
  onChange,
  className,
}: {
  value: FileViewMode;
  onChange: (mode: FileViewMode) => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-1 rounded-md border border-border bg-card p-1",
        className,
      )}
    >
      <button
        type="button"
        onClick={() => onChange("card")}
        className={cn(
          "inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11.5px] transition-colors",
          value === "card"
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:bg-muted",
        )}
      >
        <LayoutGrid className="h-3.5 w-3.5 stroke-[1.8]" />
        卡片
      </button>
      <button
        type="button"
        onClick={() => onChange("list")}
        className={cn(
          "inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11.5px] transition-colors",
          value === "list"
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:bg-muted",
        )}
      >
        <List className="h-3.5 w-3.5 stroke-[1.8]" />
        表格
      </button>
    </div>
  );
}

export function FileListSortButton({
  value,
  onChange,
  className,
  options = FILE_LIST_SORT_OPTIONS,
  ariaLabel = "排序",
}: {
  value: KnowledgeSortBy;
  onChange: (sortBy: KnowledgeSortBy) => void;
  className?: string;
  options?: { value: KnowledgeSortBy; label: string }[];
  ariaLabel?: string;
}) {
  const { open, setOpen, hoverProps } = useHoverMenu();
  return (
    <DropdownMenu open={open} onOpenChange={setOpen} modal={false}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={ariaLabel}
          title={ariaLabel}
          {...hoverProps}
          className={cn(
            "grid h-9 w-9 shrink-0 place-items-center rounded-md border border-border bg-card",
            "text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
            "data-[state=open]:border-primary/30 data-[state=open]:bg-primary-soft/30 data-[state=open]:text-primary",
            className,
          )}
        >
          <ArrowUpDown className="h-3.5 w-3.5 stroke-[1.8]" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="min-w-[132px]"
        onCloseAutoFocus={(e) => e.preventDefault()}
        {...hoverProps}
      >
        <DropdownMenuRadioGroup
          value={value}
          onValueChange={(next) => onChange(next as KnowledgeSortBy)}
        >
          {options.map((option) => (
            <DropdownMenuRadioItem
              key={option.value}
              value={option.value}
              className="text-[12.5px]"
            >
              {option.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function FileListRefreshButton({
  onClick,
  className,
}: {
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-label="刷新列表"
      title="刷新"
      onClick={onClick}
      className={cn(
        "grid h-9 w-9 shrink-0 place-items-center rounded-md border border-border bg-card",
        "text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
        className,
      )}
    >
      <RefreshCw className="h-3.5 w-3.5 stroke-[1.8]" />
    </button>
  );
}

const toolbarIconButtonClass =
  "grid h-9 w-9 shrink-0 place-items-center rounded-md border border-border bg-card text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50";

export function FileListUploadButton({
  onClick,
  disabled,
  className,
}: {
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      aria-label="上传文件"
      title="上传"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        toolbarIconButtonClass,
        "text-primary hover:border-primary/30 hover:bg-primary-soft/30 hover:text-primary",
        className,
      )}
    >
      <Upload className="h-3.5 w-3.5 stroke-[1.8]" />
    </button>
  );
}

export function FileListToolbarActions({
  viewMode,
  onViewModeChange,
  sortBy,
  onSortChange,
  onRefresh,
  onUpload,
  uploadDisabled,
  showViewModeToggle = true,
}: {
  viewMode: FileViewMode;
  onViewModeChange: (mode: FileViewMode) => void;
  sortBy: KnowledgeSortBy;
  onSortChange: (sortBy: KnowledgeSortBy) => void;
  onRefresh: () => void;
  onUpload?: () => void;
  uploadDisabled?: boolean;
  /** 全文检索等固定布局场景下隐藏卡片/列表切换 */
  showViewModeToggle?: boolean;
}) {
  return (
    <>
      {showViewModeToggle && <FileViewModeToggle value={viewMode} onChange={onViewModeChange} />}
      {onUpload && <FileListUploadButton onClick={onUpload} disabled={uploadDisabled} />}
      <FileListSortButton value={sortBy} onChange={onSortChange} />
      <FileListRefreshButton onClick={onRefresh} />
    </>
  );
}

function resolveGrid(options: {
  allLibraryMode?: boolean;
  overviewMode?: boolean;
  showLibrary?: boolean;
  showManageColumn?: boolean;
}) {
  if (options.allLibraryMode) {
    return options.showManageColumn ? GRID_ALL_LIBRARY_MANAGE : GRID_ALL_LIBRARY;
  }
  if (options.overviewMode) {
    return options.showManageColumn ? GRID_OVERVIEW_MANAGE : GRID_OVERVIEW;
  }
  if (options.showLibrary) {
    return options.showManageColumn ? GRID_WITH_LIB_MANAGE : GRID_WITH_LIB;
  }
  return options.showManageColumn ? GRID_NO_LIB_MANAGE : GRID_NO_LIB;
}

function EnabledColumnHeader() {
  return (
    <span className="inline-flex items-center gap-1">
      启用
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              className="grid h-4 w-4 place-items-center rounded-full text-muted-foreground hover:text-primary"
              aria-label="停用说明"
              onClick={(e) => e.stopPropagation()}
            >
              <Info className="h-3 w-3 stroke-[2]" />
            </button>
          </TooltipTrigger>
          <TooltipContent
            side="top"
            className="max-w-[240px] bg-[#2f424d] text-[12px] leading-relaxed"
          >
            停用后，该文件不参与文件检索与智能问答召回，普通用户不可见。
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </span>
  );
}

export function KnowledgeFileTable({
  files,
  onOpen,
  showLibrary = true,
  overviewMode = false,
  allLibraryMode = false,
  showManageColumn = false,
  selection,
  onToggleEnabled,
  onMove,
  onTogglePin,
  onViewHistory,
  onSimilarity,
  empty,
  className,
}: {
  files: KnowledgeFile[];
  onOpen: (file: KnowledgeFile) => void;
  showLibrary?: boolean;
  overviewMode?: boolean;
  allLibraryMode?: boolean;
  showManageColumn?: boolean;
  selection?: FileListSelection;
  onToggleEnabled?: (file: KnowledgeFile, enabled: boolean) => void;
  onMove?: (file: KnowledgeFile) => void;
  onTogglePin?: (file: KnowledgeFile) => void;
  onViewHistory?: (file: KnowledgeFile) => void;
  onSimilarity?: (file: KnowledgeFile) => void;
  empty?: ReactNode;
  className?: string;
}) {
  if (files.length === 0) return <>{empty}</>;

  const employee = isEmployee();
  const showEnabledStatus = showManageColumn || employee;
  const grid = resolveGrid({
    allLibraryMode,
    overviewMode,
    showLibrary,
    showManageColumn: showEnabledStatus,
  });
  const showLibraryColumn = allLibraryMode || (!overviewMode && showLibrary);
  const pageIds = selection?.pageIds ?? files.map((file) => file.id);
  const allPageSelected = pageIds.length > 0 && pageIds.every((id) => selection?.isSelected(id));
  const somePageSelected = pageIds.some((id) => selection?.isSelected(id));

  const header = (
    <>
      <SelectAllCell
        checked={allPageSelected}
        indeterminate={!allPageSelected && somePageSelected}
        onCheckedChange={(checked) => selection?.onToggleAll(pageIds, checked === true)}
      />
      <span>文件名</span>
      <span>类型</span>
      <span>大小</span>
      {showLibraryColumn && <span>所属知识库</span>}
      {showEnabledStatus && <EnabledColumnHeader />}
      <span>更新时间</span>
      <span>上传人</span>
      <span className="text-right">操作</span>
    </>
  );

  return (
    <KbDataTable
      className={cn("border-0 shadow-none !overflow-x-auto", className)}
      minWidth={grid}
      header={header}
    >
      {files.map((file) => (
        <FileDataRow
          key={file.id}
          file={file}
          grid={grid}
          onOpen={onOpen}
          showLibraryColumn={showLibraryColumn}
          showManageColumn={showEnabledStatus}
          selection={selection}
          onToggleEnabled={onToggleEnabled}
          onMove={onMove}
          onTogglePin={onTogglePin}
          onViewHistory={onViewHistory}
          onSimilarity={onSimilarity}
        />
      ))}
    </KbDataTable>
  );
}

function SelectAllCell({
  checked,
  indeterminate,
  onCheckedChange,
}: {
  checked: boolean;
  indeterminate?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}) {
  return (
    <span className="flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
      <FileListCheckbox
        checked={checked}
        indeterminate={indeterminate}
        onCheckedChange={onCheckedChange}
        aria-label="全选当前页"
      />
    </span>
  );
}

function FileDataRow({
  file,
  grid,
  onOpen,
  showLibraryColumn,
  showManageColumn,
  selection,
  onToggleEnabled,
  onMove,
  onTogglePin,
  onViewHistory,
  onSimilarity,
}: {
  file: KnowledgeFile;
  grid: string;
  onOpen: (file: KnowledgeFile) => void;
  showLibraryColumn: boolean;
  showManageColumn: boolean;
  selection?: FileListSelection;
  onToggleEnabled?: (file: KnowledgeFile, enabled: boolean) => void;
  onMove?: (file: KnowledgeFile) => void;
  onTogglePin?: (file: KnowledgeFile) => void;
  onViewHistory?: (file: KnowledgeFile) => void;
  onSimilarity?: (file: KnowledgeFile) => void;
}) {
  const type = kbFileTypeConfig[file.type ?? "other"];
  const employee = isEmployee();
  const canManageFile = !employee || getBaseById(file.knowledgeBaseId)?.scope === "personal";
  const selected = selection?.isSelected(file.id) ?? false;

  return (
    <KbDataTableRow className={grid} selected={selected} onClick={() => onOpen(file)}>
      <span className="flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
        <FileListCheckbox
          checked={selected}
          onCheckedChange={() => selection?.onToggle(file.id)}
          aria-label={`选择 ${file.name}`}
        />
      </span>
      <KbTableCellFile
        name={file.name}
        type={file.type ?? "other"}
        size="sm"
        nameWeight="normal"
        badge={
          <>
            <FileParseInlineIcon
              fileStatus={file.status}
              parseStatus={file.parseStatus}
              parseError={file.parseError}
            />
            {(file.versions?.length ?? 0) > 1 && fileListParseStatus(file) === "success" ? (
              <FileHistoryBadge
                count={file.versions?.length ?? 0}
                onClick={onViewHistory ? () => onViewHistory(file) : undefined}
              />
            ) : null}
            {onSimilarity && shouldShowSimilarFileHint(file) ? (
              <SimilarFileHintBadge onClick={() => onSimilarity(file)} />
            ) : null}
          </>
        }
      />
      <span className="text-kb-muted">{type.label}</span>
      <span className="tabular-nums text-kb-muted">{file.size ?? "-"}</span>
      {showLibraryColumn && (
        <span className="truncate text-kb-muted">{file.knowledgeBaseName ?? "-"}</span>
      )}
      {showManageColumn && (
        <span className="flex items-center" onClick={(e) => e.stopPropagation()}>
          {canManageFile ? (
            <Switch
              checked={isFileEnabled(file)}
              onCheckedChange={(checked) => onToggleEnabled?.(file, checked)}
              aria-label={`${file.name} 启用状态`}
            />
          ) : (
            <span className="text-[12px] text-kb-muted">
              {isFileEnabled(file) ? "已启用" : "已停用"}
            </span>
          )}
        </span>
      )}
      <span className="truncate text-kb-muted">{file.updatedAt ?? "-"}</span>
      <span className="truncate text-kb-muted">{file.uploaderName ?? "-"}</span>
      <FileActions
        file={file}
        onOpen={onOpen}
        onToggleEnabled={onToggleEnabled}
        onMove={onMove}
        onTogglePin={onTogglePin}
        onViewHistory={onViewHistory}
      />
    </KbDataTableRow>
  );
}

export function FileHistoryBadge({ count, onClick }: { count: number; onClick?: () => void }) {
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            aria-label={`${count} 个历史版本`}
            onClick={(e) => {
              e.stopPropagation();
              onClick?.();
            }}
            className={cn(
              "inline-flex h-4 shrink-0 items-center gap-0.5 rounded-[5px] bg-primary-soft/60 px-1 text-[10px] font-medium text-primary transition-colors",
              onClick && "hover:bg-primary/15",
            )}
          >
            <History className="h-2.5 w-2.5 stroke-[2]" />v{count}
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" className="bg-[#2f424d] text-[12px]">
          {count} 个历史版本，点击查看
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function FileParseInlineIcon({
  fileStatus,
  parseStatus,
  parseError,
}: {
  fileStatus?: import("@/lib/knowledge/types").FilePublishStatus;
  parseStatus?: KnowledgeParseStatus;
  parseError?: string;
}) {
  if (fileStatus === "uploading") {
    return (
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>
            <span
              role="status"
              aria-label="文件上传中"
              onClick={(event) => event.stopPropagation()}
              className="grid h-5 w-5 shrink-0 place-items-center rounded-[5px] text-primary"
            >
              <Loader2 className="h-3.5 w-3.5 animate-spin stroke-[2]" />
            </span>
          </TooltipTrigger>
          <TooltipContent side="top" className="bg-[#2f424d] text-[12px] leading-relaxed">
            文件上传中
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  if (parseStatus === "parsing" || fileStatus === "parsing") {
    return (
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>
            <span
              role="status"
              aria-label="文件解析中"
              onClick={(event) => event.stopPropagation()}
              className="grid h-5 w-5 shrink-0 place-items-center rounded-[5px] text-warning-foreground"
            >
              <Loader2 className="h-3.5 w-3.5 animate-spin stroke-[2]" />
            </span>
          </TooltipTrigger>
          <TooltipContent side="top" className="bg-[#2f424d] text-[12px] leading-relaxed">
            文件解析中，请稍候
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  if (parseStatus !== "failed") return null;

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            aria-label={`${fileListParseStatusLabel("failed")}，查看异常说明`}
            onClick={(event) => event.stopPropagation()}
            className="grid h-5 w-5 shrink-0 place-items-center rounded-[5px] text-destructive transition-colors hover:bg-destructive/8"
          >
            <TriangleAlert className="h-3.5 w-3.5 stroke-[2]" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" className="bg-[#2f424d] text-[12px] leading-relaxed">
          {parseError?.trim() || "解析失败，请重试"}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function FileLinkAction({
  icon: Icon,
  label,
  onClick,
  tone = "muted",
}: {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  tone?: "muted" | "primary";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex shrink-0 items-center gap-1 whitespace-nowrap px-0.5 py-0.5 text-[12px] transition-colors",
        tone === "primary"
          ? "font-medium text-primary hover:text-primary/80"
          : "text-muted-foreground hover:text-primary",
      )}
    >
      <Icon className="h-3.5 w-3.5 shrink-0 stroke-[1.8]" />
      <span className="whitespace-nowrap">{label}</span>
    </button>
  );
}

function FileActions({
  file,
  onOpen,
  onToggleEnabled,
  onMove,
  onTogglePin,
  onViewHistory,
}: {
  file: KnowledgeFile;
  onOpen: (file: KnowledgeFile) => void;
  onToggleEnabled?: (file: KnowledgeFile, enabled: boolean) => void;
  onMove?: (file: KnowledgeFile) => void;
  onTogglePin?: (file: KnowledgeFile) => void;
  onViewHistory?: (file: KnowledgeFile) => void;
}) {
  const navigate = useNavigate();
  const enabled = isFileEnabled(file);
  const employee = isEmployee();
  const isPersonal = getBaseById(file.knowledgeBaseId)?.scope === "personal";
  const canManageFile = !employee || isPersonal;
  const pinned = Boolean(file.pinned);
  const hasHistory = (file.versions?.length ?? 0) > 1;
  const parseFailed = fileListParseStatus(file) === "failed";
  const canEditParse = isPersonal && file.status === "published";
  const { open, setOpen, hoverProps } = useHoverMenu();

  const handleRetryParse = () => {
    updateStoreFile(file.id, {
      parseStatus: "parsing",
      status: "parsing",
      parseError: undefined,
    });
    toast.success(`已重新发起「${file.name}」的解析`);
  };

  return (
    <span
      className="flex flex-nowrap items-center justify-end gap-2 whitespace-nowrap"
      onClick={(e) => e.stopPropagation()}
    >
      {parseFailed && (
        <FileLinkAction icon={RefreshCw} label="重试" tone="primary" onClick={handleRetryParse} />
      )}
      <FileLinkAction icon={Eye} label="预览" onClick={() => onOpen(file)} />
      {file.canDownload !== false && (
        <FileLinkAction
          icon={Download}
          label="下载"
          onClick={() => toast.message("开始下载文件")}
        />
      )}
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
          {canEditParse && (
            <DropdownMenuItem
              className="text-[12.5px]"
              onClick={() =>
                navigate({ to: "/knowledge/edit/$fileId", params: { fileId: file.id } })
              }
            >
              <FileEdit className="h-3.5 w-3.5 stroke-[1.8]" />
              编辑解析结果
            </DropdownMenuItem>
          )}
          {canManageFile && !isPersonal && file.canEdit !== false && (
            <DropdownMenuItem className="text-[12.5px]" onClick={() => toast.message("打开编辑")}>
              <Pencil className="h-3.5 w-3.5 stroke-[1.8]" />
              编辑
            </DropdownMenuItem>
          )}
          {hasHistory && onViewHistory && (
            <DropdownMenuItem className="text-[12.5px]" onClick={() => onViewHistory(file)}>
              <History className="h-3.5 w-3.5 stroke-[1.8]" />
              查看历史版本
            </DropdownMenuItem>
          )}
          {onMove && (
            <DropdownMenuItem className="text-[12.5px]" onClick={() => onMove(file)}>
              <FolderInput className="h-3.5 w-3.5 stroke-[1.8]" />
              移动
            </DropdownMenuItem>
          )}
          {onTogglePin && (
            <DropdownMenuItem className="text-[12.5px]" onClick={() => onTogglePin(file)}>
              {pinned ? (
                <PinOff className="h-3.5 w-3.5 stroke-[1.8]" />
              ) : (
                <Pin className="h-3.5 w-3.5 stroke-[1.8]" />
              )}
              {pinned ? "取消置顶" : "置顶"}
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
    </span>
  );
}

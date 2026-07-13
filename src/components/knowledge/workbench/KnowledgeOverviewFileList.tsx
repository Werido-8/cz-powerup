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
  FolderInput,
  History,
  Pin,
  PinOff,
  Info,
  Upload,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useRef, useState, type ReactNode } from "react";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  KbDataTable,
  KbDataTableRow,
  KbTableCellFile,
} from "@/components/knowledge/ui";
import {
  fileListParseStatus,
  fileListParseStatusLabel,
  fileListParseStatusTone,
  type KnowledgeStatusTone,
} from "@/lib/knowledge/status";
import { isFileEnabled } from "@/lib/knowledge/model";
import { kbFileTypeConfig } from "@/lib/knowledge/tokens";
import type { KnowledgeFile, KnowledgeSortBy } from "@/lib/knowledge/types";
import { cn } from "@/lib/utils";
import { FileListCheckbox } from "./FileListCheckbox";

const GRID_OVERVIEW_MANAGE =
  "grid-cols-[36px_minmax(220px,1.4fr)_72px_88px_72px_92px_130px_88px_168px] min-w-[1080px]";
const GRID_OVERVIEW =
  "grid-cols-[36px_minmax(220px,1.4fr)_72px_88px_92px_130px_88px_168px] min-w-[980px]";
const GRID_ALL_LIBRARY_MANAGE =
  "grid-cols-[36px_minmax(200px,1.3fr)_72px_88px_minmax(130px,0.85fr)_72px_92px_130px_88px_168px] min-w-[1160px]";
const GRID_ALL_LIBRARY =
  "grid-cols-[36px_minmax(200px,1.3fr)_72px_88px_minmax(130px,0.85fr)_92px_130px_88px_168px] min-w-[1060px]";
const GRID_WITH_LIB_MANAGE =
  "grid-cols-[36px_minmax(220px,1.3fr)_72px_88px_minmax(130px,0.85fr)_72px_92px_130px_88px_168px] min-w-[1120px]";
const GRID_WITH_LIB =
  "grid-cols-[36px_minmax(220px,1.3fr)_72px_88px_minmax(130px,0.85fr)_92px_130px_88px_168px] min-w-[1020px]";
const GRID_NO_LIB_MANAGE =
  "grid-cols-[36px_minmax(240px,1.4fr)_72px_88px_72px_92px_130px_88px_168px] min-w-[1040px]";
const GRID_NO_LIB =
  "grid-cols-[36px_minmax(240px,1.4fr)_72px_88px_92px_130px_88px_168px] min-w-[940px]";

export type FileViewMode = "list" | "card";

export type FileListSelection = {
  isSelected: (id: string) => boolean;
  onToggle: (id: string) => void;
  onToggleAll: (ids: string[], checked: boolean) => void;
  pageIds: string[];
};

export const FILE_LIST_SORT_OPTIONS: { value: KnowledgeSortBy; label: string }[] = [
  { value: "updated", label: "最近更新" },
  { value: "size", label: "文件大小" },
  { value: "name", label: "文件名称" },
  { value: "status", label: "解析状态" },
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
}: {
  value: KnowledgeSortBy;
  onChange: (sortBy: KnowledgeSortBy) => void;
  className?: string;
}) {
  const { open, setOpen, hoverProps } = useHoverMenu();
  return (
    <DropdownMenu open={open} onOpenChange={setOpen} modal={false}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="排序"
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
          {FILE_LIST_SORT_OPTIONS.map((option) => (
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
}: {
  viewMode: FileViewMode;
  onViewModeChange: (mode: FileViewMode) => void;
  sortBy: KnowledgeSortBy;
  onSortChange: (sortBy: KnowledgeSortBy) => void;
  onRefresh: () => void;
  onUpload?: () => void;
  uploadDisabled?: boolean;
}) {
  return (
    <>
      <FileViewModeToggle value={viewMode} onChange={onViewModeChange} />
      {onUpload && (
        <FileListUploadButton onClick={onUpload} disabled={uploadDisabled} />
      )}
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
          <TooltipContent side="top" className="max-w-[240px] bg-[#2f424d] text-[12px] leading-relaxed">
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
  empty?: ReactNode;
  className?: string;
}) {
  if (files.length === 0) return <>{empty}</>;

  const grid = resolveGrid({ allLibraryMode, overviewMode, showLibrary, showManageColumn });
  const showLibraryColumn = allLibraryMode || (!overviewMode && showLibrary);
  const pageIds = selection?.pageIds ?? files.map((file) => file.id);
  const allPageSelected =
    pageIds.length > 0 && pageIds.every((id) => selection?.isSelected(id));
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
      {showManageColumn && <EnabledColumnHeader />}
      <span>解析状态</span>
      <span>更新时间</span>
      <span>上传人</span>
      <span className="text-right">操作</span>
    </>
  );

  return (
    <KbDataTable className={cn("border-0 shadow-none", className)} minWidth={grid} header={header}>
      {files.map((file) => (
        <FileDataRow
          key={file.id}
          file={file}
          grid={grid}
          onOpen={onOpen}
          showLibraryColumn={showLibraryColumn}
          showManageColumn={showManageColumn}
          selection={selection}
          onToggleEnabled={onToggleEnabled}
          onMove={onMove}
          onTogglePin={onTogglePin}
          onViewHistory={onViewHistory}
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
}) {
  const type = kbFileTypeConfig[file.type ?? "other"];
  const selected = selection?.isSelected(file.id) ?? false;
  const parseStatus = fileListParseStatus(file);

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
          (file.versions?.length ?? 0) > 1 ? (
            <FileHistoryBadge
              count={file.versions?.length ?? 0}
              onClick={onViewHistory ? () => onViewHistory(file) : undefined}
            />
          ) : undefined
        }
      />
      <span className="text-kb-muted">{type.label}</span>
      <span className="tabular-nums text-kb-muted">{file.size ?? "-"}</span>
      {showLibraryColumn && (
        <span className="truncate text-kb-muted">{file.knowledgeBaseName ?? "-"}</span>
      )}
      {showManageColumn && (
        <span className="flex items-center" onClick={(e) => e.stopPropagation()}>
          <Switch
            checked={isFileEnabled(file)}
            onCheckedChange={(checked) => onToggleEnabled?.(file, checked)}
            aria-label={`${file.name} 启用状态`}
          />
        </span>
      )}
      <FileParseStatusCell status={parseStatus} />
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

export function FileHistoryBadge({
  count,
  onClick,
}: {
  count: number;
  onClick?: () => void;
}) {
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
            <History className="h-2.5 w-2.5 stroke-[2]" />
            v{count}
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" className="bg-[#2f424d] text-[12px]">
          {count} 个历史版本，点击查看
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

function FileParseStatusCell({
  status,
}: {
  status: ReturnType<typeof fileListParseStatus>;
}) {
  const tone = fileListParseStatusTone(status);
  const label = fileListParseStatusLabel(status);

  return (
    <span className="inline-flex w-fit items-center gap-1.5 justify-self-start">
      <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", statusDotClass[tone])} />
      <span className="text-[12px] text-foreground">{label}</span>
    </span>
  );
}

const statusDotClass: Record<KnowledgeStatusTone, string> = {
  neutral: "bg-muted-foreground/50",
  accent: "bg-primary",
  success: "bg-[#19A974]",
  warning: "bg-[#C76A16]",
  danger: "bg-[#C94747]",
};

function FileLinkAction({
  icon: Icon,
  label,
  onClick,
}: {
  icon: LucideIcon;
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
  const enabled = isFileEnabled(file);
  const pinned = Boolean(file.pinned);
  const hasHistory = (file.versions?.length ?? 0) > 1;
  const { open, setOpen, hoverProps } = useHoverMenu();

  return (
    <span
      className="flex flex-nowrap items-center justify-end gap-2 whitespace-nowrap"
      onClick={(e) => e.stopPropagation()}
    >
      <FileLinkAction icon={Eye} label="预览" onClick={() => onOpen(file)} />
      {file.canDownload !== false && (
        <FileLinkAction icon={Download} label="下载" onClick={() => toast.message("开始下载文件")} />
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
          {file.canEdit !== false && (
            <DropdownMenuItem
              className="text-[12.5px]"
              onClick={() => toast.message("打开编辑")}
            >
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
          {onToggleEnabled && (
            <DropdownMenuItem
              className="text-[12.5px]"
              onClick={() => onToggleEnabled(file, !enabled)}
            >
              <CircleOff className="h-3.5 w-3.5 stroke-[1.8]" />
              {enabled ? "停用" : "启用"}
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-[12.5px] text-destructive focus:text-destructive"
            onClick={() => toast.message("确认删除文件？")}
          >
            <Trash2 className="h-3.5 w-3.5 stroke-[1.8]" />
            删除
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </span>
  );
}

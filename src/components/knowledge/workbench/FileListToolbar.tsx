import { CheckCircle2, CircleOff, Download, FolderInput, Loader2, Trash2, X } from "lucide-react";
import type { LucideIcon, ReactNode } from "lucide-react";
import { cn } from "@/lib/utils";

type BatchLoadingState = "download" | "disable" | "delete" | "move" | null;

export function FileListToolbar({
  selectedCount,
  totalCount,
  pageFileCount,
  isAllResultsSelected,
  onSelectAllResults,
  onBatchDownload,
  onBatchMove,
  onBatchDisable,
  onBatchDelete,
  onClearSelection,
  showBatchMove = false,
  showBatchDisable = true,
  batchLoading,
  left,
  right,
  className,
}: {
  selectedCount: number;
  totalCount: number;
  pageFileCount: number;
  isAllResultsSelected: boolean;
  onSelectAllResults?: () => void;
  onBatchDownload: () => void;
  onBatchMove?: () => void;
  onBatchDisable?: () => void;
  onBatchDelete: () => void;
  onClearSelection: () => void;
  showBatchMove?: boolean;
  showBatchDisable?: boolean;
  batchLoading?: BatchLoadingState;
  left?: ReactNode;
  right?: ReactNode;
  className?: string;
}) {
  const isBatchMode = selectedCount > 0;
  const allPageSelected = pageFileCount > 0 && selectedCount >= pageFileCount;
  const canSelectAllResults =
    !isAllResultsSelected &&
    allPageSelected &&
    totalCount > pageFileCount &&
    Boolean(onSelectAllResults);

  return (
    <div
      className={cn(
        "relative box-border flex h-[52px] min-h-[52px] items-center justify-between gap-4 overflow-hidden border-b border-[#e8eef1] bg-[#FAFCFD] px-3.5",
        isBatchMode && "border-[rgba(52,155,172,0.18)] bg-[rgba(52,155,172,0.055)]",
        isBatchMode &&
          "before:absolute before:bottom-2 before:left-0 before:top-2 before:w-[3px] before:rounded-r-[3px] before:bg-primary",
        className,
      )}
    >
      <div
        className={cn(
          "flex min-w-0 flex-1 items-center gap-2 transition-all duration-150",
          isBatchMode ? "pl-2 opacity-100" : "opacity-100",
        )}
      >
        {isBatchMode ? (
          <BatchToolbarSummary
            selectedCount={selectedCount}
            isAllResultsSelected={isAllResultsSelected}
            canSelectAllResults={canSelectAllResults}
            totalCount={totalCount}
            onSelectAllResults={onSelectAllResults}
          />
        ) : (
          left
        )}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {isBatchMode ? (
          <BatchToolbarActions
            onBatchDownload={onBatchDownload}
            onBatchMove={onBatchMove}
            onBatchDisable={onBatchDisable}
            onBatchDelete={onBatchDelete}
            onClearSelection={onClearSelection}
            showBatchMove={showBatchMove}
            showBatchDisable={showBatchDisable}
            batchLoading={batchLoading}
          />
        ) : (
          right
        )}
      </div>
    </div>
  );
}

function BatchToolbarSummary({
  selectedCount,
  isAllResultsSelected,
  canSelectAllResults,
  totalCount,
  onSelectAllResults,
}: {
  selectedCount: number;
  isAllResultsSelected: boolean;
  canSelectAllResults: boolean;
  totalCount: number;
  onSelectAllResults?: () => void;
}) {
  return (
    <div className="flex min-w-0 items-center gap-2 text-[14px] leading-[22px] text-[#526670]">
      <CheckCircle2 className="h-[18px] w-[18px] shrink-0 text-primary" strokeWidth={1.8} />
      <span className="truncate whitespace-nowrap">
        {isAllResultsSelected ? (
          <>
            已选择全部 <strong className="mx-1 font-semibold text-primary">{selectedCount}</strong> 个文件
          </>
        ) : (
          <>
            已选择 <strong className="mx-1 font-semibold text-primary">{selectedCount}</strong> 个文件
          </>
        )}
      </span>
      {canSelectAllResults && (
        <button
          type="button"
          onClick={onSelectAllResults}
          className="shrink-0 border-0 bg-transparent p-0 text-[14px] text-primary hover:underline"
        >
          选择全部 {totalCount} 个文件
        </button>
      )}
    </div>
  );
}

function BatchToolbarActions({
  onBatchDownload,
  onBatchMove,
  onBatchDisable,
  onBatchDelete,
  onClearSelection,
  showBatchMove,
  showBatchDisable,
  batchLoading,
}: {
  onBatchDownload: () => void;
  onBatchMove?: () => void;
  onBatchDisable?: () => void;
  onBatchDelete: () => void;
  onClearSelection: () => void;
  showBatchMove?: boolean;
  showBatchDisable?: boolean;
  batchLoading?: BatchLoadingState;
}) {
  const busy = Boolean(batchLoading);

  return (
    <div className="flex items-center gap-1">
      <BatchIconButton
        icon={Download}
        label="下载"
        onClick={onBatchDownload}
        loading={batchLoading === "download"}
        disabled={busy}
      />
      {showBatchMove && onBatchMove && (
        <BatchIconButton
          icon={FolderInput}
          label="移动"
          onClick={onBatchMove}
          loading={batchLoading === "move"}
          disabled={busy}
        />
      )}
      {showBatchDisable && onBatchDisable && (
        <BatchIconButton
          icon={CircleOff}
          label="停用"
          onClick={onBatchDisable}
          loading={batchLoading === "disable"}
          disabled={busy}
        />
      )}
      <BatchIconButton
        icon={Trash2}
        label="删除"
        onClick={onBatchDelete}
        loading={batchLoading === "delete"}
        disabled={busy}
        danger
      />
      <span className="mx-1 h-5 w-px bg-[#d8e2e7]" aria-hidden />
      <button
        type="button"
        onClick={onClearSelection}
        disabled={busy}
        aria-label="取消选择"
        title="取消选择"
        className="grid h-8 w-8 place-items-center rounded-[8px] text-[#637781] transition-colors hover:bg-white/80 hover:text-primary disabled:opacity-50"
      >
        <X className="h-4 w-4 stroke-[1.8]" />
      </button>
    </div>
  );
}

function BatchIconButton({
  icon: Icon,
  label,
  onClick,
  loading,
  disabled,
  danger,
}: {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  loading?: boolean;
  disabled?: boolean;
  danger?: boolean;
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
        danger
          ? "text-[#d83a40] hover:bg-[rgba(216,58,64,0.08)]"
          : "text-[#344a55] hover:bg-white/80 hover:text-primary",
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

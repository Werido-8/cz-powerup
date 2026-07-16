import { CheckCircle2, CircleOff, Loader2, RefreshCw, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type BatchLoadingState = "enable" | "disable" | null;

export function KnowledgeBaseListToolbar({
  selectedCount,
  totalCount,
  pageItemCount,
  isAllResultsSelected,
  onSelectAllResults,
  onBatchEnable,
  onBatchDisable,
  onClearSelection,
  canBatchEnable,
  canBatchDisable,
  batchLoading,
  left,
  right,
  className,
}: {
  selectedCount: number;
  totalCount: number;
  pageItemCount: number;
  isAllResultsSelected: boolean;
  onSelectAllResults?: () => void;
  onBatchEnable: () => void;
  onBatchDisable: () => void;
  onClearSelection: () => void;
  canBatchEnable: boolean;
  canBatchDisable: boolean;
  batchLoading?: BatchLoadingState;
  left?: ReactNode;
  right?: ReactNode;
  className?: string;
}) {
  const isBatchMode = selectedCount > 0;
  const allPageSelected = pageItemCount > 0 && selectedCount >= pageItemCount;
  const canSelectAllResults =
    !isAllResultsSelected &&
    allPageSelected &&
    totalCount > pageItemCount &&
    Boolean(onSelectAllResults);

  return (
    <div
      className={cn(
        "relative  flex h-[42px] min-h-[42px] items-center justify-between gap-4 overflow-hidden bg-white ",
        className,
      )}
    >
      <div
        className={cn(
          "flex min-w-0 flex-1 items-center gap-2 transition-all duration-150",
          isBatchMode && "pl-2",
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
            onBatchEnable={onBatchEnable}
            onBatchDisable={onBatchDisable}
            onClearSelection={onClearSelection}
            canBatchEnable={canBatchEnable}
            canBatchDisable={canBatchDisable}
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
            已选择全部{" "}
            <strong className="mx-1 font-semibold text-primary">{selectedCount}</strong> 个知识库
          </>
        ) : (
          <>
            已选择 <strong className="mx-1 font-semibold text-primary">{selectedCount}</strong>{" "}
            个知识库
          </>
        )}
      </span>
      {canSelectAllResults && (
        <button
          type="button"
          onClick={onSelectAllResults}
          className="shrink-0 border-0 bg-transparent p-0 text-[14px] text-primary hover:underline"
        >
          选择全部 {totalCount} 个知识库
        </button>
      )}
    </div>
  );
}

function BatchToolbarActions({
  onBatchEnable,
  onBatchDisable,
  onClearSelection,
  canBatchEnable,
  canBatchDisable,
  batchLoading,
}: {
  onBatchEnable: () => void;
  onBatchDisable: () => void;
  onClearSelection: () => void;
  canBatchEnable: boolean;
  canBatchDisable: boolean;
  batchLoading?: BatchLoadingState;
}) {
  const busy = Boolean(batchLoading);

  return (
    <div className="flex items-center gap-1">
      <BatchIconButton
        icon={RefreshCw}
        label="批量启用"
        onClick={onBatchEnable}
        loading={batchLoading === "enable"}
        disabled={busy || !canBatchEnable}
      />
      <BatchIconButton
        icon={CircleOff}
        label="批量停用"
        onClick={onBatchDisable}
        loading={batchLoading === "disable"}
        disabled={busy || !canBatchDisable}
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
}: {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  loading?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      className={cn(
        "inline-flex h-8 items-center gap-1.5 rounded-[8px] px-2.5 text-[13px] font-medium text-[#344a55] transition-colors",
        "hover:bg-white/80 hover:text-primary",
        "disabled:cursor-not-allowed disabled:opacity-50",
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

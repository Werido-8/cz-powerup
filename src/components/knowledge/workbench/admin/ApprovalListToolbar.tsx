import { Check, CheckCircle2, Loader2, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type BatchLoadingState = "approve" | "reject" | null;

export function ApprovalListToolbar({
  selectedCount,
  totalCount,
  pageItemCount,
  isAllResultsSelected,
  onSelectAllResults,
  onBatchApprove,
  onBatchReject,
  onClearSelection,
  batchLoading,
  entityLabel = "条",
  left,
  className,
}: {
  selectedCount: number;
  totalCount: number;
  pageItemCount: number;
  isAllResultsSelected: boolean;
  onSelectAllResults?: () => void;
  onBatchApprove: () => void;
  onBatchReject: () => void;
  onClearSelection: () => void;
  batchLoading?: BatchLoadingState;
  entityLabel?: string;
  left?: ReactNode;
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
        "relative flex min-h-[52px] items-center justify-between gap-4 border-b border-divider px-4 py-2.5",
        isBatchMode && "bg-[rgba(52,155,172,0.055)]",
        isBatchMode &&
          "before:absolute before:bottom-2 before:left-0 before:top-2 before:w-[3px] before:rounded-r-[3px] before:bg-primary",
        className,
      )}
    >
      <div
        className={cn(
          "flex min-w-0 flex-1 items-center gap-2",
          isBatchMode && "pl-2",
        )}
      >
        {isBatchMode ? (
          <div className="flex min-w-0 items-center gap-2 text-[14px] leading-[22px] text-[#526670]">
            <CheckCircle2 className="h-[18px] w-[18px] shrink-0 text-primary" strokeWidth={1.8} />
            <span className="truncate whitespace-nowrap">
              {isAllResultsSelected ? (
                <>
                  已选择全部{" "}
                  <strong className="mx-1 font-semibold text-primary">{selectedCount}</strong>{" "}
                  {entityLabel}
                </>
              ) : (
                <>
                  已选择{" "}
                  <strong className="mx-1 font-semibold text-primary">{selectedCount}</strong>{" "}
                  {entityLabel}
                </>
              )}
            </span>
            {canSelectAllResults && (
              <button
                type="button"
                onClick={onSelectAllResults}
                className="shrink-0 border-0 bg-transparent p-0 text-[14px] text-primary hover:underline"
              >
                选择全部 {totalCount} {entityLabel}
              </button>
            )}
          </div>
        ) : (
          left
        )}
      </div>

      {isBatchMode && (
        <div className="flex shrink-0 items-center gap-1">
          <BatchIconButton
            icon={Check}
            label="批量通过"
            onClick={onBatchApprove}
            loading={batchLoading === "approve"}
            disabled={Boolean(batchLoading)}
            variant="primary"
          />
          <BatchIconButton
            icon={X}
            label="批量驳回"
            onClick={onBatchReject}
            loading={batchLoading === "reject"}
            disabled={Boolean(batchLoading)}
            variant="danger"
          />
          <span className="mx-1 h-5 w-px bg-[#d8e2e7]" aria-hidden />
          <button
            type="button"
            onClick={onClearSelection}
            disabled={Boolean(batchLoading)}
            aria-label="取消选择"
            title="取消选择"
            className="grid h-8 w-8 place-items-center rounded-[8px] text-[#637781] transition-colors hover:bg-white/80 hover:text-primary disabled:opacity-50"
          >
            <X className="h-4 w-4 stroke-[1.8]" />
          </button>
        </div>
      )}
    </div>
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
  icon: LucideIcon;
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
        variant === "danger" &&
          "text-[#d83a40] hover:bg-[rgba(216,58,64,0.08)]",
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

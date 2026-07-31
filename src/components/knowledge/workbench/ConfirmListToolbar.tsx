import { Check, CheckCircle2, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";

export function ConfirmListToolbar({
  selectedCount,
  totalCount,
  pageItemCount,
  isAllResultsSelected,
  onSelectAllResults,
  onBatchConfirm,
  onClearSelection,
  batchLoading = false,
  className,
}: {
  selectedCount: number;
  totalCount: number;
  pageItemCount: number;
  isAllResultsSelected: boolean;
  onSelectAllResults?: () => void;
  onBatchConfirm: () => void;
  onClearSelection: () => void;
  batchLoading?: boolean;
  className?: string;
}) {
  const allPageSelected = pageItemCount > 0 && selectedCount >= pageItemCount;
  const canSelectAllResults =
    !isAllResultsSelected &&
    allPageSelected &&
    totalCount > pageItemCount &&
    Boolean(onSelectAllResults);

  return (
    <div
      className={cn(
        "relative box-border flex h-[52px] min-h-[52px] items-center justify-between gap-4 overflow-hidden border-b border-[rgba(52,155,172,0.18)] bg-[rgba(52,155,172,0.055)] px-3.5",
        "before:absolute before:bottom-2 before:left-0 before:top-2 before:w-[3px] before:rounded-r-[3px] before:bg-primary",
        className,
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-2 pl-2">
        <div className="flex min-w-0 items-center gap-2 text-[14px] leading-[22px] text-[#526670]">
          <CheckCircle2 className="h-[18px] w-[18px] shrink-0 text-primary" strokeWidth={1.8} />
          <span className="truncate whitespace-nowrap">
            {isAllResultsSelected ? (
              <>
                已选择全部 <strong className="mx-1 font-semibold text-primary">{selectedCount}</strong>{" "}
                个文件
              </>
            ) : (
              <>
                已选择 <strong className="mx-1 font-semibold text-primary">{selectedCount}</strong>{" "}
                个文件
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
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          onClick={onBatchConfirm}
          disabled={batchLoading || selectedCount === 0}
          title="批量确认"
          className={cn(
            "inline-flex h-8 items-center gap-1.5 rounded-[8px] px-2.5 text-[13px] font-medium transition-colors",
            "border border-primary/20 bg-primary-soft/60 text-primary hover:bg-primary hover:text-primary-foreground",
            "disabled:cursor-not-allowed disabled:opacity-50",
          )}
        >
          {batchLoading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin stroke-[1.8]" />
          ) : (
            <Check className="h-3.5 w-3.5 stroke-[1.8]" />
          )}
          批量确认
        </button>
        <span className="mx-1 h-5 w-px bg-[#d8e2e7]" aria-hidden />
        <button
          type="button"
          onClick={onClearSelection}
          disabled={batchLoading}
          aria-label="取消选择"
          title="取消选择"
          className="grid h-8 w-8 place-items-center rounded-[8px] text-[#637781] transition-colors hover:bg-white/80 hover:text-primary disabled:opacity-50"
        >
          <X className="h-4 w-4 stroke-[1.8]" />
        </button>
      </div>
    </div>
  );
}

import { RefreshCw } from "lucide-react";
import { AppDialogButton, AppFormDialog } from "@/components/ui/app-dialog";

export function RecompareConfirmDialog({
  open,
  loading,
  baseLabel,
  targetLabel,
  onClose,
  onConfirm,
}: {
  open: boolean;
  loading?: boolean;
  baseLabel: string;
  targetLabel: string;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <AppFormDialog
      open={open}
      size="small"
      variant="confirm"
      title="重新执行比对？"
      titleIcon={RefreshCw}
      onClose={onClose}
      footer={
        <>
          <AppDialogButton variant="outline" onClick={onClose} disabled={loading}>
            取消
          </AppDialogButton>
          <AppDialogButton variant="primary" onClick={onConfirm} loading={loading}>
            确认重新比对
          </AppDialogButton>
        </>
      }
    >
      <p className="text-[13.5px] leading-relaxed text-[#526670]">
        将以 <strong className="font-semibold text-foreground">{baseLabel}</strong> 为基准，重新比对{" "}
        <strong className="font-semibold text-foreground">{targetLabel}</strong>
        。重新比对会覆盖当前的差异结果，已标注的阅读进度将被清除。
      </p>
    </AppFormDialog>
  );
}

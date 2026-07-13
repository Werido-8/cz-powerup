import { AppDialogButton, AppFormDialog } from "@/components/ui/app-dialog";
import { Trash2 } from "lucide-react";

export function FileBatchDeleteDialog({
  open,
  count,
  loading,
  onClose,
  onConfirm,
}: {
  open: boolean;
  count: number;
  loading?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <AppFormDialog
      open={open}
      size="small"
      variant="confirm"
      title="批量删除文件？"
      titleIcon={Trash2}
      onClose={onClose}
      footer={
        <>
          <AppDialogButton variant="outline" onClick={onClose} disabled={loading}>
            取消
          </AppDialogButton>
          <AppDialogButton variant="primary" onClick={onConfirm} loading={loading}>
            确认删除
          </AppDialogButton>
        </>
      }
    >
      <p className="text-[13.5px] leading-relaxed text-[#526670]">
        本次将删除 <strong className="font-semibold text-foreground">{count}</strong> 个文件。删除后，这些文件将无法继续参与检索和智能问答。
      </p>
    </AppFormDialog>
  );
}

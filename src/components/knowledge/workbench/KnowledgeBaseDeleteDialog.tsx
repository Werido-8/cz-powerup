import { useMemo } from "react";
import { AlertTriangle, Trash2 } from "lucide-react";
import { AppDialogButton, AppFormDialog } from "@/components/ui/app-dialog";
import { getStoreFiles } from "@/lib/knowledge/store";
import type { KnowledgeBase } from "@/lib/knowledge/types";

export function KnowledgeBaseDeleteDialog({
  base,
  loading,
  onClose,
  onConfirm,
}: {
  base: KnowledgeBase | null;
  loading?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const open = Boolean(base);
  const fileCount = useMemo(
    () => (base ? getStoreFiles().filter((file) => file.knowledgeBaseId === base.id).length : 0),
    [base],
  );

  return (
    <AppFormDialog
      open={open}
      size="small"
      variant="confirm"
      title="删除知识库？"
      titleIcon={Trash2}
      onClose={onClose}
      footer={
        <>
          <AppDialogButton variant="outline" onClick={onClose} disabled={loading}>
            取消
          </AppDialogButton>
          <AppDialogButton
            variant="primary"
            onClick={onConfirm}
            loading={loading}
            className="border-destructive bg-destructive hover:border-destructive/90 hover:bg-destructive/90"
          >
            {loading ? "删除中" : "确认删除"}
          </AppDialogButton>
        </>
      }
    >
      <div className="flex gap-3">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-destructive/10 text-destructive">
          <AlertTriangle className="h-4 w-4 stroke-[1.8]" />
        </div>
        <div className="min-w-0 flex-1 space-y-2 text-[13px] text-kb-body">
          <p>
            确认删除知识库「<span className="font-medium text-kb-heading">{base?.name}</span>」？
            该操作不可恢复。
          </p>
          {fileCount > 0 && (
            <p className="text-kb-muted">
              库内仍有 <span className="font-medium text-kb-body">{fileCount}</span>{" "}
              个文件，将一并删除。
            </p>
          )}
        </div>
      </div>
    </AppFormDialog>
  );
}

import { CircleOff, RefreshCw } from "lucide-react";
import { AppDialogButton, AppFormDialog } from "@/components/ui/app-dialog";
import type { KnowledgeBase, KnowledgeBaseStatus } from "@/lib/knowledge/types";

export type KnowledgeBaseStatusConfirmState = {
  base: KnowledgeBase;
  nextStatus: KnowledgeBaseStatus;
  /** Override default disable copy (e.g. personal space wording). */
  description?: string;
};

export function KnowledgeBaseStatusConfirmDialog({
  state,
  onClose,
  onConfirm,
}: {
  state: KnowledgeBaseStatusConfirmState | null;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const open = Boolean(state);
  const isDisable = state?.nextStatus === "disabled";
  const TitleIcon = isDisable ? CircleOff : RefreshCw;
  const description =
    state?.description ??
    (isDisable
      ? "停用后普通员工不可见，且不参与检索。确认停用？"
      : "确认重新启用该知识库？");

  return (
    <AppFormDialog
      open={open}
      size="small"
      variant="confirm"
      title="确认操作"
      titleIcon={TitleIcon}
      onClose={onClose}
      footer={
        <>
          <AppDialogButton variant="outline" onClick={onClose}>
            取消
          </AppDialogButton>
          <AppDialogButton variant="primary" onClick={onConfirm}>
            确认
          </AppDialogButton>
        </>
      }
    >
      <div className="px-8 py-5">
        <p className="text-[13.5px] leading-relaxed text-[#526670]">{description}</p>
      </div>
    </AppFormDialog>
  );
}

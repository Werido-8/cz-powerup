import { FolderInput } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AppDialogButton, AppFormDialog } from "@/components/ui/app-dialog";
import { getMoveTargetBases } from "@/lib/knowledge/model";
import { pushRecentUploadBaseId } from "@/lib/knowledge/recentUpload";
import { getKnowledgeStoreVersion, subscribeKnowledgeStore } from "@/lib/knowledge/store";
import type { KnowledgeBase } from "@/lib/knowledge/types";
import { useSyncExternalStore } from "react";
import { BaseTreeSelect } from "./FileMoveDialog";

export function UploadBasePickerDialog({
  open,
  title = "选择目标知识库",
  onClose,
  onSelect,
}: {
  open: boolean;
  title?: string;
  onClose: () => void;
  onSelect: (base: KnowledgeBase) => void;
}) {
  const storeVersion = useSyncExternalStore(subscribeKnowledgeStore, getKnowledgeStoreVersion);
  const [target, setTarget] = useState("");
  const [treeOpen, setTreeOpen] = useState(false);

  useEffect(() => {
    if (open) setTarget("");
  }, [open]);

  const targets = useMemo(() => getMoveTargetBases(), [open, storeVersion]);
  const targetById = useMemo(() => new Map(targets.map((b) => [b.id, b])), [targets]);
  const selectedBase = target ? targetById.get(target) : undefined;

  const handleConfirm = () => {
    if (!selectedBase) return;
    pushRecentUploadBaseId(selectedBase.id);
    onSelect(selectedBase);
    onClose();
  };

  return (
    <AppFormDialog
      open={open}
      size="small"
      title={title}
      titleIcon={FolderInput}
      onClose={onClose}
      footer={
        <>
          <AppDialogButton variant="outline" onClick={onClose}>
            取消
          </AppDialogButton>
          <AppDialogButton variant="primary" disabled={!target} onClick={handleConfirm}>
            确认选择
          </AppDialogButton>
        </>
      }
    >
      <div className="space-y-3">
        <p className="text-[13px] leading-relaxed text-[#526670]">
          选择要上传到的目标知识库，确认后进入上传流程。
        </p>
        <div className="space-y-1.5">
          <span className="block text-[12px] font-medium text-kb-body">目标知识库</span>
          <BaseTreeSelect
            value={target}
            selectedBase={selectedBase}
            targets={targets}
            open={treeOpen}
            onOpenChange={setTreeOpen}
            onChange={(id) => {
              setTarget(id);
              setTreeOpen(false);
            }}
          />
        </div>
      </div>
    </AppFormDialog>
  );
}

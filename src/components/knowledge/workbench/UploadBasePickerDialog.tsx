import { FolderInput } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { KnowledgeBaseIcon } from "@/components/knowledge/ui";
import { AppDialogButton, AppFormDialog } from "@/components/ui/app-dialog";
import { getMoveTargetBases } from "@/lib/knowledge/model";
import { pushRecentUploadBaseId } from "@/lib/knowledge/recentUpload";
import {
  getKnowledgeStoreServerSnapshot,
  getKnowledgeStoreVersion,
  subscribeKnowledgeStore,
} from "@/lib/knowledge/store";
import type { KnowledgeBase } from "@/lib/knowledge/types";
import { useSyncExternalStore } from "react";

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
  const storeVersion = useSyncExternalStore(
    subscribeKnowledgeStore,
    getKnowledgeStoreVersion,
    getKnowledgeStoreServerSnapshot,
  );
  const [target, setTarget] = useState("");

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
          <div className="scrollbar-thin max-h-[300px] overflow-y-auto rounded-[8px] border border-kb-border bg-white p-1.5">
            {targets.map((base) => (
              <button
                key={base.id}
                type="button"
                onClick={() => setTarget(base.id)}
                className={
                  target === base.id
                    ? "flex h-10 w-full items-center gap-2 rounded-[7px] bg-primary-soft px-2.5 text-left text-primary"
                    : "flex h-10 w-full items-center gap-2 rounded-[7px] px-2.5 text-left text-kb-body hover:bg-kb-surface-hover"
                }
              >
                <KnowledgeBaseIcon size="sm" />
                <span className="min-w-0 flex-1 truncate text-[12.5px] font-medium">
                  {base.name}
                </span>
                <span className="text-[10.5px] text-kb-muted">
                  {base.scope === "personal" ? "个人知识库" : "公共知识库"}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </AppFormDialog>
  );
}

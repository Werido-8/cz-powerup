import { FolderInput } from "lucide-react";
import { useEffect, useState } from "react";
import { AppDialogButton } from "@/components/ui/app-dialog";
import { KbFormDialog, KbFormField } from "@/components/knowledge/ui";
import { PERSONAL_DIRECTORY_ROOT_ID } from "@/lib/knowledge/model";
import { PROFESSIONAL_CATEGORY_ROOT_ID } from "@/lib/knowledge/store";
import type { KnowledgeBase } from "@/lib/knowledge/types";
import { CategoryTreeSelect } from "./CategoryTreeSelect";
import { PersonalDirectoryTreeSelect } from "./PersonalDirectoryTreeSelect";

export function KnowledgeBaseMoveDialog({
  base,
  loading,
  onClose,
  onConfirm,
}: {
  base: KnowledgeBase | null;
  loading?: boolean;
  onClose: () => void;
  onConfirm: (targetId: string) => void;
}) {
  const open = Boolean(base);
  const isPersonal = base?.scope === "personal";
  const [targetId, setTargetId] = useState("");

  useEffect(() => {
    if (!base) return;
    setTargetId(
      isPersonal
        ? base.personalDirectoryId ?? PERSONAL_DIRECTORY_ROOT_ID
        : base.categoryId ?? PROFESSIONAL_CATEGORY_ROOT_ID,
    );
  }, [base, isPersonal]);

  const submit = () => {
    if (!base || loading || !targetId) return;
    onConfirm(targetId);
  };

  return (
    <KbFormDialog
      open={open}
      size="compact"
      variant="form"
      title="移动知识库"
      titleIcon={FolderInput}
      onClose={onClose}
      footer={
        <>
          <AppDialogButton variant="outline" onClick={onClose} disabled={loading}>
            取消
          </AppDialogButton>
          <AppDialogButton variant="primary" onClick={submit} loading={loading} disabled={!targetId}>
            {loading ? "移动中" : "确认移动"}
          </AppDialogButton>
        </>
      }
    >
      <p className="mb-3 text-[12px] text-kb-muted">
        将「{base?.name}」移动到新的{isPersonal ? "个人目录" : "分类目录"}。
      </p>
      <KbFormField
        label={isPersonal ? "目标个人目录" : "目标分类目录"}
        icon={FolderInput}
        required
        className="mb-0"
      >
        {isPersonal ? (
          <PersonalDirectoryTreeSelect value={targetId} onChange={setTargetId} includeRoot />
        ) : (
          <CategoryTreeSelect value={targetId} onChange={setTargetId} includeRoot variant="form" />
        )}
      </KbFormField>
    </KbFormDialog>
  );
}

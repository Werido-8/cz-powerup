import { useMemo } from "react";
import { AlertTriangle, Trash2 } from "lucide-react";
import { AppDialogButton, AppFormDialog } from "@/components/ui/app-dialog";
import { getBasesForCategory, getCategoryChildren } from "@/lib/knowledge/model";
import type { KnowledgeCategory } from "@/lib/knowledge/types";

function collectImpact(categoryId: string) {
  let subDirs = 0;
  let bases = getBasesForCategory(categoryId).length;
  const walk = (id: string) => {
    for (const child of getCategoryChildren(id)) {
      subDirs += 1;
      bases += getBasesForCategory(child.id).length;
      walk(child.id);
    }
  };
  walk(categoryId);
  return { subDirs, bases };
}

export function DirectoryDeleteDialog({
  category,
  loading,
  onClose,
  onConfirm,
}: {
  category: KnowledgeCategory | null;
  loading?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const open = Boolean(category);
  const impact = useMemo(
    () => (category ? collectImpact(category.id) : { subDirs: 0, bases: 0 }),
    [category],
  );
  const hasContent = impact.subDirs > 0 || impact.bases > 0;

  return (
    <AppFormDialog
      open={open}
      size="small"
      variant="confirm"
      title="删除目录？"
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
            确认删除
          </AppDialogButton>
        </>
      }
    >
      <p className="text-[13.5px] leading-relaxed text-[#526670]">
        确认删除目录
        <strong className="mx-1 font-semibold text-foreground">{category?.name}</strong>
        吗？删除后不可恢复。
      </p>

      {hasContent && (
        <div className="mt-3 flex items-start gap-2.5 rounded-[8px] border border-warning/30 bg-warning/10 px-3 py-2.5">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning-foreground stroke-[1.8]" />
          <p className="text-[12.5px] leading-relaxed text-[#7a5a1e]">
            该目录下包含
            {impact.subDirs > 0 && (
              <strong className="mx-0.5 font-semibold">{impact.subDirs} 个子目录</strong>
            )}
            {impact.subDirs > 0 && impact.bases > 0 && "、"}
            {impact.bases > 0 && (
              <strong className="mx-0.5 font-semibold">{impact.bases} 个知识库</strong>
            )}
            ，将一并被移除，请谨慎操作。
          </p>
        </div>
      )}
    </AppFormDialog>
  );
}

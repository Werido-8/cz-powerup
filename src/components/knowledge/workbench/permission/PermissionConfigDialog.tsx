import { KeyRound } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AppDialogButton } from "@/components/ui/app-dialog";
import { KbFormDialog } from "@/components/knowledge/ui";
import {
  getGrantsForBase,
  hasManager,
  type PermissionGrants,
} from "@/lib/knowledge/permission";
import type { KnowledgeBase } from "@/lib/knowledge/types";
import { PermissionEditor } from "./PermissionEditor";

export function PermissionConfigDialog({
  base,
  onClose,
  onSave,
}: {
  base: KnowledgeBase;
  onClose: () => void;
  onSave?: (grants: PermissionGrants) => void;
}) {
  const [grants, setGrants] = useState<PermissionGrants>(() => getGrantsForBase(base.id));
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setGrants(getGrantsForBase(base.id));
    setSubmitting(false);
  }, [base.id]);

  const handleSave = () => {
    if (!hasManager(grants)) {
      toast.error("至少保留一名管理者");
      return;
    }
    setSubmitting(true);
    onSave?.(grants);
    toast.success("权限配置已保存");
    setSubmitting(false);
    onClose();
  };

  return (
    <KbFormDialog
      open
      size="xlarge"
      title="权限配置"
      titleIcon={KeyRound}
      onClose={onClose}
      className="!max-h-[calc(100vh-64px)]"
      footer={
        <>
          <AppDialogButton variant="outline" onClick={onClose} disabled={submitting}>
            取消
          </AppDialogButton>
          <AppDialogButton variant="primary" onClick={handleSave} loading={submitting}>
            保存配置
          </AppDialogButton>
        </>
      }
    >
      <div className="mb-4">
        <div className="text-[14px] font-semibold text-kb-heading">{base.name}</div>
        <div className="mt-0.5 text-[12px] text-kb-muted">
          专业知识库
          {base.categoryPath?.length ? ` · ${base.categoryPath.join(" / ")}` : ""}
        </div>
      </div>

      <PermissionEditor
        grants={grants}
        onChange={setGrants}
        baseId={base.id}
        showRequests
        showSummary
      />
    </KbFormDialog>
  );
}

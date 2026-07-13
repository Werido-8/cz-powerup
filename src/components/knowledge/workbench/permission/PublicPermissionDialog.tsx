import { Globe, Info } from "lucide-react";
import { AppDialogButton, AppFormDialog } from "@/components/ui/app-dialog";
import { KbStatusTag } from "@/components/knowledge/ui";
import type { KnowledgeBase } from "@/lib/knowledge/types";
import { kbCardShell, kbRadius } from "@/lib/knowledge/tokens";
import { cn } from "@/lib/utils";

const PUBLIC_PERMISSION_ROWS = [
  { subject: "全体系统用户", level: "浏览" },
  { subject: "知识库管理员", level: "上传、管理" },
  { subject: "系统管理员", level: "管理" },
] as const;

export function PublicPermissionDialog({
  base,
  onClose,
}: {
  base: KnowledgeBase;
  onClose: () => void;
}) {
  return (
    <AppFormDialog
      open
      size="small"
      title="权限说明"
      titleIcon={Info}
      onClose={onClose}
      footer={
        <AppDialogButton variant="primary" onClick={onClose}>
          关闭
        </AppDialogButton>
      }
    >
      <div className="mb-4 flex items-center gap-2">
        <span className="grid h-8 w-8 place-items-center rounded-[8px] bg-muted text-[#4E5969]">
          <Globe className="h-4 w-4 stroke-[1.8]" />
        </span>
        <div>
          <div className="text-[13px] font-semibold text-kb-heading">公共知识库</div>
          <div className="text-[12px] text-kb-muted">{base.name}</div>
        </div>
      </div>

      <p className="mb-4 text-[12.5px] leading-relaxed text-kb-muted">
        公共知识库采用系统默认权限，无需单独配置。
      </p>

      <div className={cn(kbCardShell, kbRadius.md, "divide-y divide-[#EEF2F4] overflow-hidden")}>
        {PUBLIC_PERMISSION_ROWS.map((row) => (
          <div key={row.subject} className="flex items-center justify-between px-4 py-3">
            <span className="text-[13px] text-kb-heading">{row.subject}</span>
            <KbStatusTag tone="neutral" variant="outline">
              {row.level}
            </KbStatusTag>
          </div>
        ))}
      </div>

      <p className="mt-4 text-[12px] leading-relaxed text-kb-muted">
        知识库类型变更为专业库后，才可按角色和成员配置权限。
      </p>
    </AppFormDialog>
  );
}

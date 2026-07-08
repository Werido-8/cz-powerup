import { toast } from "sonner";
import { KbUploadCard } from "@/components/knowledge/ui";
import type { KnowledgeBase } from "@/lib/knowledge/types";

export function KnowledgeUploadPanel({
  compact = true,
  disabled,
  personal,
  base,
  onUploaded,
}: {
  compact?: boolean;
  disabled?: boolean;
  personal?: boolean;
  base?: KnowledgeBase;
  onUploaded?: () => void;
}) {
  if (disabled) {
    return (
      <KbUploadCard
        compact={compact}
        title="当前没有上传权限"
        hint="请联系知识库管理员申请上传权限"
        className="pointer-events-none opacity-60"
      />
    );
  }

  return (
    <KbUploadCard
      compact={compact}
      title="拖入文件或选择上传"
      hint={
        personal || base?.scope === "personal"
          ? "个人库上传免审批，提交后直接进入解析。"
          : "同库同名文件会建议上传为新版本，非免审场景进入审批。"
      }
      onUpload={() => {
        onUploaded?.();
        toast.success(
          personal || base?.scope === "personal"
            ? "文件已进入解析队列"
            : "文件已提交上传流程",
        );
      }}
    />
  );
}

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
          ? "个人库上传解析完成后，在「我的上传 · 文件确认」核对 AI 内容后发布。"
          : "提交后将先解析，解析完成后进入审批台审核。"
      }
      onUpload={() => {
        onUploaded?.();
        toast.success(
          personal || base?.scope === "personal"
            ? "文件已进入解析队列，完成后请在文件确认中核对"
            : "文件已提交，解析完成后将进入审批台",
        );
      }}
    />
  );
}

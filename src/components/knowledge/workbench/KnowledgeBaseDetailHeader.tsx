import { Library, Pin, PinOff, Upload } from "lucide-react";
import { ActionButton, StatIconFrame, Tag } from "@/components/learning/ui";
import type { KnowledgeBase } from "@/lib/knowledge/types";
import { cn } from "@/lib/utils";

export function KnowledgeBaseDetailHeader({
  base,
  fileCount,
  pinned,
  canUpload,
  onTogglePin,
  onUpload,
}: {
  base: KnowledgeBase;
  fileCount: number;
  pinned: boolean;
  canUpload: boolean;
  onTogglePin: () => void;
  onUpload: () => void;
}) {
  const categoryLabel = base.categoryPath?.join(" / ") ?? "未归类";
  const updatedLabel = base.updatedAt?.slice(5, 16) ?? "-";

  return (
    <section
      className={cn(
        "overflow-hidden rounded-[12px] border border-border bg-card p-4",
        "shadow-[0_8px_24px_rgba(31,52,64,0.04)]",
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <StatIconFrame
            icon={<Library className="h-[17px] w-[17px] stroke-[1.8]" />}
            size="sm"
          />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-[22px] font-semibold tracking-tight text-foreground">
                {base.name}
              </h1>
              <Tag variant="primary">{fileCount} 个文件</Tag>
            </div>
            <p className="mt-1.5 max-w-[720px] text-[13px] leading-relaxed text-muted-foreground">
              {base.description}
            </p>
            <div className="mt-2.5 flex flex-wrap items-center gap-2">
              <Tag variant="outline">{categoryLabel}</Tag>
              <span className="text-[12px] text-muted-foreground">
                {base.departmentName ?? "公共库"}
              </span>
              <span className="text-border">·</span>
              <span className="text-[12px] text-muted-foreground">更新于 {updatedLabel}</span>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <ActionButton variant="outline" size="sm" onClick={onTogglePin}>
            {pinned ? (
              <PinOff className="h-3.5 w-3.5 stroke-[1.8]" />
            ) : (
              <Pin className="h-3.5 w-3.5 stroke-[1.8]" />
            )}
            {pinned ? "取消置顶" : "置顶"}
          </ActionButton>
          {canUpload && (
            <ActionButton variant="primary" size="sm" onClick={onUpload}>
              <Upload className="h-3.5 w-3.5 stroke-[1.8]" />
              上传
            </ActionButton>
          )}
        </div>
      </div>
    </section>
  );
}

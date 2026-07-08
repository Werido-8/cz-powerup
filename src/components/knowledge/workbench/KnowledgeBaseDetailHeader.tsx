import { Clock, Library, Pin, PinOff, Upload } from "lucide-react";
import { ActionButton, StatIconFrame, Tag } from "@/components/learning/ui";
import type { KnowledgeBase } from "@/lib/knowledge/types";
import { KnowledgeBaseBreadcrumb } from "./KnowledgeBaseBreadcrumb";

export function KnowledgeBaseDetailHeader({
  base,
  fileCount,
  pinned,
  canUpload,
  onTogglePin,
  onUpload,
  onSelectBase,
}: {
  base: KnowledgeBase;
  fileCount: number;
  pinned: boolean;
  canUpload: boolean;
  onTogglePin: () => void;
  onUpload: () => void;
  onSelectBase: (baseId: string) => void;
}) {
  const categoryTags = base.categoryPath ?? [];
  const updatedLabel = base.updatedAt ?? "-";
  const ownerLabel = base.ownerName ?? "-";

  return (
    <section className="border-b border-divider px-5 py-4">
      <KnowledgeBaseBreadcrumb base={base} onSelectBase={onSelectBase} className="mb-3" />

      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 flex-1 items-start gap-3.5">
          <StatIconFrame icon={<Library className="stroke-[1.8]" />} />

          <div className="min-w-0 flex-1 pt-0.5">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-[20px] font-semibold tracking-tight text-foreground">
                {base.name}
              </h1>
              <Tag variant="primary" className="h-6 px-2.5 text-[11px]">
                {fileCount} 个文件
              </Tag>
            </div>

            {base.description && (
              <p className="mt-1.5 line-clamp-2 text-[13px] leading-relaxed text-muted-foreground">
                {base.description}
              </p>
            )}

            <div className="mt-2.5 flex flex-wrap items-center gap-2 text-[11.5px] text-muted-foreground">
              {categoryTags.map((item) => (
                <Tag key={item} variant="outline" className="h-6 rounded-[6px] px-2 text-[11px]">
                  {item}
                </Tag>
              ))}

              <span className="inline-flex items-center gap-1">
                <Clock className="h-3 w-3 shrink-0 stroke-[1.8]" />
                最后更新：{updatedLabel}
              </span>

              <span className="h-3 w-px bg-border" aria-hidden />

              <span>创建人：{ownerLabel}</span>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <ActionButton variant="outline" onClick={onTogglePin}>
            {pinned ? (
              <PinOff className="h-3.5 w-3.5 stroke-[1.8]" />
            ) : (
              <Pin className="h-3.5 w-3.5 stroke-[1.8]" />
            )}
            {pinned ? "取消置顶" : "置顶"}
          </ActionButton>
          {canUpload && (
            <ActionButton variant="primary" onClick={onUpload}>
              <Upload className="h-3.5 w-3.5 stroke-[1.8]" />
              上传
            </ActionButton>
          )}
        </div>
      </div>
    </section>
  );
}

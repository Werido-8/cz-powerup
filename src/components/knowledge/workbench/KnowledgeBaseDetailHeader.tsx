import { Clock, Library } from "lucide-react";
import kbHeaderBackground from "@/assets/image.png";
import { StatIconFrame, Tag } from "@/components/learning/ui";
import type { KnowledgeBase } from "@/lib/knowledge/types";
import { KnowledgeBaseBreadcrumb } from "./KnowledgeBaseBreadcrumb";

export function KnowledgeBaseDetailHeader({
  base,
  fileCount,
  onSelectBase,
}: {
  base: KnowledgeBase;
  fileCount: number;
  onSelectBase: (baseId: string) => void;
}) {
  const categoryTags = base.categoryPath ?? [];
  const updatedLabel = base.updatedAt ?? "-";
  const ownerLabel = base.ownerName ?? "-";

  return (
    <section className="relative overflow-hidden border-b border-divider">
      <img
        src={kbHeaderBackground}
        alt=""
        aria-hidden
        className="pointer-events-none absolute inset-0 h-full w-full object-cover object-[right_center] select-none"
        draggable={false}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 w-[min(72%,680px)] bg-gradient-to-r from-white/88 via-white/45 to-transparent"
      />

      <div className="relative z-[1] px-5 py-4">
        <KnowledgeBaseBreadcrumb base={base} onSelectBase={onSelectBase} className="mb-3" />

        <div className="flex min-w-0 items-start gap-3.5">
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
      </div>
    </section>
  );
}

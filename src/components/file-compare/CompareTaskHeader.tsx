import type { ReactNode } from "react";
import { KbStatusTag } from "@/components/knowledge/ui";
import type { CompareTaskStatus } from "@/lib/file-compare/types";
import { cn } from "@/lib/utils";

/** 比对任务标题区：标题 + 版本/状态标签 + 右侧操作 */
export function CompareTaskHeader({
  title,
  tags,
  actions,
  className,
}: {
  title: string;
  tags?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex h-10 shrink-0 items-center gap-3", className)}>
      <h1 className="shrink-0 text-[22px] font-semibold leading-tight tracking-tight text-kb-heading">
        {title}
      </h1>
      {tags}
      {actions && <div className="ml-auto flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}

/** 灰底信息胶囊，用于版本对与任务名 */
export function CompareMetaTag({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex h-[26px] shrink-0 items-center gap-1.5 rounded-[6px] bg-[#F2F6F7] px-2.5 text-[12px] text-kb-muted">
      {children}
    </span>
  );
}

const STATUS_META: Record<
  CompareTaskStatus,
  { label: string; tone: "success" | "accent" | "danger" }
> = {
  done: { label: "已完成", tone: "success" },
  running: { label: "比对中", tone: "accent" },
  failed: { label: "比对失败", tone: "danger" },
};

export function CompareStatusTag({ status }: { status: CompareTaskStatus }) {
  const meta = STATUS_META[status];
  return (
    <KbStatusTag tone={meta.tone} variant="outline" dot className="h-[26px] shrink-0 text-[12px]">
      {meta.label}
    </KbStatusTag>
  );
}

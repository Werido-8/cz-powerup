import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { KbStatusTag } from "@/components/knowledge/ui";
import type { CompareTaskStatus } from "@/lib/file-compare/types";
import { cn } from "@/lib/utils";

/** 比对任务标题区：文档名 + 版本关系 + 状态 + 操作 */
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
    <div className={cn("flex shrink-0 items-center gap-4", className)}>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <h1 className="text-[21px] font-semibold leading-tight tracking-[-0.015em] text-kb-heading">
          {title}
        </h1>
        {tags}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}

/** 版本关系展示组件 */
export function CompareVersions({
  baseLabel,
  baseVersion,
  targetLabel,
  targetVersion,
  status,
  meta,
  className,
}: {
  baseLabel: string;
  baseVersion: string;
  targetLabel: string;
  targetVersion: string;
  status?: CompareTaskStatus;
  meta?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-center gap-x-2.5 gap-y-1", className)}>
      <span className="inline-flex items-center gap-1.5 text-[13px] text-kb-body">
        <span className="font-semibold text-primary">{baseLabel}</span>
        <span className="font-medium text-kb-heading">{baseVersion}</span>
      </span>
      <ArrowRight className="h-3.5 w-3.5 shrink-0 text-kb-muted/60" aria-hidden />
      <span className="inline-flex items-center gap-1.5 text-[13px] text-kb-body">
        <span className="font-semibold text-primary">{targetLabel}</span>
        <span className="font-medium text-kb-heading">{targetVersion}</span>
      </span>
      {status && <CompareStatusTag status={status} />}
      {meta}
    </div>
  );
}

/** 灰底信息胶囊，用于辅助元数据 */
export function CompareMetaTag({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex h-[22px] shrink-0 items-center gap-1.5 rounded-[5px] bg-[#F4F7F8] px-2 text-[11.5px] text-kb-muted">
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

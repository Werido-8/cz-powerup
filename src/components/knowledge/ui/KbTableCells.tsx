import type { ReactNode } from "react";
import type { KnowledgeFileType } from "@/lib/knowledge/types";
import { cn } from "@/lib/utils";
import { KbFileTypeIcon } from "./KbFileTypeIcon";

export function KbTableCellFile({
  name,
  subtitle,
  type = "other",
  size = "md",
  nameWeight = "semibold",
  badge,
  className,
}: {
  name: string;
  subtitle?: string;
  type?: KnowledgeFileType;
  size?: "sm" | "md";
  nameWeight?: "normal" | "medium" | "semibold";
  /** 文件名后的内联标识（如历史版本图标） */
  badge?: ReactNode;
  className?: string;
}) {
  const weightClass =
    nameWeight === "normal"
      ? "font-normal"
      : nameWeight === "medium"
        ? "font-medium"
        : "font-semibold";

  return (
    <div className={cn("flex min-w-0 items-center gap-2 py-2", className)}>
      <KbFileTypeIcon type={type} fileName={name} size={size} />
      <div className="min-w-0">
        <div className="flex min-w-0 items-center gap-1.5">
          <span className={cn("truncate text-kb-heading", weightClass)}>{name}</span>
          {badge}
        </div>
        {subtitle && (
          <div className="mt-0.5 truncate text-[11px] text-kb-muted">{subtitle}</div>
        )}
      </div>
    </div>
  );
}

export function KbTableCellUser({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  const initials = name.slice(0, 1).toUpperCase();
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary-soft text-[11px] font-semibold text-accent-foreground">
        {initials}
      </div>
      <span className="truncate text-kb-body">{name}</span>
    </div>
  );
}

export function KbTableCellBase({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  return (
    <div className={cn("min-w-0", className)}>
      <div className="truncate font-medium text-kb-body">{name}</div>
    </div>
  );
}

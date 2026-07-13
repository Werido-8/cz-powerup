import type { ReactNode } from "react";
import type { KnowledgeFileType } from "@/lib/knowledge/types";
import { kbFileTypeConfig } from "@/lib/knowledge/tokens";
import { cn } from "@/lib/utils";

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
  const config = kbFileTypeConfig[type ?? "other"];
  const Icon = config.icon;
  const iconBox = size === "sm" ? "h-7 w-7 rounded-[7px]" : "h-9 w-9 rounded-[8px]";
  const iconSize = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";
  const weightClass =
    nameWeight === "normal"
      ? "font-normal"
      : nameWeight === "medium"
        ? "font-medium"
        : "font-semibold";

  return (
    <div className={cn("flex min-w-0 items-center gap-2.5 py-2", className)}>
      <div
        className={cn(
          "grid shrink-0 place-items-center ring-1 ring-inset",
          iconBox,
          config.color,
        )}
      >
        <Icon className={cn(iconSize, "stroke-[1.8]")} />
      </div>
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

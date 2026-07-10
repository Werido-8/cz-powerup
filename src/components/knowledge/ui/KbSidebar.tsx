import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { kbSpacing } from "@/lib/knowledge/tokens";
import { KbSidebarDecor } from "./KbSidebarDecor";

export function KbSidebar({
  children,
  header,
  className,
  width = "admin",
  withDecor = false,
}: {
  children: ReactNode;
  header?: ReactNode;
  className?: string;
  width?: "admin" | "browse" | "preview";
  withDecor?: boolean;
}) {
  const widthClass =
    width === "browse"
      ? kbSpacing.sidebarBrowse
      : width === "preview"
        ? kbSpacing.sidebarPreview
        : kbSpacing.sidebarAdmin;
  return (
    <aside
      className={cn(
        "relative flex shrink-0 flex-col overflow-hidden border-r border-[#E2ECF0]",
        "bg-gradient-to-b from-white via-white to-[#F8FCFD]",
        widthClass,
        className,
      )}
    >
      {withDecor && <KbSidebarDecor />}
      {header && <div className="relative z-[1]">{header}</div>}
      <div className="relative z-[1] min-h-0 flex-1 overflow-y-auto scrollbar-thin">{children}</div>
    </aside>
  );
}

export function KbSidebarSection({
  title,
  children,
  className,
  action,
}: {
  title?: string;
  children: ReactNode;
  className?: string;
  action?: ReactNode;
}) {
  return (
    <div className={cn("p-3", className)}>
      {title && (
        <div className="mb-2 flex items-center justify-between gap-2 px-1">
          <div className="min-w-0 text-[11px] font-semibold uppercase tracking-wide text-kb-muted">
            {title}
          </div>
          {action}
        </div>
      )}
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

export function KbSidebarItem({
  icon: Icon,
  label,
  active,
  badge,
  badgeTone = "neutral",
  onClick,
  indent = 0,
  trailing,
}: {
  icon?: LucideIcon;
  label: string;
  active?: boolean;
  badge?: string | number;
  badgeTone?: "neutral" | "danger";
  onClick?: () => void;
  indent?: number;
  trailing?: ReactNode;
}) {
  const Comp = onClick ? "button" : "div";
  return (
    <Comp
      type={onClick ? "button" : undefined}
      onClick={onClick}
      style={{ paddingLeft: 12 + indent * 16 }}
      className={cn(
        "relative flex min-h-9 w-full items-center gap-2 rounded-[8px] py-1.5 pr-2 text-[13px] font-medium transition-colors duration-150",
        active
          ? "bg-primary-soft text-accent-foreground"
          : "text-kb-body hover:bg-kb-surface-hover",
      )}
    >
      {active && (
        <span className="absolute left-0 h-5 w-[3px] rounded-r-full bg-primary" aria-hidden />
      )}
      {Icon && <Icon className="h-4 w-4 shrink-0 stroke-[1.8]" />}
      <span className="min-w-0 flex-1 truncate text-left">{label}</span>
      {badge !== undefined && (
        <span
          className={cn(
            "shrink-0 rounded-full px-1.5 text-[10px] font-medium",
            badgeTone === "danger"
              ? "bg-danger-soft text-destructive"
              : "bg-muted text-kb-muted",
          )}
        >
          {badge}
        </span>
      )}
      {trailing}
    </Comp>
  );
}

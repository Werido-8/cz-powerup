import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { kbSpacing } from "@/lib/knowledge/tokens";

export function AdminSidebar({
  children,
  subtitle,
}: {
  children: React.ReactNode;
  subtitle: string;
}) {
  return (
    <aside
      className={cn(
        "flex shrink-0 flex-col border-r border-kb-border bg-card",
        kbSpacing.sidebarAdmin,
      )}
    >
      <div className="border-b border-divider p-4">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-kb-muted">
          管理员工作台
        </p>
        <h1 className="mt-1 text-[15px] font-semibold text-kb-heading">知识管理</h1>
        <p className="mt-1.5 text-[12px] text-kb-muted">{subtitle}</p>
      </div>
      <nav className="space-y-0.5 p-3">{children}</nav>
    </aside>
  );
}

export function AdminNavButton({
  icon: Icon,
  label,
  badge,
  badgeTone = "danger",
  active,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  badge?: number;
  badgeTone?: "danger" | "neutral";
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex h-10 w-full items-center gap-2 rounded-[8px] px-3 text-[13px] font-medium transition-colors duration-150",
        active
          ? "bg-primary-soft text-accent-foreground"
          : "text-kb-body hover:bg-kb-surface-hover",
      )}
    >
      <Icon className="h-4 w-4 stroke-[1.8]" />
      <span className="min-w-0 flex-1 text-left">{label}</span>
      {Boolean(badge) && (
        <span
          className={cn(
            "rounded-full px-1.5 text-[11px] font-medium",
            badgeTone === "danger"
              ? "bg-danger-soft text-destructive"
              : "bg-muted text-kb-muted",
          )}
        >
          {badge}
        </span>
      )}
    </button>
  );
}

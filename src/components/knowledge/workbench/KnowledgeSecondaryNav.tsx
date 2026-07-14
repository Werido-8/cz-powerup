import { Link, useRouterState } from "@tanstack/react-router";
import { Database, FolderOpen, LayoutGrid, Network } from "lucide-react";
import { useSyncExternalStore } from "react";
import { getDemoRoleKey, subscribeDemoRole } from "@/lib/knowledge/demoRole";
import { cn } from "@/lib/utils";
import { canViewKnowledgeAdmin } from "@/lib/knowledge/model";

type SecondaryNavItem = {
  to: string;
  label: string;
  icon: typeof LayoutGrid;
  exact?: boolean;
  adminOnly?: boolean;
};

const items: SecondaryNavItem[] = [
  { to: "/knowledge", label: "知识总览", icon: LayoutGrid, exact: true },
  { to: "/knowledge/all", label: "全库资料", icon: Database },
  { to: "/knowledge/mine", label: "我的空间", icon: FolderOpen },
  { to: "/knowledge/admin", label: "知识管理", icon: Network, adminOnly: true },
];

export function KnowledgeSecondaryNav({ className }: { className?: string }) {
  useSyncExternalStore(subscribeDemoRole, getDemoRoleKey);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const showAdmin = canViewKnowledgeAdmin();

  return (
    <nav className={cn("flex flex-col gap-0.5", className)}>
      {items
        .filter((item) => !item.adminOnly || showAdmin)
        .map((item) => {
          const active = item.exact
            ? pathname === item.to ||
              pathname === `${item.to}/` ||
              pathname.startsWith("/knowledge/kb/") ||
              pathname.startsWith("/knowledge/lib/") ||
              pathname.startsWith("/knowledge/dept/") ||
              pathname.startsWith("/knowledge/space/")
            : pathname === item.to || pathname.startsWith(`${item.to}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex items-center gap-2 rounded-[8px] px-2.5 py-2 text-[13px] font-medium transition-colors",
                active
                  ? "bg-primary-soft text-accent-foreground"
                  : "text-kb-muted hover:bg-[#F4FAFB] hover:text-kb-body",
              )}
            >
              <Icon className="h-4 w-4 shrink-0" strokeWidth={1.75} />
              {item.label}
            </Link>
          );
        })}
    </nav>
  );
}

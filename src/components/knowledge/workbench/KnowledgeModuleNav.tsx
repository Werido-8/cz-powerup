import { Link, useRouterState } from "@tanstack/react-router";
import { BookOpen, FolderKanban, LayoutDashboard, Settings2 } from "lucide-react";
import { useSyncExternalStore } from "react";
import {
  DEMO_ROLE_LABELS,
  getCurrentKnowledgeUser,
  getDemoRoleKey,
  subscribeDemoRole,
} from "@/lib/knowledge/demoRole";
import { canViewKnowledgeAdmin } from "@/lib/knowledge/model";
import { cn } from "@/lib/utils";

type NavItem = {
  label: string;
  to: string;
  icon: typeof LayoutDashboard;
  adminOnly?: boolean;
};

const navItems: NavItem[] = [
  { label: "知识总览", to: "/knowledge", icon: LayoutDashboard },
  { label: "我的空间", to: "/knowledge/mine", icon: FolderKanban },
  { label: "知识管理", to: "/knowledge/admin", icon: Settings2, adminOnly: true },
];

export function KnowledgeModuleNav() {
  useSyncExternalStore(subscribeDemoRole, getDemoRoleKey);
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const currentUser = getCurrentKnowledgeUser();
  const visibleItems = navItems.filter((item) => !item.adminOnly || canViewKnowledgeAdmin());

  return (
    <div className="flex h-14 shrink-0 items-center justify-between border-b border-kb-border bg-card px-4">
      <div className="flex min-w-0 items-center gap-3">
        <span className="grid h-9 w-9 place-items-center rounded-[10px] bg-primary-soft text-primary ring-1 ring-primary/15">
          <BookOpen className="h-[18px] w-[18px] stroke-[1.8]" />
        </span>
        <div className="min-w-0">
          <div className="text-[14px] font-semibold leading-none text-kb-heading">知识库</div>
          <div className="mt-1 text-[11px] text-kb-muted">存得住、找得到、管得住</div>
        </div>
      </div>

      <nav className="flex items-center gap-1 rounded-[10px] border border-kb-border bg-kb-surface p-1">
        {visibleItems.map((item) => {
          const active =
            item.to === "/knowledge"
              ? pathname === "/knowledge" || pathname === "/knowledge/"
              : pathname.startsWith(item.to);
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "inline-flex h-8 items-center gap-1.5 rounded-[8px] px-3 text-[12.5px] font-medium transition-colors duration-150",
                active
                  ? "bg-card text-primary shadow-card"
                  : "text-kb-muted hover:bg-card/70 hover:text-kb-heading",
              )}
            >
              <Icon className="h-3.5 w-3.5 stroke-[1.9]" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="flex min-w-[180px] items-center justify-end gap-2 text-[12px] text-kb-muted">
        <span className="rounded-[8px] bg-kb-surface px-2.5 py-1 ring-1 ring-kb-border">
          {DEMO_ROLE_LABELS[currentUser.role]}
        </span>
      </div>
    </div>
  );
}

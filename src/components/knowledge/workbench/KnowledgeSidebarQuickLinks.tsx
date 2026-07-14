import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutGrid, Settings2, UserRound } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useSyncExternalStore } from "react";
import { getDemoRoleKey, subscribeDemoRole } from "@/lib/knowledge/demoRole";
import { canViewKnowledgeAdmin } from "@/lib/knowledge/model";
import { cn } from "@/lib/utils";

type PageContext = "overview" | "mine" | "admin";

type QuickLink = {
  to: string;
  label: string;
  icon: LucideIcon;
  hash?: string;
};

function getPageContext(pathname: string): PageContext {
  if (pathname.startsWith("/knowledge/mine")) return "mine";
  if (pathname.startsWith("/knowledge/admin")) return "admin";
  return "overview";
}

function getQuickLinks(context: PageContext): QuickLink[] {
  switch (context) {
    case "overview":
      return [
        { to: "/knowledge/mine", label: "我的空间", icon: UserRound },
        { to: "/knowledge/admin", label: "知识管理", icon: Settings2 },
      ];
    case "mine":
      return [
        { to: "/knowledge", label: "知识总览", icon: LayoutGrid },
        { to: "/knowledge/admin", label: "知识管理", icon: Settings2 },
      ];
    case "admin":
      return [
        { to: "/knowledge", label: "知识总览", icon: LayoutGrid },
        { to: "/knowledge/mine", label: "我的空间", icon: UserRound },
      ];
  }
}

export function KnowledgeSidebarQuickLinks() {
  useSyncExternalStore(subscribeDemoRole, getDemoRoleKey);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const context = getPageContext(pathname);
  const showAdmin = canViewKnowledgeAdmin();
  const links = getQuickLinks(context).filter(
    (item) => item.to !== "/knowledge/admin" || showAdmin,
  );

  if (links.length === 0) return null;

  return (
    <div className="space-y-0.5 border-b border-[#E8F0F2] p-2">
      {links.map((item) => {
        const Icon = item.icon;
        return (
          <Link
            key={`${item.to}-${item.hash ?? ""}`}
            to={item.to}
            hash={item.hash}
            className={cn(
              "flex h-8 w-full items-center gap-2 rounded-[8px] px-2.5 text-[12.5px] transition-colors",
              "text-kb-body hover:bg-[#F4FAFB]",
            )}
          >
            <Icon className="h-3.5 w-3.5 shrink-0 stroke-[1.8] text-kb-muted" />
            <span className="min-w-0 flex-1 truncate">{item.label}</span>
          </Link>
        );
      })}
    </div>
  );
}

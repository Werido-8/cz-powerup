import { Link, useRouterState } from "@tanstack/react-router";
import { BookOpen, Database, FolderKanban, LayoutDashboard, Settings2 } from "lucide-react";
import { CURRENT_KNOWLEDGE_USER } from "@/lib/knowledge/data";
import { canViewKnowledgeAdmin } from "@/lib/knowledge/model";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "知识总览", to: "/knowledge", icon: LayoutDashboard },
  // { label: "全库资料", to: "/knowledge/all", icon: Database },
  { label: "我的空间", to: "/knowledge/mine", icon: FolderKanban },
  { label: "知识管理", to: "/knowledge/admin", icon: Settings2, adminOnly: true },
] as const;

export function KnowledgeModuleNav() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
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
          {CURRENT_KNOWLEDGE_USER.role === "knowledgeAdmin" ? "知识库管理员" : "部门管理员"}
        </span>
      </div>
    </div>
  );
}

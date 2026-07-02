import { Link, useLocation } from "@tanstack/react-router";
import {
  Plus,
  Upload,
  Search,
  Sparkles,
  User,
  PanelLeftClose,
  PanelLeft,
  Building2,
  Globe,
  UserCircle,
  ChevronDown,
  ChevronRight,
  BookOpen,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { KB_DEPTS, KB_VIEWER, type KbDeptKind } from "@/lib/mock/knowledge-space";
import {
  getDeptIdForLibrary,
  getLibrariesByDept,
  readSidebarCollapsed,
  writeLastDept,
  writeSidebarCollapsed,
} from "@/lib/mock/knowledge-utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useEffect, useMemo, useState } from "react";

const DEPT_ICONS: Record<KbDeptKind, typeof Building2> = {
  public: Globe,
  dept: Building2,
  personal: UserCircle,
};

type KbSidebarProps = {
  collapsed: boolean;
  onCollapsedChange: (v: boolean) => void;
  activeDeptId?: string;
  activeLibraryId?: string;
  uploadEnabled?: boolean;
};

export function KbSidebar({
  collapsed,
  onCollapsedChange,
  activeDeptId,
  activeLibraryId,
  uploadEnabled = false,
}: KbSidebarProps) {
  const location = useLocation();
  const [mounted, setMounted] = useState(false);
  const [expandedDepts, setExpandedDepts] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    setMounted(true);
    const stored = readSidebarCollapsed();
    if (stored !== collapsed) onCollapsedChange(stored);
  }, []);

  const highlightDeptId = useMemo(() => {
    if (activeDeptId) return activeDeptId;
    if (activeLibraryId) return getDeptIdForLibrary(activeLibraryId);
    const m = location.pathname.match(/\/knowledge\/dept\/([^/]+)/);
    if (m) return m[1];
    return undefined;
  }, [activeDeptId, activeLibraryId, location.pathname]);

  useEffect(() => {
    if (highlightDeptId) {
      setExpandedDepts((prev) => new Set(prev).add(highlightDeptId));
    }
  }, [highlightDeptId]);

  const toggleDept = (deptId: string) => {
    setExpandedDepts((prev) => {
      const next = new Set(prev);
      if (next.has(deptId)) next.delete(deptId);
      else next.add(deptId);
      return next;
    });
    writeLastDept(deptId);
  };

  const isMine = location.pathname.startsWith("/knowledge/mine");

  const toggleCollapsed = () => {
    const next = !collapsed;
    onCollapsedChange(next);
    writeSidebarCollapsed(next);
  };

  if (!mounted) return null;

  return (
    <aside
      className={cn(
        "flex shrink-0 flex-col border-r border-border bg-card transition-all duration-200",
        collapsed ? "w-[52px]" : "w-[232px]",
      )}
    >
      {/* 模块标题 */}
      <div
        className={cn(
          "flex items-center border-b border-border py-3.5",
          collapsed ? "justify-center px-3" : "gap-2.5 px-4",
        )}
      >
        <div className="grid h-[30px] w-[30px] shrink-0 place-items-center rounded-lg bg-primary/12">
          <BookOpen className="h-[15px] w-[15px] text-primary" />
        </div>
        {!collapsed && (
          <span className="text-[15px] font-bold tracking-tight text-foreground">知识库</span>
        )}
      </div>

      {/* 新建 / 上传 */}
      {KB_VIEWER.isAdmin && (
        <div
          className={cn(
            "flex border-b border-border px-3 py-2.5",
            collapsed ? "flex-col items-center gap-1.5" : "gap-2",
          )}
        >
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className={cn(
                  "inline-flex items-center justify-center gap-1 rounded-md bg-primary text-[12px] font-medium text-primary-foreground transition-colors hover:bg-primary/90",
                  collapsed ? "h-8 w-8" : "h-8 flex-1 gap-1.5 px-3",
                )}
              >
                <Plus className="h-3.5 w-3.5 shrink-0" />
                {!collapsed && (
                  <>
                    新建
                    <ChevronDown className="h-3 w-3 opacity-60" />
                  </>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={() => toast.message("新建知识库（演示占位）")}>
                新建知识库
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => toast.message("新建目录（演示占位）")}>
                新建目录
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <button
            type="button"
            disabled={!uploadEnabled}
            onClick={() => uploadEnabled && toast.message("上传文件（演示占位）")}
            className={cn(
              "inline-flex items-center justify-center gap-1 rounded-md border border-border text-[12px] font-medium transition-colors",
              uploadEnabled
                ? "text-foreground hover:bg-muted"
                : "cursor-not-allowed text-muted-foreground/40",
              collapsed ? "h-8 w-8" : "h-8 px-3",
            )}
            title="上传"
          >
            <Upload className="h-3.5 w-3.5 shrink-0" />
            {!collapsed && "上传"}
          </button>
        </div>
      )}

      {/* 搜索 */}
      <div className={cn("px-3 py-2.5", collapsed && "flex justify-center")}>
        <button
          type="button"
          onClick={() => toast.message("全局搜索（演示占位）")}
          className={cn(
            "flex items-center gap-2 rounded-md bg-muted/70 text-[12.5px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
            collapsed ? "h-8 w-8 justify-center" : "h-8 w-full px-2.5",
          )}
        >
          <Search className="h-3.5 w-3.5 shrink-0" />
          {!collapsed && <span className="min-w-0 flex-1 truncate text-left">搜索全库…</span>}
        </button>
      </div>

      {/* 快捷导航 */}
      <nav className="flex flex-col gap-0.5 px-2 pb-2">
      {/* 本期暂不开放：问 AI
        <SidebarNavItem
          icon={Sparkles}
          label="问 AI"
          active={false}
          collapsed={collapsed}
          to="/chat"
        />
      */}
        <SidebarNavItem
          icon={User}
          label="我的"
          active={isMine}
          collapsed={collapsed}
          to="/knowledge/mine"
        />
      </nav>

      <div className="mx-3 border-t border-divider" />

      {/* 常用部门 */}
      <div className="flex-1 overflow-y-auto px-2 py-2">
        {!collapsed && (
          <div className="mb-1.5 flex items-center gap-[5px] px-2 py-1">
            <span className="h-[1em] w-[4px] shrink-0 rounded-[1px] bg-primary/50 leading-none" />
            <span className="text-[11px] font-semibold text-muted-foreground">常用部门</span>
          </div>
        )}
        <div className="flex flex-col gap-0.5">
          {KB_DEPTS.map((dept) => {
            const Icon = DEPT_ICONS[dept.kind];
            const active = highlightDeptId === dept.id && !isMine;
            const expanded = expandedDepts.has(dept.id);
            const libraries = getLibrariesByDept(dept.id);

            return (
              <div key={dept.id}>
                <div className="flex items-center gap-0.5">
                  {!collapsed && (
                    <button
                      type="button"
                      onClick={() => toggleDept(dept.id)}
                      className="grid h-6 w-5 shrink-0 place-items-center text-muted-foreground hover:text-foreground"
                      aria-label={expanded ? "收起" : "展开"}
                    >
                      {expanded ? (
                        <ChevronDown className="h-3.5 w-3.5" />
                      ) : (
                        <ChevronRight className="h-3.5 w-3.5" />
                      )}
                    </button>
                  )}
                  <Link
                    to="/knowledge/dept/$deptId"
                    params={{ deptId: dept.id }}
                    onClick={() => writeLastDept(dept.id)}
                    title={dept.name}
                    className={cn(
                      "flex min-w-0 flex-1 items-center gap-2 rounded-md px-2 py-[7px] text-[12.5px] transition-colors",
                      active
                        ? "border-l-2 border-primary bg-primary-soft pl-[calc(0.5rem-2px)] font-semibold text-accent-foreground"
                        : "text-foreground/75 hover:bg-muted hover:text-foreground",
                      collapsed && "justify-center px-2",
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-[15px] w-[15px] shrink-0",
                        active ? "text-primary" : "text-muted-foreground",
                      )}
                    />
                    {!collapsed && (
                      <>
                        <span className="min-w-0 flex-1 truncate">{dept.name}</span>
                        <span
                          className={cn(
                            "shrink-0 text-[10px] tabular-nums",
                            active ? "text-accent-foreground/60" : "text-muted-foreground/60",
                          )}
                        >
                          {dept.libraryCount}
                        </span>
                      </>
                    )}
                  </Link>
                </div>
                {!collapsed && expanded && (
                  <div className="ml-5 flex flex-col gap-0.5 border-l border-border/60 py-0.5 pl-2">
                    {libraries.map((lib) => {
                      const libActive = activeLibraryId === lib.id;
                      return (
                        <Link
                          key={lib.id}
                          to="/knowledge/lib/$libId"
                          params={{ libId: lib.id }}
                          title={lib.name}
                          className={cn(
                            "flex items-center gap-2 rounded-md px-2 py-1.5 text-[12px] transition-colors",
                            libActive
                              ? "bg-primary-soft/80 font-medium text-accent-foreground"
                              : "text-muted-foreground hover:bg-muted hover:text-foreground",
                          )}
                        >
                          <BookOpen className="h-3.5 w-3.5 shrink-0 text-primary/70" />
                          <span className="min-w-0 flex-1 truncate">{lib.name}</span>
                          <span className="shrink-0 text-[10px] tabular-nums opacity-60">
                            {lib.fileCount}
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 收起按钮 */}
      <div className="border-t border-border px-2 py-2">
        <button
          type="button"
          onClick={toggleCollapsed}
          className={cn(
            "flex w-full items-center rounded-md py-1.5 text-[11.5px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
            collapsed ? "justify-center px-2" : "gap-2 px-2",
          )}
          title={collapsed ? "展开侧栏" : "收起侧栏"}
        >
          {collapsed ? (
            <PanelLeft className="h-4 w-4" />
          ) : (
            <>
              <PanelLeftClose className="h-4 w-4" />
              <span>收起</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}

function SidebarNavItem({
  icon: Icon,
  label,
  active,
  collapsed,
  to,
}: {
  icon: typeof Sparkles;
  label: string;
  active: boolean;
  collapsed: boolean;
  to: string;
}) {
  return (
    <Link
      to={to}
      title={label}
      className={cn(
        "flex items-center gap-2 rounded-md px-2 py-[7px] text-[12.5px] transition-colors",
        active
          ? "border-l-2 border-primary bg-primary-soft pl-[calc(0.5rem-2px)] font-semibold text-accent-foreground"
          : "text-foreground/75 hover:bg-muted hover:text-foreground",
        collapsed && "justify-center px-2",
      )}
    >
      <Icon
        className={cn(
          "h-[15px] w-[15px] shrink-0",
          active ? "text-primary" : "text-muted-foreground",
        )}
      />
      {!collapsed && <span>{label}</span>}
    </Link>
  );
}

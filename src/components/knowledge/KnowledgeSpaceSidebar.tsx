import { Link } from "@tanstack/react-router";
import {
  BookOpen,
  Building2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Database,
  FilePlus2,
  Globe2,
  Search,
  Upload,
  UserRound,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import type { KnowledgeSpaceType } from "@/lib/mock/knowledge-space";
import {
  getDepartmentSpaces,
  writeLastDepartment,
} from "@/lib/mock/knowledge-utils";
import { cn } from "@/lib/utils";

type KnowledgeSpaceSidebarProps = {
  activeSpace: KnowledgeSpaceType;
  activeDepartmentId?: string;
  activeKbId?: string;
  collapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
};

const departmentSpaces = getDepartmentSpaces();

export function KnowledgeSpaceSidebar({
  activeSpace,
  activeDepartmentId,
  activeKbId,
  collapsed,
  onCollapsedChange,
}: KnowledgeSpaceSidebarProps) {
  const [deptSectionOpen, setDeptSectionOpen] = useState(true);
  const [expandedDepts, setExpandedDepts] = useState<Set<string>>(
    () => new Set(["dept-run", activeDepartmentId].filter(Boolean) as string[]),
  );

  useEffect(() => {
    if (activeDepartmentId) {
      setExpandedDepts((prev) => new Set([...prev, activeDepartmentId]));
    }
  }, [activeDepartmentId]);

  const toggleDept = (deptId: string) => {
    setExpandedDepts((prev) => {
      const next = new Set(prev);
      if (next.has(deptId)) next.delete(deptId);
      else next.add(deptId);
      return next;
    });
  };

  return (
    <aside
      className={cn(
        "flex shrink-0 flex-col border-r border-[#DCE8EA] bg-[#F7FAFB] transition-[width] duration-200",
        collapsed ? "w-[64px]" : "w-[260px]",
      )}
    >
      <div className={cn("px-3 pb-3 pt-4", collapsed && "px-2")}>
        <div className={cn("flex items-center gap-3", collapsed && "justify-center")}>
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[10px] bg-white text-[#349BAC] ring-1 ring-[#DCE8EA]">
            <BookOpen className="h-[18px] w-[18px] stroke-[1.8]" />
          </span>
          {!collapsed && (
            <div className="min-w-0">
              <div className="text-[15px] font-semibold leading-none text-[#1F3440]">知识库</div>
              <div className="mt-1 text-[11px] text-[#91A3AA]">资料沉淀与共享空间</div>
            </div>
          )}
        </div>

        {!collapsed && (
          <>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-[10px] bg-[#349BAC] text-[13px] font-medium text-white transition-colors hover:bg-[#2F8D9D]"
              >
                <FilePlus2 className="h-3.5 w-3.5 stroke-[1.9]" />
                新建
              </button>
              <button
                type="button"
                className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-[10px] border border-[#DCE8EA] bg-white text-[13px] font-medium text-[#607681] transition-colors hover:border-[#B8D8DE] hover:text-[#1F3440]"
              >
                <Upload className="h-3.5 w-3.5 stroke-[1.9]" />
                上传
              </button>
            </div>
            <label className="mt-3 flex h-9 items-center gap-2 rounded-[10px] border border-[#DCE8EA] bg-white px-3 text-[12px] text-[#607681] transition-colors focus-within:border-[#B8D8DE]">
              <Search className="h-3.5 w-3.5 text-[#91A3AA]" />
              <input
                className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-[#91A3AA]"
                placeholder="搜索"
              />
              <span className="rounded-[5px] bg-[#F5FAFB] px-1.5 py-0.5 text-[10px] text-[#91A3AA] ring-1 ring-[#EDF3F5]">
                Ctrl K
              </span>
            </label>
          </>
        )}
      </div>

      <nav className="scrollbar-thin min-h-0 flex-1 overflow-y-auto px-2 py-2">
        <SpaceItem
          icon={UserRound}
          label="我的"
          active={activeSpace === "mine"}
          collapsed={collapsed}
          to="/knowledge/mine"
        />
        <SpaceItem
          icon={Zap}
          label="快捷访问"
          active={activeSpace === "quick"}
          collapsed={collapsed}
          to="/knowledge/mine"
          hash="quick"
        />
        <SpaceItem
          icon={Globe2}
          label="公共空间"
          active={activeSpace === "public"}
          collapsed={collapsed}
          to="/knowledge/space/public"
        />

        <div className={cn("mt-4", collapsed && "mt-2")}>
          {!collapsed && (
            <button
              type="button"
              onClick={() => setDeptSectionOpen((open) => !open)}
              className="mb-1 flex h-8 w-full items-center justify-between rounded-[8px] px-2 text-[12px] font-semibold text-[#607681] transition-colors hover:bg-[#EDF3F5]"
            >
              <span>部门空间</span>
              <ChevronDown
                className={cn(
                  "h-3.5 w-3.5 text-[#91A3AA] transition-transform",
                  !deptSectionOpen && "-rotate-90",
                )}
              />
            </button>
          )}
          {deptSectionOpen && (
            <div className="space-y-0.5">
              {departmentSpaces.map((department) => {
                const deptActive =
                  activeSpace === "department" && activeDepartmentId === department.id;
                const expanded = expandedDepts.has(department.id);

                return (
                  <div key={department.id}>
                    <DepartmentNode
                      department={department}
                      active={deptActive}
                      expanded={expanded}
                      collapsed={collapsed}
                      onToggle={() => toggleDept(department.id)}
                      onNavigate={() => {
                        writeLastDepartment(department.id);
                        setExpandedDepts((prev) => new Set([...prev, department.id]));
                      }}
                    />
                    {!collapsed && expanded && (
                      <div className="mt-0.5 space-y-0.5">
                        {department.libraries.map((library) => (
                          <KnowledgeBaseNode
                            key={library.id}
                            kbId={library.id}
                            name={library.name}
                            active={activeKbId === library.id}
                            collapsed={collapsed}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </nav>

      <div className="border-t border-[#EDF3F5] p-2">
        <button
          type="button"
          onClick={() => onCollapsedChange(!collapsed)}
          className={cn(
            "flex h-9 w-full items-center rounded-[10px] text-[12px] text-[#607681] transition-colors hover:bg-[#EDF3F5] hover:text-[#1F3440]",
            collapsed ? "justify-center" : "gap-2 px-2",
          )}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          {!collapsed && "收起"}
        </button>
      </div>
    </aside>
  );
}

function SpaceItem({
  icon: Icon,
  label,
  active,
  collapsed,
  to,
  hash,
}: {
  icon: typeof UserRound;
  label: string;
  active: boolean;
  collapsed: boolean;
  to: "/knowledge/mine" | "/knowledge/space/public";
  hash?: string;
}) {
  return (
    <Link
      to={to}
      hash={hash}
      title={label}
      className={cn(
        "mb-0.5 flex h-[36px] items-center gap-2.5 rounded-[10px] px-2.5 text-[13px] transition-colors",
        active
          ? "bg-[#EAF7F9] font-medium text-[#168A99]"
          : "text-[#1F3440] hover:bg-[#EDF3F5]",
        collapsed && "justify-center px-2",
      )}
    >
      <Icon
        className={cn(
          "h-4 w-4 shrink-0 stroke-[1.8]",
          active ? "text-[#168A99]" : "text-[#91A3AA]",
        )}
      />
      {!collapsed && <span className="min-w-0 truncate">{label}</span>}
    </Link>
  );
}

function DepartmentNode({
  department,
  active,
  expanded,
  collapsed,
  onToggle,
  onNavigate,
}: {
  department: (typeof departmentSpaces)[number];
  active: boolean;
  expanded: boolean;
  collapsed: boolean;
  onToggle: () => void;
  onNavigate: () => void;
}) {
  return (
    <div
      className={cn(
        "group flex h-[36px] items-center gap-1 rounded-[10px] pr-2 transition-colors",
        active ? "bg-[#EAF7F9]" : "hover:bg-[#EDF3F5]",
        collapsed && "justify-center px-0",
      )}
    >
      {!collapsed && (
        <button
          type="button"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onToggle();
          }}
          className="flex h-7 w-6 shrink-0 items-center justify-center rounded-[6px] text-[#91A3AA] transition-colors hover:text-[#607681]"
          aria-label={expanded ? "收起部门" : "展开部门"}
        >
          <ChevronRight
            className={cn("h-3.5 w-3.5 transition-transform", expanded && "rotate-90")}
          />
        </button>
      )}
      <Link
        to="/knowledge/space/department/$departmentId"
        params={{ departmentId: department.id }}
        onClick={onNavigate}
        title={department.name}
        className={cn(
          "flex min-w-0 flex-1 items-center gap-2",
          collapsed && "justify-center",
        )}
      >
        <Building2
          className={cn(
            "h-4 w-4 shrink-0",
            active ? "text-[#168A99]" : "text-[#91A3AA]",
          )}
        />
        {!collapsed && (
          <>
            <span
              className={cn(
                "min-w-0 flex-1 truncate text-[13px]",
                active ? "font-medium text-[#168A99]" : "text-[#1F3440]",
              )}
            >
              {department.name}
            </span>
            <span
              className={cn(
                "shrink-0 rounded-[6px] px-1.5 py-0.5 text-[10px] tabular-nums",
                active
                  ? "bg-[rgba(52,155,172,0.12)] text-[#168A99]"
                  : "bg-[#EDF3F5] text-[#607681]",
              )}
            >
              {department.kbCount}
            </span>
          </>
        )}
      </Link>
    </div>
  );
}

function KnowledgeBaseNode({
  kbId,
  name,
  active,
  collapsed,
}: {
  kbId: string;
  name: string;
  active: boolean;
  collapsed: boolean;
}) {
  if (collapsed) return null;

  return (
    <Link
      to="/knowledge/kb/$kbId"
      params={{ kbId }}
      title={name}
      className={cn(
        "flex h-[34px] items-center gap-2 rounded-[8px] pl-[22px] pr-2 text-[12px] transition-colors",
        active
          ? "bg-[rgba(52,155,172,0.08)] font-medium text-[#168A99]"
          : "text-[#607681] hover:bg-[#EDF3F5] hover:text-[#1F3440]",
      )}
    >
      <Database
        className={cn(
          "h-3.5 w-3.5 shrink-0",
          active ? "text-[#168A99]" : "text-[#91A3AA]",
        )}
      />
      <span className="min-w-0 flex-1 truncate">{name}</span>
    </Link>
  );
}

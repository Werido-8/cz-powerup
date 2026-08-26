import { useState, useSyncExternalStore } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Bell, ChevronDown, Menu, UserCog } from "lucide-react";
import logo from "@/assets/logo.png";
import {
  DEMO_ROLE_LABELS,
  DEMO_USERS,
  getDemoRoleKey,
  getDemoRoleServerSnapshot,
  setDemoRole,
  subscribeDemoRole,
} from "@/lib/knowledge/demoRole";
import { canViewKnowledgeAdmin } from "@/lib/knowledge/model";
import type { KnowledgeUserRole } from "@/lib/knowledge/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

interface MenuItem {
  label: string;
  to: string;
  children?: {
    label: string;
    to: string;
    group?: string;
    search?: { tab: "topic" | "materials" };
  }[];
}

const MENU: MenuItem[] = [
  { label: "首页工作台", to: "/" },
  { label: "智能对话", to: "/chat" },
  {
    label: "知识库",
    to: "/knowledge",
    children: [
      { label: "知识总览", to: "/knowledge" },
      { label: "我的空间", to: "/knowledge/mine" },
      { label: "知识管理", to: "/knowledge/admin" },
    ],
  },
  {
    label: "能力提升",
    to: "/learn",
    children: [
      { label: "学习首页", to: "/learn", group: "我的学习" },
      { label: "知识学习", to: "/learn", search: { tab: "topic" }, group: "我的学习" },
      { label: "最近更新", to: "/learn/updates", group: "我的学习" },
      { label: "提交记录", to: "/learn/submissions", group: "我的学习" },
      { label: "个人沉淀", to: "/assets", group: "我的学习" },
      { label: "训练中心", to: "/training", group: "训练与测评" },
      { label: "专项练习", to: "/training/practice", group: "训练与测评" },
      { label: "自主组卷", to: "/training/custom-exam", group: "训练与测评" },
      { label: "正式考试", to: "/training/exam", group: "训练与测评" },
      { label: "错题本", to: "/training/wrong", group: "训练与测评" },
      { label: "训练记录", to: "/training/records", group: "训练与测评" },
      { label: "成长反馈", to: "/training/growth", group: "训练与测评" },
      { label: "专题维护", to: "/learn-admin", group: "内容管理" },
      { label: "题库管理", to: "/question-bank", group: "内容管理" },
      { label: "考试任务", to: "/exam-admin", group: "内容管理" },
      { label: "成绩分析", to: "/exam-admin/analysis", group: "内容管理" },
    ],
  },
  { label: "场景训练", to: "/scenario" },
];

const DEMO_ROLE_OPTIONS: KnowledgeUserRole[] = ["employee", "knowledgeAdmin", "superAdmin"];

function isItemActive(pathname: string, to: string) {
  if (to === "/") return pathname === "/";
  return pathname === to || pathname.startsWith(to + "/");
}

function isChildActive(
  pathname: string,
  to: string,
  childSearch?: { tab: "topic" | "materials" },
  currentSearch?: Record<string, unknown>,
) {
  if (to === "/learn" && childSearch?.tab) {
    const knowledgeTabs = ["topic", "materials", "all", "mine"];
    return (
      (pathname === "/learn" || pathname === "/learn/") &&
      knowledgeTabs.includes(String(currentSearch?.tab))
    );
  }
  if (to === "/learn") {
    return (pathname === "/learn" || pathname === "/learn/") && !currentSearch?.tab;
  }
  if (to === "/training") return pathname === "/training" || pathname === "/training/";
  if (to === "/exam-admin") {
    return (
      pathname === "/exam-admin" ||
      pathname === "/exam-admin/" ||
      (pathname.startsWith("/exam-admin/") && !pathname.startsWith("/exam-admin/analysis"))
    );
  }
  return isItemActive(pathname, to);
}

function NavLink({
  m,
  pathname,
  currentSearch,
}: {
  m: MenuItem;
  pathname: string;
  currentSearch: Record<string, unknown>;
}) {
  const [open, setOpen] = useState(false);
  const active = isItemActive(pathname, m.to);
  const hasChildren = m.children && m.children.length > 0;

  if (!hasChildren) {
    return (
      <Link
        key={m.to}
        to={m.to}
        className={`relative whitespace-nowrap rounded-lg px-3.5 py-2 text-[13.5px] font-medium transition-all duration-200 ${
          active ? "text-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
        }`}
      >
        {m.label}
        {active && (
          <span className="absolute inset-x-3 -bottom-[14px] h-[2px] rounded-full bg-primary" />
        )}
      </Link>
    );
  }

  const childActive = m.children?.some((c) =>
    isChildActive(pathname, c.to, c.search, currentSearch),
  );
  const childGroups = Array.from(
    new Set(m.children?.map((child) => child.group).filter((group): group is string => !!group)),
  );

  const renderChild = (c: NonNullable<MenuItem["children"]>[number]) => {
    const cActive =
      c.to === "/knowledge"
        ? pathname === "/knowledge" ||
          pathname === "/knowledge/" ||
          pathname.startsWith("/knowledge/kb/") ||
          pathname.startsWith("/knowledge/lib/") ||
          pathname.startsWith("/knowledge/dept/") ||
          pathname.startsWith("/knowledge/space/") ||
          pathname.startsWith("/knowledge/file/")
        : isChildActive(pathname, c.to, c.search, currentSearch);
    return (
      <Link
        key={`${c.to}-${c.label}`}
        to={c.to}
        search={c.search}
        className={`whitespace-nowrap rounded-md px-3 py-2 text-[13px] transition-colors ${
          cActive
            ? "bg-primary-soft font-medium text-primary"
            : "text-popover-foreground hover:bg-muted"
        }`}
      >
        {c.label}
      </Link>
    );
  };

  return (
    <div
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen(true)}
        onFocus={() => setOpen(true)}
        className={`relative flex items-center gap-0.5 whitespace-nowrap rounded-lg px-3.5 py-2 text-[13.5px] font-medium transition-all duration-200 ${
          childActive || active
            ? "text-foreground"
            : "text-muted-foreground hover:bg-muted hover:text-foreground"
        }`}
      >
        {m.label}
        <ChevronDown
          className={`h-3.5 w-3.5 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
        {(childActive || active) && (
          <span className="absolute inset-x-3 -bottom-[14px] h-[2px] rounded-full bg-primary" />
        )}
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 pt-1.5">
          <div className="overflow-hidden rounded-[12px] border border-border bg-popover shadow-[0_12px_30px_-8px_oklch(0.5_0.05_230_/_0.18)]">
            {childGroups.length > 0 ? (
              <div className="grid min-w-[430px] grid-cols-[120px_1fr_120px] gap-2 p-2.5">
                {childGroups.map((group) => (
                  <section
                    key={group}
                    className={`rounded-[9px] p-2 ${group === "内容管理" ? "border border-primary/12 bg-primary-soft/35" : "bg-muted/35"}`}
                  >
                    <div className="flex items-center justify-between gap-1 px-2 pb-1.5 pt-1 text-[10.5px] font-semibold text-muted-foreground">
                      <span className="whitespace-nowrap">{group}</span>
                      {group === "内容管理" && (
                        <span className="shrink-0 whitespace-nowrap rounded bg-white/80 px-1.5 py-0.5 text-[9px] font-medium text-primary">
                          管理员
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col gap-0.5">
                      {m.children?.filter((child) => child.group === group).map(renderChild)}
                    </div>
                  </section>
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-0.5 p-1.5">{m.children?.map(renderChild)}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function DemoRoleSwitcher() {
  const currentRole = useSyncExternalStore(
    subscribeDemoRole,
    getDemoRoleKey,
    getDemoRoleServerSnapshot,
  );
  const currentUser = DEMO_USERS[currentRole];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={`切换演示角色，当前为${DEMO_ROLE_LABELS[currentRole]}`}
          className="flex h-10 cursor-pointer items-center gap-2 rounded-full border border-border bg-card py-1 pl-1 pr-2 transition-colors hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <div className="grid h-7 w-7 place-items-center rounded-full bg-primary text-[12px] font-semibold text-primary-foreground">
            {currentUser.name[0]}
          </div>
          <span className="hidden text-[13px] font-medium text-foreground sm:inline">
            {currentUser.name}
          </span>
          <span className="hidden items-center gap-0.5 rounded-full bg-primary-soft px-2 py-0.5 text-[11px] font-medium text-primary 2xl:flex">
            <UserCog className="h-3 w-3" />
            <span className="ml-0.5">{DEMO_ROLE_LABELS[currentRole]}</span>
            <ChevronDown className="ml-0.5 h-2.5 w-2.5" />
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44 rounded-[10px] border-[#DCEBED]">
        <DropdownMenuLabel className="text-[11px] text-muted-foreground">
          演示角色切换
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup
          value={currentRole}
          onValueChange={(v) => setDemoRole(v as KnowledgeUserRole)}
        >
          {DEMO_ROLE_OPTIONS.map((role) => (
            <DropdownMenuRadioItem key={role} value={role} className="text-[13px]">
              <div>
                <div className="font-medium">{DEMO_USERS[role].name}</div>
                <div className="text-[11px] text-muted-foreground">{DEMO_ROLE_LABELS[role]}</div>
              </div>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function Header({ wide = false }: { wide?: boolean }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const currentSearch = useRouterState({
    select: (s) => s.location.search as Record<string, unknown>,
  });
  useSyncExternalStore(subscribeDemoRole, getDemoRoleKey, getDemoRoleServerSnapshot);
  const showKnowledgeAdmin = canViewKnowledgeAdmin();

  const menu = MENU.map((item) => {
    if (item.to !== "/knowledge" || !item.children) return item;
    return {
      ...item,
      children: item.children.filter(
        (child) => child.to !== "/knowledge/admin" || showKnowledgeAdmin,
      ),
    };
  });

  return (
    <header
      className={`sticky top-0 z-40 border-b border-border/70 bg-white${
        wide ? " page-shell__header--wide" : ""
      }`}
    >
      <div
        className={`flex h-16 w-full items-center gap-3 px-3 sm:px-5 xl:gap-6 xl:px-6${
          wide ? " page-shell__header-content--wide" : ""
        }`}
      >
        <Sheet>
          <SheetTrigger asChild>
            <button
              type="button"
              aria-label="打开主导航"
              className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring xl:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[min(88vw,360px)] p-0 sm:max-w-[360px]">
            <SheetHeader className="border-b border-border px-5 py-5 text-left">
              <SheetTitle className="flex items-center gap-3 text-[15px]">
                <span className="grid h-10 w-10 place-items-center overflow-hidden rounded-full bg-white ring-1 ring-border">
                  <img src={logo} alt="" className="h-8 w-8 object-contain" />
                </span>
                涉网运行能力智能提升平台
              </SheetTitle>
            </SheetHeader>
            <nav
              aria-label="主导航"
              className="scrollbar-thin h-[calc(100dvh-81px)] overflow-y-auto p-3"
            >
              {menu.map((item) => {
                const active = isItemActive(pathname, item.to);
                return (
                  <div key={item.to} className="mb-1">
                    <SheetClose asChild>
                      <Link
                        to={item.to}
                        className={`flex min-h-11 items-center rounded-xl px-3 text-[14px] font-medium ${
                          active ? "bg-primary-soft text-primary" : "text-foreground hover:bg-muted"
                        }`}
                      >
                        {item.label}
                      </Link>
                    </SheetClose>
                    {item.children && (
                      <div className="ml-4 border-l border-border pl-2">
                        {Array.from(
                          new Set(
                            item.children
                              .map((child) => child.group)
                              .filter((group): group is string => !!group),
                          ),
                        ).length > 0
                          ? Array.from(
                              new Set(
                                item.children
                                  .map((child) => child.group)
                                  .filter((group): group is string => !!group),
                              ),
                            ).map((group) => (
                              <div
                                key={group}
                                className={`py-1 ${group === "内容管理" ? "mt-1 border-t border-primary/15 pt-2" : ""}`}
                              >
                                <div className="flex items-center justify-between px-3 py-1 text-[10.5px] font-semibold text-muted-foreground/75">
                                  <span>{group}</span>
                                  {group === "内容管理" && (
                                    <span className="text-[9px] text-primary">管理员</span>
                                  )}
                                </div>
                                {item.children
                                  ?.filter((child) => child.group === group)
                                  .map((child) => (
                                    <SheetClose asChild key={`${child.to}-${child.label}`}>
                                      <Link
                                        to={child.to}
                                        search={child.search}
                                        className={`flex min-h-10 items-center rounded-lg px-3 text-[13px] ${
                                          isChildActive(
                                            pathname,
                                            child.to,
                                            child.search,
                                            currentSearch,
                                          )
                                            ? "bg-primary-soft font-medium text-primary"
                                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                        }`}
                                      >
                                        {child.label}
                                      </Link>
                                    </SheetClose>
                                  ))}
                              </div>
                            ))
                          : item.children.map((child) => (
                              <SheetClose asChild key={`${child.to}-${child.label}`}>
                                <Link
                                  to={child.to}
                                  search={child.search}
                                  className="flex min-h-10 items-center rounded-lg px-3 text-[13px] text-muted-foreground hover:bg-muted hover:text-foreground"
                                >
                                  {child.label}
                                </Link>
                              </SheetClose>
                            ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </nav>
          </SheetContent>
        </Sheet>

        <Link to="/" className="flex min-w-0 items-center gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full bg-white ring-1 ring-border">
            <img src={logo} alt="平台 Logo" className="h-8 w-8 object-contain" />
          </div>
          <div className="hidden min-w-0 leading-tight md:block">
            <div className="truncate text-[15px] font-semibold tracking-tight text-foreground">
              涉网运行能力智能提升平台
            </div>
            <div className="hidden text-[11px] text-muted-foreground 2xl:block">
              面向电厂人员的知识学习、场景练习与能力成长平台
            </div>
          </div>
        </Link>

        <nav
          aria-label="主导航"
          className="hidden min-w-0 flex-1 items-center justify-center gap-0.5 xl:flex"
        >
          {menu.map((m) => (
            <NavLink key={m.to} m={m} pathname={pathname} currentSearch={currentSearch} />
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1.5 sm:gap-2.5 xl:ml-0">
          <button
            type="button"
            aria-label="通知，有一条未读"
            className="relative grid h-11 w-11 place-items-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Bell className="h-[18px] w-[18px]" />
            <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-remind" />
          </button>
          <DemoRoleSwitcher />
        </div>
      </div>
    </header>
  );
}

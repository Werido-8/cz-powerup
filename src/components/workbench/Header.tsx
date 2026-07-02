import { useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Bell, ChevronDown } from "lucide-react";
import logo from "@/assets/logo.png";

interface MenuItem {
  label: string;
  to: string;
  children?: { label: string; to: string }[];
}

const MENU: MenuItem[] = [
  { label: "首页工作台", to: "/" },
  { label: "资料检索", to: "/search" },
  { label: "知识库", to: "/knowledge" },
  // 本期暂不开放：智能问答
  // { label: "智能问答", to: "/chat" },
  {
    label: "能力提升",
    to: "/learn",
    children: [
      { label: "知识学习", to: "/learn" },
      { label: "题库训练", to: "/training" },
      { label: "个人沉淀", to: "/assets" },
      { label: "题库管理", to: "/question-bank" },
      { label: "考试管理", to: "/exam-admin" },
    ],
  },
  { label: "场景训练", to: "/scenario" },
  { label: "知识治理", to: "/governance" },
];

function isItemActive(pathname: string, to: string) {
  if (to === "/") return pathname === "/";
  return pathname === to || pathname.startsWith(to + "/");
}

function NavLink({
  m,
  pathname,
}: {
  m: MenuItem;
  pathname: string;
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
          active
            ? "text-foreground"
            : "text-muted-foreground hover:bg-muted hover:text-foreground"
        }`}
      >
        {m.label}
        {active && (
          <span className="absolute inset-x-3 -bottom-[14px] h-[2px] rounded-full bg-primary" />
        )}
      </Link>
    );
  }

  const childActive = m.children?.some((c) => isItemActive(pathname, c.to));

  return (
    <div
      className="relative"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
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
          <div className="overflow-hidden rounded-lg border border-border bg-popover shadow-[0_8px_24px_-4px_oklch(0.5_0.05_230_/_0.15)]">
            <div className="flex flex-col py-1.5">
              {m.children?.map((c) => {
                const cActive = isItemActive(pathname, c.to);
                return (
                  <Link
                    key={c.to}
                    to={c.to}
                    className={`whitespace-nowrap px-4 py-2 text-[13px] transition-colors ${
                      cActive
                        ? "bg-primary-soft font-medium text-primary"
                        : "text-popover-foreground hover:bg-muted"
                    }`}
                  >
                    {c.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function Header() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[1760px] items-center gap-8 px-8">
        <Link to="/" className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center overflow-hidden rounded-full bg-white ring-1 ring-border">
            <img src={logo} alt="平台 Logo" className="h-8 w-8 object-contain" />
          </div>
          <div className="leading-tight">
            <div className="text-[15px] font-semibold tracking-tight text-foreground">
              涉网运行能力智能提升平台
            </div>
            <div className="text-[11px] text-muted-foreground">
              面向电厂人员的知识学习、场景练习与能力成长平台
            </div>
          </div>
        </Link>

        <nav className="ml-4 flex flex-1 items-center gap-1">
          {MENU.map((m) => (
            <NavLink key={m.to} m={m} pathname={pathname} />
          ))}
        </nav>

        <div className="flex items-center gap-2.5">
          <button className="relative grid h-9 w-9 place-items-center rounded-xl text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
            <Bell className="h-[18px] w-[18px]" />
            <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-remind" />
          </button>
          <div className="flex items-center gap-2 rounded-full border border-border bg-card py-1 pl-1 pr-2">
            <div className="grid h-7 w-7 place-items-center rounded-full bg-primary text-[12px] font-semibold text-primary-foreground">
              张
            </div>
            <span className="text-[13px] font-medium text-foreground">张工</span>
            <button className="flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
              运行值班
              <ChevronDown className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

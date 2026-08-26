import { useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronDown, ChevronRight, House } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { PageShell } from "@/components/workbench/PageShell";
import { cn } from "@/lib/utils";

/** 与题目提交记录页一致的外边距，配合 compact 保证一屏显示 */
export const LEARNING_PAGE_MAIN_CLASS =
  "flex min-h-0 flex-col overflow-hidden px-6 py-7 lg:px-8";

export function LearningPageShell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <PageShell compact mainClassName={cn(LEARNING_PAGE_MAIN_CLASS, className)}>
      {children}
    </PageShell>
  );
}

export type LearningNavPageKey = "knowledge" | "submissions" | "updates" | "assets";

export type LearningBreadcrumbTrailItem = {
  label: string;
  to?: "/learn/topic/$id" | "/learn/doc/$id" | "/learn";
  params?: { id: string };
  search?: { tab?: "topic" | "materials" };
};

const NAV_PAGES: {
  key: LearningNavPageKey;
  label: string;
}[] = [
  { key: "knowledge", label: "知识学习" },
  { key: "submissions", label: "提交记录" },
  { key: "updates", label: "最近更新" },
  { key: "assets", label: "个人沉淀" },
];

function HomeLink({ className }: { className?: string }) {
  return (
    <Link
      to="/learn"
      search={{ tab: undefined }}
      className={cn(
        "inline-flex items-center gap-1 text-kb-muted transition-colors hover:text-primary",
        className,
      )}
    >
      <House className="h-3.5 w-3.5 stroke-[1.8]" aria-hidden />
      学习首页
    </Link>
  );
}

function NavPageLink({
  pageKey,
  className,
  children,
  onClick,
}: {
  pageKey: LearningNavPageKey;
  className?: string;
  children: ReactNode;
  onClick?: () => void;
}) {
  if (pageKey === "knowledge") {
    return (
      <Link to="/learn" search={{ tab: "topic" }} className={className} onClick={onClick}>
        {children}
      </Link>
    );
  }
  if (pageKey === "submissions") {
    return (
      <Link to="/learn/submissions" className={className} onClick={onClick}>
        {children}
      </Link>
    );
  }
  if (pageKey === "updates") {
    return (
      <Link to="/learn/updates" className={className} onClick={onClick}>
        {children}
      </Link>
    );
  }
  return (
    <Link to="/assets" className={className} onClick={onClick}>
      {children}
    </Link>
  );
}

function TrailLink({ item }: { item: LearningBreadcrumbTrailItem }) {
  if (item.to === "/learn") {
    return (
      <Link
        to="/learn"
        search={{ tab: item.search?.tab }}
        className="max-w-[220px] truncate text-kb-muted hover:text-primary"
      >
        {item.label}
      </Link>
    );
  }
  if (item.to === "/learn/topic/$id" && item.params?.id) {
    return (
      <Link
        to="/learn/topic/$id"
        params={{ id: item.params.id }}
        className="max-w-[220px] truncate text-kb-muted hover:text-primary"
      >
        {item.label}
      </Link>
    );
  }
  if (item.to === "/learn/doc/$id" && item.params?.id) {
    return (
      <Link
        to="/learn/doc/$id"
        params={{ id: item.params.id }}
        className="max-w-[220px] truncate text-kb-muted hover:text-primary"
      >
        {item.label}
      </Link>
    );
  }
  return <span className="max-w-[280px] truncate text-kb-body">{item.label}</span>;
}

export function LearningBreadcrumb({
  current,
  trail,
  className,
}: {
  current: LearningNavPageKey;
  trail?: LearningBreadcrumbTrailItem[];
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const currentPage = NAV_PAGES.find((page) => page.key === current) ?? NAV_PAGES[0];

  return (
    <nav
      aria-label="页面导航"
      className={cn("mb-2 flex h-[22px] shrink-0 items-center text-[12px] leading-none", className)}
    >
      <HomeLink />
      <ChevronRight className="mx-1 h-3 w-3 shrink-0 text-kb-muted/40" aria-hidden />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            aria-label={`切换页面，当前为${currentPage.label}`}
            className={cn(
              "inline-flex items-center gap-0.5 text-left text-kb-body transition-colors",
              "hover:text-primary focus-visible:outline-none",
              open && "text-primary",
            )}
          >
            <span className={cn("truncate", open && "underline")}>{currentPage.label}</span>
            <ChevronDown className="h-3 w-3 shrink-0 text-kb-muted/70" />
          </button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          sideOffset={6}
          className="w-[min(220px,calc(100vw-2rem))] border-divider p-1 shadow-[0_8px_24px_rgba(31,52,64,0.08)]"
        >
          <ul className="py-0.5">
            {NAV_PAGES.map((page) => {
              const selected = page.key === current;
              return (
                <li key={page.key}>
                  <NavPageLink
                    pageKey={page.key}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex h-8 w-full items-center rounded-[6px] px-2.5 text-left text-[12.5px] transition-colors",
                      selected
                        ? "bg-primary-soft font-medium text-accent-foreground"
                        : "text-kb-body hover:bg-[#F4FAFB]",
                    )}
                  >
                    {page.label}
                  </NavPageLink>
                </li>
              );
            })}
          </ul>
        </PopoverContent>
      </Popover>
      {trail?.map((item) => (
        <span key={`${item.to ?? "text"}-${item.label}`} className="inline-flex min-w-0 items-center">
          <ChevronRight className="mx-1 h-3 w-3 shrink-0 text-kb-muted/40" aria-hidden />
          <TrailLink item={item} />
        </span>
      ))}
    </nav>
  );
}

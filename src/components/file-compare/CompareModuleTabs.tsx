import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import type { CompareOverviewSearch } from "@/lib/file-compare/navigation";

export type CompareTabKey = "overview" | "reader" | "changes" | "info";

const TABS: { key: CompareTabKey; label: string; to: string }[] = [
  { key: "overview", label: "差异概览", to: "/file-compare/$taskId/overview" },
  { key: "reader", label: "对照阅读", to: "/file-compare/$taskId/reader" },
  { key: "changes", label: "变更清单", to: "/file-compare/$taskId/changes" },
  { key: "info", label: "文件信息", to: "/file-compare/$taskId/info" },
];

/** 页面内四个主页签，通过路由切换并保留筛选条件 */
export function CompareModuleTabs({
  taskId,
  active,
  search,
}: {
  taskId: string;
  active: CompareTabKey;
  search: CompareOverviewSearch;
}) {
  return (
    <nav
      aria-label="比对结果视图"
      className="flex h-11 shrink-0 items-stretch gap-8 border-b border-kb-border px-5"
    >
      {TABS.map((tab) => {
        const isActive = tab.key === active;
        return (
          <Link
            key={tab.key}
            to={tab.to}
            params={{ taskId }}
            search={search}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "relative inline-flex items-center whitespace-nowrap text-[13.5px] font-medium transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25",
              isActive ? "text-primary" : "text-kb-muted hover:text-kb-heading",
            )}
          >
            {tab.label}
            {isActive && <span className="absolute inset-x-0 bottom-0 h-[2px] bg-primary" />}
          </Link>
        );
      })}
    </nav>
  );
}

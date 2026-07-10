import { ChevronRight, Layers, LayoutGrid, Library, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { KnowledgeDetailBannerShell } from "./KnowledgeDetailBannerShell";

function BannerCapsule({
  children,
  tone = "primary",
}: {
  children: ReactNode;
  tone?: "primary" | "neutral";
}) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center rounded-full border px-2.5 text-[11px] font-medium",
        tone === "primary"
          ? "border-[#C5E6EE] bg-[#F0FAFB] text-[#1498A8]"
          : "border-[#E6F0F2] bg-white text-[#4E5969]",
      )}
    >
      {children}
    </span>
  );
}

function AggregateBreadcrumb({
  rootLabel,
  rootIcon: RootIcon,
  ariaLabel,
  onNavigateRoot,
}: {
  rootLabel: string;
  rootIcon: LucideIcon;
  ariaLabel: string;
  onNavigateRoot?: () => void;
}) {
  return (
    <nav
      aria-label={ariaLabel}
      className="mb-3 inline-flex max-w-full flex-wrap items-center text-[12px] leading-none text-muted-foreground"
    >
      {onNavigateRoot ? (
        <button
          type="button"
          onClick={onNavigateRoot}
          className="inline-flex min-w-0 max-w-[220px] items-center gap-1 text-muted-foreground transition-colors hover:text-primary"
        >
          <RootIcon className="h-3 w-3 shrink-0 stroke-[1.8] text-kb-muted" />
          <span className="truncate">{rootLabel}</span>
        </button>
      ) : (
        <span className="inline-flex min-w-0 max-w-[220px] items-center gap-1">
          <RootIcon className="h-3 w-3 shrink-0 stroke-[1.8] text-kb-muted" />
          <span className="truncate">{rootLabel}</span>
        </span>
      )}
      <ChevronRight className="mx-1 h-3 w-3 shrink-0 text-border" aria-hidden />
      <span className="inline-flex min-w-0 max-w-[220px] items-center gap-1 text-muted-foreground">
        <Layers className="h-3 w-3 shrink-0 stroke-[1.8] text-kb-muted" />
        <span className="truncate">全部</span>
      </span>
    </nav>
  );
}

const overviewBreadcrumb = {
  label: "知识总览",
  icon: LayoutGrid,
  ariaLabel: "知识总览路径",
} as const;

export function KnowledgeAggregateDetailHeader({
  fileCount,
  description,
  scopeLabel,
  breadcrumb = overviewBreadcrumb,
  onNavigateRoot,
}: {
  fileCount: number;
  description: string;
  scopeLabel: string;
  breadcrumb?: {
    label: string;
    icon: LucideIcon;
    ariaLabel: string;
  };
  onNavigateRoot?: () => void;
}) {
  const RootIcon = breadcrumb.icon;

  return (
    <KnowledgeDetailBannerShell>
      <AggregateBreadcrumb
        rootLabel={breadcrumb.label}
        rootIcon={RootIcon}
        ariaLabel={breadcrumb.ariaLabel}
        onNavigateRoot={onNavigateRoot}
      />
      <div className="flex min-w-0 items-start gap-3.5">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-[10px] bg-primary-soft text-primary">
          <Library className="h-5 w-5 stroke-[1.8]" />
        </div>

        <div className="min-w-0 flex-1 pt-0.5">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
            <h1 className="text-[22px] font-semibold leading-tight tracking-tight text-[#002140]">
              全部
            </h1>
            <BannerCapsule tone="primary">{fileCount} 个文件</BannerCapsule>
            <BannerCapsule tone="neutral">{scopeLabel}</BannerCapsule>
          </div>

          <p className="mt-2 max-w-[640px] truncate text-[14px] leading-relaxed text-[#4E5969]">
            {description}
          </p>
        </div>
      </div>
    </KnowledgeDetailBannerShell>
  );
}

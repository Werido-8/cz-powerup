import { ChevronRight, Folder, Library } from "lucide-react";
import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  buildKnowledgeBaseBreadcrumb,
  resolveBreadcrumbSelection,
  type KnowledgeBreadcrumbOption,
  type KnowledgeBreadcrumbSegment,
} from "@/lib/knowledge/model";
import type { KnowledgeBase } from "@/lib/knowledge/types";
import { cn } from "@/lib/utils";

function BreadcrumbSegmentIcon({
  kind,
  optionKind,
}: {
  kind?: KnowledgeBreadcrumbSegment["kind"];
  optionKind?: KnowledgeBreadcrumbOption["kind"];
}) {
  const isBase = kind === "base" || optionKind === "base";
  if (isBase) {
    return <Library className="h-3 w-3 shrink-0 text-kb-muted stroke-[1.8]" />;
  }
  return <Folder className="h-3 w-3 shrink-0 text-warning stroke-[1.8]" />;
}

function BreadcrumbSegmentLabel({
  kind,
  label,
  className,
}: {
  kind: KnowledgeBreadcrumbSegment["kind"];
  label: string;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex min-w-0 max-w-[220px] items-center gap-1", className)}>
      <BreadcrumbSegmentIcon kind={kind} />
      <span className="truncate">{label}</span>
    </span>
  );
}

export function KnowledgeBaseBreadcrumb({
  base,
  onSelectBase,
  className,
}: {
  base: KnowledgeBase;
  onSelectBase: (baseId: string) => void;
  className?: string;
}) {
  const segments = buildKnowledgeBaseBreadcrumb(base);
  if (segments.length === 0) return null;

  const handleSelect = (option: KnowledgeBreadcrumbOption) => {
    const baseId = resolveBreadcrumbSelection(option);
    if (baseId) onSelectBase(baseId);
  };

  return (
    <nav
      aria-label="知识库路径"
      className={cn(
        "inline-flex max-w-full flex-wrap items-center text-[12px] leading-none text-muted-foreground",
        className,
      )}
    >
      {segments.map((segment, index) => (
        <span key={segment.id} className="inline-flex min-w-0 items-center">
          {index > 0 && (
            <ChevronRight className="mx-1 h-3 w-3 shrink-0 text-border" aria-hidden />
          )}
          <BreadcrumbSegmentItem
            segment={segment}
            currentBaseId={base.id}
            onSelect={handleSelect}
          />
        </span>
      ))}
    </nav>
  );
}

function BreadcrumbSegmentItem({
  segment,
  currentBaseId,
  onSelect,
}: {
  segment: KnowledgeBreadcrumbSegment;
  currentBaseId: string;
  onSelect: (option: KnowledgeBreadcrumbOption) => void;
}) {
  const [open, setOpen] = useState(false);
  const hasMenu = segment.options.length > 1;

  if (!hasMenu) {
    return (
      <BreadcrumbSegmentLabel
        kind={segment.kind}
        label={segment.label}
        className="text-muted-foreground"
      />
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "text-left text-muted-foreground transition-colors",
            "hover:text-primary focus-visible:outline-none",
            open && "text-primary",
          )}
        >
          <BreadcrumbSegmentLabel
            kind={segment.kind}
            label={segment.label}
            className={cn(open && "[&_span]:underline")}
          />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={6}
        className="w-[min(260px,calc(100vw-2rem))] border-divider p-1 shadow-[0_8px_24px_rgba(31,52,64,0.08)]"
      >
        <ul className="max-h-[240px] overflow-y-auto py-0.5">
          {segment.options.map((option) => {
            const selected =
              segment.kind === "base"
                ? option.id === currentBaseId
                : option.id === segment.id.replace("cat-", "");
            return (
              <li key={option.id}>
                <button
                  type="button"
                  onClick={() => {
                    onSelect(option);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex h-8 w-full items-center gap-2 rounded-[6px] px-2.5 text-left text-[12.5px] transition-colors",
                    selected
                      ? "bg-primary-soft font-medium text-accent-foreground"
                      : "text-kb-body hover:bg-[#F4FAFB]",
                  )}
                >
                  <BreadcrumbSegmentIcon optionKind={option.kind} />
                  <span className="min-w-0 truncate">{option.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </PopoverContent>
    </Popover>
  );
}

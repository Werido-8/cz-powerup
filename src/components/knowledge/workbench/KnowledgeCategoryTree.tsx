import {
  ChevronRight,
  Folder,
  FolderOpen,
  Layers,
  Library,
  LockKeyhole,
  Pin,
  PinOff,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useEffect, useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { KNOWLEDGE_CATEGORIES } from "@/lib/knowledge/data";
import {
  canViewBaseFiles,
  getBasesForCategory,
  getCategoryChildren,
  PROFESSIONAL_TREE_ALL_ID,
} from "@/lib/knowledge/model";
import { isPinnedId } from "@/lib/knowledge/pinned";
import type { KnowledgeBase, KnowledgeCategory } from "@/lib/knowledge/types";
import { cn } from "@/lib/utils";

export function KnowledgeTreeNavItem({
  icon: Icon,
  label,
  selected,
  onClick,
  depth = 0,
}: {
  icon: LucideIcon;
  label: string;
  selected: boolean;
  onClick: () => void;
  depth?: number;
}) {
  return (
    <div
      className={cn(
        "relative flex h-8 w-full items-center gap-1 rounded-[8px] pr-1.5 transition-colors",
        selected ? "bg-primary-soft" : "hover:bg-card",
      )}
      style={{ paddingLeft: 8 + depth * 14 }}
    >
      {selected && (
        <span className="absolute left-0 top-1/2 h-4 w-[3px] -translate-y-1/2 rounded-r-full bg-primary" />
      )}
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "flex min-w-0 flex-1 items-center gap-2 text-left text-[12.5px]",
          selected ? "font-medium text-accent-foreground" : "text-kb-body",
        )}
      >
        <Icon
          className={cn(
            "h-3.5 w-3.5 shrink-0 stroke-[1.8]",
            selected ? "text-primary" : "text-kb-muted",
          )}
        />
        <span className="min-w-0 flex-1 truncate">{label}</span>
      </button>
    </div>
  );
}

export function KnowledgeBaseTreeItem({
  base,
  depth,
  selected,
  pinned = false,
  showPin = true,
  onSelect,
  onTogglePin,
}: {
  base: KnowledgeBase;
  depth: number;
  selected: boolean;
  pinned?: boolean;
  showPin?: boolean;
  onSelect: () => void;
  onTogglePin?: () => void;
}) {
  const canView = canViewBaseFiles(base);

  return (
    <div
      className={cn(
        "group relative flex h-8 w-full items-center gap-1 rounded-[8px] pr-1.5 transition-colors",
        selected ? "bg-primary-soft" : "hover:bg-card",
      )}
      style={{ paddingLeft: 30 + depth * 14 }}
    >
      {selected && (
        <span className="absolute left-0 top-1/2 h-4 w-[3px] -translate-y-1/2 rounded-r-full bg-primary" />
      )}
      <button
        type="button"
        onClick={onSelect}
        className={cn(
          "flex min-w-0 flex-1 items-center gap-2 text-left text-[12.5px]",
          selected ? "font-medium text-accent-foreground" : "text-kb-body",
        )}
      >
        <Library
          className={cn(
            "h-3.5 w-3.5 shrink-0 stroke-[1.8]",
            selected ? "text-primary" : "text-kb-muted",
          )}
        />
        <span className="min-w-0 flex-1 truncate">{base.name}</span>
      </button>
      {showPin &&
        (!canView ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="grid h-6 w-6 shrink-0 place-items-center text-warning-foreground/80">
                  <LockKeyhole className="h-3.5 w-3.5" />
                </span>
              </TooltipTrigger>
              <TooltipContent className="text-[12px]">无浏览权限</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          <button
            type="button"
            aria-label={pinned ? "取消置顶" : "置顶"}
            onClick={(e) => {
              e.stopPropagation();
              onTogglePin?.();
            }}
            className="grid h-6 w-6 shrink-0 place-items-center rounded-[6px] text-kb-muted opacity-0 transition-all hover:bg-kb-surface-hover hover:text-kb-primary group-hover:opacity-100"
          >
            {pinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
          </button>
        ))}
    </div>
  );
}

export function KnowledgeTreeAllItem({
  label = "全部",
  selected,
  onSelect,
}: {
  label?: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <div
      className={cn(
        "relative flex h-8 w-full items-center rounded-[8px] pr-1.5 transition-colors",
        selected ? "bg-primary-soft" : "hover:bg-card",
      )}
    >
      {selected && (
        <span className="absolute left-0 top-1/2 h-4 w-[3px] -translate-y-1/2 rounded-r-full bg-primary" />
      )}
      <button
        type="button"
        onClick={onSelect}
        className={cn(
          "flex h-8 w-full min-w-0 items-center gap-1.5 rounded-[8px] px-2 text-left text-[12.5px] transition-colors",
          selected ? "font-medium text-accent-foreground" : "text-kb-body",
        )}
        style={{ paddingLeft: 8 }}
      >
        <span className="grid h-3.5 w-3.5 shrink-0 place-items-center" aria-hidden>
          <span
            className={cn(
              "h-1.5 w-1.5 rounded-full",
              selected ? "bg-primary/70" : "bg-kb-muted/45",
            )}
          />
        </span>
        <Layers
          className={cn(
            "h-3.5 w-3.5 shrink-0 stroke-[1.8]",
            selected ? "text-primary" : "text-kb-muted",
          )}
        />
        <span className="min-w-0 flex-1 truncate">{label}</span>
      </button>
    </div>
  );
}

export function KnowledgeCategoryTree({
  selectedBaseId,
  pinnedIds,
  onSelectBase,
  onSelectAll,
  onTogglePin,
}: {
  selectedBaseId?: string;
  pinnedIds: string[];
  onSelectBase: (base: KnowledgeBase) => void;
  onSelectAll?: () => void;
  onTogglePin: (baseId: string) => void;
}) {
  const [expanded, setExpanded] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set(KNOWLEDGE_CATEGORIES.map((item) => item.id));
    const saved = window.localStorage.getItem("knowledge-expanded-categories");
    return saved
      ? new Set(JSON.parse(saved) as string[])
      : new Set(KNOWLEDGE_CATEGORIES.map((item) => item.id));
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("knowledge-expanded-categories", JSON.stringify([...expanded]));
    }
  }, [expanded]);

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="space-y-0.5 px-1">
      <KnowledgeTreeAllItem
        selected={selectedBaseId === PROFESSIONAL_TREE_ALL_ID}
        onSelect={() => onSelectAll?.()}
      />
      {getCategoryChildren().map((category) => (
        <CategoryNode
          key={category.id}
          category={category}
          depth={0}
          expanded={expanded}
          selectedBaseId={selectedBaseId}
          pinnedIds={pinnedIds}
          onToggle={toggle}
          onSelectBase={onSelectBase}
          onTogglePin={onTogglePin}
        />
      ))}
    </div>
  );
}

function CategoryNode({
  category,
  depth,
  expanded,
  selectedBaseId,
  pinnedIds,
  onToggle,
  onSelectBase,
  onTogglePin,
}: {
  category: KnowledgeCategory;
  depth: number;
  expanded: Set<string>;
  selectedBaseId?: string;
  pinnedIds: string[];
  onToggle: (id: string) => void;
  onSelectBase: (base: KnowledgeBase) => void;
  onTogglePin: (baseId: string) => void;
}) {
  const open = expanded.has(category.id);
  const children = getCategoryChildren(category.id);
  const bases = getBasesForCategory(category.id);
  const FolderIcon = open ? FolderOpen : Folder;

  return (
    <div>
      <button
        type="button"
        onClick={() => onToggle(category.id)}
        className="flex h-8 w-full items-center gap-1.5 rounded-[8px] px-2 text-left text-[12.5px] text-kb-muted transition-colors hover:bg-card hover:text-kb-body"
        style={{ paddingLeft: 8 + depth * 14 }}
      >
        <ChevronRight className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-90")} />
        <FolderIcon className="h-3.5 w-3.5 text-warning stroke-[1.8]" />
        <span className="min-w-0 flex-1 truncate">{category.name}</span>
      </button>
      {open && (
        <div className="space-y-0.5">
          {children.map((child) => (
            <CategoryNode
              key={child.id}
              category={child}
              depth={depth + 1}
              expanded={expanded}
              selectedBaseId={selectedBaseId}
              pinnedIds={pinnedIds}
              onToggle={onToggle}
              onSelectBase={onSelectBase}
              onTogglePin={onTogglePin}
            />
          ))}
          {bases.map((base) => (
            <KnowledgeBaseTreeItem
              key={base.id}
              base={base}
              depth={depth}
              selected={selectedBaseId === base.id}
              pinned={isPinnedId(pinnedIds, base.id)}
              onSelect={() => onSelectBase(base)}
              onTogglePin={() => onTogglePin(base.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

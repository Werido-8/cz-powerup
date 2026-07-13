import {
  ChevronRight,
  Folder,
  FolderOpen,
  FolderInput,
  FolderPlus,
  Layers,
  Library,
  LockKeyhole,
  Pin,
  PinOff,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  canViewBaseFiles,
  getBasesForCategory,
  getCategoryChildren,
  PROFESSIONAL_TREE_ALL_ID,
} from "@/lib/knowledge/model";
import { isPinnedId } from "@/lib/knowledge/pinned";
import {
  getKnowledgeStoreVersion,
  getStoreCategories,
  subscribeKnowledgeStore,
} from "@/lib/knowledge/store";
import type { KnowledgeBase, KnowledgeCategory } from "@/lib/knowledge/types";
import { cn } from "@/lib/utils";
import { KnowledgeBasePlusIcon } from "./KnowledgeBasePlusIcon";

function useKnowledgeStoreVersion() {
  const [version, setVersion] = useState(getKnowledgeStoreVersion);
  useEffect(() => subscribeKnowledgeStore(() => setVersion(getKnowledgeStoreVersion())), []);
  return version;
}

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
  highlighted = false,
  onSelect,
  onTogglePin,
}: {
  base: KnowledgeBase;
  depth: number;
  selected: boolean;
  pinned?: boolean;
  showPin?: boolean;
  highlighted?: boolean;
  onSelect: () => void;
  onTogglePin?: () => void;
}) {
  const canView = canViewBaseFiles(base);

  return (
    <div
      className={cn(
        "group relative flex h-8 w-full items-center gap-1 rounded-[8px] pr-1.5 transition-colors",
        selected ? "bg-primary-soft" : "hover:bg-[#F4FAFB]",
        highlighted && "bg-primary-soft/80 ring-1 ring-primary/30",
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
          "flex min-w-0 flex-1 items-center gap-2 text-left text-[12.5px] transition-colors",
          selected
            ? "font-medium text-accent-foreground"
            : "text-kb-body group-hover:text-kb-heading",
        )}
      >
        <Library
          className={cn(
            "h-3.5 w-3.5 shrink-0 stroke-[1.8]",
            selected ? "text-primary" : "text-kb-muted group-hover:text-primary/80",
          )}
        />
        <span className="min-w-0 flex-1 truncate">{base.name}</span>
      </button>
      {showPin &&
        (!canView ? (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="grid h-5 w-5 shrink-0 place-items-center text-warning-foreground/80">
                  <LockKeyhole className="h-3 w-3 stroke-[1.8]" />
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
            className={cn(
              "grid h-5 w-5 shrink-0 place-items-center rounded-[5px] text-kb-muted opacity-0 transition-all",
              "hover:bg-kb-surface-hover hover:text-kb-primary",
              "group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/30",
            )}
          >
            {pinned ? (
              <PinOff className="h-3 w-3 stroke-[1.8]" />
            ) : (
              <Pin className="h-3 w-3 stroke-[1.8]" />
            )}
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

export function TreeNodeActionButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            aria-label={label}
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              onClick();
            }}
            onMouseDown={(event) => {
              event.preventDefault();
              event.stopPropagation();
            }}
            className={cn(
              "grid h-5 w-5 shrink-0 place-items-center rounded-[5px] text-kb-muted opacity-0 transition-all",
              "hover:bg-kb-surface-hover hover:text-kb-body",
              "group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/30",
            )}
          >
            {children}
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-[12px]">
          {label}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function KnowledgeCategoryTree({
  selectedBaseId,
  pinnedIds,
  forceExpandIds,
  highlightedCategoryId,
  highlightedBaseId,
  onSelectBase,
  onSelectAll,
  onTogglePin,
  onCreateDirectory,
  onCreateKnowledgeBase,
  onMoveDirectory,
}: {
  selectedBaseId?: string;
  pinnedIds: string[];
  forceExpandIds?: string[];
  highlightedCategoryId?: string;
  highlightedBaseId?: string;
  onSelectBase: (base: KnowledgeBase) => void;
  onSelectAll?: () => void;
  onTogglePin: (baseId: string) => void;
  onCreateDirectory?: (category: KnowledgeCategory) => void;
  onCreateKnowledgeBase?: (category: KnowledgeCategory) => void;
  onMoveDirectory?: (category: KnowledgeCategory) => void;
}) {
  useKnowledgeStoreVersion();
  const categories = getStoreCategories();

  const [expanded, setExpanded] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set(categories.map((item) => item.id));
    const saved = window.localStorage.getItem("knowledge-expanded-categories");
    return saved
      ? new Set(JSON.parse(saved) as string[])
      : new Set(categories.map((item) => item.id));
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("knowledge-expanded-categories", JSON.stringify([...expanded]));
    }
  }, [expanded]);

  useEffect(() => {
    if (!forceExpandIds?.length) return;
    setExpanded((prev) => {
      const next = new Set(prev);
      let changed = false;
      for (const id of forceExpandIds) {
        if (!next.has(id)) {
          next.add(id);
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [forceExpandIds]);

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
          highlightedCategoryId={highlightedCategoryId}
          highlightedBaseId={highlightedBaseId}
          onToggle={toggle}
          onSelectBase={onSelectBase}
          onTogglePin={onTogglePin}
          onCreateDirectory={onCreateDirectory}
          onCreateKnowledgeBase={onCreateKnowledgeBase}
          onMoveDirectory={onMoveDirectory}
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
  highlightedCategoryId,
  highlightedBaseId,
  onToggle,
  onSelectBase,
  onTogglePin,
  onCreateDirectory,
  onCreateKnowledgeBase,
  onMoveDirectory,
}: {
  category: KnowledgeCategory;
  depth: number;
  expanded: Set<string>;
  selectedBaseId?: string;
  pinnedIds: string[];
  highlightedCategoryId?: string;
  highlightedBaseId?: string;
  onToggle: (id: string) => void;
  onSelectBase: (base: KnowledgeBase) => void;
  onTogglePin: (baseId: string) => void;
  onCreateDirectory?: (category: KnowledgeCategory) => void;
  onCreateKnowledgeBase?: (category: KnowledgeCategory) => void;
  onMoveDirectory?: (category: KnowledgeCategory) => void;
}) {
  const open = expanded.has(category.id);
  const children = getCategoryChildren(category.id);
  const bases = getBasesForCategory(category.id);
  const FolderIcon = open ? FolderOpen : Folder;
  const highlighted = highlightedCategoryId === category.id;
  const showActions = Boolean(onCreateDirectory || onCreateKnowledgeBase || onMoveDirectory);

  return (
    <div>
      <div
        className={cn(
          "group relative flex h-8 w-full items-center rounded-[8px] transition-colors",
          "hover:bg-[#F4FAFB]",
          highlighted && "bg-primary-soft/80 ring-1 ring-primary/30",
        )}
        style={{ paddingLeft: 8 + depth * 14 }}
      >
        <button
          type="button"
          onClick={() => onToggle(category.id)}
          className={cn(
            "flex h-8 min-w-0 flex-1 items-center gap-1.5 rounded-[8px] pr-12 text-left text-[12.5px] transition-colors",
            "text-kb-muted group-hover:text-kb-body",
            highlighted && "font-medium text-accent-foreground",
          )}
        >
          <ChevronRight className={cn("h-3.5 w-3.5 shrink-0 transition-transform", open && "rotate-90")} />
          <FolderIcon className="h-3.5 w-3.5 shrink-0 text-warning stroke-[1.8]" />
          <span className="min-w-0 flex-1 truncate">{category.name}</span>
        </button>
        {showActions && (
          <div
            className={cn(
              "pointer-events-none absolute right-1 top-1/2 flex -translate-y-1/2 items-center justify-end gap-0.5",
              onMoveDirectory ? "w-[4.5rem]" : "w-11",
              "opacity-0 transition-opacity",
              "group-hover:pointer-events-auto group-hover:opacity-100",
            )}
          >
            {onMoveDirectory && (
              <TreeNodeActionButton
                label="移动目录"
                onClick={() => onMoveDirectory(category)}
              >
                <FolderInput className="h-3 w-3 stroke-[1.8]" />
              </TreeNodeActionButton>
            )}
            {onCreateDirectory && (
              <TreeNodeActionButton
                label="新建子目录"
                onClick={() => onCreateDirectory(category)}
              >
                <FolderPlus className="h-3 w-3 stroke-[1.8]" />
              </TreeNodeActionButton>
            )}
            {onCreateKnowledgeBase && (
              <TreeNodeActionButton
                label="新增知识库"
                onClick={() => onCreateKnowledgeBase(category)}
              >
                <KnowledgeBasePlusIcon className="h-3 w-3" />
              </TreeNodeActionButton>
            )}
          </div>
        )}
      </div>
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
              highlightedCategoryId={highlightedCategoryId}
              highlightedBaseId={highlightedBaseId}
              onToggle={onToggle}
              onSelectBase={onSelectBase}
              onTogglePin={onTogglePin}
              onCreateDirectory={onCreateDirectory}
              onCreateKnowledgeBase={onCreateKnowledgeBase}
              onMoveDirectory={onMoveDirectory}
            />
          ))}
          {bases.map((base) => (
            <KnowledgeBaseTreeItem
              key={base.id}
              base={base}
              depth={depth}
              selected={selectedBaseId === base.id}
              pinned={isPinnedId(pinnedIds, base.id)}
              highlighted={highlightedBaseId === base.id}
              onSelect={() => onSelectBase(base)}
              onTogglePin={() => onTogglePin(base.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

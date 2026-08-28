import {
  ChevronDown,
  ChevronRight,
  FileStack,
  Folder,
  FolderOpen,
  FolderPlus,
  MoreVertical,
  Pencil,
  Trash2,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { EllipsisTooltip } from "@/components/common/ellipsis-tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TooltipProvider } from "@/components/ui/tooltip";
import { getInternalDirectoryDescendantIds } from "@/lib/knowledge/model";
import type { KnowledgeFile, KnowledgeInternalDirectory } from "@/lib/knowledge/types";
import { cn } from "@/lib/utils";

export const KNOWLEDGE_DIRECTORY_ALL_ID = "__knowledge_directory_all__";

export function KnowledgeInternalDirectoryTree({
  baseId,
  directories,
  files,
  selectedId,
  showAll = false,
  compact = false,
  onSelect,
  onCreate,
  onRename,
  onDelete,
}: {
  baseId: string;
  directories: KnowledgeInternalDirectory[];
  files?: KnowledgeFile[];
  selectedId?: string;
  showAll?: boolean;
  compact?: boolean;
  onSelect: (directoryId?: string) => void;
  onCreate?: (parentId?: string) => void;
  onRename?: (directory: KnowledgeInternalDirectory) => void;
  onDelete?: (directory: KnowledgeInternalDirectory) => void;
}) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(
    () =>
      new Set(
        directories
          .filter((item) => directories.some((child) => child.parentId === item.id))
          .map((item) => item.id),
      ),
  );

  useEffect(() => {
    setExpandedIds((current) => {
      const next = new Set(current);
      for (const directory of directories) {
        if (directories.some((child) => child.parentId === directory.id)) next.add(directory.id);
      }
      return next;
    });
  }, [directories]);

  const rootDirectories = useMemo(
    () => directories.filter((directory) => !directory.parentId),
    [directories],
  );

  const toggleExpanded = (id: string) => {
    setExpandedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <TooltipProvider delayDuration={200}>
      <div className={cn("space-y-0.5", compact && "space-y-px")}>
        {showAll && (
          <DirectoryRootRow
            label="全部文件"
            selected={selectedId === KNOWLEDGE_DIRECTORY_ALL_ID}
            count={files?.length}
            compact={compact}
            onClick={() => onSelect(KNOWLEDGE_DIRECTORY_ALL_ID)}
          />
        )}

        {rootDirectories.length === 0 && (
          <p className={cn("px-2 py-4 text-center text-kb-muted", compact ? "text-[11px]" : "text-[12px]")}>
            暂无目录
          </p>
        )}

        {rootDirectories.map((directory) => (
          <DirectoryBranch
            key={directory.id}
            baseId={baseId}
            directory={directory}
            directories={directories}
            files={files}
            depth={0}
            selectedId={selectedId}
            expandedIds={expandedIds}
            compact={compact}
            onSelect={onSelect}
            onToggleExpanded={toggleExpanded}
            onCreate={onCreate}
            onRename={onRename}
            onDelete={onDelete}
          />
        ))}
      </div>
    </TooltipProvider>
  );
}

function DirectoryRootRow({
  label,
  selected,
  count,
  compact,
  onClick,
}: {
  label: string;
  selected: boolean;
  count?: number;
  compact: boolean;
  onClick: () => void;
}) {
  return (
    <div
      className={cn(
        "group flex w-full items-center rounded-[7px] pr-1.5 transition-colors",
        compact ? "h-8" : "h-9",
        selected ? "bg-primary-soft text-primary" : "text-kb-body hover:bg-kb-surface-hover",
      )}
    >
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "flex min-w-0 flex-1 items-center px-2 text-left",
          compact ? "text-[12px]" : "text-[12.5px]",
        )}
      >
        <span className="w-5 shrink-0" aria-hidden="true" />
        <FileStack
          className={cn(
            "h-4 w-4 shrink-0 stroke-[1.8]",
            selected ? "text-primary" : "text-[#7C949D]",
          )}
        />
        <EllipsisTooltip
          text={label}
          side="right"
          className={cn("ml-2 min-w-0 flex-1 font-medium", selected && "text-primary")}
        />
      </button>
      <DirectoryCountSlot count={count} />
    </div>
  );
}

function DirectoryBranch({
  baseId,
  directory,
  directories,
  files,
  depth,
  selectedId,
  expandedIds,
  compact,
  onSelect,
  onToggleExpanded,
  onCreate,
  onRename,
  onDelete,
}: {
  baseId: string;
  directory: KnowledgeInternalDirectory;
  directories: KnowledgeInternalDirectory[];
  files?: KnowledgeFile[];
  depth: number;
  selectedId?: string;
  expandedIds: Set<string>;
  compact: boolean;
  onSelect: (directoryId?: string) => void;
  onToggleExpanded: (id: string) => void;
  onCreate?: (parentId?: string) => void;
  onRename?: (directory: KnowledgeInternalDirectory) => void;
  onDelete?: (directory: KnowledgeInternalDirectory) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const children = directories.filter((item) => item.parentId === directory.id);
  const hasChildren = children.length > 0;
  const expanded = expandedIds.has(directory.id);
  const selected = selectedId === directory.id;
  const descendantIds = files ? getInternalDirectoryDescendantIds(baseId, directory.id) : undefined;
  const count = descendantIds
    ? files?.filter((file) => file.directoryId && descendantIds.has(file.directoryId)).length
    : undefined;
  const FolderIcon = expanded && hasChildren ? FolderOpen : Folder;
  const menuItems = [
    onRename
      ? { key: "rename", label: "编辑", icon: Pencil, onSelect: () => onRename(directory) }
      : null,
    onCreate
      ? {
          key: "create",
          label: "创建目录",
          icon: FolderPlus,
          onSelect: () => onCreate(directory.id),
        }
      : null,
    onDelete
      ? {
          key: "delete",
          label: "删除",
          icon: Trash2,
          danger: true,
          onSelect: () => onDelete(directory),
        }
      : null,
  ].filter(Boolean) as DirectoryMenuItem[];
  const hasActions = menuItems.length > 0;

  return (
    <div>
      <div
        className={cn(
          "group flex items-center rounded-[7px] pr-1.5 transition-colors",
          compact ? "h-8" : "h-9",
          selected ? "bg-primary-soft" : "hover:bg-kb-surface-hover",
        )}
      >
        <div
          className="flex min-w-0 flex-1 items-center"
          style={{ paddingLeft: 8 + depth * 16 }}
        >
          {hasChildren ? (
            <button
              type="button"
              aria-label={expanded ? `收起${directory.name}` : `展开${directory.name}`}
              onClick={() => onToggleExpanded(directory.id)}
              className="grid h-6 w-5 shrink-0 place-items-center rounded text-kb-muted hover:text-primary"
            >
              {expanded ? (
                <ChevronDown className="h-3.5 w-3.5" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5" />
              )}
            </button>
          ) : (
            <span className="h-6 w-5 shrink-0" aria-hidden="true" />
          )}
          <button
            type="button"
            onClick={() => onSelect(directory.id)}
            className={cn(
              "flex min-w-0 flex-1 items-center gap-2 text-left",
              compact ? "text-[12px]" : "text-[12.5px]",
              selected ? "font-medium text-primary" : "text-kb-body",
            )}
          >
            <FolderIcon
              className={cn(
                "h-4 w-4 shrink-0 stroke-[1.8]",
                selected ? "text-primary" : expanded ? "text-[#E5A12A]" : "text-[#8CA3AB]",
              )}
            />
            <EllipsisTooltip text={directory.name} side="right" className="min-w-0 flex-1" />
          </button>
        </div>
        <DirectoryCountSlot
          count={count}
          hideCount={hasActions && menuOpen}
          hideCountOnHover={hasActions}
        >
          {hasActions ? <DirectoryMoreMenu items={menuItems} onOpenChange={setMenuOpen} /> : null}
        </DirectoryCountSlot>
      </div>

      {expanded &&
        children.map((child) => (
          <DirectoryBranch
            key={child.id}
            baseId={baseId}
            directory={child}
            directories={directories}
            files={files}
            depth={depth + 1}
            selectedId={selectedId}
            expandedIds={expandedIds}
            compact={compact}
            onSelect={onSelect}
            onToggleExpanded={onToggleExpanded}
            onCreate={onCreate}
            onRename={onRename}
            onDelete={onDelete}
          />
        ))}
    </div>
  );
}

type DirectoryMenuItem = {
  key: string;
  label: string;
  icon: LucideIcon;
  danger?: boolean;
  onSelect: () => void;
};

function DirectoryCountSlot({
  count,
  hideCount = false,
  hideCountOnHover = false,
  children,
}: {
  count?: number;
  hideCount?: boolean;
  hideCountOnHover?: boolean;
  children?: ReactNode;
}) {
  if (typeof count !== "number" && !children) return null;

  return (
    <div className="relative flex h-6 w-7 shrink-0 items-center justify-end">
      {typeof count === "number" && (
        <span
          className={cn(
            "w-full text-right text-[10.5px] tabular-nums text-kb-muted",
            hideCountOnHover && "group-hover:invisible group-focus-within:invisible",
            hideCount && "invisible",
          )}
        >
          {count}
        </span>
      )}
      {children ? <div className="absolute inset-y-0 right-0">{children}</div> : null}
    </div>
  );
}

function DirectoryMoreMenu({
  items,
  onOpenChange,
}: {
  items: DirectoryMenuItem[];
  onOpenChange?: (open: boolean) => void;
}) {
  const [open, setOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const updateOpen = (next: boolean) => {
    setOpen(next);
    onOpenChange?.(next);
  };

  const hoverProps = {
    onMouseEnter: () => {
      if (timer.current) {
        clearTimeout(timer.current);
        timer.current = null;
      }
      updateOpen(true);
    },
    onMouseLeave: () => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => updateOpen(false), 120);
    },
  };

  if (items.length === 0) return null;

  const rename = items.find((item) => item.key === "rename");
  const create = items.find((item) => item.key === "create");
  const remove = items.find((item) => item.key === "delete");
  const ordered = [rename, create, remove].filter(Boolean) as DirectoryMenuItem[];

  return (
    <DropdownMenu open={open} onOpenChange={updateOpen} modal={false}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="更多操作"
          {...hoverProps}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
          }}
          onMouseDown={(event) => event.stopPropagation()}
          className={cn(
            "grid h-6 w-6 shrink-0 place-items-center rounded-[5px] text-kb-muted transition-colors",
            "opacity-0 group-hover:opacity-100 group-focus-within:opacity-100",
            "hover:bg-white hover:text-primary",
            "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/30",
            open && "bg-white text-primary opacity-100",
          )}
        >
          <MoreVertical className="h-3.5 w-3.5 stroke-[1.8]" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="min-w-[8.5rem]"
        onCloseAutoFocus={(event) => event.preventDefault()}
        {...hoverProps}
      >
        {ordered.map((item, index) => (
          <div key={item.key}>
            {item.danger && index > 0 && <DropdownMenuSeparator />}
            <DropdownMenuItem
              className={cn(
                "gap-2 text-[13px]",
                item.danger && "text-destructive focus:bg-destructive/10 focus:text-destructive",
              )}
              onSelect={item.onSelect}
            >
              <item.icon className="h-3.5 w-3.5 stroke-[1.8]" />
              {item.label}
            </DropdownMenuItem>
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

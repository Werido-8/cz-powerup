import {
  ChevronRight,
  CircleOff,
  Folder,
  FolderOpen,
  FolderInput,
  FolderPlus,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  canDisablePersonalDirectory,
  canManageBase,
  getPersonalBasesForDirectoryTree,
  getPersonalDirectoryChildren,
  getPersonalDirectoryTreeDirectories,
  PERSONAL_DIRECTORY_ROOT_ID,
  PERSONAL_TREE_ALL_ID,
} from "@/lib/knowledge/model";
import { isPinnedId } from "@/lib/knowledge/pinned";
import {
  getKnowledgeStoreVersion,
  getStorePersonalDirectories,
  subscribeKnowledgeStore,
} from "@/lib/knowledge/store";
import type { KnowledgeBase, PersonalDirectory } from "@/lib/knowledge/types";
import { cn } from "@/lib/utils";
import {
  KnowledgeBaseTreeItem,
  KnowledgeTreeAllItem,
  TreeNodeActionButton,
} from "./KnowledgeCategoryTree";
import { KnowledgeBasePlusIcon } from "./KnowledgeBasePlusIcon";

function useKnowledgeStoreVersion() {
  const [version, setVersion] = useState(getKnowledgeStoreVersion);
  useEffect(() => subscribeKnowledgeStore(() => setVersion(getKnowledgeStoreVersion())), []);
  return version;
}

const defaultExpandedDirectoryIds = () =>
  getStorePersonalDirectories()
    .filter((item) => item.id !== PERSONAL_DIRECTORY_ROOT_ID)
    .map((item) => item.id);

export function PersonalDirectoryTree({
  selectedBaseId,
  pinnedIds = [],
  highlightedDirectoryId,
  highlightedBaseId,
  showDirectoryManageActions = false,
  onSelectBase,
  onTogglePin,
  onCreateDirectory,
  onCreateKnowledgeBase,
  onMoveDirectory,
  onRenameDirectory,
  onDeleteDirectory,
  onDisableDirectory,
  onRenameBase,
  onMoveBase,
  onDeleteBase,
  onToggleBaseStatus,
}: {
  selectedBaseId?: string;
  pinnedIds?: string[];
  highlightedDirectoryId?: string;
  highlightedBaseId?: string;
  showDirectoryManageActions?: boolean;
  onSelectBase: (baseId: string) => void;
  onTogglePin?: (baseId: string) => void;
  onCreateDirectory?: (directory: PersonalDirectory) => void;
  onCreateKnowledgeBase?: (directory: PersonalDirectory) => void;
  onMoveDirectory?: (directory: PersonalDirectory) => void;
  onRenameDirectory?: (directory: PersonalDirectory) => void;
  onDeleteDirectory?: (directory: PersonalDirectory) => void;
  onDisableDirectory?: (directory: PersonalDirectory) => void;
  onRenameBase?: (base: KnowledgeBase) => void;
  onMoveBase?: (base: KnowledgeBase) => void;
  onDeleteBase?: (base: KnowledgeBase) => void;
  onToggleBaseStatus?: (base: KnowledgeBase) => void;
}) {
  useKnowledgeStoreVersion();
  const [expanded, setExpanded] = useState<Set<string>>(() => {
    if (typeof window === "undefined") {
      return new Set(defaultExpandedDirectoryIds());
    }
    const saved = window.localStorage.getItem("knowledge-expanded-personal-directories");
    if (!saved) return new Set(defaultExpandedDirectoryIds());
    const parsed = new Set(JSON.parse(saved) as string[]);
    parsed.delete(PERSONAL_DIRECTORY_ROOT_ID);
    return parsed;
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(
        "knowledge-expanded-personal-directories",
        JSON.stringify([...expanded]),
      );
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

  const directories = getPersonalDirectoryTreeDirectories();

  return (
    <div className="space-y-0.5 px-1">
      <KnowledgeTreeAllItem
        selected={selectedBaseId === PERSONAL_TREE_ALL_ID}
        onSelect={() => onSelectBase(PERSONAL_TREE_ALL_ID)}
      />
      {directories.map((directory) => (
        <PersonalDirectoryNode
          key={directory.id}
          directory={directory}
          depth={0}
          expanded={expanded}
          selectedBaseId={selectedBaseId}
          pinnedIds={pinnedIds}
          highlightedDirectoryId={highlightedDirectoryId}
          highlightedBaseId={highlightedBaseId}
          showDirectoryManageActions={showDirectoryManageActions}
          onToggle={toggle}
          onSelectBase={onSelectBase}
          onTogglePin={onTogglePin}
          onCreateDirectory={onCreateDirectory}
          onCreateKnowledgeBase={onCreateKnowledgeBase}
          onMoveDirectory={onMoveDirectory}
          onRenameDirectory={onRenameDirectory}
          onDeleteDirectory={onDeleteDirectory}
          onDisableDirectory={onDisableDirectory}
          onRenameBase={onRenameBase}
          onMoveBase={onMoveBase}
          onDeleteBase={onDeleteBase}
          onToggleBaseStatus={onToggleBaseStatus}
        />
      ))}
    </div>
  );
}

function PersonalDirectoryNode({
  directory,
  depth,
  expanded,
  selectedBaseId,
  pinnedIds,
  highlightedDirectoryId,
  highlightedBaseId,
  showDirectoryManageActions,
  onToggle,
  onSelectBase,
  onTogglePin,
  onCreateDirectory,
  onCreateKnowledgeBase,
  onMoveDirectory,
  onRenameDirectory,
  onDeleteDirectory,
  onDisableDirectory,
  onRenameBase,
  onMoveBase,
  onDeleteBase,
  onToggleBaseStatus,
}: {
  directory: PersonalDirectory;
  depth: number;
  expanded: Set<string>;
  selectedBaseId?: string;
  pinnedIds: string[];
  highlightedDirectoryId?: string;
  highlightedBaseId?: string;
  showDirectoryManageActions: boolean;
  onToggle: (id: string) => void;
  onSelectBase: (baseId: string) => void;
  onTogglePin?: (baseId: string) => void;
  onCreateDirectory?: (directory: PersonalDirectory) => void;
  onCreateKnowledgeBase?: (directory: PersonalDirectory) => void;
  onMoveDirectory?: (directory: PersonalDirectory) => void;
  onRenameDirectory?: (directory: PersonalDirectory) => void;
  onDeleteDirectory?: (directory: PersonalDirectory) => void;
  onDisableDirectory?: (directory: PersonalDirectory) => void;
  onRenameBase?: (base: KnowledgeBase) => void;
  onMoveBase?: (base: KnowledgeBase) => void;
  onDeleteBase?: (base: KnowledgeBase) => void;
  onToggleBaseStatus?: (base: KnowledgeBase) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const open = expanded.has(directory.id);
  const children = getPersonalDirectoryChildren(directory.id);
  const bases = getPersonalBasesForDirectoryTree(directory.id);
  const FolderIcon = open ? FolderOpen : Folder;
  const hasChildren = children.length > 0 || bases.length > 0;
  const highlighted = highlightedDirectoryId === directory.id;
  const canDisableDir = canDisablePersonalDirectory(directory.id);
  const hasMoreMenu = Boolean(
    showDirectoryManageActions && (onMoveDirectory || onDeleteDirectory || onDisableDirectory),
  );
  const showActions = Boolean(
    showDirectoryManageActions &&
      (onCreateDirectory || onCreateKnowledgeBase || onRenameDirectory || hasMoreMenu),
  );
  const actionWidth =
    1 +
    (onCreateDirectory ? 1 : 0) +
    (onCreateKnowledgeBase ? 1 : 0) +
    (onRenameDirectory ? 1 : 0) +
    (hasMoreMenu ? 1 : 0);

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
          onClick={() => onToggle(directory.id)}
          className={cn(
            "flex h-8 min-w-0 flex-1 items-center gap-1.5 rounded-[8px] text-left text-[12.5px] transition-colors",
            "text-kb-muted group-hover:text-kb-body",
            highlighted && "font-medium text-accent-foreground",
            showActions && "pr-1",
          )}
          style={showActions ? { paddingRight: `${actionWidth * 1.25 + 0.5}rem` } : undefined}
        >
          <ChevronRight
            className={cn(
              "h-3.5 w-3.5 shrink-0 transition-transform",
              open && "rotate-90",
              !hasChildren && "invisible",
            )}
          />
          <FolderIcon className="h-3.5 w-3.5 shrink-0 text-warning stroke-[1.8]" />
          <span className="min-w-0 flex-1 truncate">{directory.name}</span>
        </button>
        {showActions && (
          <div
            className={cn(
              "pointer-events-none absolute right-1 top-1/2 flex -translate-y-1/2 items-center justify-end gap-0.5",
              "opacity-0 transition-opacity",
              "group-hover:pointer-events-auto group-hover:opacity-100",
              "focus-within:pointer-events-auto focus-within:opacity-100",
              menuOpen && "pointer-events-auto opacity-100",
            )}
          >
            {onRenameDirectory && (
              <TreeNodeActionButton label="重命名" onClick={() => onRenameDirectory(directory)}>
                <Pencil className="h-3 w-3 stroke-[1.8]" />
              </TreeNodeActionButton>
            )}
            {onCreateDirectory && (
              <TreeNodeActionButton
                label="新建个人目录"
                onClick={() => onCreateDirectory(directory)}
              >
                <FolderPlus className="h-3 w-3 stroke-[1.8]" />
              </TreeNodeActionButton>
            )}
            {onCreateKnowledgeBase && (
              <TreeNodeActionButton
                label="新建个人知识库"
                onClick={() => onCreateKnowledgeBase(directory)}
              >
                <KnowledgeBasePlusIcon className="h-3 w-3" />
              </TreeNodeActionButton>
            )}
            {hasMoreMenu && (
              <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
                <TooltipProvider delayDuration={200}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          aria-label="更多操作"
                          onClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                          }}
                          onMouseDown={(event) => event.stopPropagation()}
                          className={cn(
                            "grid h-5 w-5 shrink-0 place-items-center rounded-[5px] text-kb-muted transition-colors",
                            "hover:bg-kb-surface-hover hover:text-kb-body",
                            "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/30",
                            menuOpen && "bg-kb-surface-hover text-kb-body",
                          )}
                        >
                          <MoreHorizontal className="h-3.5 w-3.5 stroke-[1.8]" />
                        </button>
                      </DropdownMenuTrigger>
                    </TooltipTrigger>
                    {!menuOpen && (
                      <TooltipContent side="bottom" className="text-[12px]">
                        更多操作
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TooltipProvider>
                <DropdownMenuContent align="end" className="min-w-[9rem]">
                  {onMoveDirectory && (
                    <DropdownMenuItem
                      className="gap-2 text-[13px]"
                      onSelect={() => onMoveDirectory(directory)}
                    >
                      <FolderInput className="h-3.5 w-3.5 stroke-[1.8] text-kb-muted" />
                      移动
                    </DropdownMenuItem>
                  )}
                  {onDeleteDirectory && (
                    <DropdownMenuItem
                      className="gap-2 text-[13px] text-destructive focus:bg-destructive/10 focus:text-destructive"
                      onSelect={() => onDeleteDirectory(directory)}
                    >
                      <Trash2 className="h-3.5 w-3.5 stroke-[1.8]" />
                      删除
                    </DropdownMenuItem>
                  )}
                  {onDisableDirectory && (
                    <>
                      {(onMoveDirectory || onDeleteDirectory) && <DropdownMenuSeparator />}
                      <DropdownMenuItem
                        className="gap-2 text-[13px]"
                        disabled={!canDisableDir}
                        title={!canDisableDir ? "下属仍有知识库，无法停用" : undefined}
                        onSelect={() => {
                          if (!canDisableDir) return;
                          onDisableDirectory(directory);
                        }}
                      >
                        <CircleOff className="h-3.5 w-3.5 stroke-[1.8] text-kb-muted" />
                        停用
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        )}
      </div>
      {open && (
        <div className="space-y-0.5">
          {children.map((child) => (
            <PersonalDirectoryNode
              key={child.id}
              directory={child}
              depth={depth + 1}
              expanded={expanded}
              selectedBaseId={selectedBaseId}
              pinnedIds={pinnedIds}
              highlightedDirectoryId={highlightedDirectoryId}
              highlightedBaseId={highlightedBaseId}
              showDirectoryManageActions={showDirectoryManageActions}
              onToggle={onToggle}
              onSelectBase={onSelectBase}
              onTogglePin={onTogglePin}
              onCreateDirectory={onCreateDirectory}
              onCreateKnowledgeBase={onCreateKnowledgeBase}
              onMoveDirectory={onMoveDirectory}
              onRenameDirectory={onRenameDirectory}
              onDeleteDirectory={onDeleteDirectory}
              onDisableDirectory={onDisableDirectory}
              onRenameBase={onRenameBase}
              onMoveBase={onMoveBase}
              onDeleteBase={onDeleteBase}
              onToggleBaseStatus={onToggleBaseStatus}
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
              showPin={Boolean(onTogglePin)}
              showManageActions={canManageBase(base)}
              onSelect={() => onSelectBase(base.id)}
              onTogglePin={() => onTogglePin?.(base.id)}
              onRename={onRenameBase ? () => onRenameBase(base) : undefined}
              onMove={onMoveBase ? () => onMoveBase(base) : undefined}
              onDelete={onDeleteBase ? () => onDeleteBase(base) : undefined}
              onToggleStatus={onToggleBaseStatus ? () => onToggleBaseStatus(base) : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
}

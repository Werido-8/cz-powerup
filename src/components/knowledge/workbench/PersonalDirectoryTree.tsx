import { ChevronRight, Folder, FolderOpen, FolderInput, FolderPlus } from "lucide-react";
import { useEffect, useState } from "react";
import { PERSONAL_DIRECTORIES } from "@/lib/knowledge/data";
import {
  getPersonalBasesForDirectory,
  getPersonalDirectoryChildren,
  getPersonalDirectoryTreeDirectories,
  PERSONAL_DIRECTORY_ROOT_ID,
  PERSONAL_TREE_ALL_ID,
} from "@/lib/knowledge/model";
import { isPinnedId } from "@/lib/knowledge/pinned";
import type { PersonalDirectory } from "@/lib/knowledge/types";
import { cn } from "@/lib/utils";
import {
  KnowledgeBaseTreeItem,
  KnowledgeTreeAllItem,
  TreeNodeActionButton,
} from "./KnowledgeCategoryTree";
import { KnowledgeBasePlusIcon } from "./KnowledgeBasePlusIcon";

const defaultExpandedDirectoryIds = () =>
  PERSONAL_DIRECTORIES.filter((item) => item.id !== PERSONAL_DIRECTORY_ROOT_ID).map(
    (item) => item.id,
  );

export function PersonalDirectoryTree({
  selectedBaseId,
  pinnedIds = [],
  highlightedDirectoryId,
  highlightedBaseId,
  onSelectBase,
  onTogglePin,
  onCreateDirectory,
  onCreateKnowledgeBase,
  onMoveDirectory,
}: {
  selectedBaseId?: string;
  pinnedIds?: string[];
  highlightedDirectoryId?: string;
  highlightedBaseId?: string;
  onSelectBase: (baseId: string) => void;
  onTogglePin?: (baseId: string) => void;
  onCreateDirectory?: (directory: PersonalDirectory) => void;
  onCreateKnowledgeBase?: (directory: PersonalDirectory) => void;
  onMoveDirectory?: (directory: PersonalDirectory) => void;
}) {
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

function PersonalDirectoryNode({
  directory,
  depth,
  expanded,
  selectedBaseId,
  pinnedIds,
  highlightedDirectoryId,
  highlightedBaseId,
  onToggle,
  onSelectBase,
  onTogglePin,
  onCreateDirectory,
  onCreateKnowledgeBase,
  onMoveDirectory,
}: {
  directory: PersonalDirectory;
  depth: number;
  expanded: Set<string>;
  selectedBaseId?: string;
  pinnedIds: string[];
  highlightedDirectoryId?: string;
  highlightedBaseId?: string;
  onToggle: (id: string) => void;
  onSelectBase: (baseId: string) => void;
  onTogglePin?: (baseId: string) => void;
  onCreateDirectory?: (directory: PersonalDirectory) => void;
  onCreateKnowledgeBase?: (directory: PersonalDirectory) => void;
  onMoveDirectory?: (directory: PersonalDirectory) => void;
}) {
  const open = expanded.has(directory.id);
  const children = getPersonalDirectoryChildren(directory.id);
  const bases = getPersonalBasesForDirectory(directory.id);
  const FolderIcon = open ? FolderOpen : Folder;
  const hasChildren = children.length > 0 || bases.length > 0;
  const highlighted = highlightedDirectoryId === directory.id;
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
          onClick={() => onToggle(directory.id)}
          className={cn(
            "flex h-8 min-w-0 flex-1 items-center gap-1.5 rounded-[8px] pr-12 text-left text-[12.5px] transition-colors",
            "text-kb-muted group-hover:text-kb-body",
            highlighted && "font-medium text-accent-foreground",
          )}
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
              onMoveDirectory ? "w-[4.5rem]" : "w-11",
              "opacity-0 transition-opacity",
              "group-hover:pointer-events-auto group-hover:opacity-100",
            )}
          >
            {onMoveDirectory && (
              <TreeNodeActionButton
                label="移动目录"
                onClick={() => onMoveDirectory(directory)}
              >
                <FolderInput className="h-3 w-3 stroke-[1.8]" />
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
              showPin={Boolean(onTogglePin)}
              onSelect={() => onSelectBase(base.id)}
              onTogglePin={() => onTogglePin?.(base.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

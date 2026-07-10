import { ChevronRight, Folder, FolderOpen } from "lucide-react";
import { useEffect, useState } from "react";
import { PERSONAL_DIRECTORIES } from "@/lib/knowledge/data";
import {
  getPersonalBasesForDirectory,
  getPersonalDirectoryChildren,
  getPersonalDirectoryTreeDirectories,
  PERSONAL_DIRECTORY_ROOT_ID,
  PERSONAL_TREE_ALL_ID,
} from "@/lib/knowledge/model";
import type { PersonalDirectory } from "@/lib/knowledge/types";
import { cn } from "@/lib/utils";
import { KnowledgeBaseTreeItem, KnowledgeTreeAllItem } from "./KnowledgeCategoryTree";

const defaultExpandedDirectoryIds = () =>
  PERSONAL_DIRECTORIES.filter((item) => item.id !== PERSONAL_DIRECTORY_ROOT_ID).map(
    (item) => item.id,
  );

export function PersonalDirectoryTree({
  selectedBaseId,
  onSelectBase,
}: {
  selectedBaseId?: string;
  onSelectBase: (baseId: string) => void;
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
          onToggle={toggle}
          onSelectBase={onSelectBase}
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
  onToggle,
  onSelectBase,
}: {
  directory: PersonalDirectory;
  depth: number;
  expanded: Set<string>;
  selectedBaseId?: string;
  onToggle: (id: string) => void;
  onSelectBase: (baseId: string) => void;
}) {
  const open = expanded.has(directory.id);
  const children = getPersonalDirectoryChildren(directory.id);
  const bases = getPersonalBasesForDirectory(directory.id);
  const FolderIcon = open ? FolderOpen : Folder;
  const hasChildren = children.length > 0 || bases.length > 0;

  return (
    <div>
      <button
        type="button"
        onClick={() => onToggle(directory.id)}
        className="flex h-8 w-full items-center gap-1.5 rounded-[8px] px-2 text-left text-[12.5px] text-kb-muted transition-colors hover:bg-card hover:text-kb-body"
        style={{ paddingLeft: 8 + depth * 14 }}
      >
        <ChevronRight
          className={cn(
            "h-3.5 w-3.5 transition-transform",
            open && "rotate-90",
            !hasChildren && "invisible",
          )}
        />
        <FolderIcon className="h-3.5 w-3.5 text-warning stroke-[1.8]" />
        <span className="min-w-0 flex-1 truncate">{directory.name}</span>
      </button>
      {open && (
        <div className="space-y-0.5">
          {children.map((child) => (
            <PersonalDirectoryNode
              key={child.id}
              directory={child}
              depth={depth + 1}
              expanded={expanded}
              selectedBaseId={selectedBaseId}
              onToggle={onToggle}
              onSelectBase={onSelectBase}
            />
          ))}
          {bases.map((base) => (
            <KnowledgeBaseTreeItem
              key={base.id}
              base={base}
              depth={depth}
              selected={selectedBaseId === base.id}
              showPin={false}
              onSelect={() => onSelectBase(base.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

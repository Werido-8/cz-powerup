import { Link, useNavigate } from "@tanstack/react-router";
import { BookOpen, ChevronDown, ChevronRight, FileText, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import type { KbFile } from "@/lib/mock/knowledge-space";
import {
  getFileNavTree,
  getLibraryById,
  parseStatusLabel,
  type KbFileNavNode,
} from "@/lib/mock/knowledge-utils";

type KbFileNavProps = {
  libraryId: string;
  currentFileId: string;
  collapsed?: boolean;
};

export function KbFileNav({ libraryId, currentFileId, collapsed }: KbFileNavProps) {
  const navigate = useNavigate();
  const library = getLibraryById(libraryId);
  const [searchQ, setSearchQ] = useState("");

  const currentFile = useMemo(
    () => getFileNavTree(libraryId).flatMap((n) => n.files).find((f) => f.id === currentFileId),
    [libraryId, currentFileId],
  );

  const [expanded, setExpanded] = useState<Set<string>>(() => {
    const folderId = currentFile?.folderId;
    return new Set(folderId ? [folderId] : []);
  });

  const tree = useMemo(() => getFileNavTree(libraryId), [libraryId]);

  const filteredTree = useMemo(() => {
    const q = searchQ.trim().toLowerCase();
    if (!q) return tree;
    return tree
      .map((node) => ({
        ...node,
        files: node.files.filter((f) => f.name.toLowerCase().includes(q)),
      }))
      .filter((node) => node.files.length > 0);
  }, [tree, searchQ]);

  const toggleFolder = (folderId: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) next.delete(folderId);
      else next.add(folderId);
      return next;
    });
  };

  if (collapsed) return null;

  const coverColor = library?.coverColor ?? "var(--primary)";

  return (
    <aside className="flex w-[232px] shrink-0 flex-col border-r border-border bg-card">
      {/* 顶部色带 */}
      <div className="h-1 w-full shrink-0" style={{ backgroundColor: coverColor }} />

      {/* 库标题 */}
      <div className="border-b border-border px-3 py-3">
        <Link
          to="/knowledge/lib/$libId"
          params={{ libId: libraryId }}
          search={currentFile ? { folder: currentFile.folderId } : {}}
          className="group flex items-center gap-2"
        >
          <div
            className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-white"
            style={{ backgroundColor: coverColor }}
          >
            <BookOpen className="h-3.5 w-3.5" />
          </div>
          <span className="min-w-0 flex-1 truncate text-[13px] font-semibold text-foreground transition-colors group-hover:text-primary">
            {library?.name ?? "知识库"}
          </span>
        </Link>

        {/* 搜索框 */}
        <div className="relative mt-2.5">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/60" />
          <input
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
            placeholder="搜索本库文件…"
            className="h-8 w-full rounded-md border border-border/80 bg-background py-0 pl-8 pr-2.5 text-[12px] outline-none focus:border-primary/40"
          />
        </div>
      </div>

      {/* 目录树 */}
      <div className="flex-1 overflow-y-auto py-1.5">
        {filteredTree.map((node) => (
          <FolderSection
            key={node.folder.id}
            node={node}
            expanded={expanded.has(node.folder.id)}
            currentFileId={currentFileId}
            onToggle={() => toggleFolder(node.folder.id)}
            onSelectFile={(fileId) =>
              navigate({
                to: "/knowledge/file/$fileId",
                params: { fileId },
                search: { panel: "ai" },
              })
            }
          />
        ))}
      </div>
    </aside>
  );
}

function FolderSection({
  node,
  expanded,
  currentFileId,
  onToggle,
  onSelectFile,
}: {
  node: KbFileNavNode;
  expanded: boolean;
  currentFileId: string;
  onToggle: () => void;
  onSelectFile: (fileId: string) => void;
}) {
  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium text-foreground/80 transition-colors hover:bg-muted"
      >
        {expanded ? (
          <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
        )}
        <span className="min-w-0 flex-1 truncate">{node.folder.name}</span>
        <span className="ml-auto shrink-0 text-[10px] tabular-nums text-muted-foreground/60">
          {node.files.length}
        </span>
      </button>
      {expanded &&
        node.files.map((file) => (
          <FileNavItem
            key={file.id}
            file={file}
            active={file.id === currentFileId}
            onSelect={() => onSelectFile(file.id)}
          />
        ))}
    </div>
  );
}

function FileNavItem({
  file,
  active,
  onSelect,
}: {
  file: KbFile;
  active: boolean;
  onSelect: () => void;
}) {
  const dimmed = file.parseStatus !== "done";
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex w-full items-center gap-2 border-l-2 py-1.5 pl-6 pr-3 text-left text-[12px] transition-colors",
        active
          ? "border-primary bg-primary-soft font-medium text-accent-foreground"
          : "border-transparent text-foreground/70 hover:bg-muted hover:text-foreground",
        dimmed && !active && "opacity-50",
      )}
    >
      <FileText
        className={cn(
          "h-3.5 w-3.5 shrink-0",
          active ? "text-primary" : "text-muted-foreground/60",
        )}
      />
      <span className="min-w-0 flex-1 truncate">{file.name}</span>
      {dimmed && (
        <span className="shrink-0 text-[9px] text-muted-foreground/70">
          {parseStatusLabel(file.parseStatus)}
        </span>
      )}
    </button>
  );
}

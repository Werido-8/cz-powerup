import { Folder, FolderOpen, Plus } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { KB_VIEWER } from "@/lib/mock/knowledge-space";
import { getFileCountForFolder, getFoldersByLibrary } from "@/lib/mock/knowledge-utils";

type KbFolderListProps = {
  libraryId: string;
  selectedFolderId: string | null;
  onSelectFolder: (folderId: string | null) => void;
};

export function KbFolderList({
  libraryId,
  selectedFolderId,
  onSelectFolder,
}: KbFolderListProps) {
  const folders = getFoldersByLibrary(libraryId).filter((f) => f.name !== "未分类");

  return (
    <div className="flex w-[200px] shrink-0 flex-col border-r border-border bg-background/50">
      {/* 区块标题 */}
      <div className="border-b border-border px-3 py-2.5">
        <div className="flex items-center gap-[5px]">
          <span className="h-[1em] w-[5px] shrink-0 rounded-[1px] bg-primary leading-none" />
          <span className="text-[13px] font-bold text-foreground">库内目录</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-1.5">
        {/* 全部文件 */}
        <FolderItem
          label="全部文件"
          count={null}
          active={selectedFolderId === null}
          isAll
          onClick={() => onSelectFolder(null)}
        />
        {folders.map((folder) => {
          const count = getFileCountForFolder(folder.id);
          return (
            <FolderItem
              key={folder.id}
              label={folder.name}
              count={count}
              active={selectedFolderId === folder.id}
              onClick={() => onSelectFolder(folder.id)}
            />
          );
        })}
      </div>

      {KB_VIEWER.isAdmin && (
        <div className="border-t border-border px-2 py-2">
          <button
            type="button"
            onClick={() => toast.message("新建目录（演示占位）")}
            className="flex w-full items-center justify-center gap-1.5 rounded-md py-1.5 text-[12px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <Plus className="h-3.5 w-3.5" />
            新建目录
          </button>
        </div>
      )}
    </div>
  );
}

function FolderItem({
  label,
  count,
  active,
  isAll = false,
  onClick,
}: {
  label: string;
  count: number | null;
  active: boolean;
  isAll?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2 py-[7px] pr-3 text-left text-[12.5px] transition-colors",
        active
          ? "border-l-2 border-primary bg-primary-soft pl-[calc(0.75rem-2px)] font-semibold text-accent-foreground"
          : "pl-3 text-foreground/75 hover:bg-muted hover:text-foreground",
      )}
    >
      {active ? (
        <FolderOpen
          className={cn("h-[15px] w-[15px] shrink-0", isAll ? "text-primary/70" : "text-primary/80")}
        />
      ) : (
        <Folder
          className={cn(
            "h-[15px] w-[15px] shrink-0",
            isAll ? "text-muted-foreground/60" : "text-warning/70",
          )}
        />
      )}
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {count !== null && (
        <span
          className={cn(
            "shrink-0 text-[10px] tabular-nums",
            active ? "text-accent-foreground/60" : "text-muted-foreground/50",
          )}
        >
          {count}
        </span>
      )}
    </button>
  );
}

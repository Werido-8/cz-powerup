import {
  FileQuestion,
  Folder,
  FolderOpen,
  Home,
  Plus,
  Upload,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { KB_VIEWER, type KnowledgeBase, type KnowledgeFile } from "@/lib/mock/knowledge-space";
import {
  canUploadToKnowledgeBase,
  getDepartmentById,
  getDirectoryTree,
  getFileCountForDirectory,
  getFilesByKnowledgeBase,
  parseStatusLabel,
  publishStatusLabel,
} from "@/lib/mock/knowledge-utils";
import { cn } from "@/lib/utils";
import { FileStatusTag, parseTone, publishTone } from "./FileStatusTag";
import { FileTypeIcon } from "./FileTypeIcon";
import { KnowledgeBaseSwitcher } from "./KnowledgeBaseSwitcher";
import { VersionBadge } from "./VersionBadge";

type KnowledgeDirectoryTreeProps = {
  kbId: string;
  kbName: string;
  base?: KnowledgeBase;
  selectedDirectoryId?: string | null;
  selectedFileId?: string;
  onSelectDirectory: (directoryId: string | null) => void;
  onSelectFile: (file: KnowledgeFile) => void;
};

export function KnowledgeDirectoryTree({
  kbId,
  kbName,
  base,
  selectedDirectoryId,
  selectedFileId,
  onSelectDirectory,
  onSelectFile,
}: KnowledgeDirectoryTreeProps) {
  const tree = getDirectoryTree(kbId);
  const allCount = getFilesByKnowledgeBase(kbId).length;
  const canUpload = canUploadToKnowledgeBase(kbId);
  const [dragTarget, setDragTarget] = useState<string | null>(null);
  const department = base?.departmentId ? getDepartmentById(base.departmentId) : undefined;
  const spaceName =
    department?.name ?? (base?.spaceType === "public" ? "公共空间" : base?.spaceType === "personal" ? "我的资料" : "知识库");

  return (
    <aside className="flex w-[232px] shrink-0 flex-col border-r border-[#DCE8EA] bg-[#F7FAFB]">
      <div className="px-3 pb-3 pt-4">
        <div className="text-[11px] text-[#91A3AA]">{spaceName}</div>
        <div className="mt-1">
          {base ? (
            <KnowledgeBaseSwitcher current={base} compact />
          ) : (
            <div className="line-clamp-2 text-[14px] font-semibold leading-snug text-[#1F3440]">
              {kbName}
            </div>
          )}
        </div>
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={() => toast.message("新建目录（演示占位）")}
            className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-[10px] bg-[#349BAC] text-[13px] font-medium text-white transition-colors hover:bg-[#2F8D9D]"
          >
            <Plus className="h-3.5 w-3.5 stroke-[1.9]" />
            新建
          </button>
          <button
            type="button"
            onClick={() =>
              toast.message(canUpload ? "上传文件（演示占位）" : "申请上传权限（演示占位）")
            }
            className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-[10px] border border-[#DCE8EA] bg-white text-[13px] font-medium text-[#607681] transition-colors hover:border-[#B8D8DE] hover:text-[#1F3440]"
          >
            <Upload className="h-3.5 w-3.5 stroke-[1.9]" />
            上传
          </button>
        </div>
      </div>

      <div className="border-y border-[#EDF3F5] px-2 py-2">
        <SidebarMenuItem
          icon={Home}
          label="主页"
          active={!selectedDirectoryId && !selectedFileId}
          onClick={() => onSelectDirectory(null)}
        />
      </div>

      <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto px-2 py-2">
        <div className="mb-1 flex h-8 items-center justify-between px-2">
          <span className="text-[12px] font-semibold text-[#607681]">目录</span>
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => toast.message("新建目录（演示占位）")}
                  className="grid h-6 w-6 place-items-center rounded-[6px] text-[#91A3AA] transition-colors hover:bg-[#EDF3F5] hover:text-[#168A99]"
                  aria-label="新建目录"
                >
                  <Plus className="h-3.5 w-3.5 stroke-[1.9]" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" className="bg-[#1F3440] text-white">
                新建目录
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <TreeDirectory
          name="全部文件"
          count={allCount}
          active={!selectedDirectoryId && !selectedFileId}
          dragActive={dragTarget === "all"}
          onClick={() => onSelectDirectory(null)}
          onDragEnter={() => setDragTarget("all")}
          onDragLeave={() => setDragTarget(null)}
        />
        {tree.map((node) => (
          <div key={node.directory.id} className="mt-0.5">
            <TreeDirectory
              name={node.directory.name}
              count={getFileCountForDirectory(node.directory.id)}
              active={selectedDirectoryId === node.directory.id && !selectedFileId}
              dragActive={dragTarget === node.directory.id}
              onClick={() => onSelectDirectory(node.directory.id)}
              onDragEnter={() => setDragTarget(node.directory.id)}
              onDragLeave={() => setDragTarget(null)}
            />
            <div className="ml-3 border-l border-[#EDF3F5] py-0.5 pl-2">
              {node.files.map((file) => (
                <TreeFile
                  key={file.id}
                  file={file}
                  active={selectedFileId === file.id}
                  onClick={() => onSelectFile(file)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-[#EDF3F5] p-2 text-[11px] text-[#8EA1A8]">
        {canUpload || KB_VIEWER.role !== "employee" ? "支持拖拽上传到当前目录" : "当前账号需申请上传权限"}
      </div>
    </aside>
  );
}

function SidebarMenuItem({
  icon: Icon,
  label,
  active,
  disabled,
  onClick,
}: {
  icon: typeof Home;
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "mb-0.5 flex h-[36px] w-full items-center gap-2.5 rounded-[10px] px-2.5 text-left text-[13px] transition-colors last:mb-0",
        active
          ? "bg-[#EAF7F9] font-medium text-[#168A99]"
          : "text-[#1F3440] hover:bg-[#EDF3F5]",
        disabled && "cursor-not-allowed opacity-55 hover:bg-transparent",
      )}
    >
      <Icon
        className={cn(
          "h-4 w-4 shrink-0 stroke-[1.8]",
          active ? "text-[#168A99]" : "text-[#91A3AA]",
        )}
      />
      <span>{label}</span>
    </button>
  );
}

function TreeDirectory({
  name,
  count,
  active,
  dragActive,
  onClick,
  onDragEnter,
  onDragLeave,
}: {
  name: string;
  count: number;
  active: boolean;
  dragActive: boolean;
  onClick: () => void;
  onDragEnter: () => void;
  onDragLeave: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      className={cn(
        "flex h-[36px] w-full items-center gap-2 rounded-[10px] px-2.5 text-left text-[13px] transition-colors",
        active
          ? "bg-[#EAF7F9] font-medium text-[#168A99]"
          : "text-[#1F3440] hover:bg-[#EDF3F5]",
        dragActive && "bg-[rgba(52,155,172,0.08)] outline outline-1 outline-[#B8D8DE]",
      )}
    >
      {active ? (
        <FolderOpen className="h-4 w-4 shrink-0 text-[#C58B18] stroke-[1.8]" />
      ) : (
        <Folder className="h-4 w-4 shrink-0 text-[#C58B18] stroke-[1.8]" />
      )}
      <span className="min-w-0 flex-1 truncate">{name}</span>
      <span
        className={cn(
          "shrink-0 rounded-[6px] px-1.5 py-0.5 text-[10px] tabular-nums",
          active
            ? "bg-[rgba(52,155,172,0.12)] text-[#168A99]"
            : "bg-[#EDF3F5] text-[#607681]",
        )}
      >
        {count}
      </span>
    </button>
  );
}

function TreeFile({ file, active, onClick }: { file: KnowledgeFile; active: boolean; onClick: () => void }) {
  const showState = file.parseStatus !== "done" || file.publishStatus !== "published";

  return (
    <button
      type="button"
      onClick={onClick}
      title={file.name}
      className={cn(
        "flex min-h-[34px] w-full items-center gap-2 rounded-[8px] px-2 py-1 text-left text-[12px] transition-colors",
        active
          ? "bg-[rgba(52,155,172,0.08)] font-medium text-[#168A99]"
          : "text-[#607681] hover:bg-[#EDF3F5] hover:text-[#1F3440]",
      )}
    >
      <FileTypeIcon type={file.type} size="sm" />
      <span className="min-w-0 flex-1 truncate">{file.name}</span>
      {file.hasHistoryVersions && <VersionBadge version={file.currentVersion} muted={!active} />}
      {showState && (
        <span className="flex shrink-0 gap-1">
          {file.parseStatus !== "done" && (
            <FileStatusTag tone={parseTone(file.parseStatus)}>{parseStatusLabel(file.parseStatus)}</FileStatusTag>
          )}
          {file.publishStatus !== "published" && (
            <FileStatusTag tone={publishTone(file.publishStatus)}>
              {publishStatusLabel(file.publishStatus)}
            </FileStatusTag>
          )}
        </span>
      )}
    </button>
  );
}

export function EmptyTreeHint() {
  return (
    <div className="rounded-lg border border-dashed border-[#DCE8EA] bg-white p-3 text-center text-[12px] text-[#91A3AA]">
      <FileQuestion className="mx-auto mb-2 h-4 w-4" />
      暂无目录
    </div>
  );
}

import { Folder, Grid2X2, List, Plus, Search, ShieldCheck, Upload } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import type {
  KnowledgeFile,
  KnowledgeSortBy,
  KnowledgeViewMode,
} from "@/lib/mock/knowledge-space";
import { getDirectoriesByKnowledgeBase } from "@/lib/mock/knowledge-utils";
import { cn } from "@/lib/utils";
import { DragUploadOverlay } from "./DragUploadOverlay";
import { FileStatusTag } from "./FileStatusTag";
import { KnowledgeFileCard } from "./KnowledgeFileCard";
import { KnowledgeFileRow } from "./KnowledgeFileRow";

type KnowledgeFileListProps = {
  kbId: string;
  selectedDirectoryId: string | null;
  directoryTitle: string;
  files: KnowledgeFile[];
  viewMode: KnowledgeViewMode;
  sortBy: KnowledgeSortBy;
  query: string;
  onDirectoryChange: (directoryId: string | null) => void;
  onViewModeChange: (mode: KnowledgeViewMode) => void;
  onSortChange: (sortBy: KnowledgeSortBy) => void;
  onQueryChange: (query: string) => void;
  onFileClick: (file: KnowledgeFile) => void;
  canManage?: boolean;
};

export function KnowledgeFileList(props: KnowledgeFileListProps) {
  return <KnowledgeFolderFileList {...props} />;
}

export function KnowledgeFolderFileList({
  kbId,
  selectedDirectoryId,
  directoryTitle,
  files,
  viewMode,
  sortBy,
  query,
  onDirectoryChange,
  onViewModeChange,
  onSortChange,
  onQueryChange,
  onFileClick,
  canManage,
}: KnowledgeFileListProps) {
  const [dragging, setDragging] = useState(false);
  const directories = useMemo(
    () => (selectedDirectoryId ? [] : getDirectoriesByKnowledgeBase(kbId)),
    [kbId, selectedDirectoryId],
  );

  return (
    <section
      className="relative flex min-w-0 flex-1 flex-col overflow-hidden bg-white"
      onDragEnter={() => setDragging(true)}
      onDragOver={(event) => event.preventDefault()}
      onDragLeave={(event) => {
        if (event.currentTarget === event.target) setDragging(false);
      }}
      onDrop={(event) => {
        event.preventDefault();
        setDragging(false);
      }}
    >
      <div className="shrink-0 border-b border-[#EDF3F5] bg-white px-8 py-5">
        <div className="mx-auto flex w-full max-w-[980px] items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="text-[22px] font-semibold text-[#1F3440]">{directoryTitle}</div>
            <div className="mt-1 text-[12px] text-[#8EA1A8]">
              {directories.length} 个目录 · {files.length} 个文件
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => toast.message("新建目录（演示占位）")}
              className="inline-flex h-9 items-center gap-1.5 rounded-full border border-[#E2ECEF] bg-white px-3.5 text-[12px] font-medium text-[#1F3440] shadow-[0_8px_18px_-16px_rgba(31,52,64,0.5)] transition-all hover:border-[#CFE0E4] hover:bg-[#FBFDFD]"
            >
              <Plus className="h-3.5 w-3.5 stroke-[1.9]" />
              新建
            </button>
            <button
              type="button"
              onClick={() => toast.message("上传文件（演示占位）")}
              className="inline-flex h-9 items-center gap-1.5 rounded-full border border-[#E2ECEF] bg-white px-3.5 text-[12px] font-medium text-[#1F3440] shadow-[0_8px_18px_-16px_rgba(31,52,64,0.5)] transition-all hover:border-[#CFE0E4] hover:bg-[#FBFDFD]"
            >
              <Upload className="h-3.5 w-3.5 stroke-[1.9]" />
              上传
            </button>
            <button
              type="button"
              onClick={() =>
                toast.message(canManage ? "权限管理（演示占位）" : "申请权限（演示占位）")
              }
              className="inline-flex h-9 items-center gap-1.5 rounded-full border border-[#E2ECEF] bg-white px-3.5 text-[12px] font-medium text-[#1F3440] shadow-[0_8px_18px_-16px_rgba(31,52,64,0.5)] transition-all hover:border-[#CFE0E4] hover:bg-[#FBFDFD]"
            >
              <ShieldCheck className="h-3.5 w-3.5 text-[#349BAC] stroke-[1.9]" />
              {canManage ? "权限管理" : "申请权限"}
            </button>
          </div>
        </div>
      </div>

      <div className="scrollbar-thin min-h-0 flex-1 overflow-auto px-8 py-5">
        <div className="mx-auto w-full max-w-[980px]">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div className="flex overflow-hidden rounded-full border border-[#E2ECEF] bg-[#F7FAFB] p-0.5">
              <ModeButton
                active={viewMode === "list"}
                onClick={() => onViewModeChange("list")}
                icon={List}
                label="列表视图"
              />
              <ModeButton
                active={viewMode === "grid"}
                onClick={() => onViewModeChange("grid")}
                icon={Grid2X2}
                label="卡片视图"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="flex h-9 w-[232px] items-center gap-2 rounded-full border border-[#E2ECEF] bg-[#F7FAFB] px-3 text-[12px] transition-colors focus-within:border-[#B8D8DE] focus-within:bg-white">
                <Search className="h-3.5 w-3.5 text-[#8EA1A8]" />
                <input
                  value={query}
                  onChange={(event) => onQueryChange(event.target.value)}
                  placeholder="搜索本库文件"
                  className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-[#91A3AA]"
                />
              </label>
              <select
                value={sortBy}
                onChange={(event) => onSortChange(event.target.value as KnowledgeSortBy)}
                className="h-9 rounded-full border border-[#E2ECEF] bg-white px-3 text-[12px] text-[#1F3440] outline-none transition-colors focus:border-[#B8D8DE]"
              >
                <option value="updated">最近更新</option>
                <option value="name">文件名称</option>
                <option value="uploaded">上传时间</option>
              </select>
            </div>
          </div>

          {directories.length === 0 && files.length === 0 ? (
            <EmptyUploadArea />
          ) : viewMode === "list" ? (
            <KnowledgeFileTable
              directories={directories}
              files={files}
              onDirectoryClick={onDirectoryChange}
              onFileClick={onFileClick}
            />
          ) : (
            <KnowledgeFileGrid
              directories={directories}
              files={files}
              onDirectoryClick={onDirectoryChange}
              onFileClick={onFileClick}
            />
          )}
        </div>
      </div>

      <DragUploadOverlay active={dragging} />
    </section>
  );
}

export function KnowledgeFileTable({
  directories,
  files,
  onDirectoryClick,
  onFileClick,
}: {
  directories: ReturnType<typeof getDirectoriesByKnowledgeBase>;
  files: KnowledgeFile[];
  onDirectoryClick: (directoryId: string | null) => void;
  onFileClick: (file: KnowledgeFile) => void;
}) {
  return (
    <div className="overflow-hidden rounded-[12px] border border-[#E6F0F2] bg-white shadow-[0_12px_28px_-24px_rgba(31,52,64,0.4)]">
      <div className="grid h-10 grid-cols-[minmax(280px,1fr)_150px] items-center border-b border-[#EDF3F5] bg-[#FBFDFD] px-4 text-[12px] text-[#8EA1A8]">
        <span>名称</span>
        <span className="text-right">更新时间</span>
      </div>
      {directories.map((directory) => (
        <button
          key={directory.id}
          type="button"
          onClick={() => onDirectoryClick(directory.id)}
          className="grid min-h-[54px] w-full grid-cols-[minmax(280px,1fr)_150px] items-center border-b border-[#EDF3F5] px-4 text-left transition-colors hover:bg-[#F8FCFC]"
        >
          <span className="flex min-w-0 items-center gap-2.5">
            <Folder className="h-[18px] w-[18px] shrink-0 text-[#C58B18] stroke-[1.8]" />
            <span className="truncate text-[13px] font-medium text-[#1F3440]">{directory.name}</span>
            <FileStatusTag>{directory.sortOrder} 级目录</FileStatusTag>
          </span>
          <span className="text-right text-[12px] text-[#8EA1A8]">3天前</span>
        </button>
      ))}
      {files.map((file) => (
        <KnowledgeFileRow key={file.id} file={file} onClick={onFileClick} />
      ))}
    </div>
  );
}

export function KnowledgeFileGrid({
  directories,
  files,
  onDirectoryClick,
  onFileClick,
}: {
  directories: ReturnType<typeof getDirectoriesByKnowledgeBase>;
  files: KnowledgeFile[];
  onDirectoryClick: (directoryId: string | null) => void;
  onFileClick: (file: KnowledgeFile) => void;
}) {
  return (
    <div className="grid auto-rows-min grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {directories.map((directory) => (
        <button
          key={directory.id}
          type="button"
          onClick={() => onDirectoryClick(directory.id)}
          className="group relative flex min-h-[150px] flex-col rounded-[12px] border border-transparent bg-[#F6FAFB] px-4 pb-4 pt-5 text-left transition-all duration-200 before:absolute before:-top-[1px] before:left-0 before:h-[18px] before:w-[70px] before:rounded-t-[12px] before:bg-[#F6FAFB] before:content-[''] after:absolute after:left-[52px] after:top-0 after:h-[18px] after:w-9 after:skew-x-[30deg] after:rounded-tr-[10px] after:bg-[#F6FAFB] after:content-[''] hover:-translate-y-0.5 hover:border-[#D8E7EA] hover:bg-white hover:shadow-[0_14px_30px_-24px_rgba(31,52,64,0.55)] hover:before:bg-white hover:after:bg-white"
        >
          <div className="relative z-10 flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-[9px] bg-white text-[#C58B18] shadow-[0_8px_18px_-16px_rgba(31,52,64,0.5)] ring-1 ring-[#EDF3F5]">
              <Folder className="h-5 w-5 stroke-[1.8]" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-[14px] font-semibold text-[#1F3440]">
                {directory.name}
              </span>
              <span className="mt-0.5 block text-[11px] text-[#8EA1A8]">
                {directory.sortOrder} 级目录
              </span>
            </span>
          </div>
          <div className="relative z-10 mt-auto flex items-center justify-between pt-8 text-[12px]">
            <span className="text-[#607681]">进入目录查看文件</span>
            <span className="rounded-full bg-white px-2 py-1 text-[11px] text-[#8EA1A8] ring-1 ring-[#E2ECEF]">
              文件夹
            </span>
          </div>
        </button>
      ))}
      {files.map((file) => (
        <KnowledgeFileCard key={file.id} file={file} onClick={onFileClick} />
      ))}
    </div>
  );
}

function EmptyUploadArea() {
  return (
    <div className="flex min-h-[360px] items-center justify-center rounded-[14px] border border-dashed border-[#DCE8EA] bg-[#F7FAFB] p-6">
      <div className="text-center">
        <Upload className="mx-auto h-8 w-8 text-[#8EA1A8] stroke-[1.8]" />
        <div className="mt-3 text-[14px] font-semibold text-[#1F3440]">当前目录暂无内容</div>
        <div className="mt-1 text-[12px] text-[#607681]">拖拽文件到此处或点击上传按钮添加资料</div>
      </div>
    </div>
  );
}

function ModeButton({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof List;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className={cn(
        "grid h-8 w-8 place-items-center rounded-full",
        active ? "bg-white text-[#349BAC] shadow-[0_6px_14px_-12px_rgba(31,52,64,0.5)]" : "text-[#607681] hover:bg-white/80",
      )}
    >
      <Icon className="h-3.5 w-3.5 stroke-[1.9]" />
    </button>
  );
}

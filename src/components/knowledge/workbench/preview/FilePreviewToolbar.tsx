import { ArrowLeft, Download, Library, Star } from "lucide-react";
import { toast } from "sonner";
import { KbFileTypeIcon, KbIconButton, KbVersionSelect } from "@/components/knowledge/ui";
import type { KnowledgeBase, KnowledgeFile, KnowledgeFileVersion } from "@/lib/knowledge/types";

export function FilePreviewToolbar({
  currentBase,
  currentFile,
  versions,
  currentVersionId,
  onBack,
  onVersionChange,
}: {
  currentBase: KnowledgeBase;
  currentFile: KnowledgeFile;
  versions: KnowledgeFileVersion[];
  currentVersionId?: string;
  onBack: () => void;
  onVersionChange: (versionId: string) => void;
}) {
  return (
    <header className="flex h-[68px] shrink-0 items-center gap-2 border-b border-[#E0E9EB] bg-card px-4 lg:px-5">
      <button
        type="button"
        onClick={onBack}
        aria-label="返回文件列表"
        title="返回文件列表"
        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px] text-kb-muted transition-colors hover:bg-primary-soft hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35"
      >
        <ArrowLeft className="h-4 w-4 stroke-[1.8]" />
      </button>
      <div className="h-7 w-px bg-[#E1EAEC]" />
      <span className="inline-flex max-w-[240px] items-center gap-2 text-[13px] font-semibold text-kb-heading">
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-[8px] bg-primary text-primary-foreground">
          <Library className="h-4 w-4 stroke-[1.8]" />
        </span>
        <span className="min-w-0 truncate">{currentBase.name}</span>
      </span>
      <span className="mx-1 text-kb-muted">/</span>
      <div className="flex min-w-0 flex-1 items-center gap-2.5">
        <KbFileTypeIcon type={currentFile.type} fileName={currentFile.name} size="xs" />
        <h1 className="min-w-0 flex-1 truncate text-[14px] font-semibold text-kb-heading">
          {currentFile.name}
        </h1>
      </div>
      <KbVersionSelect
        versions={versions}
        value={currentVersionId}
        onChange={onVersionChange}
      />
      <KbIconButton icon={Download} label="下载" onClick={() => toast.message("开始下载文件")} />
      <KbIconButton
        icon={Star}
        label={currentFile.favorite ? "已收藏" : "收藏"}
        active={currentFile.favorite}
        onClick={() => toast.success("收藏状态已更新")}
      />
    </header>
  );
}

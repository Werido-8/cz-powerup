import {
  ArrowLeft,
  Download,
  History,
  Library,
  MoreHorizontal,
  Pencil,
  Star,
} from "lucide-react";
import { toast } from "sonner";
import {
  KbIconButton,
  KbStatusTag,
  KbVersionSelect,
} from "@/components/knowledge/ui";
import {
  parseStatusLabel,
  parseStatusTone,
  publishStatusLabel,
  publishStatusTone,
} from "@/lib/knowledge/status";
import { kbFileTypeConfig } from "@/lib/knowledge/tokens";
import type { KnowledgeBase, KnowledgeFile, KnowledgeFileVersion } from "@/lib/knowledge/types";

export function FilePreviewToolbar({
  currentBase,
  currentFile,
  versions,
  currentVersionId,
  onBack,
  onVersionChange,
  onOpenVersionHistory,
  canEdit,
}: {
  currentBase: KnowledgeBase;
  currentFile: KnowledgeFile;
  versions: KnowledgeFileVersion[];
  currentVersionId?: string;
  onBack: () => void;
  onVersionChange: (versionId: string) => void;
  onOpenVersionHistory?: () => void;
  canEdit: boolean;
}) {
  const typeConfig = kbFileTypeConfig[currentFile.type ?? "other"];

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b border-kb-border bg-card px-3">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex h-9 items-center gap-1.5 rounded-[8px] px-2.5 text-[12.5px] font-medium text-kb-muted transition-colors hover:bg-kb-surface-hover hover:text-kb-heading"
      >
        <ArrowLeft className="h-4 w-4 stroke-[1.8]" />
        返回
      </button>
      <div className="h-5 w-px bg-divider" />
      <span className="inline-flex max-w-[220px] items-center gap-2 text-[12.5px] font-medium text-kb-heading">
        <Library className="h-4 w-4 shrink-0 text-primary stroke-[1.8]" />
        <span className="min-w-0 truncate">{currentBase.name}</span>
      </span>
      <span className="text-kb-muted">/</span>
      <h1 className="min-w-0 flex-1 truncate text-[14px] font-semibold text-kb-heading">
        {currentFile.name}
      </h1>
      <KbStatusTag tone={publishStatusTone(currentFile.status)}>
        {publishStatusLabel(currentFile.status)}
      </KbStatusTag>
      <KbStatusTag tone="accent">{typeConfig.label}</KbStatusTag>
      <KbVersionSelect
        versions={versions}
        value={currentVersionId}
        onChange={onVersionChange}
      />
      {versions.length > 1 && onOpenVersionHistory && (
        <button
          type="button"
          onClick={onOpenVersionHistory}
          className="inline-flex h-9 items-center gap-1 rounded-[8px] px-2.5 text-[12px] font-medium text-kb-muted transition-colors hover:bg-kb-surface-hover hover:text-primary"
        >
          <History className="h-3.5 w-3.5 stroke-[1.8]" />
          版本历史
        </button>
      )}
      <KbIconButton icon={Download} label="下载" onClick={() => toast.message("开始下载文件")} />
      <KbIconButton
        icon={Star}
        label={currentFile.favorite ? "已收藏" : "收藏"}
        active={currentFile.favorite}
        onClick={() => toast.success("收藏状态已更新")}
      />
      {canEdit && (
        <KbIconButton
          icon={Pencil}
          label="编辑元数据"
          onClick={() => toast.message("打开元数据编辑面板")}
        />
      )}
      <KbIconButton icon={MoreHorizontal} label="更多" onClick={() => toast.message("更多操作")} />
    </header>
  );
}

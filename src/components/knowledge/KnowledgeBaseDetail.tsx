import type {
  KnowledgeBase,
  KnowledgeFile,
  KnowledgeSortBy,
  KnowledgeVersion,
  KnowledgeViewMode,
} from "@/lib/mock/knowledge-space";
import { canManageKnowledgeBase, getDirectoryById } from "@/lib/mock/knowledge-utils";
import { KnowledgeAIPanel } from "./KnowledgeAIPanel";
import { KnowledgeBaseDetailLayout } from "./KnowledgeBaseDetailLayout";
import { KnowledgeDirectoryTree } from "./KnowledgeDirectoryTree";
import { KnowledgeFileList } from "./KnowledgeFileList";
import { KnowledgeFilePreview } from "./KnowledgeFilePreview";

type KnowledgeBaseDetailProps = {
  base: KnowledgeBase;
  files: KnowledgeFile[];
  selectedDirectoryId: string | null;
  selectedFile?: KnowledgeFile;
  versions?: KnowledgeVersion[];
  currentVersionId?: string;
  viewMode: KnowledgeViewMode;
  sortBy: KnowledgeSortBy;
  query: string;
  onDirectoryChange: (directoryId: string | null) => void;
  onFileClick: (file: KnowledgeFile) => void;
  onViewModeChange: (mode: KnowledgeViewMode) => void;
  onSortChange: (sortBy: KnowledgeSortBy) => void;
  onQueryChange: (query: string) => void;
  onVersionChange?: (versionId: string) => void;
};

export function KnowledgeBaseDetail({
  base,
  files,
  selectedDirectoryId,
  selectedFile,
  versions = [],
  currentVersionId,
  viewMode,
  sortBy,
  query,
  onDirectoryChange,
  onFileClick,
  onViewModeChange,
  onSortChange,
  onQueryChange,
  onVersionChange,
}: KnowledgeBaseDetailProps) {
  const canManage = canManageKnowledgeBase(base);
  const directoryTitle = selectedDirectoryId
    ? (getDirectoryById(selectedDirectoryId)?.name ?? "当前目录")
    : base.name;

  const sidebar = (
    <KnowledgeDirectoryTree
      kbId={base.id}
      kbName={base.name}
      base={base}
      selectedDirectoryId={selectedDirectoryId}
      selectedFileId={selectedFile?.id}
      onSelectDirectory={onDirectoryChange}
      onSelectFile={onFileClick}
    />
  );

  if (selectedFile) {
    return (
      <KnowledgeBaseDetailLayout
        sidebar={sidebar}
        aiPanel={
          <KnowledgeAIPanel
            base={base}
            file={selectedFile}
            enabled={selectedFile.parseStatus === "done"}
          />
        }
      >
        <KnowledgeFilePreview
          kbId={base.id}
          file={selectedFile}
          versions={versions}
          currentVersionId={currentVersionId}
          onVersionChange={(versionId) => onVersionChange?.(versionId)}
          canManage={canManage}
        />
      </KnowledgeBaseDetailLayout>
    );
  }

  return (
    <KnowledgeBaseDetailLayout sidebar={sidebar}>
      <KnowledgeFileList
        kbId={base.id}
        selectedDirectoryId={selectedDirectoryId}
        directoryTitle={directoryTitle}
        files={files}
        viewMode={viewMode}
        sortBy={sortBy}
        query={query}
        onDirectoryChange={onDirectoryChange}
        onViewModeChange={onViewModeChange}
        onSortChange={onSortChange}
        onQueryChange={onQueryChange}
        onFileClick={onFileClick}
        canManage={canManage}
      />
    </KnowledgeBaseDetailLayout>
  );
}

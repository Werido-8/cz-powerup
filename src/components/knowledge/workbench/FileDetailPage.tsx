import { useNavigate, useRouter } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { KbButton, KbEmptyState } from "@/components/knowledge/ui";
import {
  getBaseById,
  getFileById,
  getFilesForBase,
  getFilesForPersonalTree,
  getFilesForProfessionalTree,
} from "@/lib/knowledge/model";
import { kbMainPanel } from "@/lib/knowledge/tokens";
import type { FileSearchMode, KnowledgeFile, KnowledgeFileVersion } from "@/lib/knowledge/types";
import type { FileDetailSearchScope } from "@/lib/knowledge/searchNav";
import { resolveFileDetailReturnHref } from "@/lib/knowledge/searchNav";
import { cn } from "@/lib/utils";
import { FileAIAssistantPanel } from "./preview/FileAIAssistantPanel";
import { FilePreviewCanvas } from "./preview/FilePreviewCanvas";
import { FilePreviewToolbar } from "./preview/FilePreviewToolbar";
import { FileTreeSidebar } from "./preview/FileTreeSidebar";

export function FileDetailPage({
  fileId,
  initialKnowledgeBaseId,
  versionId,
  searchQuery,
  searchMode,
  searchResultIds,
  searchScope,
  returnFrom,
}: {
  fileId: string;
  initialKnowledgeBaseId?: string;
  versionId?: string;
  searchQuery?: string;
  searchMode?: FileSearchMode;
  searchResultIds?: string[];
  searchScope?: FileDetailSearchScope;
  returnFrom?: string;
}) {
  const navigate = useNavigate({ from: "/knowledge/file/$fileId" });
  const router = useRouter();
  const routeFile = getFileById(fileId);
  const routeBase = initialKnowledgeBaseId ? getBaseById(initialKnowledgeBaseId) : undefined;
  const fileBase = routeFile ? getBaseById(routeFile.knowledgeBaseId) : undefined;
  const currentBase = routeBase ?? fileBase;
  const baseFiles = currentBase ? getFilesForBase(currentBase.id) : [];
  const currentFile = baseFiles.find((file) => file.id === fileId) ?? baseFiles[0] ?? routeFile;
  const versions = currentFile?.versions ?? buildDefaultVersion(currentFile);
  const currentVersion =
    versions.find((version) => version.id === versionId) ??
    versions.find((version) => version.isCurrent) ??
    versions[0];
  const historyVersion = currentVersion ? !currentVersion.isCurrent : false;

  // ─── List context (search / metadata filter / sorted list from origin page) ─
  const trimmedQuery = searchQuery?.trim() ?? "";

  const listContextFiles = useMemo<KnowledgeFile[]>(() => {
    if (!searchResultIds?.length) return [];
    return searchResultIds.map((id) => getFileById(id)).filter((f): f is KnowledgeFile => f != null);
  }, [searchResultIds]);

  const fullFileList = useMemo<KnowledgeFile[]>(() => {
    if (searchScope === "personal-all") return getFilesForPersonalTree();
    if (searchScope === "professional-all") return getFilesForProfessionalTree();
    return baseFiles;
  }, [searchScope, baseFiles]);

  const hasActiveSearch = Boolean(trimmedQuery);
  const hasFilteredList =
    listContextFiles.length > 0 && !isSameFileSet(listContextFiles, fullFileList);
  const hasListContext = hasActiveSearch || hasFilteredList;

  // The file list shown in the sidebar mirrors the list page the user came from.
  const sidebarFiles = hasListContext ? listContextFiles : fullFileList;

  const exitResultsLabel =
    searchScope === "personal-all"
      ? "返回全部文件列表"
      : searchScope === "professional-all"
        ? "返回全部文件列表"
        : "回到库内";

  const handleExitResults = () => {
    navigate({
      search: (prev) => ({
        kbId: (prev as Record<string, string>).kbId,
        scope: searchScope,
      }),
    });
  };

  const sidebarTitle = hasListContext
    ? trimmedQuery
      ? "检索结果"
      : "筛选结果"
    : searchScope
      ? "全部文件列表"
      : "当前库文件";

  const sidebarSubtitle =
    hasListContext && trimmedQuery ? `搜索内容："${trimmedQuery}"` : undefined;

  // ─── Controlled preview page ─────────────────────────────────────────────
  const [previewPage, setPreviewPage] = useState(1);
  useEffect(() => {
    setPreviewPage(1);
  }, [currentFile?.id]);

  // Whether to show the "搜索命中" tab in the AI panel (full-text hits only)
  const showHitTabs = hasListContext && Boolean(trimmedQuery) && searchMode !== "filename";

  // ─── Navigation helpers ───────────────────────────────────────────────────
  const handleGoBack = () => {
    const href = resolveFileDetailReturnHref({
      from: returnFrom,
      searchScope,
      base: currentBase,
    });
    // 按打开时记录的上层页跳转，不用浏览器历史后退，也不关闭当前标签
    router.history.push(href);
  };

  const handleSelectFile = (file: KnowledgeFile) => {
    navigate({
      to: "/knowledge/file/$fileId",
      params: { fileId: file.id },
      search: (prev) => ({ ...prev, kbId: file.knowledgeBaseId }),
    });
  };

  // ─── Recent file tracking ─────────────────────────────────────────────────
  useEffect(() => {
    if (!currentFile || typeof window === "undefined") return;
    const raw = window.localStorage.getItem("knowledge-recent-file-ids");
    const previous = raw ? (JSON.parse(raw) as string[]) : [];
    window.localStorage.setItem(
      "knowledge-recent-file-ids",
      JSON.stringify(
        [currentFile.id, ...previous.filter((id) => id !== currentFile.id)].slice(0, 8),
      ),
    );
    if (currentBase) {
      const baseRaw = window.localStorage.getItem("knowledge-recent-base-ids");
      const basePrev = baseRaw ? (JSON.parse(baseRaw) as string[]) : [];
      window.localStorage.setItem(
        "knowledge-recent-base-ids",
        JSON.stringify(
          [currentBase.id, ...basePrev.filter((id) => id !== currentBase.id)].slice(0, 6),
        ),
      );
    }
  }, [currentFile, currentBase]);

  if (!currentBase || !currentFile) {
    return (
      <main className={cn(kbMainPanel, "items-center justify-center p-6")}>
        <KbEmptyState
          title="文件不存在或暂不可访问"
          description="请从知识总览、全库资料或我的空间重新选择文件。"
          action={<KbButton onClick={handleGoBack}>返回</KbButton>}
        />
      </main>
    );
  }

  return (
    <main className={cn(kbMainPanel, "overflow-hidden bg-[#F5F8FA]")}>
      <FilePreviewToolbar
        currentBase={currentBase}
        currentFile={currentFile}
        versions={versions}
        currentVersionId={currentVersion?.id}
        onBack={handleGoBack}
        onVersionChange={(vid) =>
          navigate({ search: (prev) => ({ ...prev, version: vid }) })
        }
      />

      <div className="flex min-h-0 flex-1 overflow-hidden bg-[#F5F8FA]">
        <FileTreeSidebar
          files={sidebarFiles}
          currentFileId={currentFile.id}
          title={sidebarTitle}
          subtitle={sidebarSubtitle}
          hitQuery={showHitTabs ? trimmedQuery : undefined}
          onExitResults={hasListContext ? handleExitResults : undefined}
          exitResultsLabel={hasListContext ? exitResultsLabel : undefined}
          onSelect={handleSelectFile}
        />
        <FilePreviewCanvas
          file={currentFile}
          version={currentVersion}
          historyVersion={historyVersion}
          page={previewPage}
          onPageChange={setPreviewPage}
        />
        <FileAIAssistantPanel
          file={currentFile}
          base={currentBase}
          showHitTabs={showHitTabs}
          searchQuery={trimmedQuery}
          onJumpToPage={setPreviewPage}
        />
      </div>
    </main>
  );
}

function isSameFileSet(a: KnowledgeFile[], b: KnowledgeFile[]): boolean {
  if (a.length !== b.length) return false;
  const bIds = new Set(b.map((file) => file.id));
  return a.every((file) => bIds.has(file.id));
}

function buildDefaultVersion(file?: KnowledgeFile): KnowledgeFileVersion[] {
  if (!file) return [];
  return [
    {
      id: `${file.id}-current`,
      version: file.version ?? "v1",
      name: "当前版",
      uploadedAt: file.updatedAt ?? file.createdAt ?? "",
      uploaderName: file.uploaderName ?? "-",
      isCurrent: true,
    },
  ];
}

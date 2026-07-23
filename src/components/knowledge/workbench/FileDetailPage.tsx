import { useNavigate, useRouter } from "@tanstack/react-router";
import { useEffect } from "react";
import { KbButton, KbEmptyState } from "@/components/knowledge/ui";
import {
  getBaseById,
  getFileById,
  getFilesForBase,
} from "@/lib/knowledge/model";
import { kbMainPanel } from "@/lib/knowledge/tokens";
import type { KnowledgeFile, KnowledgeFileVersion } from "@/lib/knowledge/types";
import { cn } from "@/lib/utils";
import { FileAIAssistantPanel } from "./preview/FileAIAssistantPanel";
import { FilePreviewCanvas } from "./preview/FilePreviewCanvas";
import { FilePreviewToolbar } from "./preview/FilePreviewToolbar";
import { FileTreeSidebar } from "./preview/FileTreeSidebar";

export function FileDetailPage({
  fileId,
  initialKnowledgeBaseId,
  versionId,
}: {
  fileId: string;
  initialKnowledgeBaseId?: string;
  versionId?: string;
}) {
  const navigate = useNavigate({ from: "/knowledge/file/$fileId" });
  const router = useRouter();
  const routeFile = getFileById(fileId);
  const routeBase = initialKnowledgeBaseId ? getBaseById(initialKnowledgeBaseId) : undefined;
  const fileBase = routeFile ? getBaseById(routeFile.knowledgeBaseId) : undefined;
  const currentBase = routeBase ?? fileBase;
  const files = currentBase ? getFilesForBase(currentBase.id) : [];
  const currentFile = files.find((file) => file.id === fileId) ?? files[0] ?? routeFile;
  const versions = currentFile?.versions ?? buildDefaultVersion(currentFile);
  const currentVersion =
    versions.find((version) => version.id === versionId) ??
    versions.find((version) => version.isCurrent) ??
    versions[0];
  const historyVersion = currentVersion ? !currentVersion.isCurrent : false;

  const handleGoBack = () => {
    if (window.history.length > 1) {
      router.history.back();
      return;
    }
    navigate({ to: "/knowledge" });
  };

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
          files={files}
          currentFileId={currentFile.id}
          onSelect={(file) =>
            navigate({
              to: "/knowledge/file/$fileId",
              params: { fileId: file.id },
              search: { kbId: currentBase.id },
            })
          }
        />
        <FilePreviewCanvas
          file={currentFile}
          version={currentVersion}
          historyVersion={historyVersion}
        />
        <FileAIAssistantPanel file={currentFile} base={currentBase} />
      </div>
    </main>
  );
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

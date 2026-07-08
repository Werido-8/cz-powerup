import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo } from "react";
import { toast } from "sonner";
import { KbButton, KbEmptyState } from "@/components/knowledge/ui";
import type { KbBaseSwitcherGroup } from "@/components/knowledge/ui";
import {
  canManageBase,
  getBaseById,
  getFileById,
  getFilesForBase,
  getFirstReadableFileInBase,
  getReadableBases,
} from "@/lib/knowledge/model";
import type { KnowledgeFile, KnowledgeFileVersion } from "@/lib/knowledge/types";
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
  const readableBases = getReadableBases().filter(
    (base) => base.scope !== "personal" || base.id === currentBase?.id,
  );

  const baseGroups = useMemo((): KbBaseSwitcherGroup[] => {
    const recentIds =
      typeof window !== "undefined"
        ? (JSON.parse(window.localStorage.getItem("knowledge-recent-base-ids") ?? "[]") as string[])
        : [];
    const recent = recentIds
      .map((id) => readableBases.find((b) => b.id === id))
      .filter(Boolean) as typeof readableBases;
    const deptBases = readableBases.filter((b) => b.scope === "department");
    const publicBases = readableBases.filter((b) => b.scope === "public");
    const groups: KbBaseSwitcherGroup[] = [];
    if (recent.length) groups.push({ label: "最近访问", bases: recent });
    if (deptBases.length) groups.push({ label: "运行部", bases: deptBases.slice(0, 4) });
    if (publicBases.length) groups.push({ label: "公共制度", bases: publicBases });
    if (!groups.length) groups.push({ label: "知识库", bases: readableBases });
    return groups;
  }, [readableBases]);

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

  const relatedQuestions = useMemo(
    () => [
      "这份文件的关键执行要求是什么？",
      "有哪些需要运行人员重点关注的风险？",
      "历史版本和当前版本有什么差异？",
    ],
    [],
  );

  if (!currentBase || !currentFile) {
    return (
      <main className="flex min-w-0 flex-1 items-center justify-center bg-kb-surface p-6">
        <KbEmptyState
          title="文件不存在或暂不可访问"
          description="请从知识总览、全库资料或我的空间重新选择文件。"
          action={
            <Link to="/knowledge">
              <KbButton>返回知识总览</KbButton>
            </Link>
          }
        />
      </main>
    );
  }

  const switchBase = (baseId: string) => {
    const nextFile = getFirstReadableFileInBase(baseId);
    if (!nextFile) {
      toast.message("该知识库暂无可打开文件");
      return;
    }
    navigate({
      to: "/knowledge/file/$fileId",
      params: { fileId: nextFile.id },
      search: { kbId: baseId },
    });
  };

  return (
    <main className="flex min-w-0 flex-1 flex-col overflow-hidden bg-kb-surface">
      <FilePreviewToolbar
        currentBase={currentBase}
        currentFile={currentFile}
        versions={versions}
        currentVersionId={currentVersion?.id}
        baseGroups={baseGroups}
        onBaseChange={switchBase}
        onVersionChange={(vid) =>
          navigate({ search: (prev) => ({ ...prev, version: vid }) })
        }
        canEdit={canManageBase(currentBase)}
      />

      <div className="flex min-h-0 flex-1 overflow-hidden">
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
        <FileAIAssistantPanel
          file={currentFile}
          base={currentBase}
          questions={relatedQuestions}
        />
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

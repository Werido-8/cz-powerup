import { createFileRoute, notFound, useNavigate } from "@tanstack/react-router";
import { useMemo } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { KnowledgeBaseDetail } from "@/components/knowledge/KnowledgeBaseDetail";
import {
  canOpenFilePreview,
  filterFilesByQuery,
  getFilesByKnowledgeBase,
  getKnowledgeBaseById,
  getKnowledgeFileById,
  getVersionsByFile,
  readViewMode,
  sortFiles,
  writeViewMode,
  type KbSortBy,
} from "@/lib/mock/knowledge-utils";
import type { KnowledgeFile, KnowledgeViewMode } from "@/lib/mock/knowledge-space";

const fileSearchSchema = z.object({
  version: z.string().optional().catch(undefined),
  view: z.enum(["grid", "list"]).optional().catch(undefined),
  sort: z.enum(["updated", "name", "uploaded"]).optional().catch("updated"),
  q: z.string().optional().catch(undefined),
});

export const Route = createFileRoute("/knowledge/kb/$kbId/file/$fileId")({
  validateSearch: fileSearchSchema,
  loader: ({ params }) => {
    const base = getKnowledgeBaseById(params.kbId);
    const file = getKnowledgeFileById(params.fileId);
    if (!base || !file || file.kbId !== base.id) throw notFound();
    return { base, file, versions: getVersionsByFile(file.id) };
  },
  component: KnowledgeFilePreviewPage,
  head: ({ loaderData }) => ({
    meta: [{ title: `${loaderData?.file.name ?? "文件预览"} · 知识库 · 涉网运行能力智能提升平台` }],
  }),
});

function KnowledgeFilePreviewPage() {
  const { base, file, versions } = Route.useLoaderData();
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });

  const viewMode = (search.view ?? readViewMode()) as KnowledgeViewMode;
  const sortBy = (search.sort ?? "updated") as KbSortBy;
  const query = search.q ?? "";
  const currentVersionId = search.version ?? versions.find((version) => version.isCurrent)?.id;

  const files = useMemo(() => {
    return sortFiles(
      filterFilesByQuery(getFilesByKnowledgeBase(base.id, file.directoryId), query),
      sortBy,
    );
  }, [base.id, file.directoryId, query, sortBy]);

  const updateSearch = (patch: Partial<z.infer<typeof fileSearchSchema>>) => {
    if (patch.view) writeViewMode(patch.view);
    navigate({ search: (prev) => ({ ...prev, ...patch }) });
  };

  const handleFileClick = (nextFile: KnowledgeFile) => {
    const result = canOpenFilePreview(nextFile);
    if (!result.ok) {
      toast.error(result.reason);
      return;
    }
    navigate({
      to: "/knowledge/kb/$kbId/file/$fileId",
      params: { kbId: base.id, fileId: nextFile.id },
      search: { version: undefined, view: viewMode, sort: sortBy, q: query || undefined },
    });
  };

  return (
    <KnowledgeBaseDetail
      base={base}
      files={files}
      selectedDirectoryId={file.directoryId}
      selectedFile={file}
      versions={versions}
      currentVersionId={currentVersionId}
      viewMode={viewMode}
      sortBy={sortBy}
      query={query}
      onDirectoryChange={(directoryId) =>
        navigate({
          to: "/knowledge/kb/$kbId",
          params: { kbId: base.id },
          search: { dir: directoryId ?? undefined },
        })
      }
      onFileClick={handleFileClick}
      onViewModeChange={(mode) => updateSearch({ view: mode })}
      onSortChange={(sort) => updateSearch({ sort })}
      onQueryChange={(q) => updateSearch({ q: q || undefined })}
      onVersionChange={(version) => updateSearch({ version })}
    />
  );
}

import { createFileRoute, notFound, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { useMemo } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { KnowledgeBaseDetail } from "@/components/knowledge/KnowledgeBaseDetail";
import {
  canOpenFilePreview,
  filterFilesByQuery,
  getFilesByKnowledgeBase,
  getKnowledgeBaseById,
  readViewMode,
  sortFiles,
  writeViewMode,
  type KbSortBy,
} from "@/lib/mock/knowledge-utils";
import type { KnowledgeFile, KnowledgeViewMode } from "@/lib/mock/knowledge-space";

const kbSearchSchema = z.object({
  dir: z.string().optional().catch(undefined),
  view: z.enum(["grid", "list"]).optional().catch(undefined),
  sort: z.enum(["updated", "name", "uploaded"]).optional().catch("updated"),
  q: z.string().optional().catch(undefined),
});

export const Route = createFileRoute("/knowledge/kb/$kbId")({
  validateSearch: kbSearchSchema,
  loader: ({ params }) => {
    const base = getKnowledgeBaseById(params.kbId);
    if (!base) throw notFound();
    return { base };
  },
  component: KnowledgeBasePage,
  head: ({ loaderData }) => ({
    meta: [{ title: `${loaderData?.base.name ?? "知识库"} · 涉网运行能力智能提升平台` }],
  }),
});

function KnowledgeBasePage() {
  const { base } = Route.useLoaderData();
  const search = Route.useSearch();
  const location = useLocation();
  const navigate = useNavigate({ from: Route.fullPath });

  const selectedDirectoryId = search.dir ?? null;
  const viewMode = (search.view ?? readViewMode()) as KnowledgeViewMode;
  const sortBy = (search.sort ?? "updated") as KbSortBy;
  const query = search.q ?? "";

  const files = useMemo(() => {
    const directoryId = selectedDirectoryId ?? undefined;
    return sortFiles(
      filterFilesByQuery(getFilesByKnowledgeBase(base.id, directoryId), query),
      sortBy,
    );
  }, [base.id, selectedDirectoryId, query, sortBy]);

  const updateSearch = (patch: Partial<z.infer<typeof kbSearchSchema>>) => {
    if (patch.view) writeViewMode(patch.view);
    navigate({ search: (prev) => ({ ...prev, ...patch }) });
  };

  const handleFileClick = (file: KnowledgeFile) => {
    const result = canOpenFilePreview(file);
    if (!result.ok) {
      toast.error(result.reason);
      return;
    }
    navigate({
      to: "/knowledge/kb/$kbId/file/$fileId",
      params: { kbId: base.id, fileId: file.id },
    });
  };

  if (location.pathname.includes("/file/")) {
    return <Outlet />;
  }

  return (
    <KnowledgeBaseDetail
      base={base}
      files={files}
      selectedDirectoryId={selectedDirectoryId}
      viewMode={viewMode}
      sortBy={sortBy}
      query={query}
      onDirectoryChange={(directoryId) => updateSearch({ dir: directoryId ?? undefined })}
      onFileClick={handleFileClick}
      onViewModeChange={(mode) => updateSearch({ view: mode })}
      onSortChange={(sort) => updateSearch({ sort })}
      onQueryChange={(q) => updateSearch({ q: q || undefined })}
    />
  );
}

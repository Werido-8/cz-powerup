import { createFileRoute, notFound } from "@tanstack/react-router";
import { z } from "zod";
import { FileDetailPage } from "@/components/knowledge/workbench/FileDetailPage";
import { getFileById } from "@/lib/knowledge/model";

const fileSearchSchema = z.object({
  kbId: z.string().optional().catch(undefined),
  version: z.string().optional().catch(undefined),
  q: z.string().optional().catch(undefined),
  mode: z.enum(["fulltext", "filename"]).optional().catch(undefined),
  resultIds: z.array(z.string()).optional().catch(undefined),
  scope: z.enum(["personal-all", "professional-all"]).optional().catch(undefined),
  from: z.string().optional().catch(undefined),
});

export const Route = createFileRoute("/knowledge/file/$fileId")({
  validateSearch: fileSearchSchema,
  loader: ({ params }) => {
    const file = getFileById(params.fileId);
    if (!file) throw notFound();
    return { file };
  },
  component: KnowledgeFileRoute,
  head: ({ loaderData }) => ({
    meta: [
      {
        title: `${loaderData?.file.name ?? "文件详情"} · 知识库 · 涉网运行能力智能提升平台`,
      },
    ],
  }),
});

function KnowledgeFileRoute() {
  const params = Route.useParams();
  const search = Route.useSearch();
  return (
    <FileDetailPage
      fileId={params.fileId}
      initialKnowledgeBaseId={search.kbId}
      versionId={search.version}
      searchQuery={search.q}
      searchMode={search.mode}
      searchResultIds={search.resultIds}
      searchScope={search.scope}
      returnFrom={search.from}
    />
  );
}

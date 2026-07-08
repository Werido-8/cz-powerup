import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { KnowledgeOverviewPage } from "@/components/knowledge/workbench/KnowledgeOverviewPage";

const overviewSearchSchema = z.object({
  kbId: z.string().optional().catch(undefined),
});

export const Route = createFileRoute("/knowledge/")({
  validateSearch: overviewSearchSchema,
  component: KnowledgeIndexPage,
  head: () => ({ meta: [{ title: "知识总览 · 知识库 · 涉网运行能力智能提升平台" }] }),
});

function KnowledgeIndexPage() {
  const search = Route.useSearch();
  return <KnowledgeOverviewPage initialBaseId={search.kbId} />;
}

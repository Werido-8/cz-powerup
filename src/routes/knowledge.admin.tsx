import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { KnowledgeAdminPage } from "@/components/knowledge/workbench/KnowledgeAdminPage";

const adminSearchSchema = z.object({
  section: z.enum(["categories", "bases", "approvals", "exceptions"]).optional().catch(undefined),
});

export const Route = createFileRoute("/knowledge/admin")({
  validateSearch: adminSearchSchema,
  component: KnowledgeAdminRoute,
  head: () => ({ meta: [{ title: "知识管理 · 知识库 · 涉网运行能力智能提升平台" }] }),
});

function KnowledgeAdminRoute() {
  const search = Route.useSearch();
  return <KnowledgeAdminPage initialSection={search.section} />;
}

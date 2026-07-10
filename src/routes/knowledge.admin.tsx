import { createFileRoute } from "@tanstack/react-router";
import { KnowledgeAdminPage } from "@/components/knowledge/workbench/KnowledgeAdminPage";

export const Route = createFileRoute("/knowledge/admin")({
  component: KnowledgeAdminRoute,
  head: () => ({ meta: [{ title: "知识管理 · 知识库 · 涉网运行能力智能提升平台" }] }),
});

function KnowledgeAdminRoute() {
  return <KnowledgeAdminPage />;
}

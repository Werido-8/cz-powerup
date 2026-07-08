import { createFileRoute } from "@tanstack/react-router";
import { AllKnowledgeFilesPage } from "@/components/knowledge/workbench/AllKnowledgeFilesPage";

export const Route = createFileRoute("/knowledge/all")({
  component: AllKnowledgeRoute,
  head: () => ({ meta: [{ title: "全库资料 · 知识库 · 涉网运行能力智能提升平台" }] }),
});

function AllKnowledgeRoute() {
  return <AllKnowledgeFilesPage />;
}

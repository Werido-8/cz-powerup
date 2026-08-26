import { createFileRoute } from "@tanstack/react-router";
import { FileEditPage } from "@/components/knowledge/workbench/admin/FileApprovalPage";

export const Route = createFileRoute("/knowledge/edit/$fileId")({
  component: KnowledgeEditRoute,
  head: () => ({ meta: [{ title: "编辑解析结果 · 知识库 · 涉网运行能力智能提升平台" }] }),
});

function KnowledgeEditRoute() {
  const { fileId } = Route.useParams();
  return <FileEditPage fileId={fileId} />;
}

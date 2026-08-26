import { createFileRoute } from "@tanstack/react-router";
import { FileApprovalPage } from "@/components/knowledge/workbench/admin/FileApprovalPage";

export const Route = createFileRoute("/knowledge/confirm/$confirmId")({
  component: KnowledgeConfirmRoute,
  head: () => ({ meta: [{ title: "文件确认 · 知识库 · 涉网运行能力智能提升平台" }] }),
});

function KnowledgeConfirmRoute() {
  const { confirmId } = Route.useParams();
  return <FileApprovalPage approvalId={confirmId} />;
}

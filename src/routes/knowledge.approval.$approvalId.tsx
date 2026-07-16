import { createFileRoute } from "@tanstack/react-router";
import { FileApprovalPage } from "@/components/knowledge/workbench/admin/FileApprovalPage";

export const Route = createFileRoute("/knowledge/approval/$approvalId")({
  component: KnowledgeApprovalRoute,
  head: () => ({ meta: [{ title: "文件审批 · 知识库 · 涉网运行能力智能提升平台" }] }),
});

function KnowledgeApprovalRoute() {
  const { approvalId } = Route.useParams();
  return <FileApprovalPage approvalId={approvalId} />;
}

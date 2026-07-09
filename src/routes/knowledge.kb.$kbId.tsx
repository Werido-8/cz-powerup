import { createFileRoute, Outlet, useLocation } from "@tanstack/react-router";
import { KnowledgeOverviewPage } from "@/components/knowledge/workbench/KnowledgeOverviewPage";

export const Route = createFileRoute("/knowledge/kb/$kbId")({
  component: LegacyKnowledgeBaseRoute,
  head: () => ({ meta: [{ title: "知识总览 · 知识库 · 涉网运行能力智能提升平台" }] }),
});

function LegacyKnowledgeBaseRoute() {
  const { kbId } = Route.useParams();
  const location = useLocation();

  if (location.pathname.includes("/file/")) {
    return <Outlet />;
  }

  return <KnowledgeOverviewPage initialBaseId={kbId} />;
}

import { createFileRoute, Outlet } from "@tanstack/react-router";
import { KnowledgeAppLayout } from "@/components/knowledge/KnowledgeAppLayout";
import { PageShell } from "@/components/workbench/PageShell";

export const Route = createFileRoute("/knowledge")({
  component: KnowledgeLayout,
});

function KnowledgeLayout() {
  return (
    <PageShell compact wide>
      <div className="knowledge-density-frame h-full">
        <KnowledgeAppLayout>
          <Outlet />
        </KnowledgeAppLayout>
      </div>
    </PageShell>
  );
}

import { createFileRoute, Outlet } from "@tanstack/react-router";
import { KnowledgeAppLayout } from "@/components/knowledge/KnowledgeAppLayout";
import { PageShell } from "@/components/workbench/PageShell";

export const Route = createFileRoute("/knowledge")({
  component: KnowledgeLayout,
});

function KnowledgeLayout() {
  return (
    <PageShell compact>
      <KnowledgeAppLayout>
        <Outlet />
      </KnowledgeAppLayout>
    </PageShell>
  );
}

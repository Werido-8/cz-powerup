import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { PageShell } from "@/components/workbench/PageShell";
import { TopicEditorWizard } from "@/components/learning/topic-admin/topic-editor-wizard";

export const Route = createFileRoute("/learn-admin/topic/$topicId/edit")({
  component: EditTopicPage,
  head: () => ({ meta: [{ title: "编辑专题 · 专题维护" }] }),
});

function EditTopicPage() {
  const navigate = useNavigate();
  const { topicId } = Route.useParams();

  return (
    <PageShell>
      <TopicEditorWizard
        mode="edit"
        topicId={topicId}
        onBack={() => navigate({ to: "/learn-admin" })}
        onPreview={() => {
          navigate({ to: "/learn/topic/$id", params: { id: topicId } });
        }}
      />
    </PageShell>
  );
}

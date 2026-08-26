import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { PageShell } from "@/components/workbench/PageShell";
import { TopicEditorWizard } from "@/components/learning/topic-admin/topic-editor-wizard";

const searchSchema = z.object({
  step: z.number().optional(),
});

export const Route = createFileRoute("/learn-admin/topic/$topicId/edit")({
  validateSearch: searchSchema,
  component: EditTopicPage,
  head: () => ({ meta: [{ title: "编辑专题 · 专题维护" }] }),
});

function EditTopicPage() {
  const navigate = useNavigate();
  const { topicId } = Route.useParams();
  const { step } = Route.useSearch();

  return (
    <PageShell compact mainClassName="flex flex-col p-0">
      <TopicEditorWizard
        mode="edit"
        topicId={topicId}
        initialStep={step}
        onBack={() => navigate({ to: "/learn-admin" })}
        onPreview={() => {
          navigate({ to: "/learn/topic/$id", params: { id: topicId } });
        }}
      />
    </PageShell>
  );
}

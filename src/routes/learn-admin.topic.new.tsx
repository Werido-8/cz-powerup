import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { PageShell } from "@/components/workbench/PageShell";
import { TopicEditorWizard } from "@/components/learning/topic-admin/topic-editor-wizard";

const searchSchema = z.object({
  // 本期暂不开放：AI 辅助创建
  // source: z.enum(["ai"]).optional(),
  preview: z.string().optional(),
});

export const Route = createFileRoute("/learn-admin/topic/new")({
  validateSearch: searchSchema,
  component: NewTopicPage,
  head: () => ({ meta: [{ title: "新建专题 · 专题维护" }] }),
});

function NewTopicPage() {
  const navigate = useNavigate();
  // const { source } = Route.useSearch();

  return (
    <PageShell>
      <TopicEditorWizard
        mode="create"
        onBack={() => navigate({ to: "/learn-admin" })}
        onPreview={() => {
          navigate({ to: "/learn-admin" });
        }}
      />
    </PageShell>
  );
}

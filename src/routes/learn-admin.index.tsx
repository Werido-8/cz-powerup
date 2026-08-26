import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { PageShell } from "@/components/workbench/PageShell";
import { TopicAdminSplitView } from "@/components/learning/topic-admin/topic-admin-split-view";
import { PageHeader } from "@/components/learning/ui";
import { type TopicAdminRecord } from "@/lib/mock/topicAdmin";

export const Route = createFileRoute("/learn-admin/")({
  component: LearnAdminIndexPage,
  head: () => ({
    meta: [
      { title: "专题维护 · 涉网运行能力智能提升平台" },
      { name: "description", content: "培训老师创建专题、选择资料、维护知识点与关联题目。" },
    ],
  }),
});

function LearnAdminIndexPage() {
  const navigate = useNavigate();

  const handleNew = (mode: "standard" | "ai" = "standard") => {
    navigate({
      to: "/learn-admin/topic/new",
      search: { preview: undefined, source: mode === "ai" ? "ai" : undefined },
    });
  };

  const handleEdit = (record: TopicAdminRecord, step?: number) => {
    navigate({
      to: "/learn-admin/topic/$topicId/edit",
      params: { topicId: record.id },
      search: { step },
    });
  };

  const handlePreview = (record: TopicAdminRecord) => {
    if (record.status === "已发布") {
      navigate({ to: "/learn/topic/$id", params: { id: record.id } });
      return;
    }
    navigate({
      to: "/learn-admin/topic/new",
      search: { preview: record.id, source: undefined },
    });
  };

  return (
    <PageShell compact>
      <div className="flex h-full min-h-0 w-full flex-col">
        <PageHeader
          title="专题维护"
          subtitle="组织学习内容与练习覆盖，并在同一个工作台完成发布交付。"
          size="md"
        />

        <div className="min-h-0 flex-1 overflow-y-auto xl:overflow-hidden">
          <TopicAdminSplitView onNew={handleNew} onEdit={handleEdit} onPreview={handlePreview} />
        </div>
      </div>
    </PageShell>
  );
}

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { BookOpen, ClipboardList, Layers, Users } from "lucide-react";
import { PageShell } from "@/components/workbench/PageShell";
import { TopicAdminSplitView } from "@/components/learning/topic-admin/topic-admin-split-view";
import { PageHeader, OverviewStatCard, ModulePanel } from "@/components/learning/ui";
import { TOPIC_ADMIN_STATS, type TopicAdminRecord } from "@/lib/mock/topicAdmin";

export const Route = createFileRoute("/learn-admin/")({
  component: LearnAdminIndexPage,
  head: () => ({
    meta: [
      { title: "专题维护 · 涉网运行能力智能提升平台" },
      { name: "description", content: "培训老师创建专题、选择资料、维护知识点与关联题目。" },
    ],
  }),
});

const STAT_ICONS: Record<string, React.ReactNode> = {
  total: <Layers className="h-[18px] w-[18px]" />,
  published: <BookOpen className="h-[18px] w-[18px]" />,
  draft: <ClipboardList className="h-[18px] w-[18px]" />,
  learners: <Users className="h-[18px] w-[18px]" />,
};

function LearnAdminIndexPage() {
  const navigate = useNavigate();

  const handleNew = () => {
    navigate({ to: "/learn-admin/topic/new", search: { source: undefined } });
  };

  const handleEdit = (record: TopicAdminRecord) => {
    navigate({ to: "/learn-admin/topic/$topicId/edit", params: { topicId: record.id } });
  };

  const handlePreview = (record: TopicAdminRecord) => {
    if (record.status === "已发布") {
      navigate({ to: "/learn/topic/$id", params: { id: record.id } });
      return;
    }
    navigate({
      to: "/learn-admin/topic/new",
      search: { preview: record.id },
    });
  };

  return (
    <PageShell>
      <PageHeader
        title="专题维护"
        subtitle="围绕岗位能力与业务场景组织精品学习资料，维护知识点与文档关联题目后发布。"
        size="md"
      />

      <section className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        {TOPIC_ADMIN_STATS.map((s, i) => (
          <OverviewStatCard
            key={s.key}
            label={s.label}
            value={s.value}
            hint={s.hint}
            detail={s.detail}
            icon={STAT_ICONS[s.key]}
            tint={i}
            emphasis={s.tone === "warning" ? "remind" : "primary"}
          />
        ))}
      </section>

      <ModulePanel>
        <div className="p-4">
          <TopicAdminSplitView onNew={handleNew} onEdit={handleEdit} onPreview={handlePreview} />
        </div>
      </ModulePanel>
    </PageShell>
  );
}

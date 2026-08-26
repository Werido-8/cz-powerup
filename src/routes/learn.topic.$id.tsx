import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { toast } from "sonner";
import { TopicDetailView } from "@/components/learning/topic-detail-view";
import { LearningBreadcrumb } from "@/components/learning/learning-breadcrumb";
import { PageShell } from "@/components/workbench/PageShell";
import { TOPICS } from "@/lib/mock/data";
import { useMockStore } from "@/lib/mock/store";

export const Route = createFileRoute("/learn/topic/$id")({
  loader: ({ params }) => {
    const topic = TOPICS.find((t) => t.id === params.id);
    if (!topic) throw notFound();
    return { topic };
  },
  component: TopicPage,
  notFoundComponent: () => (
    <PageShell>
      <div className="rounded-lg border border-border bg-card p-10 text-center text-muted-foreground">
        未找到该专题，
        <Link to="/learn" className="ml-1 text-primary hover:underline">
          返回专题列表
        </Link>
      </div>
    </PageShell>
  ),
  errorComponent: ({ error }) => (
    <PageShell>
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-destructive">
        载入出错: {error.message}
      </div>
    </PageShell>
  ),
});

function TopicPage() {
  const { topic } = Route.useLoaderData();
  const { state, toggleFavorite } = useMockStore();
  const fav = state.favorites.includes(`topic:${topic.id}`);

  return (
    <PageShell>
      <LearningBreadcrumb
        current="knowledge"
        trail={[{ label: topic.title }]}
      />

      <TopicDetailView
        topic={topic}
        state={state}
        isFavorite={fav}
        onToggleFavorite={() => {
          toggleFavorite(`topic:${topic.id}`);
          toast.success(fav ? "已取消收藏" : "已收藏到个人沉淀");
        }}
      />
    </PageShell>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { CompareOverviewPage } from "@/components/file-compare/CompareOverviewPage";
import { compareOverviewSearchSchema } from "@/lib/file-compare/navigation";

export const Route = createFileRoute("/file-compare/$taskId/overview")({
  validateSearch: compareOverviewSearchSchema,
  component: FileCompareOverviewRoute,
  head: () => ({ meta: [{ title: "差异概览 · 文件比对 · 涉网运行能力智能提升平台" }] }),
});

function FileCompareOverviewRoute() {
  const { taskId } = Route.useParams();
  const search = Route.useSearch();
  return <CompareOverviewPage taskId={taskId} tab="overview" search={search} />;
}

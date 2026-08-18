import { createFileRoute } from "@tanstack/react-router";
import { CompareOverviewPage } from "@/components/file-compare/CompareOverviewPage";
import { compareOverviewSearchSchema } from "@/lib/file-compare/navigation";

export const Route = createFileRoute("/file-compare/$taskId/changes")({
  validateSearch: compareOverviewSearchSchema,
  component: FileCompareChangesRoute,
  head: () => ({ meta: [{ title: "变更清单 · 文件比对 · 涉网运行能力智能提升平台" }] }),
});

function FileCompareChangesRoute() {
  const { taskId } = Route.useParams();
  const search = Route.useSearch();
  return <CompareOverviewPage taskId={taskId} tab="changes" search={search} />;
}

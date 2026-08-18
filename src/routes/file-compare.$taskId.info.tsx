import { createFileRoute } from "@tanstack/react-router";
import { CompareOverviewPage } from "@/components/file-compare/CompareOverviewPage";
import { compareOverviewSearchSchema } from "@/lib/file-compare/navigation";

export const Route = createFileRoute("/file-compare/$taskId/info")({
  validateSearch: compareOverviewSearchSchema,
  component: FileCompareInfoRoute,
  head: () => ({ meta: [{ title: "文件信息 · 文件比对 · 涉网运行能力智能提升平台" }] }),
});

function FileCompareInfoRoute() {
  const { taskId } = Route.useParams();
  const search = Route.useSearch();
  return <CompareOverviewPage taskId={taskId} tab="info" search={search} />;
}

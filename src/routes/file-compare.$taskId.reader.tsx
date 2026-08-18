import { createFileRoute } from "@tanstack/react-router";
import { CompareReaderPage } from "@/components/file-compare/CompareReaderPage";
import { compareReaderSearchSchema } from "@/lib/file-compare/navigation";

export const Route = createFileRoute("/file-compare/$taskId/reader")({
  validateSearch: compareReaderSearchSchema,
  component: FileCompareReaderRoute,
  head: () => ({ meta: [{ title: "双栏对照阅读 · 文件比对 · 涉网运行能力智能提升平台" }] }),
});

function FileCompareReaderRoute() {
  const { taskId } = Route.useParams();
  const search = Route.useSearch();
  return <CompareReaderPage taskId={taskId} search={search} />;
}

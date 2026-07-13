import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { MyUploadPage } from "@/components/knowledge/workbench/MyUploadPage";

const uploadSearchSchema = z.object({
  view: z.enum(["all", "review", "parse", "publish"]).optional().catch("all"),
  status: z.string().optional().catch(undefined),
  q: z.string().optional().catch(undefined),
});

export type UploadSearch = z.infer<typeof uploadSearchSchema>;

export const Route = createFileRoute("/knowledge/uploads")({
  validateSearch: uploadSearchSchema,
  component: KnowledgeUploadsRoute,
  head: () => ({ meta: [{ title: "我的上传 · 知识库 · 涉网运行能力智能提升平台" }] }),
});

function KnowledgeUploadsRoute() {
  const search = Route.useSearch();
  return <MyUploadPage search={search} />;
}

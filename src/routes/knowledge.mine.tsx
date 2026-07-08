import { createFileRoute } from "@tanstack/react-router";
import { MySpacePage } from "@/components/knowledge/workbench/MySpacePage";

export const Route = createFileRoute("/knowledge/mine")({
  component: KnowledgeMinePage,
  head: () => ({ meta: [{ title: "我的空间 · 知识库 · 涉网运行能力智能提升平台" }] }),
});

function KnowledgeMinePage() {
  return <MySpacePage />;
}

import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { KnowledgeSpaceHome } from "@/components/knowledge/KnowledgeSpaceHome";
import { KnowledgeSpaceSidebar } from "@/components/knowledge/KnowledgeSpaceSidebar";
import {
  getPublicKnowledgeBases,
  readSpaceSidebarCollapsed,
  writeSpaceSidebarCollapsed,
} from "@/lib/mock/knowledge-utils";

export const Route = createFileRoute("/knowledge/space/public")({
  component: KnowledgePublicSpacePage,
  head: () => ({ meta: [{ title: "公共空间 · 知识库 · 涉网运行能力智能提升平台" }] }),
});

function KnowledgePublicSpacePage() {
  const [collapsed, setCollapsed] = useState(() => readSpaceSidebarCollapsed());

  const handleCollapsedChange = (next: boolean) => {
    setCollapsed(next);
    writeSpaceSidebarCollapsed(next);
  };

  return (
    <>
      <KnowledgeSpaceSidebar
        activeSpace="public"
        collapsed={collapsed}
        onCollapsedChange={handleCollapsedChange}
      />
      <KnowledgeSpaceHome
        type="public"
        title="公共空间"
        subtitle="全厂共享的规章制度、技术标准与经验资料"
        bases={getPublicKnowledgeBases()}
      />
    </>
  );
}

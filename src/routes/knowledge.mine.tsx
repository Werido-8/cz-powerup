import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { KnowledgeSpaceHome } from "@/components/knowledge/KnowledgeSpaceHome";
import { KnowledgeSpaceSidebar } from "@/components/knowledge/KnowledgeSpaceSidebar";
import { readSpaceSidebarCollapsed, writeSpaceSidebarCollapsed } from "@/lib/mock/knowledge-utils";

export const Route = createFileRoute("/knowledge/mine")({
  component: KnowledgeMinePage,
  head: () => ({ meta: [{ title: "我的 · 知识库 · 涉网运行能力智能提升平台" }] }),
});

function KnowledgeMinePage() {
  const [collapsed, setCollapsed] = useState(() => readSpaceSidebarCollapsed());
  const [activeTab, setActiveTab] = useState<"mine" | "quick">("mine");

  useEffect(() => {
    const syncTab = () => {
      setActiveTab(window.location.hash === "#quick" ? "quick" : "mine");
    };
    syncTab();
    window.addEventListener("hashchange", syncTab);
    return () => window.removeEventListener("hashchange", syncTab);
  }, []);

  const handleCollapsedChange = (next: boolean) => {
    setCollapsed(next);
    writeSpaceSidebarCollapsed(next);
  };

  return (
    <>
      <KnowledgeSpaceSidebar
        activeSpace={activeTab === "quick" ? "quick" : "mine"}
        collapsed={collapsed}
        onCollapsedChange={handleCollapsedChange}
      />
      <KnowledgeSpaceHome
        type="mine"
        title="我的"
        subtitle="最近访问的知识库与文件、个人资料和上传记录"
        defaultTab={activeTab === "quick" ? "recent" : undefined}
      />
    </>
  );
}

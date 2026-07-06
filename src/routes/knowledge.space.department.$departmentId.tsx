import { createFileRoute, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { KnowledgeSpaceHome } from "@/components/knowledge/KnowledgeSpaceHome";
import { KnowledgeSpaceSidebar } from "@/components/knowledge/KnowledgeSpaceSidebar";
import {
  getDepartmentById,
  getKnowledgeBasesByDepartment,
  readSpaceSidebarCollapsed,
  writeLastDepartment,
  writeSpaceSidebarCollapsed,
} from "@/lib/mock/knowledge-utils";

export const Route = createFileRoute("/knowledge/space/department/$departmentId")({
  loader: ({ params }) => {
    const department = getDepartmentById(params.departmentId);
    if (!department) throw notFound();
    return { department, bases: getKnowledgeBasesByDepartment(department.id) };
  },
  component: KnowledgeDepartmentSpacePage,
  head: ({ loaderData }) => ({
    meta: [
      {
        title: `${loaderData?.department.name ?? "部门空间"} · 知识库 · 涉网运行能力智能提升平台`,
      },
    ],
  }),
});

function KnowledgeDepartmentSpacePage() {
  const { department, bases } = Route.useLoaderData();
  const [collapsed, setCollapsed] = useState(() => readSpaceSidebarCollapsed());

  useEffect(() => {
    writeLastDepartment(department.id);
  }, [department.id]);

  const handleCollapsedChange = (next: boolean) => {
    setCollapsed(next);
    writeSpaceSidebarCollapsed(next);
  };

  return (
    <>
      <KnowledgeSpaceSidebar
        activeSpace="department"
        activeDepartmentId={department.id}
        collapsed={collapsed}
        onCollapsedChange={handleCollapsedChange}
      />
      <KnowledgeSpaceHome
        type="department"
        title={department.name}
        subtitle="该部门共享的知识资产与资料"
        bases={bases}
        department={department}
      />
    </>
  );
}

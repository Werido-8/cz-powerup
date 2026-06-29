import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/workbench/Header";
import { Workbench } from "@/components/workbench/Workbench";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "涉网运行能力智能提升平台" },
      {
        name: "description",
        content: "面向电厂人员的知识学习、场景练习与能力成长平台。",
      },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Workbench />
    </div>
  );
}

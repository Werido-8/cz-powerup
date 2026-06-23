import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/workbench/Header";
import { Workbench } from "@/components/workbench/Workbench";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "涉网运行 AI 智能训练平台" },
      {
        name: "description",
        content: "面向厂站人员的知识学习、题库训练与场景复盘平台。",
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

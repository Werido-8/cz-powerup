import { createFileRoute } from "@tanstack/react-router";
import { FileSelfPracticePage } from "@/components/knowledge/workbench/FileSelfPracticePage";
import { getFileById } from "@/lib/knowledge/model";

export const Route = createFileRoute("/knowledge-practice/$fileId")({
  component: KnowledgeFilePracticeRoute,
  head: ({ params }) => {
    const file = getFileById(params.fileId);
    return {
      meta: [
        {
          title: `${file?.name ?? "文件"} · 自测练习 · 涉网运行能力智能提升平台`,
        },
      ],
    };
  },
});

function KnowledgeFilePracticeRoute() {
  const { fileId } = Route.useParams();
  return <FileSelfPracticePage fileId={fileId} />;
}

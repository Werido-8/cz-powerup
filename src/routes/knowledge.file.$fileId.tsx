import { createFileRoute, notFound, redirect } from "@tanstack/react-router";
import { getKnowledgeFileById } from "@/lib/mock/knowledge-utils";

export const Route = createFileRoute("/knowledge/file/$fileId")({
  beforeLoad: ({ params }) => {
    const file = getKnowledgeFileById(params.fileId);
    if (!file) throw notFound();
    throw redirect({
      to: "/knowledge/kb/$kbId/file/$fileId",
      params: { kbId: file.kbId, fileId: file.id },
    });
  },
});

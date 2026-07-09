import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/knowledge/kb/$kbId/file/$fileId")({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: "/knowledge/file/$fileId",
      params: { fileId: params.fileId },
      search: { kbId: params.kbId },
    });
  },
});

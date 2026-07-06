import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/knowledge/kb/$kbId/dir/$dirId")({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: "/knowledge/kb/$kbId",
      params: { kbId: params.kbId },
      search: { dir: params.dirId },
    });
  },
});

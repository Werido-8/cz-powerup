import { createFileRoute, redirect } from "@tanstack/react-router";
import { compareOverviewSearchSchema } from "@/lib/file-compare/navigation";

export const Route = createFileRoute("/file-compare/$taskId/changes")({
  validateSearch: compareOverviewSearchSchema,
  beforeLoad: ({ params, search }) => {
    throw redirect({
      to: "/file-compare/$taskId/overview",
      params: { taskId: params.taskId },
      search,
      replace: true,
    });
  },
  component: () => null,
});

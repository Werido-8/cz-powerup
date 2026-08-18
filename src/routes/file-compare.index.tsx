import { createFileRoute, redirect } from "@tanstack/react-router";
import { DEFAULT_COMPARE_TASK_ID } from "@/lib/file-compare/data";

/** /file-compare 直接进入演示任务的差异概览 */
export const Route = createFileRoute("/file-compare/")({
  beforeLoad: () => {
    throw redirect({
      to: "/file-compare/$taskId/overview",
      params: { taskId: DEFAULT_COMPARE_TASK_ID },
      replace: true,
    });
  },
  component: () => null,
});

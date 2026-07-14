import { createFileRoute, redirect } from "@tanstack/react-router";
import type { UploadView } from "@/lib/knowledge/uploadTracking";

/**
 * /knowledge/uploads 已合并进「我的空间」，保留此路由做兼容重定向。
 */
export const Route = createFileRoute("/knowledge/uploads")({
  beforeLoad: ({ search }) => {
    const legacy = search as { view?: string; status?: string; q?: string };
    const view = legacy.view as UploadView | undefined;
    throw redirect({
      to: "/knowledge/mine",
      search: {
        panel: "uploads",
        view,
        status: legacy.status,
        q: legacy.q,
      },
      replace: true,
    });
  },
  component: () => null,
});

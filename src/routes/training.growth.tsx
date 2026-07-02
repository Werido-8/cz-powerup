import { createFileRoute, redirect } from "@tanstack/react-router";

/** 第一版移除能力成长入口，保留路由做重定向 */
export const Route = createFileRoute("/training/growth")({
  beforeLoad: () => {
    throw redirect({ to: "/training" });
  },
  component: () => null,
});

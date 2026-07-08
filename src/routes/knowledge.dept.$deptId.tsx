import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/knowledge/dept/$deptId")({
  beforeLoad: () => {
    throw redirect({ to: "/knowledge" });
  },
});

import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/knowledge/space/department/$departmentId")({
  beforeLoad: () => {
    throw redirect({ to: "/knowledge" });
  },
});

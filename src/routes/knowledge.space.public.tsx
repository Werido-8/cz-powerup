import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/knowledge/space/public")({
  beforeLoad: () => {
    throw redirect({ to: "/knowledge/all" });
  },
});

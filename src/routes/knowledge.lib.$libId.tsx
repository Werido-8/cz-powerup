import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/knowledge/lib/$libId")({
  beforeLoad: () => {
    throw redirect({ to: "/knowledge" });
  },
});

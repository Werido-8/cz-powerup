import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/scenario/fault")({
  component: () => <Outlet />,
});

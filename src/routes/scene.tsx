import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/scene")({
  component: () => <Navigate to="/scenario" replace />,
});

import { createFileRoute, Outlet } from "@tanstack/react-router";
import { TooltipProvider } from "@/components/ui/tooltip";

export const Route = createFileRoute("/learn-admin")({
  component: LearnAdminLayout,
});

function LearnAdminLayout() {
  return (
    <TooltipProvider delayDuration={200}>
      <Outlet />
    </TooltipProvider>
  );
}

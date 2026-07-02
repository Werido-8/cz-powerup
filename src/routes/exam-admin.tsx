import { createFileRoute, Outlet } from "@tanstack/react-router";
import { TooltipProvider } from "@/components/ui/tooltip";

export const Route = createFileRoute("/exam-admin")({
  component: ExamAdminLayout,
});

function ExamAdminLayout() {
  return (
    <TooltipProvider delayDuration={200}>
      <Outlet />
    </TooltipProvider>
  );
}

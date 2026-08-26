import { createFileRoute, Outlet } from "@tanstack/react-router";
import { CompareTabStrip } from "@/components/file-compare/CompareTabStrip";
import { PageShell } from "@/components/workbench/PageShell";

export const Route = createFileRoute("/file-compare")({
  component: FileCompareLayout,
});

function FileCompareLayout() {
  return (
    <PageShell
      compact
      wide
      subBar={<CompareTabStrip />}
      mainClassName="bg-[#F4F7F8] px-3 py-2.5 xl:px-5 xl:py-3"
    >
      <Outlet />
    </PageShell>
  );
}

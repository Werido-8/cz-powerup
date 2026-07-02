import { createFileRoute, Outlet, useRouterState } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageShell } from "@/components/workbench/PageShell";
import { KbSidebar } from "@/components/knowledge/KbSidebar";
import { getFileById } from "@/lib/mock/knowledge-utils";
import { readSidebarCollapsed } from "@/lib/mock/knowledge-utils";

export const Route = createFileRoute("/knowledge")({
  component: KnowledgeLayout,
});

function KnowledgeLayout() {
  const routerState = useRouterState();
  const pathname = routerState.location.pathname;
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => readSidebarCollapsed());

  const fileMatch = pathname.match(/\/knowledge\/file\/([^/]+)/);
  const libMatch = pathname.match(/\/knowledge\/lib\/([^/]+)/);
  const deptMatch = pathname.match(/\/knowledge\/dept\/([^/]+)/);

  const fileId = fileMatch?.[1];
  const activeLibraryId = libMatch?.[1] ?? (fileId ? getFileById(fileId)?.libraryId : undefined);
  const activeDeptId = deptMatch?.[1];

  const isFilePreview = Boolean(fileId);
  const uploadEnabled = Boolean(libMatch) || Boolean(fileMatch);

  const fileLibraryId = useMemo(() => {
    if (!fileId) return undefined;
    return getFileById(fileId)?.libraryId;
  }, [fileId]);

  return (
    <PageShell compact>
      <div className="flex h-full overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]">
        <KbSidebar
          collapsed={sidebarCollapsed}
          onCollapsedChange={setSidebarCollapsed}
          activeDeptId={activeDeptId}
          activeLibraryId={activeLibraryId}
          uploadEnabled={uploadEnabled}
        />
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden bg-background">
          <Outlet />
        </div>
      </div>
    </PageShell>
  );
}

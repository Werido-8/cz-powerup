import type { ReactNode } from "react";

export function KnowledgeBaseDetailLayout({
  sidebar,
  children,
  aiPanel,
}: {
  sidebar: ReactNode;
  children: ReactNode;
  aiPanel?: ReactNode;
}) {
  return (
    <main className="flex min-w-0 flex-1 overflow-hidden bg-[#F5FAFB]">
      {sidebar}
      <section className="flex min-w-0 flex-1 flex-col overflow-hidden">{children}</section>
      {aiPanel}
    </main>
  );
}

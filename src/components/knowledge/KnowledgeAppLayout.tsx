import type { ReactNode } from "react";

export function KnowledgeAppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-full min-h-0 overflow-hidden rounded-[14px] border border-[#E2ECEF] bg-white shadow-[0_18px_42px_-34px_rgba(31,52,64,0.42)]">
      {children}
    </div>
  );
}

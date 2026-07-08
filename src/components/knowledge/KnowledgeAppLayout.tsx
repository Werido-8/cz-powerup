import type { ReactNode } from "react";
import { kbRadius } from "@/lib/knowledge/tokens";
import { cn } from "@/lib/utils";

export function KnowledgeAppLayout({ children }: { children: ReactNode }) {
  return (
    <div
      className={cn(
        "flex h-full min-h-0 flex-col overflow-hidden border border-[#DCE8EA] bg-white",
        "shadow-[0_4px_20px_-12px_rgba(31,52,64,0.18)]",
        kbRadius.lg,
      )}
    >
      <div className="flex min-h-0 flex-1 overflow-hidden">{children}</div>
    </div>
  );
}

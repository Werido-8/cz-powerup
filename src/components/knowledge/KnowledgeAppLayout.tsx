import type { ReactNode } from "react";
import { kbRadius } from "@/lib/knowledge/tokens";
import { cn } from "@/lib/utils";

export function KnowledgeAppLayout({ children }: { children: ReactNode }) {
  return (
    <div
      className={cn(
        "relative flex h-full min-h-0 flex-col overflow-hidden",
        "border border-[#D7E4E8] bg-[#F7FBFC]",
        "shadow-[0_10px_36px_-20px_rgba(31,52,64,0.28)]",
        kbRadius.lg,
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white/70 to-transparent"
      />
      <div className="relative flex min-h-0 flex-1 overflow-hidden">{children}</div>
    </div>
  );
}

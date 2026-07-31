import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function KnowledgeBaseListToolbar({
  left,
  right,
  className,
}: {
  left?: ReactNode;
  right?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative flex h-[42px] min-h-[42px] items-center justify-between gap-4 overflow-hidden bg-white",
        className,
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-2">{left}</div>
      <div className="flex shrink-0 items-center gap-2">{right}</div>
    </div>
  );
}

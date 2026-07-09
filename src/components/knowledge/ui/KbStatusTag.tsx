import type { ReactNode } from "react";
import type { KnowledgeStatusTone } from "@/lib/knowledge/status";
import { kbToneClasses } from "@/lib/knowledge/tokens";
import { cn } from "@/lib/utils";

export function KbStatusTag({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: KnowledgeStatusTone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-[22px] items-center rounded-full px-2.5 text-[11.5px] font-medium leading-none",
        kbToneClasses[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

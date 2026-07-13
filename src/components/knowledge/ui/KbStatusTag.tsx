import type { ReactNode } from "react";
import type { KnowledgeStatusTone } from "@/lib/knowledge/status";
import { kbToneClasses, kbToneDotClasses, kbToneOutlineClasses } from "@/lib/knowledge/tokens";
import { cn } from "@/lib/utils";

export function KbStatusTag({
  children,
  tone = "neutral",
  variant = "solid",
  dot = false,
  className,
}: {
  children: ReactNode;
  tone?: KnowledgeStatusTone;
  /** solid：原实心胶囊；outline：描边式浅底胶囊 */
  variant?: "solid" | "outline";
  /** 是否显示状态色圆点 */
  dot?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-[22px] items-center gap-1.5 rounded-full px-2.5 text-[11.5px] font-medium leading-none",
        variant === "outline" ? kbToneOutlineClasses[tone] : kbToneClasses[tone],
        className,
      )}
    >
      {dot && (
        <span
          className={cn("h-1.5 w-1.5 shrink-0 rounded-full", kbToneDotClasses[tone])}
          aria-hidden
        />
      )}
      {children}
    </span>
  );
}

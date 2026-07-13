import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { kbTableHead, kbTableRow, kbTableShell } from "@/lib/knowledge/tokens";

export function KbDataTable({
  header,
  children,
  empty,
  className,
  minWidth,
  variant = "card",
}: {
  header: ReactNode;
  children: ReactNode;
  empty?: ReactNode;
  className?: string;
  minWidth?: string;
  variant?: "card" | "flat";
}) {
  const hasChildren = Array.isArray(children)
    ? children.some(Boolean)
    : Boolean(children);

  return (
    <div
      className={cn(
        variant === "flat" ? "w-full overflow-x-auto bg-white" : kbTableShell,
        className,
      )}
    >
      <div
        className={cn(
          "grid items-center border-b border-[#E8F0F2] px-5 py-2.5",
          variant === "flat" ? "bg-[#F8FAFB] text-[12px] font-medium text-kb-muted" : kbTableHead,
          minWidth,
        )}
      >
        {header}
      </div>
      {hasChildren ? children : empty}
    </div>
  );
}

export function KbDataTableRow({
  children,
  className,
  dimmed,
  selected,
  onClick,
  variant = "default",
}: {
  children: ReactNode;
  className?: string;
  dimmed?: boolean;
  selected?: boolean;
  onClick?: () => void;
  variant?: "default" | "flat";
}) {
  const Comp = onClick ? "button" : "div";
  return (
    <Comp
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={cn(
        "grid w-full items-center text-left text-kb-body transition-colors",
        variant === "flat"
          ? "min-h-[56px] border-b border-[#EEF2F4] px-5 text-[13px] last:border-b-0 hover:bg-[#F8FAFB]"
          : cn("px-4 text-[12.5px]", kbTableRow),
        selected && "bg-[rgba(52,155,172,0.055)] hover:bg-[rgba(52,155,172,0.085)]",
        dimmed && !selected && (variant === "flat" ? "bg-muted/20 opacity-70" : "opacity-60 bg-muted/30"),
        onClick && "cursor-pointer",
        className,
      )}
    >
      {children}
    </Comp>
  );
}

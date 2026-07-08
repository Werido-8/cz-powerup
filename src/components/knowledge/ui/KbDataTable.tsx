import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { kbTableHead, kbTableRow, kbTableShell } from "@/lib/knowledge/tokens";

export function KbDataTable({
  header,
  children,
  empty,
  className,
  minWidth,
}: {
  header: ReactNode;
  children: ReactNode;
  empty?: ReactNode;
  className?: string;
  minWidth?: string;
}) {
  const hasChildren = Array.isArray(children)
    ? children.some(Boolean)
    : Boolean(children);

  return (
    <div className={cn(kbTableShell, "w-full overflow-x-auto", className)}>
      <div
        className={cn(
          "grid items-center border-b border-divider px-4 py-3",
          kbTableHead,
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
  onClick,
}: {
  children: ReactNode;
  className?: string;
  dimmed?: boolean;
  onClick?: () => void;
}) {
  const Comp = onClick ? "button" : "div";
  return (
    <Comp
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={cn(
        "grid w-full items-center px-4 text-left text-[12.5px] text-kb-body",
        kbTableRow,
        dimmed && "opacity-60 bg-muted/30",
        onClick && "cursor-pointer",
        className,
      )}
    >
      {children}
    </Comp>
  );
}

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Header } from "./Header";

export function PageShell({
  children,
  compact,
  wide,
  subBar,
  mainClassName,
}: {
  children: ReactNode;
  compact?: boolean;
  /** Enables the 2K desktop density treatment used by the knowledge workspace. */
  wide?: boolean;
  /** 顶部导航下方的通栏区域（多页签栏等） */
  subBar?: ReactNode;
  mainClassName?: string;
}) {
  return (
    <div
      className={
        compact
          ? `flex h-dvh flex-col overflow-hidden bg-background${wide ? " page-shell--wide" : ""}`
          : `min-h-screen bg-background${wide ? " page-shell--wide" : ""}`
      }
    >
      <Header wide={wide} />
      {subBar}
      <main
        className={cn(
          compact
            ? `page-shell__main min-h-0 w-full flex-1 overflow-hidden px-4 py-3${wide ? " page-shell__main--wide" : ""}`
            : "w-full px-6 py-7 lg:px-8",
          mainClassName,
        )}
      >
        {children}
      </main>
    </div>
  );
}

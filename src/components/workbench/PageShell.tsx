import type { ReactNode } from "react";
import { Header } from "./Header";

export function PageShell({
  children,
  compact,
}: {
  children: ReactNode;
  compact?: boolean;
}) {
  return (
    <div
      className={
        compact ? "flex h-screen flex-col overflow-hidden bg-background" : "min-h-screen bg-background"
      }
    >
      <Header />
      <main
        className={
          compact
            ? "mx-auto min-h-0 w-full max-w-[1760px] flex-1 overflow-hidden px-4 py-3"
            : "mx-auto max-w-[1760px] px-8 py-8"
        }
      >
        {children}
      </main>
    </div>
  );
}

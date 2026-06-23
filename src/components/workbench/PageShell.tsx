import type { ReactNode } from "react";
import { Header } from "./Header";

export function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="mx-auto max-w-[1760px] px-8 py-8">{children}</main>
    </div>
  );
}

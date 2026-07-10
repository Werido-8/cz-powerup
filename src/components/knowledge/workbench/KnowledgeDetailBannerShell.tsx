import type { ReactNode } from "react";
import kbHeaderBackground from "@/assets/image.png";
import { kbDetailBannerShell } from "@/lib/knowledge/tokens";
import { cn } from "@/lib/utils";

export function KnowledgeDetailBannerShell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("shrink-0 px-4 pt-3", className)}>
      <div className={cn(kbDetailBannerShell, "relative")}>
        <img
          src={kbHeaderBackground}
          alt=""
          aria-hidden
          className="pointer-events-none absolute inset-0 h-full w-full object-cover object-[right_center] opacity-40 select-none"
          draggable={false}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-0 w-[min(72%,680px)] bg-gradient-to-r from-white/94 via-white/78 to-transparent"
        />
        <div className="relative z-[1] px-5 py-4">{children}</div>
      </div>
    </section>
  );
}

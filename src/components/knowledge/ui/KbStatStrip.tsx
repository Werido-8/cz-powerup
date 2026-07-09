import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { kbCardShell, kbRadius } from "@/lib/knowledge/tokens";

export interface KbStatItem {
  label: string;
  value: string | number;
  icon?: LucideIcon;
}

export function KbStatStrip({
  items,
  className,
}: {
  items: KbStatItem[];
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mb-4 grid gap-3",
        items.length === 3 ? "grid-cols-3" : "grid-cols-2 sm:grid-cols-4",
        className,
      )}
    >
      {items.map((item) => (
        <KbStatCard key={item.label} {...item} />
      ))}
    </div>
  );
}

function KbStatCard({ label, value, icon: Icon }: KbStatItem) {
  return (
    <div
      className={cn(
        kbCardShell,
        kbRadius.sm,
        "flex h-[72px] items-center gap-3 px-4",
      )}
    >
      {Icon && (
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-[8px] bg-primary-soft text-primary">
          <Icon className="h-4 w-4 stroke-[1.8]" />
        </div>
      )}
      <div className="min-w-0">
        <div className="text-[11.5px] font-medium text-kb-muted">{label}</div>
        <div className="mt-0.5 text-[22px] font-bold tabular-nums leading-none text-kb-heading">
          {value}
        </div>
      </div>
    </div>
  );
}

export function KbInlineStats({
  items,
  className,
}: {
  items: { label: string; value: string | number }[];
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap gap-4", className)}>
      {items.map((item) => (
        <div key={item.label} className="text-center">
          <div className="text-[18px] font-semibold tabular-nums text-kb-heading">
            {item.value}
          </div>
          <div className="mt-0.5 text-[11px] text-kb-muted">{item.label}</div>
        </div>
      ))}
    </div>
  );
}

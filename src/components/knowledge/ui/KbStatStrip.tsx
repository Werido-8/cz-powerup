import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { kbCardShell, kbFlatCardShell, kbRadius } from "@/lib/knowledge/tokens";

export interface KbStatItem {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  iconTone?: "primary" | "success" | "warning" | "info";
}

const statIconToneClasses: Record<
  NonNullable<KbStatItem["iconTone"]>,
  string
> = {
  primary: "bg-primary-soft text-primary",
  success: "bg-[#EAFBF1] text-[#19A974]",
  warning: "bg-[#FFF7ED] text-[#C76A16]",
  info: "bg-[#F1F7FF] text-[#2F6FB0]",
};

export function KbStatStrip({
  items,
  className,
  variant = "default",
}: {
  items: KbStatItem[];
  className?: string;
  variant?: "default" | "flat" | "divided";
}) {
  if (variant === "divided") {
    return (
      <div
        className={cn(
          "grid divide-x divide-[#E8F0F2]",
          items.length === 3 ? "grid-cols-3" : "grid-cols-2 sm:grid-cols-4",
          className,
        )}
      >
        {items.map((item) => (
          <KbStatCardDivided key={item.label} {...item} />
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "mb-4 grid gap-3",
        items.length === 3 ? "grid-cols-3" : "grid-cols-2 sm:grid-cols-4",
        className,
      )}
    >
      {items.map((item) => (
        <KbStatCard key={item.label} {...item} variant={variant} />
      ))}
    </div>
  );
}

function KbStatCardDivided({ label, value, icon: Icon, iconTone = "primary" }: KbStatItem) {
  return (
    <div className="flex h-[76px] items-center gap-3 px-5">
      {Icon && (
        <div
          className={cn(
            "grid h-9 w-9 shrink-0 place-items-center rounded-[8px]",
            statIconToneClasses[iconTone],
          )}
        >
          <Icon className="h-4 w-4 stroke-[1.8]" />
        </div>
      )}
      <div className="min-w-0">
        <div className="text-[12px] font-medium text-kb-muted">{label}</div>
        <div className="mt-1 text-[24px] font-bold tabular-nums leading-none tracking-tight text-kb-heading">
          {value}
        </div>
      </div>
    </div>
  );
}

function KbStatCard({
  label,
  value,
  icon: Icon,
  iconTone = "primary",
  variant = "default",
}: KbStatItem & { variant?: "default" | "flat" }) {
  return (
    <div
      className={cn(
        variant === "flat" ? kbFlatCardShell : kbCardShell,
        kbRadius.sm,
        "flex h-[72px] items-center gap-3 px-4",
      )}
    >
      {Icon && (
        <div
          className={cn(
            "grid h-9 w-9 shrink-0 place-items-center rounded-[8px]",
            statIconToneClasses[iconTone],
          )}
        >
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

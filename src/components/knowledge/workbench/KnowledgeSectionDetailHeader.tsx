import type { ReactNode } from "react";
import kbHeaderBackground from "@/assets/image.png";
import { StatIconFrame, Tag } from "@/components/learning/ui";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export function KnowledgeSectionDetailHeader({
  icon,
  title,
  badge,
  description,
  meta,
  breadcrumb,
  action,
  className,
}: {
  icon: ReactNode;
  title: string;
  badge?: string;
  description?: string;
  meta?: ReactNode;
  breadcrumb?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("relative shrink-0 overflow-hidden border-b border-divider", className)}>
      <img
        src={kbHeaderBackground}
        alt=""
        aria-hidden
        className="pointer-events-none absolute inset-0 h-full w-full object-cover object-[right_center] select-none"
        draggable={false}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 w-[min(72%,680px)] bg-gradient-to-r from-white/88 via-white/45 to-transparent"
      />

      <div className="relative z-[1] px-5 py-4">
        {breadcrumb && <div className="mb-3">{breadcrumb}</div>}

        <div className="flex min-w-0 items-start justify-between gap-3">
          <div className="flex min-w-0 flex-1 items-start gap-3.5">
            <StatIconFrame icon={icon} />

            <div className="min-w-0 flex-1 pt-0.5">
              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                <h1 className="text-[20px] font-semibold tracking-tight text-foreground">{title}</h1>
                {badge && (
                  <Tag variant="primary" className="h-6 px-2.5 text-[11px]">
                    {badge}
                  </Tag>
                )}
              </div>

              {(description || meta) && (
                <div className="mt-1.5 flex flex-wrap items-center gap-x-5 gap-y-1">
                  {description && (
                    <TooltipProvider delayDuration={200}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <p className="w-[65%] shrink-0 truncate text-[13px] text-muted-foreground">
                            {description}
                          </p>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="max-w-sm text-[12px] leading-relaxed">
                          {description}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                  {meta && (
                    <div className="flex shrink-0 items-center gap-2.5 text-[11.5px] text-muted-foreground">
                      {meta}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          {action}
        </div>
      </div>
    </section>
  );
}

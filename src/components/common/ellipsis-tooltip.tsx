import { useEffect, useRef, useState } from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

const POPOVER_CLASS =
  "max-w-[min(24rem,90vw)] border-0 bg-[#303133] px-3 py-2 text-[12px] leading-relaxed text-white shadow-[0_2px_12px_rgba(0,0,0,0.15)]";

/** 单行省略，溢出时悬浮于上方显示完整内容（类似 Element Plus Tooltip） */
export function EllipsisTooltip({
  text,
  className,
  lines = 1,
}: {
  text: string;
  className?: string;
  lines?: 1 | 2;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [overflow, setOverflow] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const check = () => {
      if (lines === 1) {
        setOverflow(el.scrollWidth > el.clientWidth + 1);
      } else {
        setOverflow(el.scrollHeight > el.clientHeight + 1);
      }
    };

    check();
    const observer = new ResizeObserver(check);
    observer.observe(el);
    return () => observer.disconnect();
  }, [text, lines]);

  const trigger = (
    <span
      ref={ref}
      className={cn(
        "block min-w-0 max-w-full cursor-default",
        lines === 1 ? "truncate" : "line-clamp-2",
        className,
      )}
    >
      {text}
    </span>
  );

  if (!overflow) return trigger;

  return (
    <Tooltip delayDuration={200}>
      <TooltipTrigger asChild>{trigger}</TooltipTrigger>
      <TooltipContent side="top" sideOffset={8} className={POPOVER_CLASS}>
        {text}
        <TooltipPrimitive.Arrow className="fill-[#303133]" width={10} height={5} />
      </TooltipContent>
    </Tooltip>
  );
}

/** 表格题干单元格 */
export function StemCell({
  text,
  className,
  maxWidthClass = "max-w-[320px]",
}: {
  text: string;
  className?: string;
  maxWidthClass?: string;
}) {
  return (
    <td className={cn("px-4 py-3 align-middle", maxWidthClass)}>
      <EllipsisTooltip text={text} className={cn("font-medium leading-relaxed", className)} />
    </td>
  );
}

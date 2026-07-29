import { useEffect, useRef, useState, type ComponentProps } from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export const ELLIPSIS_TOOLTIP_CLASS =
  "max-w-[min(24rem,90vw)] border-0 bg-[#303133] px-3 py-2 text-[12px] leading-relaxed text-white shadow-[0_2px_12px_rgba(0,0,0,0.15)]";

const POPOVER_CLASS = ELLIPSIS_TOOLTIP_CLASS;

export function useTextOverflow<T extends HTMLElement>(
  lines: 1 | 2,
  deps: unknown[],
) {
  const ref = useRef<T>(null);
  const [overflow, setOverflow] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const check = () => {
      requestAnimationFrame(() => {
        const node = ref.current;
        if (!node) return;

        if (lines === 1) {
          const widthOverflow = node.scrollWidth > node.clientWidth + 1;
          if (widthOverflow) {
            setOverflow(true);
            return;
          }

          const range = document.createRange();
          range.selectNodeContents(node);
          const textWidth = range.getBoundingClientRect().width;
          const boxWidth = node.getBoundingClientRect().width;
          setOverflow(textWidth > boxWidth + 1);
          return;
        }

        setOverflow(node.scrollHeight > node.clientHeight + 1);
      });
    };

    check();
    const observer = new ResizeObserver(check);
    observer.observe(el);
    let parent: HTMLElement | null = el.parentElement;
    for (let depth = 0; parent && depth < 3; depth += 1) {
      observer.observe(parent);
      parent = parent.parentElement;
    }
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { ref, overflow };
}

/** 单行省略，溢出时悬浮显示完整内容（类似 Element Plus Tooltip） */
export function EllipsisTooltip({
  text,
  className,
  lines = 1,
  side = "top",
  sideOffset = 8,
  contentClassName,
}: {
  text: string;
  className?: string;
  lines?: 1 | 2;
  side?: ComponentProps<typeof TooltipContent>["side"];
  sideOffset?: number;
  contentClassName?: string;
}) {
  const { ref, overflow } = useTextOverflow<HTMLSpanElement>(lines, [text, lines]);

  const titleClass = cn(
    "min-w-0 max-w-full",
    lines === 1 ? "truncate" : "line-clamp-2",
    className,
  );

  return (
    <Tooltip delayDuration={200} {...(overflow ? {} : { open: false })}>
      <TooltipTrigger asChild>
        <span ref={ref} className={titleClass}>
          {text}
        </span>
      </TooltipTrigger>
      {overflow ? (
        <TooltipContent
          side={side}
          sideOffset={sideOffset}
          className={cn(POPOVER_CLASS, "whitespace-normal", contentClassName)}
        >
          {text}
          {side === "top" ? (
            <TooltipPrimitive.Arrow className="fill-[#303133]" width={10} height={5} />
          ) : null}
        </TooltipContent>
      ) : null}
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

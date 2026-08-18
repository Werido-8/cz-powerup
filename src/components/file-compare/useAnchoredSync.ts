import { useCallback, useRef } from "react";
import type { CompareSide } from "@/lib/file-compare/types";

interface AnchorPosition {
  anchor: string;
  top: number;
}

/** 探测点距容器顶部的偏移，用于判断“当前正在阅读哪个段落” */
const PROBE_OFFSET = 12;

/** 定位差异时在其上方保留的上下文高度，让所属标题仍可见 */
const CONTEXT_OFFSET = 76;

function relativeTop(element: HTMLElement, container: HTMLElement) {
  return (
    element.getBoundingClientRect().top -
    container.getBoundingClientRect().top +
    container.scrollTop
  );
}

function collectAnchors(container: HTMLElement): AnchorPosition[] {
  return Array.from(container.querySelectorAll<HTMLElement>("[data-anchor]")).map((element) => ({
    anchor: element.dataset.anchor ?? "",
    top: relativeTop(element, container),
  }));
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

/**
 * 基于段落锚点的双栏同步滚动。
 * 不直接复制 scrollTop：先找到源栏顶部所在的锚点段落与段内进度，
 * 再把目标栏滚动到同名锚点的相同进度，因此两侧内容高度不同时也能保持段落对齐。
 */
export function useAnchoredSync() {
  const baseRef = useRef<HTMLDivElement | null>(null);
  const targetRef = useRef<HTMLDivElement | null>(null);
  const lockRef = useRef(false);

  const getPane = useCallback(
    (side: CompareSide) => (side === "base" ? baseRef.current : targetRef.current),
    [],
  );

  const align = useCallback(
    (from: CompareSide) => {
      if (lockRef.current) return;
      const source = getPane(from);
      const dest = getPane(from === "base" ? "target" : "base");
      if (!source || !dest) return;

      const sourceAnchors = collectAnchors(source);
      if (sourceAnchors.length === 0) return;

      const probe = source.scrollTop + PROBE_OFFSET;
      let index = 0;
      for (let i = 0; i < sourceAnchors.length; i += 1) {
        if (sourceAnchors[i].top <= probe) index = i;
        else break;
      }

      const current = sourceAnchors[index];
      const next = sourceAnchors[index + 1];
      const sourceSpan = next
        ? next.top - current.top
        : Math.max(1, source.scrollHeight - current.top);
      const ratio = clamp((probe - current.top) / Math.max(1, sourceSpan), 0, 1);

      const destAnchors = collectAnchors(dest);
      const destCurrent = destAnchors.find((item) => item.anchor === current.anchor);
      if (!destCurrent) return;
      const destNext = next ? destAnchors.find((item) => item.anchor === next.anchor) : undefined;
      const destSpan = destNext
        ? destNext.top - destCurrent.top
        : Math.max(1, dest.scrollHeight - destCurrent.top);

      const nextScrollTop = clamp(
        destCurrent.top + ratio * destSpan - PROBE_OFFSET,
        0,
        Math.max(0, dest.scrollHeight - dest.clientHeight),
      );

      if (Math.abs(dest.scrollTop - nextScrollTop) < 1) return;

      lockRef.current = true;
      dest.scrollTop = nextScrollTop;
      window.requestAnimationFrame(() => {
        lockRef.current = false;
      });
    },
    [getPane],
  );

  /** 将两栏同时滚动到指定锚点 */
  const scrollToAnchor = useCallback(
    (anchor: string, behavior: ScrollBehavior = "smooth") => {
      lockRef.current = true;
      for (const side of ["base", "target"] as const) {
        const pane = getPane(side);
        if (!pane) continue;
        const element = pane.querySelector<HTMLElement>(`[data-anchor="${anchor}"]`);
        if (!element) continue;
        const top = clamp(
          relativeTop(element, pane) - CONTEXT_OFFSET,
          0,
          Math.max(0, pane.scrollHeight - pane.clientHeight),
        );
        pane.scrollTo({ top, behavior });
      }
      window.setTimeout(
        () => {
          lockRef.current = false;
        },
        behavior === "smooth" ? 420 : 60,
      );
    },
    [getPane],
  );

  return { baseRef, targetRef, align, scrollToAnchor };
}

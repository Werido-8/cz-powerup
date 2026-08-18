import type { Ref, UIEvent } from "react";
import { DIFF_TONE_CLASSES } from "@/lib/file-compare/meta";
import type { CompareDocument, DocBlock, DocSpan } from "@/lib/file-compare/types";
import { cn } from "@/lib/utils";

/** 基准 / 更新文档阅读面板：固定文件标题栏 + 内部滚动正文 */
export function DocumentPane({
  doc,
  currentPage,
  zoom,
  blocks,
  scrollRef,
  onScroll,
  className,
}: {
  doc: CompareDocument;
  currentPage: number;
  /** 缩放百分比，通过基准字号换算，不使用 transform 缩放 */
  zoom: number;
  blocks: DocBlock[];
  scrollRef: Ref<HTMLDivElement>;
  onScroll: (event: UIEvent<HTMLDivElement>) => void;
  className?: string;
}) {
  const isBase = doc.side === "base";

  return (
    <section className={cn("flex min-h-0 min-w-0 flex-col", className)}>
      <header className="flex h-9 shrink-0 items-center justify-between gap-3 border-b border-kb-border bg-[#FAFCFC] px-4">
        <span className="flex min-w-0 items-baseline gap-2">
          <span className="shrink-0 text-[12.5px] font-semibold text-kb-heading">
            {isBase ? "基准文件" : "更新文件"}
          </span>
          <span className="min-w-0 truncate text-[12px] text-kb-muted">{doc.fileName}</span>
        </span>
        <span className="shrink-0 text-[11.5px] tabular-nums text-kb-muted">
          第 {currentPage} / {doc.totalPages} 页
        </span>
      </header>

      <div
        ref={scrollRef}
        onScroll={onScroll}
        className="scrollbar-thin relative min-h-0 flex-1 overflow-y-auto px-5 py-4"
        style={{ fontSize: `${(13 * zoom) / 100}px` }}
      >
        {blocks.map((block) => (
          <DocumentBlock key={block.id} block={block} />
        ))}
        <div className="h-16" aria-hidden />
      </div>
    </section>
  );
}

function DocumentBlock({ block }: { block: DocBlock }) {
  if (block.kind === "heading") {
    return (
      <div
        data-anchor={block.anchor}
        className={cn(
          "scroll-mt-4 font-semibold text-kb-heading",
          block.level === 1 ? "mb-2.5 mt-5 text-[1.16em] first:mt-0" : "mb-2 mt-4 text-[1.04em]",
        )}
      >
        {block.text}
      </div>
    );
  }

  if (block.kind === "table") {
    return (
      <div data-anchor={block.anchor} className="my-3 scroll-mt-4 overflow-hidden">
        <table className="w-full table-fixed border-collapse text-[0.94em]">
          <thead>
            <tr>
              {block.columns.map((column) => (
                <th
                  key={column}
                  className="border border-[#E1EAEC] bg-[#F5F8F9] px-3 py-2 text-left font-medium text-kb-body"
                >
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {block.rows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {row.map((cell, cellIndex) => (
                  <td
                    key={cellIndex}
                    className="border border-[#E1EAEC] px-3 py-2 align-top text-kb-body"
                  >
                    <SpanList spans={cell} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <p
      data-anchor={block.anchor}
      className="my-2.5 scroll-mt-4 text-[1em] leading-[1.85] text-kb-body"
    >
      <SpanList spans={block.spans} />
    </p>
  );
}

function SpanList({ spans }: { spans: DocSpan[] }) {
  return (
    <>
      {spans.map((span, index) =>
        span.tone ? (
          <mark
            key={index}
            className={cn(
              "rounded-[3px] px-1 py-[1.5px] font-normal",
              DIFF_TONE_CLASSES[span.tone],
            )}
          >
            {span.text}
          </mark>
        ) : (
          <span key={index}>{span.text}</span>
        ),
      )}
    </>
  );
}

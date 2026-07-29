import { splitByKeyword } from "@/lib/knowledge/fulltextSearch";

/**
 * Renders `text` with every occurrence of `keyword` wrapped in a highlighted
 * <mark> element.  Used both in FullTextSearchResultPanel and the AI-panel
 * "搜索命中" tab to keep highlight styles consistent.
 */
export function KbHighlightText({ text, keyword }: { text: string; keyword: string }) {
  const parts = splitByKeyword(text, keyword);
  return (
    <>
      {parts.map((part, index) =>
        part.matched ? (
          <mark
            key={index}
            className="rounded-[3px] bg-warning-soft px-0.5 py-px font-semibold text-warning-foreground"
          >
            {part.text}
          </mark>
        ) : (
          <span key={index}>{part.text}</span>
        ),
      )}
    </>
  );
}

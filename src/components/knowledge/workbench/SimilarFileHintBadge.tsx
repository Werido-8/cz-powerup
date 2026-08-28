import { GitCompareArrows } from "lucide-react";
import { getBaseById } from "@/lib/knowledge/model";
import { fileHasSimilarCandidates } from "@/lib/knowledge/similarFiles";
import type { KnowledgeFile } from "@/lib/knowledge/types";

export function shouldShowSimilarFileHint(file: KnowledgeFile) {
  const base = getBaseById(file.knowledgeBaseId);
  return (
    base?.scope === "personal" &&
    file.parseStatus === "success" &&
    fileHasSimilarCandidates(file.name)
  );
}

export function SimilarFileHintBadge({
  onClick,
  nested = false,
}: {
  onClick: () => void;
  /** 放在卡片主按钮内部时用 span，避免按钮嵌套 */
  nested?: boolean;
}) {
  const className =
    "inline-flex shrink-0 items-center gap-0.5 rounded-[5px] border border-[#F4DEC2] bg-[#FEF6EC] px-1.5 py-0.5 text-[10.5px] font-medium text-[#C0691A] transition-colors hover:border-[#E8A85C] hover:bg-[#FDE8CC]";
  const content = (
    <>
      <GitCompareArrows className="h-3 w-3" />
      相似
    </>
  );
  const handleClick = (event: { stopPropagation: () => void; preventDefault: () => void }) => {
    event.stopPropagation();
    event.preventDefault();
    onClick();
  };

  if (nested) {
    return (
      <span
        role="button"
        tabIndex={0}
        title="发现相似资料，点击查看"
        onClick={handleClick}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") handleClick(event);
        }}
        className={className}
      >
        {content}
      </span>
    );
  }

  return (
    <button type="button" title="发现相似资料，点击查看" onClick={handleClick} className={className}>
      {content}
    </button>
  );
}

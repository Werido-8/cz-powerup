import { RefreshCw } from "lucide-react";
import knowledgeDisabledIllustration from "@/assets/knowledge-disabled.png";
import { KbButton } from "@/components/knowledge/ui";
import { cn } from "@/lib/utils";

export function KnowledgeDisabledState({
  className,
  onEnable,
}: {
  className?: string;
  onEnable?: () => void;
}) {
  return (
    <div
      className={cn(
        "flex min-h-0 flex-1 flex-col items-center justify-center px-6 py-10",
        className,
      )}
    >
      <div className="flex w-full max-w-[300px] flex-col items-center">
        <img
          src={knowledgeDisabledIllustration}
          alt=""
          aria-hidden
          draggable={false}
          className="pointer-events-none h-auto w-full select-none"
        />
      </div>

      <div className="mt-5 max-w-[360px] text-center">
        <h1 className="text-[16px] font-semibold text-kb-heading">知识库已停用</h1>
        <p className="mt-2 text-[12.5px] leading-relaxed text-kb-muted">
          该知识库当前不可浏览与检索。如需继续使用，请重新启用。
        </p>
        {onEnable && (
          <div className="mt-5 flex justify-center">
            <KbButton
              onClick={onEnable}
              className="shadow-[0_8px_20px_rgba(52,155,172,0.28)]"
            >
              <RefreshCw className="h-4 w-4 stroke-[1.8]" />
              启用知识库
            </KbButton>
          </div>
        )}
      </div>
    </div>
  );
}

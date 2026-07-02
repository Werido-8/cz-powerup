import { Sparkles } from "lucide-react";
import { getLibraryById } from "@/lib/mock/knowledge-utils";

type KbAiPanelProps = {
  libraryId: string;
  fileId?: string;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
};

/** 本期暂不开放：智能问答侧栏占位 */
export function KbAiPanel({ libraryId, collapsed }: KbAiPanelProps) {
  const library = getLibraryById(libraryId);

  if (collapsed) return null;

  return (
    <aside className="flex w-[300px] shrink-0 flex-col border-l border-border bg-card">
      <div className="border-b border-border bg-primary-soft/40 px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-primary/40 text-primary-foreground">
            <Sparkles className="h-3.5 w-3.5" />
          </div>
          <div className="min-w-0">
            <div className="text-[13px] font-semibold text-foreground">AI 问答</div>
            <p className="truncate text-[11px] text-muted-foreground">
              {library?.name ?? "当前知识库"}
            </p>
          </div>
        </div>
      </div>
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-10 text-center">
        <p className="text-[13px] font-medium text-foreground">本期暂未开放</p>
        <p className="mt-2 text-[12px] leading-relaxed text-muted-foreground">
          智能问答功能将在后续版本提供，当前请通过资料阅读与题库训练进行学习。
        </p>
      </div>
    </aside>
  );
}

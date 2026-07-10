import { FolderPlus } from "lucide-react";
import type { ReactNode } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { KnowledgeBasePlusIcon } from "./KnowledgeBasePlusIcon";

function SectionIconButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            aria-label={label}
            onClick={onClick}
            className={cn(
              "grid h-6 w-6 shrink-0 place-items-center rounded-[6px] text-kb-muted transition-colors",
              "hover:bg-kb-surface-hover hover:text-kb-body",
            )}
          >
            {children}
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-[12px]">
          {label}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function KnowledgeTreeSectionActions({
  onAddDirectory,
  onAddKnowledgeBase,
  directoryLabel = "新建目录",
  knowledgeBaseLabel = "新建知识库",
}: {
  onAddDirectory: () => void;
  onAddKnowledgeBase: () => void;
  directoryLabel?: string;
  knowledgeBaseLabel?: string;
}) {
  return (
    <div className="flex shrink-0 items-center gap-0.5">
      <SectionIconButton label={directoryLabel} onClick={onAddDirectory}>
        <FolderPlus className="h-3.5 w-3.5 stroke-[1.8]" />
      </SectionIconButton>
      <SectionIconButton label={knowledgeBaseLabel} onClick={onAddKnowledgeBase}>
        <KnowledgeBasePlusIcon />
      </SectionIconButton>
    </div>
  );
}

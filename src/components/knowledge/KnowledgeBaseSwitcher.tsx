import { Link } from "@tanstack/react-router";
import { ChevronDown } from "lucide-react";
import type { KnowledgeBase } from "@/lib/mock/knowledge-space";
import { getSiblingKnowledgeBases } from "@/lib/mock/knowledge-utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export function KnowledgeBaseSwitcher({
  current,
  compact,
}: {
  current: KnowledgeBase;
  compact?: boolean;
}) {
  const siblings = getSiblingKnowledgeBases(current.id);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex max-w-full items-center gap-2 rounded-lg text-left font-bold text-[#1F3440] transition-colors hover:bg-[#F5FAFB]",
            compact ? "px-1 py-1 text-[14px]" : "px-2 py-1 text-[18px]",
          )}
        >
          <span className={cn("truncate", compact && "line-clamp-2 whitespace-normal")}>
            {current.name}
          </span>
          <ChevronDown className="h-4 w-4 shrink-0 text-[#607681]" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[360px]">
        {siblings.map((base) => (
          <DropdownMenuItem key={base.id} asChild>
            <Link
              to="/knowledge/kb/$kbId"
              params={{ kbId: base.id }}
              className="flex cursor-pointer flex-col items-start gap-1 py-2"
            >
              <span className="text-[13px] font-semibold">{base.name}</span>
              <span className="text-[11px] text-muted-foreground">
                {base.fileCount} 个文件 · 最近更新 {base.latestUpdateTime}
              </span>
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

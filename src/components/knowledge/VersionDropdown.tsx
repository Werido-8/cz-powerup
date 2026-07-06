import { ChevronDown, Download } from "lucide-react";
import type { KnowledgeVersion } from "@/lib/mock/knowledge-space";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

type VersionDropdownProps = {
  versions: KnowledgeVersion[];
  currentVersionId?: string;
  onVersionChange: (versionId: string) => void;
};

export function VersionDropdown({
  versions,
  currentVersionId,
  onVersionChange,
}: VersionDropdownProps) {
  const current =
    versions.find((version) => version.id === currentVersionId) ??
    versions.find((version) => version.isCurrent) ??
    versions[0];
  if (!current) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="inline-flex h-8 items-center gap-2 rounded-full border border-[#E2ECEF] bg-white px-3 text-[12px] text-[#1F3440] shadow-[0_8px_18px_-16px_rgba(31,52,64,0.5)] transition-colors hover:bg-[#FBFDFD]"
        >
          {current.versionNo} · {current.versionName}
          <ChevronDown className="h-3.5 w-3.5 text-[#607681] stroke-[1.9]" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[360px] rounded-[14px] border-[#E2ECEF]">
        {versions.map((version) => (
          <DropdownMenuItem
            key={version.id}
            onClick={() => onVersionChange(version.id)}
            className={cn(
              "flex cursor-pointer items-start gap-3 py-3",
              version.isCurrent ? "bg-[#EAF7F9]/70" : "opacity-85",
            )}
          >
            <span
              className={cn(
                "mt-0.5 rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                version.isCurrent
                  ? "border-[#CFE9ED] bg-white text-[#268C9A]"
                  : "border-[#DDE8EA] bg-[#F7FAFB] text-[#8EA1A8]",
              )}
            >
              {version.versionNo}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[13px] font-semibold text-[#1F3440]">
                {version.isCurrent ? "当前版" : "历史版"} · {version.versionName}
              </span>
              <span className="mt-1 block text-[11px] text-muted-foreground">
                {version.description}
              </span>
              <span className="mt-1 block text-[10px] text-muted-foreground">
                {version.uploadedAt} · {version.uploadedBy}
              </span>
            </span>
            {!version.isCurrent && <Download className="mt-1 h-3.5 w-3.5 text-[#8EA1A8] stroke-[1.8]" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

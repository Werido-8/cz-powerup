import {
  FileArchive,
  FileImage,
  FileSpreadsheet,
  FileText,
  FileVideo,
  Presentation,
} from "lucide-react";
import type { KnowledgeFileType } from "@/lib/mock/knowledge-space";
import { cn } from "@/lib/utils";

const typeConfig: Record<KnowledgeFileType, { label: string; className: string; icon: typeof FileText }> = {
  pdf: { label: "PDF", className: "bg-[#EAF7F9] text-[#349BAC] ring-[#D7ECEF]", icon: FileText },
  word: { label: "Word", className: "bg-[#EEF6FF] text-[#2B6CB0] ring-[#D7E8FA]", icon: FileText },
  excel: { label: "Excel", className: "bg-[#ECF9F3] text-[#16815E] ring-[#CFEFE1]", icon: FileSpreadsheet },
  ppt: { label: "PPT", className: "bg-[#FFF8EA] text-[#A76F15] ring-[#F5E3BE]", icon: Presentation },
  image: { label: "图片", className: "bg-[#ECF9F3] text-[#16815E] ring-[#CFEFE1]", icon: FileImage },
  video: { label: "视频", className: "bg-[#FFF8EA] text-[#A76F15] ring-[#F5E3BE]", icon: FileVideo },
  audio: { label: "音频", className: "bg-[#FFF8EA] text-[#A76F15] ring-[#F5E3BE]", icon: FileVideo },
  other: { label: "文件", className: "bg-[#F7FAFB] text-[#607681] ring-[#E2ECEF]", icon: FileArchive },
};

export function FileTypeIcon({
  type,
  size = "md",
  showLabel,
}: {
  type: KnowledgeFileType;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}) {
  const config = typeConfig[type];
  const Icon = config.icon;
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center gap-1.5 rounded-[9px] font-semibold ring-1",
        config.className,
        size === "sm" && "h-7 min-w-7 px-1.5 text-[10px]",
        size === "md" && "h-10 min-w-10 px-2 text-[10.5px]",
        size === "lg" && "h-12 min-w-12 px-2.5 text-[11px]",
      )}
    >
      <Icon className={cn("stroke-[1.8]", size === "sm" ? "h-3.5 w-3.5" : "h-[18px] w-[18px]")} />
      {showLabel && <span>{config.label}</span>}
    </span>
  );
}

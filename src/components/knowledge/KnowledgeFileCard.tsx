import { MoreHorizontal } from "lucide-react";
import type { KnowledgeFile } from "@/lib/mock/knowledge-space";
import { parseStatusLabel, publishStatusLabel } from "@/lib/mock/knowledge-utils";
import { FileStatusTag, parseTone, permissionLabel, publishTone } from "./FileStatusTag";
import { FileTypeIcon } from "./FileTypeIcon";
import { VersionBadge } from "./VersionBadge";

export function KnowledgeFileCard({
  file,
  onClick,
}: {
  file: KnowledgeFile;
  onClick: (file: KnowledgeFile) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onClick(file)}
      className="group flex min-h-[150px] flex-col rounded-[12px] border border-[#E6F0F2] bg-white p-4 text-left transition-all hover:-translate-y-0.5 hover:border-[#D8E7EA] hover:bg-[#FBFDFD] hover:shadow-[0_14px_30px_-24px_rgba(31,52,64,0.55)]"
    >
      <div className="flex items-start justify-between gap-2">
        <FileTypeIcon type={file.type} size="md" showLabel />
        <div className="flex items-center gap-1">
          {file.hasHistoryVersions && <VersionBadge version={file.currentVersion} />}
          <MoreHorizontal className="h-4 w-4 text-[#8EA1A8] opacity-0 transition-opacity group-hover:opacity-100" />
        </div>
      </div>
      <div className="mt-3 line-clamp-2 text-[13px] font-semibold leading-snug text-[#1F3440]">
        {file.name}
      </div>
      <div className="mt-2 line-clamp-2 text-[12px] leading-relaxed text-[#607681]">
        {file.summary}
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        <FileStatusTag>{permissionLabel(file.permission)}</FileStatusTag>
        <FileStatusTag tone={parseTone(file.parseStatus)}>
          {parseStatusLabel(file.parseStatus)}
        </FileStatusTag>
        {file.publishStatus !== "published" && (
          <FileStatusTag tone={publishTone(file.publishStatus)}>
            {publishStatusLabel(file.publishStatus)}
          </FileStatusTag>
        )}
      </div>
      <div className="mt-auto flex items-center justify-between border-t border-[#EDF3F5] pt-3 text-[11px] text-[#8EA1A8]">
        <span>{file.updatedAt}</span>
        <span>{file.size}</span>
      </div>
    </button>
  );
}

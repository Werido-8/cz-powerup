import { MoreHorizontal } from "lucide-react";
import type { KnowledgeFile } from "@/lib/mock/knowledge-space";
import { parseStatusLabel, publishStatusLabel } from "@/lib/mock/knowledge-utils";
import { FileStatusTag, parseTone, permissionLabel, publishTone } from "./FileStatusTag";
import { FileTypeIcon } from "./FileTypeIcon";
import { VersionBadge } from "./VersionBadge";

export function KnowledgeFileRow({
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
      className="group grid min-h-[54px] w-full grid-cols-[minmax(280px,1fr)_150px] items-center border-b border-[#EDF3F5] px-4 text-left transition-colors last:border-b-0 hover:bg-[#F8FCFC]"
    >
      <span className="flex min-w-0 items-center gap-2.5">
        <FileTypeIcon type={file.type} size="sm" />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13px] font-medium text-[#1F3440]">{file.name}</span>
          <span className="mt-0.5 block truncate text-[11px] text-[#8EA1A8]">{file.summary}</span>
        </span>
        {file.hasHistoryVersions && <VersionBadge version={file.currentVersion} />}
        <FileStatusTag tone={parseTone(file.parseStatus)}>{parseStatusLabel(file.parseStatus)}</FileStatusTag>
        {file.publishStatus !== "published" && (
          <FileStatusTag tone={publishTone(file.publishStatus)}>
            {publishStatusLabel(file.publishStatus)}
          </FileStatusTag>
        )}
        <span className="sr-only">{permissionLabel(file.permission)}</span>
      </span>
      <span className="flex items-center justify-end gap-2 text-[12px] text-[#8EA1A8]">
        {file.updatedAt}
        <MoreHorizontal className="h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100" />
      </span>
    </button>
  );
}

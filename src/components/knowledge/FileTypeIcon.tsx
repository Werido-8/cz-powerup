import { KbFileTypeIcon } from "@/components/knowledge/ui";
import type { KnowledgeFileType } from "@/lib/mock/knowledge-space";

export function FileTypeIcon({
  type,
  size = "md",
  showLabel,
}: {
  type: KnowledgeFileType;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}) {
  return (
    <KbFileTypeIcon
      type={type}
      size={size}
      showLabel={showLabel}
      className={showLabel ? "font-semibold text-kb-body" : undefined}
    />
  );
}

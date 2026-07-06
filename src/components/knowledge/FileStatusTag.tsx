import type { ReactNode } from "react";
import type {
  KnowledgeBasePermission,
  KnowledgeParseStatus,
  KnowledgePublishStatus,
  UploadRecordStatus,
} from "@/lib/mock/knowledge-space";
import { cn } from "@/lib/utils";

type Tone = "default" | "primary" | "success" | "warning" | "danger";

const toneClass: Record<Tone, string> = {
  default: "border-[#DDE8EA] bg-[#F7FAFB] text-[#607681]",
  primary: "border-[#CFE9ED] bg-[#EAF7F9] text-[#268C9A]",
  success: "border-[#CFEFE1] bg-[#ECF9F3] text-[#16815E]",
  warning: "border-[#F5E3BE] bg-[#FFF8EA] text-[#A76F15]",
  danger: "border-[#F4D1D1] bg-[#FFF3F3] text-[#C94747]",
};

export function FileStatusTag({ children, tone = "default" }: { children: ReactNode; tone?: Tone }) {
  return (
    <span
      className={cn(
        "inline-flex h-[22px] items-center rounded-full border px-2 text-[10.5px] font-medium leading-none",
        toneClass[tone],
      )}
    >
      {children}
    </span>
  );
}

export function permissionLabel(permission: KnowledgeBasePermission) {
  if (permission === "public") return "公共";
  if (permission === "department") return "本部门";
  if (permission === "personal") return "个人";
  return "已授权";
}

export function parseTone(status: KnowledgeParseStatus): Tone {
  if (status === "done") return "success";
  if (status === "failed") return "danger";
  return "warning";
}

export function publishTone(status: KnowledgePublishStatus): Tone {
  if (status === "published") return "success";
  if (status === "rejected") return "danger";
  return "warning";
}

export function uploadTone(status: UploadRecordStatus): Tone {
  if (status === "published") return "success";
  if (status === "rejected") return "danger";
  if (status === "processing") return "primary";
  return "warning";
}

import {
  FileArchive,
  FileImage,
  FileSpreadsheet,
  FileText,
  FileType2,
} from "lucide-react";
import type { KnowledgeStatusTone } from "./status";
import type { KnowledgeFileType } from "./types";

export const kbSpacing = {
  page: "p-5",
  pageY: "py-4 px-5",
  sectionGap: "gap-4",
  sidebarAdmin: "w-[236px]",
  sidebarBrowse: "w-[280px]",
  sidebarPreview: "w-[260px]",
  aiPanel: "w-[340px]",
} as const;

export const kbRadius = {
  sm: "rounded-[8px]",
  md: "rounded-[10px]",
  lg: "rounded-[12px]",
} as const;

export const kbCardShell = "border border-kb-border bg-card shadow-card";
export const kbTableShell = `${kbCardShell} ${kbRadius.md} overflow-hidden`;
export const kbTableHead = "bg-muted/40 text-muted-foreground text-[11.5px] font-medium";
export const kbTableRow =
  "min-h-[52px] border-b border-divider transition-colors hover:bg-kb-surface-hover last:border-b-0";
export const kbRowHeight = "min-h-[52px]";

/** 知识库主内容区 */
export const kbMainPanel = "flex min-w-0 flex-1 flex-col overflow-hidden bg-white";

export const kbToneClasses: Record<KnowledgeStatusTone, string> = {
  neutral: "bg-muted text-muted-foreground",
  accent: "bg-primary-soft text-[#1498A8]",
  success: "bg-[#EAFBF1] text-[#19A974]",
  warning: "bg-[#FFF7ED] text-[#C76A16]",
  danger: "bg-[#FFF3F3] text-[#C94747]",
};

export const kbFileTypeConfig: Record<
  KnowledgeFileType,
  { label: string; icon: typeof FileText; color: string }
> = {
  pdf: { label: "PDF", icon: FileText, color: "text-destructive bg-danger-soft ring-destructive/20" },
  docx: { label: "Word", icon: FileType2, color: "text-[#2F6FB0] bg-[#F1F7FF] ring-[#CFE1F5]" },
  xlsx: {
    label: "Excel",
    icon: FileSpreadsheet,
    color: "text-success bg-success-soft ring-success/20",
  },
  pptx: { label: "PPT", icon: FileArchive, color: "text-warning-foreground bg-warning-soft ring-warning/30" },
  image: { label: "图片", icon: FileImage, color: "text-[#7A68A6] bg-[#F6F3FF] ring-[#DED7F6]" },
  other: { label: "文件", icon: FileText, color: "text-kb-muted bg-muted ring-border" },
};

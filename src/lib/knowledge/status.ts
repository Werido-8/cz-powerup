import type { FilePublishStatus, KnowledgeBaseStatus, KnowledgeParseStatus } from "./types";

export type KnowledgeStatusTone = "neutral" | "accent" | "success" | "warning" | "danger";

export function publishStatusLabel(status: FilePublishStatus) {
  const labels: Record<FilePublishStatus, string> = {
    pendingApproval: "待审批",
    rejected: "审批驳回",
    parsing: "解析中",
    parseFailed: "解析失败",
    published: "已发布",
    archived: "已归档",
    disabled: "已停用",
  };
  return labels[status];
}

export function publishStatusTone(status: FilePublishStatus): KnowledgeStatusTone {
  if (status === "published") return "success";
  if (status === "pendingApproval" || status === "parsing") return "warning";
  if (status === "rejected" || status === "parseFailed" || status === "disabled") {
    return "danger";
  }
  return "neutral";
}

export function parseStatusLabel(status?: KnowledgeParseStatus) {
  if (!status) return "待解析";
  const labels: Record<KnowledgeParseStatus, string> = {
    waiting: "待解析",
    parsing: "解析中",
    success: "解析成功",
    failed: "解析失败",
  };
  return labels[status];
}

export function parseStatusTone(status?: KnowledgeParseStatus): KnowledgeStatusTone {
  if (status === "success") return "success";
  if (status === "failed") return "danger";
  return "warning";
}

export function baseStatusLabel(status: KnowledgeBaseStatus) {
  return status === "enabled" ? "启用" : "停用";
}

export function baseStatusTone(status: KnowledgeBaseStatus): KnowledgeStatusTone {
  return status === "enabled" ? "success" : "neutral";
}

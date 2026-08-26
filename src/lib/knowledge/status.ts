import type {
  ApprovalStatus,
  ContentConfirmStatus,
  FilePublishStatus,
  KnowledgeParseStatus,
  UploadSourceType,
} from "./types";

export type KnowledgeStatusTone = "neutral" | "accent" | "success" | "warning" | "danger";

export function publishStatusLabel(status: FilePublishStatus) {
  const labels: Record<FilePublishStatus, string> = {
    uploading: "上传中",
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
  if (status === "pendingApproval" || status === "uploading" || status === "parsing") {
    return "warning";
  }
  if (status === "rejected" || status === "parseFailed" || status === "disabled") {
    return "danger";
  }
  return "neutral";
}

/**
 * 「审批状态」列专用：只表达审批维度，避免与「解析状态」列串值。
 * 解析中 / 解析失败 属于解析维度，其审批结论都是「已通过」。
 */
export function approvalStatusLabel(status: FilePublishStatus) {
  const labels: Record<FilePublishStatus, string> = {
    uploading: "上传中",
    pendingApproval: "待审批",
    rejected: "已驳回",
    parsing: "已通过",
    parseFailed: "已通过",
    published: "已发布",
    archived: "已归档",
    disabled: "已停用",
  };
  return labels[status];
}

export function approvalStatusTone(status: FilePublishStatus): KnowledgeStatusTone {
  if (status === "pendingApproval" || status === "uploading") return "warning";
  if (status === "rejected") return "danger";
  if (status === "published") return "success";
  if (status === "parsing" || status === "parseFailed") return "accent";
  if (status === "disabled") return "danger";
  return "neutral";
}

/** 审批台入库列表「审核状态」：移动类型在待内容审时回显「批准移入」 */
export function uploadApprovalReviewLabel(
  status: ApprovalStatus | undefined,
  uploadType?: UploadSourceType,
) {
  if (status === "approved") return "已通过";
  if (status === "rejected") return "已驳回";
  if (status === "parsing") return "解析中";
  if (uploadType === "move") return "批准移入";
  return "待审批";
}

export function uploadApprovalReviewTone(
  status: ApprovalStatus | undefined,
): KnowledgeStatusTone {
  if (status === "approved") return "success";
  if (status === "rejected") return "danger";
  return "warning";
}

export function uploadSourceTypeLabel(type?: UploadSourceType) {
  if (type === "move") return "移动入库";
  if (type === "copy") return "复制入库";
  return "文件上传";
}

export function contentConfirmStatusLabel(status?: ContentConfirmStatus) {
  return status === "confirmed" ? "已确认" : "未确认";
}

export function contentConfirmStatusTone(status?: ContentConfirmStatus): KnowledgeStatusTone {
  return status === "confirmed" ? "success" : "warning";
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

/** 文件列表「解析状态」列：仅展示未解析 / 解析失败 / 解析成功 */
export type FileListParseStatus = "unparsed" | "failed" | "success";

export function fileListParseStatus(file: {
  parseStatus?: KnowledgeParseStatus;
}): FileListParseStatus {
  if (file.parseStatus === "success") return "success";
  if (file.parseStatus === "failed") return "failed";
  return "unparsed";
}

export function fileListParseStatusLabel(status: FileListParseStatus) {
  const labels: Record<FileListParseStatus, string> = {
    unparsed: "未解析",
    failed: "解析失败",
    success: "解析成功",
  };
  return labels[status];
}

export function fileListParseStatusTone(status: FileListParseStatus): KnowledgeStatusTone {
  if (status === "success") return "success";
  if (status === "failed") return "danger";
  return "warning";
}

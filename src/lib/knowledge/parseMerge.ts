import type { KnowledgeParseStatus } from "./types";

export type SubParseStatus = KnowledgeParseStatus | "skipped";

/** 合并文档解析与 AI 解析终态：任一 failed → failed；均 skipped → skipped；均 success → success */
export function mergeParseStatus(
  doc?: SubParseStatus,
  ai?: SubParseStatus,
): KnowledgeParseStatus | "skipped" {
  const docStatus = doc ?? "waiting";
  const aiStatus = ai ?? "waiting";

  if (docStatus === "failed" || aiStatus === "failed") return "failed";
  if (docStatus === "skipped" && aiStatus === "skipped") return "skipped";
  if (docStatus === "success" && (aiStatus === "success" || aiStatus === "skipped")) {
    return "success";
  }
  if (docStatus === "skipped" && aiStatus === "success") return "success";
  if (docStatus === "parsing" || aiStatus === "parsing") return "parsing";
  return "waiting";
}

export function isStorageOnlyFile(input: {
  storageOnly?: boolean;
  canPreview?: boolean;
  docParseStatus?: SubParseStatus;
}): boolean {
  if (input.storageOnly) return true;
  if (input.docParseStatus === "skipped") return true;
  return input.canPreview === false;
}

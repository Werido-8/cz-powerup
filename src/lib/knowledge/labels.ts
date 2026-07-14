import type { KnowledgeBaseScope } from "./types";

/**
 * 展示在知识库分组标题、面包屑、详情页 scope badge 中的名称。
 * public + professional 统一对外叫"公共知识库"，personal 叫"个人知识库"。
 */
export function scopeSectionLabel(scope: KnowledgeBaseScope): string {
  if (scope === "personal") return "个人知识库";
  return "公共知识库";
}

/**
 * 展示在表单选项、详情页 type badge 中的名称（含括号类型说明时使用）。
 */
export function scopeTypeLabel(scope: KnowledgeBaseScope): string {
  if (scope === "personal") return "个人知识库";
  if (scope === "professional") return "公共知识库（专业库）";
  return "公共知识库";
}

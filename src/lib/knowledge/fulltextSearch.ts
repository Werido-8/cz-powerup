import type { KnowledgeFile } from "./types";

/** 全文检索命中的分块（演示数据，按文件 id + 关键词确定性生成，避免每次渲染跳动） */
export interface KnowledgeFileMatchChunk {
  id: string;
  /** 预览定位页码（演示数据）；后端暂未返回章节/页码时不在 UI 展示 */
  page: number;
  text: string;
  keyword: string;
}

const SNIPPET_TEMPLATES: Array<(keyword: string) => string> = [
  (kw) => `本条款明确了涉及「${kw}」的操作应遵循的基本要求，相关人员应严格执行，操作前后做好记录，确保可追溯。`,
  (kw) => `发生「${kw}」相关情形时，应第一时间向上级报告，并尽快补办「${kw}」手续，避免影响系统安全稳定运行。`,
  (kw) => `未经「${kw}」，任何单位和个人不得擅自变更运行方式和设备状态，确需变更时应事先征得「${kw}」。`,
  (kw) => `遇紧急情况需越级操作时，操作人员应评估风险，采取必要措施后立即执行，并在事后及时上报「${kw}」情况，补办相关手续。`,
  (kw) => `「${kw}」相关记录应至少保存一年，便于后续复盘与审计核查，如有异常应及时留痕说明。`,
];

function hashString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (Math.imul(hash, 31) + input.charCodeAt(i)) >>> 0;
  }
  return hash;
}

/**
 * 根据文件与查询关键词，确定性生成一组「命中分块」用于全文检索结果展示。
 * 演示数据暂不具备章节/序号信息；页码仅用于预览定位，不在结果列表中展示。
 */
export function getFileMatchChunks(file: KnowledgeFile, query: string): KnowledgeFileMatchChunk[] {
  const keyword = query.trim() || file.name;
  const seed = hashString(`${file.id}::${keyword}`);
  const count = 1 + (seed % 5);
  const chunks: KnowledgeFileMatchChunk[] = [];

  for (let i = 0; i < count; i += 1) {
    const s = (seed + i * 97) >>> 0;
    const page = 3 + (s % 68);
    const template = SNIPPET_TEMPLATES[Math.floor(s / 13) % SNIPPET_TEMPLATES.length];

    chunks.push({
      id: `${file.id}-chunk-${i}`,
      page,
      text: template(keyword),
      keyword,
    });
  }

  return chunks;
}

export function countFileMatches(file: KnowledgeFile, query: string): number {
  return getFileMatchChunks(file, query).length;
}

/** 转义正则特殊字符，避免关键词中含有 ( ) . * 等符号时匹配异常 */
function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** 将文本按关键词切片，供调用方高亮渲染命中片段 */
export function splitByKeyword(text: string, keyword: string): Array<{ text: string; matched: boolean }> {
  const trimmed = keyword.trim();
  if (!trimmed) return [{ text, matched: false }];

  const parts = text.split(new RegExp(`(${escapeRegExp(trimmed)})`, "gi"));
  return parts
    .filter((part) => part.length > 0)
    .map((part) => ({ text: part, matched: part.toLowerCase() === trimmed.toLowerCase() }));
}

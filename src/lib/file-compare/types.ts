/** 文件比对模块类型定义（演示数据，不含真实比对算法） */

export type DiffType = "added" | "removed" | "modified" | "moved";

/** 正文中的差异着色语义 */
export type DiffTone = "add" | "remove" | "modifyOld" | "modifyNew";

export type CompareTaskStatus = "done" | "running" | "failed";

export type CompareSide = "base" | "target";

export type ReaderLayout = "dual" | "single";

export const READER_ZOOM_OPTIONS = [80, 90, 100, 110, 125] as const;

export type ReaderZoom = (typeof READER_ZOOM_OPTIONS)[number];

export interface CompareVersion {
  id: string;
  /** 版本号，如 V5 */
  label: string;
  /** 展示用文件名，如 2025版.pdf */
  fileName: string;
  /** 文件全称 */
  title: string;
  publishedAt: string;
  pages: number;
  size: string;
}

export interface CompareTask {
  id: string;
  title: string;
  baseVersionId: string;
  targetVersionId: string;
  status: CompareTaskStatus;
  finishedAt: string;
  operator: string;
  /** 变化摘要标题 */
  summaryTitle: string;
  /** 变化摘要正文 */
  summaryBody: string;
}

export interface ChapterNode {
  id: string;
  /** 章节编号，如 3 / 3.2 */
  no: string;
  title: string;
  children?: ChapterNode[];
}

export interface DiffItem {
  id: string;
  /** 全文档顺序中的序号，从 1 开始 */
  seq: number;
  type: DiffType;
  title: string;
  /** 「变化摘要」列表使用的长标题，缺省时回退到 title */
  summaryTitle?: string;
  description: string;
  /** 所属一级章节 id */
  chapterId: string;
  /** 所属最小章节 id（可能等于 chapterId） */
  sectionId: string;
  /** 条款号或表号，如 3.2.2 / 表 5-2 */
  clause: string;
  basePage: number;
  targetPage: number;
  /** 与文档段落对应的锚点，用于双栏定位 */
  anchor: string;
  /** 是否为系统归纳的重点变化 */
  highlight?: boolean;
}

export interface DocSpan {
  text: string;
  tone?: DiffTone;
}

export type DocTableCell = DocSpan[];

interface DocBlockBase {
  id: string;
  /** 基准 / 更新两侧共享的段落锚点，用于对齐滚动 */
  anchor: string;
  /** 关联的差异 id */
  diffId?: string;
}

export interface DocHeadingBlock extends DocBlockBase {
  kind: "heading";
  level: 1 | 2;
  text: string;
}

export interface DocParagraphBlock extends DocBlockBase {
  kind: "paragraph";
  spans: DocSpan[];
}

export interface DocTableBlock extends DocBlockBase {
  kind: "table";
  columns: string[];
  rows: DocTableCell[][];
}

export type DocBlock = DocHeadingBlock | DocParagraphBlock | DocTableBlock;

export interface CompareDocument {
  side: CompareSide;
  versionId: string;
  fileName: string;
  label: string;
  totalPages: number;
  blocks: DocBlock[];
}

export interface DiffTypeCount {
  type: DiffType;
  count: number;
}

export interface ChapterDensityItem {
  chapterId: string;
  label: string;
  count: number;
}

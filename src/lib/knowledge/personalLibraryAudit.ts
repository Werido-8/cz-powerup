import { canSeeGlobalAudit } from "./model";
import type { KnowledgeFileType } from "./types";

/** 个人库：解析结果（与业务解析态解耦，仅审计列表展示） */
export type PersonalAuditParseStatus = "parsed" | "failed";

/** 个人库：审核结论 */
export type PersonalAuditStatus = "approved" | "rejected";

export interface PersonalLibrary {
  id: string;
  name: string;
  ownerId: string;
  ownerName: string;
  fileCount: number;
  /** 总占用字节数 */
  totalSize: number;
}

export interface PersonalLibraryFile {
  id: string;
  fileName: string;
  fileType: KnowledgeFileType;
  libraryId: string;
  libraryName: string;
  uploaderId: string;
  uploaderName: string;
  uploadTime: string;
  /** 文件大小（字节） */
  fileSize: number;
  parseStatus: PersonalAuditParseStatus;
  auditStatus: PersonalAuditStatus;
}

export interface PersonalLibraryFileQuery {
  libraryId: "all" | string;
  keyword?: string;
  ownerId?: string;
  /** 仅「全部个人库」范围使用 */
  filterLibraryId?: string;
  parseStatus?: PersonalAuditParseStatus | "all";
  auditStatus?: PersonalAuditStatus | "all";
}

const KB = 1024;
const MB = 1024 * KB;
const GB = 1024 * MB;

/** 将字节格式化为 KB / MB / GB 展示文案 */
export function formatByteSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return "—";
  if (bytes < KB) return `${Math.round(bytes)} B`;
  if (bytes < MB) {
    const value = bytes / KB;
    return `${value >= 100 ? Math.round(value) : value.toFixed(value >= 10 ? 0 : 1)} KB`;
  }
  if (bytes < GB) {
    const value = bytes / MB;
    return `${value >= 100 ? Math.round(value) : Math.round(value)} MB`;
  }
  const value = bytes / GB;
  return `${value.toFixed(2)} GB`;
}

export function personalAuditParseLabel(status: PersonalAuditParseStatus) {
  return status === "parsed" ? "已解析" : "解析异常";
}

export function personalAuditParseTone(status: PersonalAuditParseStatus) {
  return status === "parsed" ? ("success" as const) : ("warning" as const);
}

export function personalAuditStatusLabel(status: PersonalAuditStatus) {
  return status === "approved" ? "通过" : "驳回";
}

export function personalAuditStatusTone(status: PersonalAuditStatus) {
  return status === "approved" ? ("success" as const) : ("danger" as const);
}

/** 演示用个人库清单（含多用户） */
const MOCK_LIBRARIES: PersonalLibrary[] = [
  {
    id: "kb-personal-work",
    name: "运行值班笔记库",
    ownerId: "u-zhang",
    ownerName: "张工",
    fileCount: 15,
    totalSize: 286 * MB,
  },
  {
    id: "kb-personal-relay",
    name: "继电保护资料库",
    ownerId: "u-lina",
    ownerName: "李娜",
    fileCount: 28,
    totalSize: Math.round(1.12 * GB),
  },
  {
    id: "kb-personal-boiler",
    name: "锅炉检修记录",
    ownerId: "u-wangq",
    ownerName: "王强",
    fileCount: 12,
    totalSize: 458 * MB,
  },
  {
    id: "kb-personal-chem",
    name: "化学水处理资料",
    ownerId: "u-chenj",
    ownerName: "陈洁",
    fileCount: 9,
    totalSize: 176 * MB,
  },
  {
    id: "kb-personal-turbine",
    name: "汽机运行经验库",
    ownerId: "u-zhaol",
    ownerName: "赵磊",
    fileCount: 21,
    totalSize: 620 * MB,
  },
  {
    id: "kb-personal-study",
    name: "规程学习摘录库",
    ownerId: "u-zhang",
    ownerName: "张工",
    fileCount: 8,
    totalSize: 94 * MB,
  },
];

function file(
  partial: Omit<PersonalLibraryFile, "libraryName" | "uploaderId" | "uploaderName"> & {
    ownerId: string;
    ownerName: string;
  },
): PersonalLibraryFile {
  const library = MOCK_LIBRARIES.find((item) => item.id === partial.libraryId);
  return {
    id: partial.id,
    fileName: partial.fileName,
    fileType: partial.fileType,
    libraryId: partial.libraryId,
    libraryName: library?.name ?? partial.libraryId,
    uploaderId: partial.ownerId,
    uploaderName: partial.ownerName,
    uploadTime: partial.uploadTime,
    fileSize: partial.fileSize,
    parseStatus: partial.parseStatus,
    auditStatus: partial.auditStatus,
  };
}

/** 演示用个人库文件（mock 层集中维护，不散落在模板） */
const MOCK_FILES: PersonalLibraryFile[] = [
  file({
    id: "file-personal-shift-log",
    fileName: "7月早班交接记录.docx",
    fileType: "docx",
    libraryId: "kb-personal-work",
    ownerId: "u-zhang",
    ownerName: "张工",
    uploadTime: "2026-07-06 08:05",
    fileSize: 312 * KB,
    parseStatus: "parsed",
    auditStatus: "approved",
  }),
  file({
    id: "file-personal-trip-review",
    fileName: "主变跳闸复盘纪要.docx",
    fileType: "docx",
    libraryId: "kb-personal-work",
    ownerId: "u-zhang",
    ownerName: "张工",
    uploadTime: "2026-07-04 16:48",
    fileSize: 528 * KB,
    parseStatus: "parsed",
    auditStatus: "approved",
  }),
  file({
    id: "file-personal-market-note",
    fileName: "现货报价策略备忘.xlsx",
    fileType: "xlsx",
    libraryId: "kb-personal-work",
    ownerId: "u-zhang",
    ownerName: "张工",
    uploadTime: "2026-07-07 10:15",
    fileSize: 186 * KB,
    parseStatus: "failed",
    auditStatus: "approved",
  }),
  file({
    id: "file-personal-scan",
    fileName: "值班笔记扫描件.jpg",
    fileType: "image",
    libraryId: "kb-personal-work",
    ownerId: "u-zhang",
    ownerName: "张工",
    uploadTime: "2026-07-06 22:15",
    fileSize: 820 * KB,
    parseStatus: "failed",
    auditStatus: "rejected",
  }),
  file({
    id: "file-personal-draft",
    fileName: "AGC 指标复盘草稿.docx",
    fileType: "docx",
    libraryId: "kb-personal-work",
    ownerId: "u-zhang",
    ownerName: "张工",
    uploadTime: "2026-07-05 20:16",
    fileSize: 420 * KB,
    parseStatus: "parsed",
    auditStatus: "approved",
  }),
  file({
    id: "file-personal-note",
    fileName: "个人学习笔记汇总.docx",
    fileType: "docx",
    libraryId: "kb-personal-work",
    ownerId: "u-zhang",
    ownerName: "张工",
    uploadTime: "2026-07-07 19:10",
    fileSize: 856 * KB,
    parseStatus: "parsed",
    auditStatus: "approved",
  }),
  file({
    id: "pla-f7",
    fileName: "中班异常处置备忘.pdf",
    fileType: "pdf",
    libraryId: "kb-personal-work",
    ownerId: "u-zhang",
    ownerName: "张工",
    uploadTime: "2026-07-03 21:40",
    fileSize: 1.4 * MB,
    parseStatus: "parsed",
    auditStatus: "approved",
  }),
  file({
    id: "pla-f8",
    fileName: "机组启停操作要点.docx",
    fileType: "docx",
    libraryId: "kb-personal-work",
    ownerId: "u-zhang",
    ownerName: "张工",
    uploadTime: "2026-07-02 09:12",
    fileSize: 640 * KB,
    parseStatus: "parsed",
    auditStatus: "approved",
  }),
  file({
    id: "pla-f9",
    fileName: "夜班监盘检查表.xlsx",
    fileType: "xlsx",
    libraryId: "kb-personal-work",
    ownerId: "u-zhang",
    ownerName: "张工",
    uploadTime: "2026-07-01 23:05",
    fileSize: 268 * KB,
    parseStatus: "parsed",
    auditStatus: "rejected",
  }),
  file({
    id: "pla-f10",
    fileName: "AGC 考核口径摘录.pdf",
    fileType: "pdf",
    libraryId: "kb-personal-work",
    ownerId: "u-zhang",
    ownerName: "张工",
    uploadTime: "2026-06-28 14:20",
    fileSize: 2.1 * MB,
    parseStatus: "parsed",
    auditStatus: "approved",
  }),
  file({
    id: "pla-f11",
    fileName: "调度联系录音转写.txt",
    fileType: "other",
    libraryId: "kb-personal-work",
    ownerId: "u-zhang",
    ownerName: "张工",
    uploadTime: "2026-06-26 11:08",
    fileSize: 48 * KB,
    parseStatus: "failed",
    auditStatus: "approved",
  }),
  file({
    id: "pla-f12",
    fileName: "电压越限处置流程.docx",
    fileType: "docx",
    libraryId: "kb-personal-work",
    ownerId: "u-zhang",
    ownerName: "张工",
    uploadTime: "2026-06-24 16:33",
    fileSize: 390 * KB,
    parseStatus: "parsed",
    auditStatus: "approved",
  }),
  file({
    id: "pla-f13",
    fileName: "班组培训记录-6月.pdf",
    fileType: "pdf",
    libraryId: "kb-personal-work",
    ownerId: "u-zhang",
    ownerName: "张工",
    uploadTime: "2026-06-20 10:45",
    fileSize: 3.2 * MB,
    parseStatus: "parsed",
    auditStatus: "approved",
  }),
  file({
    id: "pla-f14",
    fileName: "辅机油温异常照片.png",
    fileType: "image",
    libraryId: "kb-personal-work",
    ownerId: "u-zhang",
    ownerName: "张工",
    uploadTime: "2026-06-18 19:02",
    fileSize: 1.8 * MB,
    parseStatus: "failed",
    auditStatus: "rejected",
  }),
  file({
    id: "pla-f15",
    fileName: "并网考核月报草稿.xlsx",
    fileType: "xlsx",
    libraryId: "kb-personal-work",
    ownerId: "u-zhang",
    ownerName: "张工",
    uploadTime: "2026-06-15 08:50",
    fileSize: 512 * KB,
    parseStatus: "parsed",
    auditStatus: "approved",
  }),
  file({
    id: "pla-f16",
    fileName: "差动保护定值校核表.xlsx",
    fileType: "xlsx",
    libraryId: "kb-personal-relay",
    ownerId: "u-lina",
    ownerName: "李娜",
    uploadTime: "2026-07-05 15:20",
    fileSize: 1.05 * MB,
    parseStatus: "parsed",
    auditStatus: "approved",
  }),
  file({
    id: "pla-f17",
    fileName: "线路保护动作分析报告.pdf",
    fileType: "pdf",
    libraryId: "kb-personal-relay",
    ownerId: "u-lina",
    ownerName: "李娜",
    uploadTime: "2026-07-04 09:40",
    fileSize: 4.6 * MB,
    parseStatus: "parsed",
    auditStatus: "approved",
  }),
  file({
    id: "pla-f18",
    fileName: "保护装置说明书摘录.docx",
    fileType: "docx",
    libraryId: "kb-personal-relay",
    ownerId: "u-lina",
    ownerName: "李娜",
    uploadTime: "2026-07-01 11:12",
    fileSize: 780 * KB,
    parseStatus: "failed",
    auditStatus: "approved",
  }),
  file({
    id: "pla-f19",
    fileName: "锅炉水冷壁检修记录.docx",
    fileType: "docx",
    libraryId: "kb-personal-boiler",
    ownerId: "u-wangq",
    ownerName: "王强",
    uploadTime: "2026-07-03 14:05",
    fileSize: 920 * KB,
    parseStatus: "parsed",
    auditStatus: "approved",
  }),
  file({
    id: "pla-f20",
    fileName: "受热面结焦排查照片.jpg",
    fileType: "image",
    libraryId: "kb-personal-boiler",
    ownerId: "u-wangq",
    ownerName: "王强",
    uploadTime: "2026-06-29 17:22",
    fileSize: 2.4 * MB,
    parseStatus: "failed",
    auditStatus: "rejected",
  }),
  file({
    id: "pla-f21",
    fileName: "除盐水质日报.xlsx",
    fileType: "xlsx",
    libraryId: "kb-personal-chem",
    ownerId: "u-chenj",
    ownerName: "陈洁",
    uploadTime: "2026-07-06 07:55",
    fileSize: 210 * KB,
    parseStatus: "parsed",
    auditStatus: "approved",
  }),
  file({
    id: "pla-f22",
    fileName: "精处理再生操作纪要.docx",
    fileType: "docx",
    libraryId: "kb-personal-chem",
    ownerId: "u-chenj",
    ownerName: "陈洁",
    uploadTime: "2026-07-02 16:10",
    fileSize: 445 * KB,
    parseStatus: "parsed",
    auditStatus: "approved",
  }),
  file({
    id: "pla-f23",
    fileName: "汽轮机振动趋势分析.pdf",
    fileType: "pdf",
    libraryId: "kb-personal-turbine",
    ownerId: "u-zhaol",
    ownerName: "赵磊",
    uploadTime: "2026-07-05 18:30",
    fileSize: 3.8 * MB,
    parseStatus: "parsed",
    auditStatus: "approved",
  }),
  file({
    id: "pla-f24",
    fileName: "轴系对中调整记录.docx",
    fileType: "docx",
    libraryId: "kb-personal-turbine",
    ownerId: "u-zhaol",
    ownerName: "赵磊",
    uploadTime: "2026-06-30 13:18",
    fileSize: 560 * KB,
    parseStatus: "parsed",
    auditStatus: "rejected",
  }),
  file({
    id: "file-personal-grid-excerpt",
    fileName: "并网管理规程重点摘录.pdf",
    fileType: "pdf",
    libraryId: "kb-personal-study",
    ownerId: "u-zhang",
    ownerName: "张工",
    uploadTime: "2026-07-05 11:40",
    fileSize: 1.12 * MB,
    parseStatus: "parsed",
    auditStatus: "approved",
  }),
  file({
    id: "file-personal-agc-quiz",
    fileName: "AGC 考核题库整理.xlsx",
    fileType: "xlsx",
    libraryId: "kb-personal-study",
    ownerId: "u-zhang",
    ownerName: "张工",
    uploadTime: "2026-07-02 19:05",
    fileSize: 244 * KB,
    parseStatus: "parsed",
    auditStatus: "approved",
  }),
];

function delay(ms: number, signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException("Aborted", "AbortError"));
      return;
    }
    const timer = window.setTimeout(() => resolve(), ms);
    signal?.addEventListener(
      "abort",
      () => {
        window.clearTimeout(timer);
        reject(new DOMException("Aborted", "AbortError"));
      },
      { once: true },
    );
  });
}

function assertCanAudit() {
  if (!canSeeGlobalAudit()) {
    throw new Error("无个人库权限");
  }
}

/** 个人库所有者列表（用户筛选） */
export function listPersonalLibraryOwners(): { id: string; name: string }[] {
  assertCanAudit();
  const map = new Map<string, string>();
  for (const library of MOCK_LIBRARIES) {
    map.set(library.ownerId, library.ownerName);
  }
  return Array.from(map.entries())
    .map(([id, name]) => ({ id, name }))
    .sort((a, b) => a.name.localeCompare(b.name, "zh-CN"));
}

export function listPersonalLibraries(params?: {
  keyword?: string;
  ownerId?: string;
}): PersonalLibrary[] {
  assertCanAudit();
  const keyword = params?.keyword?.trim().toLowerCase() ?? "";
  const ownerId = params?.ownerId;
  return MOCK_LIBRARIES.filter((library) => {
    if (ownerId && library.ownerId !== ownerId) return false;
    if (!keyword) return true;
    return (
      library.name.toLowerCase().includes(keyword) ||
      library.ownerName.toLowerCase().includes(keyword)
    );
  });
}

export function getPersonalLibrarySummary(libraryId: "all" | string): {
  title: string;
  fileCount: number;
  totalSize: number;
  libraryCount: number;
  ownerName?: string;
} {
  assertCanAudit();
  if (libraryId === "all") {
    // 演示汇总：与产品示意一致；正式环境由后端返回实际聚合值
    return {
      title: "全部个人库文件",
      fileCount: 128,
      totalSize: Math.round(3.46 * GB),
      libraryCount: MOCK_LIBRARIES.length,
    };
  }
  const library = MOCK_LIBRARIES.find((item) => item.id === libraryId);
  if (!library) {
    return { title: "个人库", fileCount: 0, totalSize: 0, libraryCount: 0 };
  }
  return {
    title: library.name,
    fileCount: library.fileCount,
    totalSize: library.totalSize,
    libraryCount: 1,
    ownerName: library.ownerName,
  };
}

/** 切换个人库面板：分页加载，滚动触底继续拉取 */
export async function fetchPersonalLibrariesPage(
  params: {
    keyword?: string;
    ownerId?: string;
    page: number;
    pageSize?: number;
  },
  signal?: AbortSignal,
): Promise<{ items: PersonalLibrary[]; total: number; hasMore: boolean }> {
  assertCanAudit();
  await delay(160, signal);
  const pageSize = params.pageSize ?? 8;
  const all = listPersonalLibraries({
    keyword: params.keyword,
    ownerId: params.ownerId,
  });
  const start = Math.max(0, (params.page - 1) * pageSize);
  const items = all.slice(start, start + pageSize);
  return {
    items,
    total: all.length,
    hasMore: start + items.length < all.length,
  };
}

export function getAllPersonalLibrariesForFilter(): PersonalLibrary[] {
  assertCanAudit();
  return [...MOCK_LIBRARIES];
}

function matchKeyword(fileItem: PersonalLibraryFile, keyword: string) {
  if (!keyword) return true;
  const q = keyword.toLowerCase();
  return (
    fileItem.fileName.toLowerCase().includes(q) || fileItem.uploaderName.toLowerCase().includes(q)
  );
}

/** 查询个人库文件；支持 AbortSignal 防止快速切换覆盖结果 */
export async function fetchPersonalLibraryFiles(
  query: PersonalLibraryFileQuery,
  signal?: AbortSignal,
): Promise<PersonalLibraryFile[]> {
  assertCanAudit();
  await delay(180, signal);

  const keyword = query.keyword?.trim() ?? "";
  const parseStatus = query.parseStatus ?? "all";
  const auditStatus = query.auditStatus ?? "all";

  return MOCK_FILES.filter((item) => {
    if (query.libraryId !== "all" && item.libraryId !== query.libraryId) return false;
    if (query.libraryId === "all") {
      if (query.ownerId) {
        const library = MOCK_LIBRARIES.find((lib) => lib.id === item.libraryId);
        if (library?.ownerId !== query.ownerId) return false;
      }
      if (query.filterLibraryId && item.libraryId !== query.filterLibraryId) return false;
    }
    if (!matchKeyword(item, keyword)) return false;
    if (parseStatus !== "all" && item.parseStatus !== parseStatus) return false;
    if (auditStatus !== "all" && item.auditStatus !== auditStatus) return false;
    return true;
  });
}

export function getPersonalLibraryAggregateStats(ownerId?: string) {
  if (!ownerId) {
    return {
      fileCount: 128,
      totalSize: Math.round(3.46 * GB),
    };
  }
  const libraries = listPersonalLibraries({ ownerId });
  return {
    fileCount: libraries.reduce((sum, item) => sum + item.fileCount, 0),
    totalSize: libraries.reduce((sum, item) => sum + item.totalSize, 0),
  };
}

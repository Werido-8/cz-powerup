// Knowledge base mock data — dept / library / folder / file model (v1.1)

export type KbDeptKind = "public" | "dept" | "personal";

export type KbDept = {
  id: string;
  name: string;
  kind: KbDeptKind;
  icon?: string;
  libraryCount: number;
  description?: string;
};

export type KbLibrary = {
  id: string;
  deptId: string;
  name: string;
  description?: string;
  coverColor?: string;
  fileCount: number;
  parsedCount: number;
  recentFiles: { id: string; name: string; updatedAt: string }[];
  updatedAt: string;
};

export type KbFolder = {
  id: string;
  libraryId: string;
  parentId: string | null;
  name: string;
  sortOrder: number;
};

export type KbFileType = "pdf" | "docx" | "xlsx" | "ppt" | "txt" | "other";

export type KbParseStatus = "pending" | "processing" | "done" | "failed" | "disabled";

export type KbFile = {
  id: string;
  libraryId: string;
  folderId: string;
  name: string;
  summary: string;
  fileType: KbFileType;
  scope: "公共" | "部门" | "个人";
  parseStatus: KbParseStatus;
  uploaderId: string;
  updatedAt: string;
  size: string;
};

export const KB_VIEWER = { id: "u-demo", isAdmin: false } as const;

export const KB_DEPTS: KbDept[] = [
  {
    id: "dept-public",
    name: "公共空间",
    kind: "public",
    libraryCount: 3,
    description: "全厂共享的规章制度、技术标准与经验资料",
  },
  {
    id: "dept-run",
    name: "运行处",
    kind: "dept",
    libraryCount: 3,
    description: "本部门运行规程、技术标准与经验资料",
  },
  {
    id: "dept-tech",
    name: "技术处",
    kind: "dept",
    libraryCount: 2,
    description: "技术监督、设备标准与技改资料",
  },
  {
    id: "dept-dispatch",
    name: "调度处",
    kind: "dept",
    libraryCount: 2,
    description: "调度规程、并网协议与运行协调资料",
  },
  {
    id: "dept-personal",
    name: "个人空间",
    kind: "personal",
    libraryCount: 1,
    description: "个人工作笔记与学习资料",
  },
];

export const KB_LIBRARIES: KbLibrary[] = [
  {
    id: "lib-trade-spec",
    deptId: "dept-run",
    name: "电力交易业务技术标准库",
    description: "现货、中长期与辅助服务相关技术标准",
    coverColor: "#349bac",
    fileCount: 6,
    parsedCount: 5,
    recentFiles: [
      { id: "kf1", name: "电力现货市场基本规则", updatedAt: "今天" },
      { id: "kf2", name: "电力中长期交易基本规则", updatedAt: "昨天" },
    ],
    updatedAt: "2026-07-01",
  },
  {
    id: "lib-grid-run",
    deptId: "dept-run",
    name: "并网运行管理库",
    description: "并网运行规程与典型操作经验",
    coverColor: "#2d8a9a",
    fileCount: 4,
    parsedCount: 4,
    recentFiles: [{ id: "kf9", name: "并网发电厂运行规程汇编", updatedAt: "3天前" }],
    updatedAt: "2026-06-28",
  },
  {
    id: "lib-agc",
    deptId: "dept-run",
    name: "AGC 考核标准库",
    description: "AGC 考核指标与实施细则",
    coverColor: "#3aabbd",
    fileCount: 3,
    parsedCount: 3,
    recentFiles: [{ id: "kf10", name: "AGC 考核管理办法", updatedAt: "上周" }],
    updatedAt: "2026-06-20",
  },
  {
    id: "lib-tech-standard",
    deptId: "dept-tech",
    name: "设备技术标准库",
    description: "主设备技术规范与检修标准",
    coverColor: "#4a9fb0",
    fileCount: 5,
    parsedCount: 5,
    recentFiles: [{ id: "kf11", name: "主变压器检修规程", updatedAt: "今天" }],
    updatedAt: "2026-06-30",
  },
  {
    id: "lib-retrofit",
    deptId: "dept-tech",
    name: "技改项目资料库",
    description: "技术改造方案与验收资料",
    coverColor: "#5eb3c4",
    fileCount: 2,
    parsedCount: 2,
    recentFiles: [{ id: "kf12", name: "深度调峰改造方案", updatedAt: "2周前" }],
    updatedAt: "2026-06-15",
  },
  {
    id: "lib-dispatch-rule",
    deptId: "dept-dispatch",
    name: "调度运行规程库",
    description: "电网调度规程与并网协议",
    coverColor: "#349bac",
    fileCount: 4,
    parsedCount: 4,
    recentFiles: [{ id: "kf13", name: "电网调度运行管理规程", updatedAt: "昨天" }],
    updatedAt: "2026-06-25",
  },
  {
    id: "lib-dispatch-coord",
    deptId: "dept-dispatch",
    name: "运行协调资料库",
    description: "厂网协调与联络线运行资料",
    coverColor: "#2d8a9a",
    fileCount: 2,
    parsedCount: 2,
    recentFiles: [{ id: "kf14", name: "联络线运行管理办法", updatedAt: "上周" }],
    updatedAt: "2026-06-18",
  },
  {
    id: "lib-public-reg",
    deptId: "dept-public",
    name: "规章制度汇编库",
    description: "全厂规章制度与管理办法",
    coverColor: "#349bac",
    fileCount: 8,
    parsedCount: 8,
    recentFiles: [{ id: "kf15", name: "安全生产管理规定", updatedAt: "今天" }],
    updatedAt: "2026-07-01",
  },
  {
    id: "lib-public-exp",
    deptId: "dept-public",
    name: "经验成果共享库",
    description: "典型经验与成果汇编",
    coverColor: "#3aabbd",
    fileCount: 5,
    parsedCount: 5,
    recentFiles: [{ id: "kf16", name: "典型故障处置案例集", updatedAt: "3天前" }],
    updatedAt: "2026-06-22",
  },
  {
    id: "lib-public-basic",
    deptId: "dept-public",
    name: "基础信息资料库",
    description: "厂站基础信息与设备台账",
    coverColor: "#4a9fb0",
    fileCount: 3,
    parsedCount: 3,
    recentFiles: [{ id: "kf17", name: "厂站设备台账汇总", updatedAt: "上周" }],
    updatedAt: "2026-06-10",
  },
  {
    id: "lib-personal",
    deptId: "dept-personal",
    name: "个人工作资料库",
    description: "个人笔记与学习资料",
    coverColor: "#5eb3c4",
    fileCount: 2,
    parsedCount: 1,
    recentFiles: [{ id: "kf7", name: "个人学习笔记汇总", updatedAt: "昨天" }],
    updatedAt: "2026-06-10",
  },
];

export const KB_FOLDERS: KbFolder[] = [
  { id: "folder-spot", libraryId: "lib-trade-spec", parentId: null, name: "现货市场规则", sortOrder: 1 },
  { id: "folder-mid", libraryId: "lib-trade-spec", parentId: null, name: "中长期交易", sortOrder: 2 },
  { id: "folder-aux", libraryId: "lib-trade-spec", parentId: null, name: "辅助服务", sortOrder: 3 },
  { id: "folder-uncategorized", libraryId: "lib-trade-spec", parentId: null, name: "未分类", sortOrder: 99 },
  { id: "folder-grid", libraryId: "lib-grid-run", parentId: null, name: "运行规程", sortOrder: 1 },
  { id: "folder-agc", libraryId: "lib-agc", parentId: null, name: "考核标准", sortOrder: 1 },
  { id: "folder-personal", libraryId: "lib-personal", parentId: null, name: "个人笔记", sortOrder: 1 },
];

export const KB_FILES: KbFile[] = [
  {
    id: "kf1",
    libraryId: "lib-trade-spec",
    folderId: "folder-spot",
    name: "电力现货市场基本规则.pdf",
    summary: "规定现货市场参与主体、交易品种与出清流程的基本要求。",
    fileType: "pdf",
    scope: "公共",
    parseStatus: "done",
    uploaderId: "u-admin",
    updatedAt: "2024-04-22 10:17:54",
    size: "1.28MB",
  },
  {
    id: "kf2",
    libraryId: "lib-trade-spec",
    folderId: "folder-spot",
    name: "电力中长期交易基本规则.pdf",
    summary: "中长期交易合同签订、执行与结算相关规定。",
    fileType: "pdf",
    scope: "公共",
    parseStatus: "done",
    uploaderId: "u-admin",
    updatedAt: "2024-04-22 10:17:54",
    size: "1.28MB",
  },
  {
    id: "kf3",
    libraryId: "lib-trade-spec",
    folderId: "folder-mid",
    name: "电力中长期交易成分.pdf",
    summary: "中长期交易电量成分划分与统计方法。",
    fileType: "pdf",
    scope: "公共",
    parseStatus: "disabled",
    uploaderId: "u-admin",
    updatedAt: "2024-04-22 10:17:54",
    size: "1.28MB",
  },
  {
    id: "kf4",
    libraryId: "lib-trade-spec",
    folderId: "folder-aux",
    name: "电力辅助服务基本规则.pdf",
    summary: "辅助服务品种、补偿机制与考核要求。",
    fileType: "pdf",
    scope: "公共",
    parseStatus: "done",
    uploaderId: "u-admin",
    updatedAt: "2024-04-22 10:17:54",
    size: "1.28MB",
  },
  {
    id: "kf5",
    libraryId: "lib-trade-spec",
    folderId: "folder-mid",
    name: "电力市场运营基本规则.pdf",
    summary: "电力市场运营机构职责与市场秩序维护。",
    fileType: "pdf",
    scope: "公共",
    parseStatus: "done",
    uploaderId: "u-admin",
    updatedAt: "2024-04-22 10:17:54",
    size: "1.28MB",
  },
  {
    id: "kf6",
    libraryId: "lib-trade-spec",
    folderId: "folder-spot",
    name: "关于开展电网设备电气信息深度采集工作的通知.pdf",
    summary: "电网设备电气信息采集范围与实施要求。",
    fileType: "pdf",
    scope: "公共",
    parseStatus: "processing",
    uploaderId: "u-demo",
    updatedAt: "2024-04-22 10:17:54",
    size: "1.28MB",
  },
  {
    id: "kf7",
    libraryId: "lib-personal",
    folderId: "folder-personal",
    name: "个人学习笔记汇总.docx",
    summary: "个人学习笔记与要点摘录。",
    fileType: "docx",
    scope: "个人",
    parseStatus: "processing",
    uploaderId: "u-demo",
    updatedAt: "2024-06-10 09:30:12",
    size: "856KB",
  },
  {
    id: "kf9",
    libraryId: "lib-grid-run",
    folderId: "folder-grid",
    name: "并网发电厂运行规程汇编.pdf",
    summary: "并网发电厂日常运行与异常处置规程汇编。",
    fileType: "pdf",
    scope: "部门",
    parseStatus: "done",
    uploaderId: "u-admin",
    updatedAt: "2024-03-15 14:22:00",
    size: "2.45MB",
  },
  {
    id: "kf10",
    libraryId: "lib-agc",
    folderId: "folder-agc",
    name: "AGC 考核管理办法.pdf",
    summary: "AGC 考核指标定义与月度统计方法。",
    fileType: "pdf",
    scope: "部门",
    parseStatus: "done",
    uploaderId: "u-admin",
    updatedAt: "2024-05-01 09:00:00",
    size: "980KB",
  },
];

/** Mock recent access for「我的」页 */
export const KB_RECENT_LIBRARIES = [
  { libraryId: "lib-trade-spec", visitedAt: "今天 14:30" },
  { libraryId: "lib-grid-run", visitedAt: "昨天 09:15" },
  { libraryId: "lib-agc", visitedAt: "3天前" },
];

export const KB_RECENT_FILES = [
  { fileId: "kf1", visitedAt: "今天 14:35" },
  { fileId: "kf2", visitedAt: "今天 10:20" },
  { fileId: "kf9", visitedAt: "昨天 16:00" },
];

/** AI panel suggested questions per library */
export const KB_AI_SUGGESTIONS: Record<string, string[]> = {
  "lib-trade-spec": [
    "现货市场与中长期市场的区别是什么？",
    "电力现货市场出清流程是怎样的？",
    "辅助服务补偿机制如何计算？",
  ],
};

export const KB_STORAGE_KEYS = {
  lastDept: "kb-last-dept",
  sidebarCollapsed: "kb-sidebar-collapsed",
} as const;

export type KnowledgeSpaceType = "mine" | "quick" | "public" | "department";

export type KnowledgeBaseRecentFile = {
  name: string;
  updatedAt: string;
};
export type KnowledgeBasePermission = "public" | "department" | "personal" | "restricted";
export type KnowledgeBaseStatus = "enabled" | "disabled";
export type KnowledgeFileType =
  | "pdf"
  | "word"
  | "excel"
  | "ppt"
  | "image"
  | "video"
  | "audio"
  | "other";
export type KnowledgeParseStatus = "pending" | "processing" | "done" | "failed";
export type KnowledgePublishStatus = "published" | "reviewing" | "rejected";
export type KnowledgeViewMode = "grid" | "list";
export type KnowledgeSortBy = "updated" | "name" | "uploaded";
export type KnowledgeViewerRole = "knowledgeAdmin" | "departmentAdmin" | "employee";
export type UploadRecordStatus = "pending" | "processing" | "published" | "rejected";

export type KnowledgeViewer = {
  id: string;
  name: string;
  departmentId: string;
  role: KnowledgeViewerRole;
  grantedKbIds: string[];
  uploadKbIds: string[];
};

export type KnowledgeSpace = {
  type: KnowledgeSpaceType;
  id: string;
  name: string;
};

export type KnowledgeDepartment = {
  id: string;
  name: string;
  kbCount: number;
  description: string;
  adminName: string;
};

export type KnowledgeBase = {
  id: string;
  spaceType: Exclude<KnowledgeSpaceType, "mine"> | "personal";
  departmentId?: string;
  name: string;
  description: string;
  fileCount: number;
  parsedCount: number;
  latestFileName: string;
  latestUpdateTime: string;
  permission: KnowledgeBasePermission;
  status: KnowledgeBaseStatus;
  color?: string;
  ownerName: string;
};

export type KnowledgeDirectory = {
  id: string;
  kbId: string;
  parentId: string | null;
  name: string;
  sortOrder: number;
};

export type KnowledgeFile = {
  id: string;
  kbId: string;
  directoryId: string;
  name: string;
  type: KnowledgeFileType;
  size: string;
  summary: string;
  parseStatus: KnowledgeParseStatus;
  publishStatus: KnowledgePublishStatus;
  currentVersion: string;
  hasHistoryVersions: boolean;
  updatedAt: string;
  uploadedAt: string;
  uploadedBy: string;
  permission: KnowledgeBasePermission;
  tags: string[];
};

export type KnowledgeVersion = {
  id: string;
  fileId: string;
  versionNo: string;
  versionName: string;
  description: string;
  uploadedAt: string;
  uploadedBy: string;
  isCurrent: boolean;
};

export const KB_VIEWER: KnowledgeViewer = {
  id: "u-demo",
  name: "运行值长",
  departmentId: "dept-run",
  role: "departmentAdmin",
  grantedKbIds: [
    "kb-public-regulation",
    "kb-public-experience",
    "kb-trading-standard",
    "kb-grid-operation",
    "kb-agc",
    "kb-personal",
  ],
  uploadKbIds: ["kb-trading-standard", "kb-grid-operation", "kb-agc", "kb-personal"],
};

export const KNOWLEDGE_SPACES: KnowledgeSpace[] = [
  { type: "mine", id: "mine", name: "我的" },
  { type: "public", id: "public", name: "公共空间" },
  { type: "department", id: "department", name: "部门空间" },
];

export const KNOWLEDGE_DEPARTMENTS: KnowledgeDepartment[] = [
  {
    id: "dept-run",
    name: "运行处",
    kbCount: 3,
    description: "运行规程、交易规则、考核标准与经验资料沉淀",
    adminName: "张工",
  },
  {
    id: "dept-tech",
    name: "技术处",
    kbCount: 2,
    description: "设备技术标准、检修规程、技术改造与验收资料",
    adminName: "李工",
  },
  {
    id: "dept-dispatch",
    name: "调度处",
    kbCount: 2,
    description: "调度规程、并网协议、运行协调与联络线资料",
    adminName: "王工",
  },
  {
    id: "dept-maintenance",
    name: "检修处",
    kbCount: 1,
    description: "检修作业标准、风险辨识与验收记录",
    adminName: "赵工",
  },
];

export const KNOWLEDGE_BASES: KnowledgeBase[] = [
  {
    id: "kb-public-regulation",
    spaceType: "public",
    name: "规章制度汇编库",
    description: "全厂共享的安全生产、运行管理与制度文件",
    fileCount: 18,
    parsedCount: 16,
    latestFileName: "安全生产管理规定.pdf",
    latestUpdateTime: "今天 09:20",
    permission: "public",
    status: "enabled",
    color: "#349BAC",
    ownerName: "知识库管理员",
  },
  {
    id: "kb-public-experience",
    spaceType: "public",
    name: "经验成果共享库",
    description: "典型经验、成果案例、跨部门复盘资料统一沉淀",
    fileCount: 11,
    parsedCount: 11,
    latestFileName: "典型故障处置案例集.pdf",
    latestUpdateTime: "3天前",
    permission: "public",
    status: "enabled",
    color: "#3AABBD",
    ownerName: "知识库管理员",
  },
  {
    id: "kb-public-basic",
    spaceType: "public",
    name: "基础信息资料库",
    description: "厂站基础信息、设备台账、系统结构图与基础参数",
    fileCount: 9,
    parsedCount: 8,
    latestFileName: "厂站设备台账汇总.xlsx",
    latestUpdateTime: "上周",
    permission: "restricted",
    status: "enabled",
    color: "#4A9FB0",
    ownerName: "知识库管理员",
  },
  {
    id: "kb-trading-standard",
    spaceType: "department",
    departmentId: "dept-run",
    name: "电力交易业务技术标准库",
    description: "收录电力交易业务相关的技术标准、规定与规范文件。",
    fileCount: 128,
    parsedCount: 116,
    latestFileName: "电力现货市场基本规则.pdf",
    latestUpdateTime: "今天 14:30",
    permission: "department",
    status: "enabled",
    color: "#349BAC",
    ownerName: "运行处",
  },
  {
    id: "kb-grid-operation",
    spaceType: "department",
    departmentId: "dept-run",
    name: "并网运行管理库",
    description: "并网运行规程、典型操作票与异常处置经验资料。",
    fileCount: 86,
    parsedCount: 82,
    latestFileName: "并网发电厂运行规程汇编.pdf",
    latestUpdateTime: "昨天",
    permission: "department",
    status: "enabled",
    color: "#2F8D9D",
    ownerName: "运行处",
  },
  {
    id: "kb-agc",
    spaceType: "department",
    departmentId: "dept-run",
    name: "AGC 考核标准库",
    description: "AGC 考核指标、实施细则与月度统计方法。",
    fileCount: 42,
    parsedCount: 40,
    latestFileName: "AGC 考核管理办法.pdf",
    latestUpdateTime: "上周",
    permission: "department",
    status: "enabled",
    color: "#5EB3C4",
    ownerName: "运行处",
  },
  {
    id: "kb-equipment-standard",
    spaceType: "department",
    departmentId: "dept-tech",
    name: "设备技术标准库",
    description: "主设备技术规范、检修标准与试验报告。",
    fileCount: 67,
    parsedCount: 63,
    latestFileName: "主变压器检修规程.pdf",
    latestUpdateTime: "今天 10:10",
    permission: "department",
    status: "enabled",
    color: "#4A9FB0",
    ownerName: "技术处",
  },
  {
    id: "kb-retrofit",
    spaceType: "department",
    departmentId: "dept-tech",
    name: "技改项目资料库",
    description: "技术改造方案、验收资料与效果评估报告。",
    fileCount: 29,
    parsedCount: 26,
    latestFileName: "深度调峰改造方案.ppt",
    latestUpdateTime: "2周前",
    permission: "department",
    status: "enabled",
    color: "#3AABBD",
    ownerName: "技术处",
  },
  {
    id: "kb-dispatch-rule",
    spaceType: "department",
    departmentId: "dept-dispatch",
    name: "调度运行规程库",
    description: "电网调度规程、并网协议与运行协调规则。",
    fileCount: 54,
    parsedCount: 52,
    latestFileName: "电网调度运行管理规程.pdf",
    latestUpdateTime: "昨天",
    permission: "department",
    status: "enabled",
    color: "#349BAC",
    ownerName: "调度处",
  },
  {
    id: "kb-dispatch-coordination",
    spaceType: "department",
    departmentId: "dept-dispatch",
    name: "运行协调资料库",
    description: "运行协调联络、联络线管理与跨部门协同资料。",
    fileCount: 31,
    parsedCount: 28,
    latestFileName: "联络线运行协调管理办法.pdf",
    latestUpdateTime: "3天前",
    permission: "department",
    status: "enabled",
    color: "#3AABBD",
    ownerName: "调度处",
  },
  {
    id: "kb-maintenance-risk",
    spaceType: "department",
    departmentId: "dept-maintenance",
    name: "检修标准库",
    description: "检修作业指导书、风险辨识清单与验收记录。",
    fileCount: 38,
    parsedCount: 35,
    latestFileName: "主机检修风险辨识清单.xlsx",
    latestUpdateTime: "5天前",
    permission: "department",
    status: "enabled",
    color: "#4A9FB0",
    ownerName: "检修处",
  },
  {
    id: "kb-personal",
    spaceType: "personal",
    departmentId: "dept-run",
    name: "个人工作资料库",
    description: "个人学习笔记、工作沉淀与待整理资料",
    fileCount: 4,
    parsedCount: 2,
    latestFileName: "个人学习笔记汇总.docx",
    latestUpdateTime: "昨天",
    permission: "personal",
    status: "enabled",
    color: "#5EB3C4",
    ownerName: "运行值长",
  },
];

export const KNOWLEDGE_DIRECTORIES: KnowledgeDirectory[] = [
  { id: "dir-spot-market", kbId: "kb-trading-standard", parentId: null, name: "规章制度", sortOrder: 1 },
  { id: "dir-mid-market", kbId: "kb-trading-standard", parentId: null, name: "中长期交易", sortOrder: 2 },
  { id: "dir-aux-service", kbId: "kb-trading-standard", parentId: null, name: "辅助服务", sortOrder: 3 },
  { id: "dir-grid-rules", kbId: "kb-grid-operation", parentId: null, name: "运行规程", sortOrder: 1 },
  { id: "dir-grid-cases", kbId: "kb-grid-operation", parentId: null, name: "典型操作票", sortOrder: 2 },
  { id: "dir-agc-rule", kbId: "kb-agc", parentId: null, name: "考核标准", sortOrder: 1 },
  { id: "dir-agc-report", kbId: "kb-agc", parentId: null, name: "月度统计", sortOrder: 2 },
  { id: "dir-public-safe", kbId: "kb-public-regulation", parentId: null, name: "安全生产", sortOrder: 1 },
  { id: "dir-public-manage", kbId: "kb-public-regulation", parentId: null, name: "管理制度", sortOrder: 2 },
  { id: "dir-public-exp", kbId: "kb-public-experience", parentId: null, name: "典型案例", sortOrder: 1 },
  { id: "dir-basic-equipment", kbId: "kb-public-basic", parentId: null, name: "设备台账", sortOrder: 1 },
  { id: "dir-tech-standard", kbId: "kb-equipment-standard", parentId: null, name: "技术规范", sortOrder: 1 },
  { id: "dir-retrofit-plan", kbId: "kb-retrofit", parentId: null, name: "改造方案", sortOrder: 1 },
  { id: "dir-dispatch-rules", kbId: "kb-dispatch-rule", parentId: null, name: "调度规程", sortOrder: 1 },
  { id: "dir-dispatch-coord", kbId: "kb-dispatch-coordination", parentId: null, name: "运行协调", sortOrder: 1 },
  { id: "dir-maintenance-risk", kbId: "kb-maintenance-risk", parentId: null, name: "风险清单", sortOrder: 1 },
  { id: "dir-personal-note", kbId: "kb-personal", parentId: null, name: "个人笔记", sortOrder: 1 },
];

export const KNOWLEDGE_FILES: KnowledgeFile[] = [
  {
    id: "file-spot-rule",
    kbId: "kb-trading-standard",
    directoryId: "dir-spot-market",
    name: "电力现货市场基本规则.pdf",
    type: "pdf",
    size: "1.28MB",
    summary: "规定现货市场参与主体、交易品种、出清流程与结算边界。",
    parseStatus: "done",
    publishStatus: "published",
    currentVersion: "v3",
    hasHistoryVersions: true,
    updatedAt: "2026-07-06 14:30",
    uploadedAt: "2026-07-06 14:30",
    uploadedBy: "张工",
    permission: "department",
    tags: ["现货", "交易规则", "当前版"],
  },
  {
    id: "file-mid-rule",
    kbId: "kb-trading-standard",
    directoryId: "dir-spot-market",
    name: "电力中长期交易基本规则.pdf",
    type: "pdf",
    size: "1.16MB",
    summary: "说明中长期合同签订、执行偏差与结算相关管理要求。",
    parseStatus: "done",
    publishStatus: "published",
    currentVersion: "v2",
    hasHistoryVersions: true,
    updatedAt: "2026-07-05 16:42",
    uploadedAt: "2026-07-05 16:42",
    uploadedBy: "张工",
    permission: "department",
    tags: ["中长期", "合同", "当前版"],
  },
  {
    id: "file-contract",
    kbId: "kb-trading-standard",
    directoryId: "dir-mid-market",
    name: "中长期合同签订规程.pdf",
    type: "pdf",
    size: "864KB",
    summary: "面向合同签订、履约调整和交易执行的操作说明。",
    parseStatus: "processing",
    publishStatus: "reviewing",
    currentVersion: "v1",
    hasHistoryVersions: false,
    updatedAt: "2026-07-02 13:08",
    uploadedAt: "2026-07-02 13:08",
    uploadedBy: "运行值长",
    permission: "department",
    tags: ["待审批", "解析中"],
  },
  {
    id: "file-aux-service",
    kbId: "kb-trading-standard",
    directoryId: "dir-aux-service",
    name: "辅助服务基本规则.pdf",
    type: "pdf",
    size: "1.42MB",
    summary: "覆盖辅助服务品种、补偿机制、考核约束和调用流程。",
    parseStatus: "done",
    publishStatus: "published",
    currentVersion: "v3",
    hasHistoryVersions: true,
    updatedAt: "2026-06-30 09:12",
    uploadedAt: "2026-06-30 09:12",
    uploadedBy: "李工",
    permission: "department",
    tags: ["辅助服务", "补偿"],
  },
  {
    id: "file-market-ops",
    kbId: "kb-trading-standard",
    directoryId: "dir-mid-market",
    name: "电力市场运营基本规则.pdf",
    type: "pdf",
    size: "980KB",
    summary: "明确市场运营机构职责、市场秩序维护和信息披露要求。",
    parseStatus: "done",
    publishStatus: "published",
    currentVersion: "v1",
    hasHistoryVersions: false,
    updatedAt: "2026-06-28 15:30",
    uploadedAt: "2026-06-28 15:30",
    uploadedBy: "张工",
    permission: "department",
    tags: ["运营", "披露"],
  },
  {
    id: "file-settlement",
    kbId: "kb-trading-standard",
    directoryId: "dir-mid-market",
    name: "中长期交易结算细则.pdf",
    type: "pdf",
    size: "1.05MB",
    summary: "明确中长期交易结算口径、偏差处理与对账流程。",
    parseStatus: "done",
    publishStatus: "published",
    currentVersion: "v2",
    hasHistoryVersions: true,
    updatedAt: "2026-07-01 11:20",
    uploadedAt: "2026-07-01 11:20",
    uploadedBy: "张工",
    permission: "department",
    tags: ["结算", "中长期"],
  },
  {
    id: "file-grid-guide",
    kbId: "kb-grid-operation",
    directoryId: "dir-grid-rules",
    name: "并网发电厂运行规程汇编.pdf",
    type: "pdf",
    size: "2.45MB",
    summary: "汇编并网运行日常监视、异常处置和调度联系要求。",
    parseStatus: "done",
    publishStatus: "published",
    currentVersion: "v4",
    hasHistoryVersions: true,
    updatedAt: "2026-07-03 09:15",
    uploadedAt: "2026-07-03 09:15",
    uploadedBy: "王工",
    permission: "department",
    tags: ["并网", "运行规程"],
  },
  {
    id: "file-grid-ticket",
    kbId: "kb-grid-operation",
    directoryId: "dir-grid-cases",
    name: "220kV 主变停复役典型操作票.docx",
    type: "word",
    size: "756KB",
    summary: "沉淀主变停复役操作节点、复核项与风险提示。",
    parseStatus: "done",
    publishStatus: "published",
    currentVersion: "v2",
    hasHistoryVersions: true,
    updatedAt: "2026-06-25 11:30",
    uploadedAt: "2026-06-25 11:30",
    uploadedBy: "运行处",
    permission: "department",
    tags: ["操作票", "主变"],
  },
  {
    id: "file-dispatch-coord",
    kbId: "kb-dispatch-coordination",
    directoryId: "dir-dispatch-coord",
    name: "联络线运行协调管理办法.pdf",
    type: "pdf",
    size: "1.12MB",
    summary: "规范联络线运行协调、信息通报与应急处置流程。",
    parseStatus: "done",
    publishStatus: "published",
    currentVersion: "v1",
    hasHistoryVersions: false,
    updatedAt: "2026-07-03 14:00",
    uploadedAt: "2026-07-03 14:00",
    uploadedBy: "王工",
    permission: "department",
    tags: ["联络线", "协调"],
  },
  {
    id: "file-agc-rule",
    kbId: "kb-agc",
    directoryId: "dir-agc-rule",
    name: "AGC 考核管理办法.pdf",
    type: "pdf",
    size: "980KB",
    summary: "定义 AGC 考核指标、月度统计口径和责任分解方式。",
    parseStatus: "done",
    publishStatus: "published",
    currentVersion: "v2",
    hasHistoryVersions: true,
    updatedAt: "2026-06-20 08:40",
    uploadedAt: "2026-06-20 08:40",
    uploadedBy: "运行处",
    permission: "department",
    tags: ["AGC", "考核"],
  },
  {
    id: "file-public-safety",
    kbId: "kb-public-regulation",
    directoryId: "dir-public-safe",
    name: "安全生产管理规定.pdf",
    type: "pdf",
    size: "1.62MB",
    summary: "全厂安全生产责任、制度执行、隐患闭环和检查机制。",
    parseStatus: "done",
    publishStatus: "published",
    currentVersion: "v5",
    hasHistoryVersions: true,
    updatedAt: "2026-07-04 09:20",
    uploadedAt: "2026-07-04 09:20",
    uploadedBy: "知识库管理员",
    permission: "public",
    tags: ["安全", "制度"],
  },
  {
    id: "file-public-case",
    kbId: "kb-public-experience",
    directoryId: "dir-public-exp",
    name: "典型故障处置案例集.pdf",
    type: "pdf",
    size: "3.2MB",
    summary: "复盘典型故障处置流程、协同节点和经验反馈。",
    parseStatus: "done",
    publishStatus: "published",
    currentVersion: "v1",
    hasHistoryVersions: false,
    updatedAt: "2026-06-28 14:00",
    uploadedAt: "2026-06-28 14:00",
    uploadedBy: "知识库管理员",
    permission: "public",
    tags: ["故障", "复盘"],
  },
  {
    id: "file-personal-note",
    kbId: "kb-personal",
    directoryId: "dir-personal-note",
    name: "个人学习笔记汇总.docx",
    type: "word",
    size: "856KB",
    summary: "个人学习笔记、规程摘录与待整理问题清单。",
    parseStatus: "processing",
    publishStatus: "reviewing",
    currentVersion: "v1",
    hasHistoryVersions: false,
    updatedAt: "2026-07-03 19:10",
    uploadedAt: "2026-07-03 19:10",
    uploadedBy: "运行值长",
    permission: "personal",
    tags: ["个人", "解析中"],
  },
];

export const KNOWLEDGE_VERSIONS: KnowledgeVersion[] = [
  {
    id: "ver-spot-v3",
    fileId: "file-spot-rule",
    versionNo: "v3",
    versionName: "2026 修订版",
    description: "当前版，参与默认 AI 问答召回",
    uploadedAt: "2026-07-04 10:17",
    uploadedBy: "张工",
    isCurrent: true,
  },
  {
    id: "ver-spot-v2",
    fileId: "file-spot-rule",
    versionNo: "v2",
    versionName: "2025 试行版",
    description: "历史版本，仅用于只读预览和下载",
    uploadedAt: "2025-12-18 09:30",
    uploadedBy: "张工",
    isCurrent: false,
  },
  {
    id: "ver-spot-v1",
    fileId: "file-spot-rule",
    versionNo: "v1",
    versionName: "2024 版",
    description: "历史版本，不参与默认 AI 召回",
    uploadedAt: "2024-04-22 10:17",
    uploadedBy: "张工",
    isCurrent: false,
  },
  {
    id: "ver-mid-v2",
    fileId: "file-mid-rule",
    versionNo: "v2",
    versionName: "2026 修订版",
    description: "当前版，参与默认 AI 问答召回",
    uploadedAt: "2026-07-03 16:42",
    uploadedBy: "张工",
    isCurrent: true,
  },
  {
    id: "ver-mid-v1",
    fileId: "file-mid-rule",
    versionNo: "v1",
    versionName: "2025 版",
    description: "历史版本，仅用于只读预览和下载",
    uploadedAt: "2025-08-19 11:10",
    uploadedBy: "李工",
    isCurrent: false,
  },
];

export const KNOWLEDGE_RECENT_BASES = [
  { kbId: "kb-trading-standard", visitedAt: "今天 14:30" },
  { kbId: "kb-grid-operation", visitedAt: "昨天 09:15" },
  { kbId: "kb-agc", visitedAt: "3天前" },
];

export const KNOWLEDGE_RECENT_FILES = [
  { fileId: "file-spot-rule", visitedAt: "今天 14:35" },
  { fileId: "file-mid-rule", visitedAt: "今天 10:20" },
  { fileId: "file-grid-guide", visitedAt: "昨天 16:00" },
];

export const KNOWLEDGE_UPLOAD_RECORDS: Array<{
  fileId: string;
  target: string;
  status: UploadRecordStatus;
  submittedAt: string;
  rejectReason?: string;
}> = [
  {
    fileId: "file-contract",
    target: "运行处 / 电力交易业务技术标准库",
    status: "pending",
    submittedAt: "2026-07-02 13:08",
  },
  {
    fileId: "file-personal-note",
    target: "个人工作资料库",
    status: "processing",
    submittedAt: "2026-07-03 19:10",
  },
  {
    fileId: "file-market-ops",
    target: "运行处 / 电力交易业务技术标准库",
    status: "published",
    submittedAt: "2026-06-28 15:30",
  },
  {
    fileId: "file-public-case",
    target: "公共空间 / 经验成果共享库",
    status: "rejected",
    submittedAt: "2026-06-21 08:10",
    rejectReason: "资料来源和审批依据不完整，请补充后重新提交。",
  },
];

export const KNOWLEDGE_AI_SUGGESTIONS: Record<string, string[]> = {
  "kb-trading-standard": [
    "现货市场与中长期市场的边界是什么？",
    "辅助服务补偿机制如何计算？",
    "合同偏差处理需要关注哪些风险？",
  ],
  "kb-grid-operation": [
    "主变停复役操作前需要复核哪些条件？",
    "并网异常处置流程如何启动？",
    "调度联系记录有哪些归档要求？",
  ],
};

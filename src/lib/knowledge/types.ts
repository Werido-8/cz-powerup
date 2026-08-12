export type KnowledgeUserRole = "employee" | "knowledgeAdmin" | "superAdmin";

export type KnowledgeBaseScope = "public" | "professional" | "personal";

export type FilePublishStatus =
  | "pendingApproval"
  | "pendingConfirm"
  | "rejected"
  | "parsing"
  | "parseFailed"
  | "published"
  | "archived"
  | "disabled";

export type KnowledgePermissionGroup = "view" | "upload" | "manage";

/** UI 二档权限：访问 / 库管理（内部仍映射到 view|upload|manage） */
export type GrantTier = "access" | "manage";

export type SubParseStatus = KnowledgeParseStatus | "skipped";

export type KnowledgeParseStatus = "waiting" | "parsing" | "success" | "failed";

export type KnowledgeFileType = "pdf" | "docx" | "xlsx" | "pptx" | "image" | "other";

export type KnowledgeSortBy = "updated" | "size" | "name" | "status";

export type FileSearchMode = "fulltext" | "filename";

export type KnowledgeMetadataFieldType = "select" | "multiSelect" | "text";

export interface KnowledgeMetadataField {
  id: string;
  label: string;
  type: KnowledgeMetadataFieldType;
  options?: string[];
}

export interface KnowledgeUser {
  id: string;
  name: string;
  role: KnowledgeUserRole;
}

export interface KnowledgeCategory {
  id: string;
  name: string;
  parentId?: string;
}

export interface KnowledgeBasePermission {
  canView: boolean;
  canUpload: boolean;
  canManage: boolean;
  canConfigurePermission: boolean;
}

export interface KnowledgeBase {
  id: string;
  name: string;
  description?: string;
  scope: KnowledgeBaseScope;
  categoryId?: string;
  categoryPath?: string[];
  fileCount?: number;
  permission: KnowledgeBasePermission;
  updatedAt?: string;
  ownerName?: string;
  isPinned?: boolean;
  /** 演示用：对普通员工锁定浏览/上传，知识库管理员不受影响 */
  restricted?: boolean;
  /** 个人知识库所属目录（仅 scope=personal 时使用） */
  personalDirectoryId?: string;
  /** 本库文件元数据字段定义，用于筛选与编辑 */
  metadataFields?: KnowledgeMetadataField[];
}

export interface KnowledgeFileVersion {
  id: string;
  version: string;
  name: string;
  description?: string;
  uploadedAt: string;
  uploaderName: string;
  isCurrent: boolean;
}

export interface KnowledgeFile {
  id: string;
  name: string;
  type?: KnowledgeFileType;
  knowledgeBaseId: string;
  knowledgeBaseName?: string;
  categoryPath?: string[];
  professionalType?: string;
  tags?: string[];
  version?: string;
  versions?: KnowledgeFileVersion[];
  isCurrentVersion?: boolean;
  status: FilePublishStatus;
  parseStatus?: KnowledgeParseStatus;
  /** 文档基础解析 */
  docParseStatus?: SubParseStatus;
  /** AI 智能体解析（摘要、脑图、题目等） */
  aiParseStatus?: SubParseStatus;
  parseError?: string;
  /** 不支持解析的格式，仅作文件存储 */
  storageOnly?: boolean;
  /** 审批时可编辑的 AI 字段 */
  aiKeywords?: string[];
  aiQuestions?: string[];
  uploaderId?: string;
  uploaderName?: string;
  updatedAt?: string;
  createdAt?: string;
  size?: string;
  summary?: string;
  canPreview?: boolean;
  canDownload?: boolean;
  canEdit?: boolean;
  favorite?: boolean;
  /** 是否启用；停用后普通用户不可见，管理员可切换 */
  enabled?: boolean;
  /** 是否置顶；置顶文件排在列表最前 */
  pinned?: boolean;
  /** 按知识库元数据字段存储的值 */
  metadata?: Record<string, string | string[]>;
  lastAccessedAt?: string;
  /** 演示用全文检索内容 */
  fullTextContent?: string;
}

export interface PersonalDirectory {
  id: string;
  name: string;
  parentId?: string;
}

export interface UploadRecord {
  id: string;
  fileId: string;
  fileName: string;
  targetKnowledgeBaseId: string;
  targetKnowledgeBaseName: string;
  submittedAt: string;
  status: FilePublishStatus;
  rejectReason?: string;
  /** 关联文件的解析状态（演示数据可直接写入） */
  parseStatus?: KnowledgeParseStatus;
  docParseStatus?: SubParseStatus;
  aiParseStatus?: SubParseStatus;

  /* ─── 上传跟踪多维字段（演示数据可选写入） ─── */
  /** 最近一次状态变化时间 */
  updatedAt?: string;
  /** 审核处理人；待审核为空 */
  reviewerName?: string;
  /** 审核完成时间；待审核为空 */
  reviewedAt?: string;
  /** 审核说明（通过说明或驳回摘要） */
  reviewNote?: string;
  /** 解析开始时间 */
  parseStartedAt?: string;
  /** 解析完成/更新时间 */
  parseUpdatedAt?: string;
  /** 解析进度百分比 0-100（解析中） */
  parseProgress?: number;
  /** 解析结果摘要，如「共 128 个分块 · 80 页」 */
  parseResult?: string;
  /** 解析异常摘要 */
  parseError?: string;
  /** 当前版本号，如 V1.0 */
  version?: string;
  /** 首次或当前版本发布时间 */
  publishedAt?: string;
  /** 执行发布的管理员 */
  publisherName?: string;
  /** 停用原因 */
  disabledReason?: string;
}

export interface PermissionRequest {
  id: string;
  applicantName: string;
  knowledgeBaseId: string;
  knowledgeBaseName: string;
  group: KnowledgePermissionGroup;
  reason: string;
  submittedAt: string;
  notifyStatus: "waiting" | "sent";
}

export type ApprovalStatus = "pendingApproval" | "approved" | "rejected" | "parsing";

/** 审批台入库来源：直传 / 个人库移入 */
export type UploadSourceType = "direct" | "move";

/** 审批台内容复核状态 */
export type ContentConfirmStatus = "confirmed" | "unconfirmed";

/** 文件移动（移入公共/专业库）审批状态 */
export type FileMoveApprovalStatus = "pendingMove" | "approved" | "rejected";

export type KnowledgeExerciseType = "single" | "multiple" | "judge";

export interface KnowledgeExerciseOption {
  id: string;
  label: string;
  content: string;
}

export interface KnowledgeExercise {
  id: string;
  type: KnowledgeExerciseType;
  stem: string;
  difficulty?: "easy" | "medium" | "hard";
  knowledgePoint?: string;
  source?: string;
  enabled?: boolean;
  options: KnowledgeExerciseOption[];
  correctAnswers: string[];
  analysis: string;
}

export interface UploadApproval {
  id: string;
  fileName: string;
  knowledgeBaseName: string;
  knowledgeBaseId?: string;
  /** 关联文件 ID（撤回删除、移入入库时使用） */
  fileId?: string;
  submitterName: string;
  submittedAt: string;
  fileSize?: string;
  uploadNote?: string;
  riskHint?: string;
  status?: ApprovalStatus;
  parseStatus?: KnowledgeParseStatus;
  /** 上传类型：文件直传 / 文件移动 */
  uploadType?: UploadSourceType;
  /** 内容确认状态：管理员是否已完成 AI 内容复核 */
  contentConfirmStatus?: ContentConfirmStatus;
  reviewerName?: string;
  reviewedAt?: string;
  reviewNote?: string;
  summary?: string;
  aiKeywords?: string[];
  aiMetadata?: Array<{
    id: string;
    label: string;
    value: string;
  }>;
  aiQuestions?: string[];
  aiAnswers?: string[];
  aiExercises?: KnowledgeExercise[];
  categoryId?: string;
}

/** 审批台「文件移动列表」：个人库移入公共/专业库的第一步审批 */
export interface FileMoveApproval {
  id: string;
  fileId: string;
  fileName: string;
  sourceKnowledgeBaseId: string;
  sourceKnowledgeBaseName: string;
  targetKnowledgeBaseId: string;
  targetKnowledgeBaseName: string;
  submitterName: string;
  submittedAt: string;
  fileSize?: string;
  status: FileMoveApprovalStatus;
  rejectReason?: string;
  reviewerName?: string;
  reviewedAt?: string;
}

export interface ParseException {
  id: string;
  fileId: string;
  fileName: string;
  knowledgeBaseName: string;
  uploadedAt: string;
  /** 原始失败原因（不做类型枚举） */
  reason: string;
  uploaderName?: string;
  fileSize?: string;
  version?: string;
}

export interface PermissionMember {
  id: string;
  name: string;
  group: KnowledgePermissionGroup;
}

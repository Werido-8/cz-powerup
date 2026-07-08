export type KnowledgeUserRole = "employee" | "departmentAdmin" | "knowledgeAdmin";

export type KnowledgeBaseStatus = "enabled" | "disabled";

export type KnowledgeBaseScope = "public" | "department" | "personal";

export type FilePublishStatus =
  | "pendingApproval"
  | "rejected"
  | "parsing"
  | "parseFailed"
  | "published"
  | "archived"
  | "disabled";

export type KnowledgePermissionGroup = "view" | "upload" | "manage";

export type KnowledgeParseStatus = "waiting" | "parsing" | "success" | "failed";

export type KnowledgeFileType = "pdf" | "docx" | "xlsx" | "pptx" | "image" | "other";

export type KnowledgeSortBy = "updated" | "name" | "uploader";

export interface KnowledgeUser {
  id: string;
  name: string;
  departmentId: string;
  departmentName: string;
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
  departmentId?: string;
  departmentName?: string;
  fileCount?: number;
  status: KnowledgeBaseStatus;
  permission: KnowledgeBasePermission;
  updatedAt?: string;
  ownerName?: string;
  isPinned?: boolean;
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
  parseError?: string;
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
  targetKnowledgeBaseName: string;
  submittedAt: string;
  status: FilePublishStatus;
  rejectReason?: string;
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

export interface UploadApproval {
  id: string;
  fileName: string;
  knowledgeBaseName: string;
  departmentName?: string;
  submitterName: string;
  submittedAt: string;
  fileSize?: string;
  uploadNote?: string;
  riskHint?: string;
}

export interface ParseException {
  id: string;
  fileId: string;
  fileName: string;
  knowledgeBaseName: string;
  uploadedAt: string;
  reason: string;
  failureType?: "ocr" | "timeout" | "format" | "other";
  fileSize?: string;
  version?: string;
}

export interface PermissionMember {
  id: string;
  name: string;
  group: KnowledgePermissionGroup;
}

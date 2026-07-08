import {
  CURRENT_KNOWLEDGE_USER,
  FAVORITE_FILE_IDS,
  KNOWLEDGE_BASES,
  KNOWLEDGE_CATEGORIES,
  KNOWLEDGE_FILES,
  PARSE_EXCEPTIONS,
  PERMISSION_REQUESTS,
  RECENT_FILE_IDS,
} from "./data";
import type {
  FilePublishStatus,
  KnowledgeBase,
  KnowledgeCategory,
  KnowledgeFile,
  KnowledgePermissionGroup,
  KnowledgeSortBy,
  KnowledgeUser,
  ParseException,
  PermissionRequest,
} from "./types";

export function isKnowledgeAdmin(user: KnowledgeUser = CURRENT_KNOWLEDGE_USER) {
  return user.role === "knowledgeAdmin";
}

export function isDepartmentAdmin(user: KnowledgeUser = CURRENT_KNOWLEDGE_USER) {
  return user.role === "departmentAdmin";
}

export function canViewKnowledgeAdmin(user: KnowledgeUser = CURRENT_KNOWLEDGE_USER) {
  return isKnowledgeAdmin(user) || isDepartmentAdmin(user);
}

export function canSeeCategoryManager(user: KnowledgeUser = CURRENT_KNOWLEDGE_USER) {
  return isKnowledgeAdmin(user);
}

export function canManageBase(base: KnowledgeBase, user: KnowledgeUser = CURRENT_KNOWLEDGE_USER) {
  if (isKnowledgeAdmin(user)) return true;
  return isDepartmentAdmin(user) && base.departmentId === user.departmentId;
}

export function canBrowseBase(base: KnowledgeBase) {
  return base.status === "enabled";
}

export function canViewBaseFiles(
  base: KnowledgeBase,
  user: KnowledgeUser = CURRENT_KNOWLEDGE_USER,
) {
  return base.permission.canView || canManageBase(base, user);
}

export function canUploadToBase(base: KnowledgeBase, user: KnowledgeUser = CURRENT_KNOWLEDGE_USER) {
  if (base.scope === "personal") return true;
  if (isKnowledgeAdmin(user)) return true;
  if (isDepartmentAdmin(user) && base.departmentId === user.departmentId) return true;
  return base.permission.canUpload;
}

export function canConfigureBasePermission(
  base: KnowledgeBase,
  user: KnowledgeUser = CURRENT_KNOWLEDGE_USER,
) {
  return base.permission.canConfigurePermission || canManageBase(base, user);
}

export function getBaseById(id: string) {
  return KNOWLEDGE_BASES.find((base) => base.id === id);
}

export function getFileById(id: string) {
  return KNOWLEDGE_FILES.find((file) => file.id === id);
}

export function getCategoryById(id: string) {
  return KNOWLEDGE_CATEGORIES.find((category) => category.id === id);
}

export function getBrowsableBases() {
  return KNOWLEDGE_BASES.filter((base) => base.scope !== "personal" && canBrowseBase(base));
}

export function getPinnedBases() {
  return KNOWLEDGE_BASES.filter((base) => base.isPinned && base.status === "enabled");
}

export function getPersonalBases() {
  return KNOWLEDGE_BASES.filter((base) => base.scope === "personal" && base.status === "enabled");
}

export function getReadableBases(user: KnowledgeUser = CURRENT_KNOWLEDGE_USER) {
  return KNOWLEDGE_BASES.filter(
    (base) => base.status === "enabled" && canViewBaseFiles(base, user),
  );
}

export function getManageableBases(user: KnowledgeUser = CURRENT_KNOWLEDGE_USER) {
  if (isKnowledgeAdmin(user)) return KNOWLEDGE_BASES;
  if (isDepartmentAdmin(user)) {
    return KNOWLEDGE_BASES.filter((base) => base.departmentId === user.departmentId);
  }
  return [];
}

export function isFileVisibleToUser(
  file: KnowledgeFile,
  user: KnowledgeUser = CURRENT_KNOWLEDGE_USER,
) {
  const base = getBaseById(file.knowledgeBaseId);
  if (!base || base.status !== "enabled") return false;
  if (file.status === "published") return canViewBaseFiles(base, user);
  return file.uploaderId === user.id || canManageBase(base, user);
}

export function getFilesForBase(baseId: string, user: KnowledgeUser = CURRENT_KNOWLEDGE_USER) {
  return KNOWLEDGE_FILES.filter(
    (file) => file.knowledgeBaseId === baseId && isFileVisibleToUser(file, user),
  );
}

export function getAllPublishedFiles(user: KnowledgeUser = CURRENT_KNOWLEDGE_USER) {
  return KNOWLEDGE_FILES.filter((file) => {
    const base = getBaseById(file.knowledgeBaseId);
    return (
      base?.status === "enabled" &&
      file.status === "published" &&
      file.isCurrentVersion !== false &&
      canViewBaseFiles(base, user)
    );
  });
}

export function getRecentFiles() {
  return RECENT_FILE_IDS.map((id) => getFileById(id)).filter((file): file is KnowledgeFile =>
    Boolean(file),
  );
}

export function getFavoriteFiles() {
  return FAVORITE_FILE_IDS.map((id) => getFileById(id)).filter((file): file is KnowledgeFile =>
    Boolean(file),
  );
}

export function getDefaultOverviewBaseId(user: KnowledgeUser = CURRENT_KNOWLEDGE_USER) {
  return (
    getPinnedBases().find((base) => base.scope !== "personal" && canViewBaseFiles(base, user))
      ?.id ??
    getBrowsableBases().find((base) => canViewBaseFiles(base, user))?.id ??
    getBrowsableBases()[0]?.id
  );
}

export function getFirstReadableFileInBase(baseId: string) {
  return (
    getFilesForBase(baseId).find((file) => file.status === "published") ??
    getFilesForBase(baseId)[0]
  );
}

export function filterFiles(
  files: KnowledgeFile[],
  filters: {
    query?: string;
    categoryId?: string;
    baseId?: string;
    professionalType?: string;
    tag?: string;
    status?: FilePublishStatus | "all";
  },
) {
  const query = filters.query?.trim().toLowerCase();
  return files.filter((file) => {
    const base = getBaseById(file.knowledgeBaseId);
    if (filters.categoryId && base?.categoryId !== filters.categoryId) return false;
    if (filters.baseId && file.knowledgeBaseId !== filters.baseId) return false;
    if (filters.professionalType && file.professionalType !== filters.professionalType)
      return false;
    if (filters.tag && !file.tags?.includes(filters.tag)) return false;
    if (filters.status && filters.status !== "all" && file.status !== filters.status) return false;
    if (!query) return true;
    return (
      file.name.toLowerCase().includes(query) ||
      file.summary?.toLowerCase().includes(query) ||
      file.knowledgeBaseName?.toLowerCase().includes(query) ||
      file.tags?.some((tag) => tag.toLowerCase().includes(query))
    );
  });
}

export function sortKnowledgeFiles(files: KnowledgeFile[], sortBy: KnowledgeSortBy) {
  const next = [...files];
  if (sortBy === "name") return next.sort((a, b) => a.name.localeCompare(b.name, "zh-CN"));
  if (sortBy === "uploader") {
    return next.sort((a, b) => (a.uploaderName ?? "").localeCompare(b.uploaderName ?? "", "zh-CN"));
  }
  return next.sort((a, b) => (b.updatedAt ?? "").localeCompare(a.updatedAt ?? ""));
}

export function getProfessionalTypes(files = KNOWLEDGE_FILES) {
  return Array.from(new Set(files.map((file) => file.professionalType).filter(Boolean))).sort(
    (a, b) => String(a).localeCompare(String(b), "zh-CN"),
  ) as string[];
}

export function getAllTags(files = KNOWLEDGE_FILES) {
  return Array.from(new Set(files.flatMap((file) => file.tags ?? []))).sort((a, b) =>
    a.localeCompare(b, "zh-CN"),
  );
}

export function getCategoryChildren(parentId?: string): KnowledgeCategory[] {
  return KNOWLEDGE_CATEGORIES.filter((category) => category.parentId === parentId);
}

export function getBasesForCategory(categoryId: string) {
  return getBrowsableBases().filter((base) => base.categoryId === categoryId);
}

export function permissionGroupLabel(group: KnowledgePermissionGroup) {
  const labels: Record<KnowledgePermissionGroup, string> = {
    view: "浏览组",
    upload: "上传组",
    manage: "管理组",
  };
  return labels[group];
}

export function getPermissionRequestsForBase(baseId: string): PermissionRequest[] {
  return PERMISSION_REQUESTS.filter((request) => request.knowledgeBaseId === baseId);
}

export function getParseExceptionsForScope(
  user: KnowledgeUser = CURRENT_KNOWLEDGE_USER,
): ParseException[] {
  if (isKnowledgeAdmin(user)) return PARSE_EXCEPTIONS;
  return PARSE_EXCEPTIONS.filter((item) => {
    const file = getFileById(item.fileId);
    const base = file ? getBaseById(file.knowledgeBaseId) : undefined;
    return base?.departmentId === user.departmentId;
  });
}

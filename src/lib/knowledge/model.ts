import { FAVORITE_FILE_IDS, PARSE_EXCEPTIONS, PERMISSION_REQUESTS, RECENT_FILE_IDS } from "./data";
import { getLearningMaterialFileById } from "@/lib/learning/material-files";
import { getCurrentKnowledgeUser } from "./demoRole";
import { getEffectiveLevelForUser, getGrantsForBase, type PermissionLevel } from "./permission";
import {
  getStoreBases,
  getStoreCategories,
  getStoreFiles,
  getStoreInternalDirectories,
  getStorePersonalDirectories,
} from "./store";
import { publishStatusLabel } from "./status";
import type {
  FilePublishStatus,
  FileSearchMode,
  KnowledgeBase,
  KnowledgeCategory,
  KnowledgeFile,
  KnowledgeInternalDirectory,
  KnowledgeMetadataField,
  KnowledgePermissionGroup,
  KnowledgeSortBy,
  KnowledgeUser,
  ParseException,
  PermissionRequest,
  PersonalDirectory,
} from "./types";

export function isSuperAdmin(user: KnowledgeUser = getCurrentKnowledgeUser()) {
  return user.role === "superAdmin";
}

export function isKnowledgeAdmin(user: KnowledgeUser = getCurrentKnowledgeUser()) {
  return user.role === "knowledgeAdmin" || isSuperAdmin(user);
}

export function isEmployee(user: KnowledgeUser = getCurrentKnowledgeUser()) {
  return user.role === "employee";
}

export function canViewKnowledgeAdmin(user: KnowledgeUser = getCurrentKnowledgeUser()) {
  return isKnowledgeAdmin(user);
}

export function canSeeCategoryManager(user: KnowledgeUser = getCurrentKnowledgeUser()) {
  return isKnowledgeAdmin(user) || isSuperAdmin(user);
}

/** 超级管理员可见：个人库（原全局审计入口已并入库清单 Tab） */
export function canSeeGlobalAudit(user: KnowledgeUser = getCurrentKnowledgeUser()) {
  return isSuperAdmin(user);
}

export function canSeePersonalLibraryAudit(user: KnowledgeUser = getCurrentKnowledgeUser()) {
  return canSeeGlobalAudit(user);
}

/** 管理端「专业库」清单：排除个人库 */
export function getManageableProfessionalBases(user: KnowledgeUser = getCurrentKnowledgeUser()) {
  return getManageableBases(user).filter((base) => base.scope !== "personal");
}

function effectiveLevelForBase(
  base: KnowledgeBase,
  user: KnowledgeUser = getCurrentKnowledgeUser(),
): PermissionLevel | null {
  if (base.scope === "personal") return "manage";
  if (isEmployee(user)) return "view";
  if (isSuperAdmin(user) || isKnowledgeAdmin(user)) return "manage";
  const fromGrants = getEffectiveLevelForUser(base.id, user.id);
  if (fromGrants) return fromGrants;
  if (base.permission.canManage) return "manage";
  if (base.permission.canUpload) return "upload";
  if (base.permission.canView) return "view";
  return null;
}

export function canManageBase(
  base: KnowledgeBase,
  user: KnowledgeUser = getCurrentKnowledgeUser(),
) {
  if (base.scope === "personal") return true;
  if (isEmployee(user)) return false;
  if (isSuperAdmin(user)) return true;
  if (isKnowledgeAdmin(user)) return true;
  return effectiveLevelForBase(base, user) === "manage";
}

export function canViewBaseFiles(
  base: KnowledgeBase,
  user: KnowledgeUser = getCurrentKnowledgeUser(),
) {
  if (isSuperAdmin(user) || isKnowledgeAdmin(user)) return true;
  if (base.restricted) return false;
  return base.permission.canView || canManageBase(base, user);
}

export function canUploadToBase(
  base: KnowledgeBase,
  user: KnowledgeUser = getCurrentKnowledgeUser(),
) {
  if (base.scope === "personal") return true;
  if (isEmployee(user)) return false;
  if (isSuperAdmin(user) || isKnowledgeAdmin(user)) return true;
  if (base.restricted) return false;
  const level = effectiveLevelForBase(base, user);
  return level === "upload" || level === "manage" || base.permission.canUpload;
}

export function canConfigureBasePermission(
  base: KnowledgeBase,
  user: KnowledgeUser = getCurrentKnowledgeUser(),
) {
  if (isEmployee(user)) return false;
  // 公共库对全员开放，不提供权限配置能力；仅专业库支持配置权限
  if (base.scope === "public") return false;
  return base.permission.canConfigurePermission || canManageBase(base, user);
}

export function canManageFileList(
  base?: KnowledgeBase,
  user: KnowledgeUser = getCurrentKnowledgeUser(),
) {
  if (base?.scope === "personal") return true;
  if (isEmployee(user)) return false;
  if (isSuperAdmin(user)) return true;
  if (!base) return canViewKnowledgeAdmin(user);
  return canManageBase(base, user);
}

export function canDeleteFile(
  base: KnowledgeBase,
  user: KnowledgeUser = getCurrentKnowledgeUser(),
) {
  if (base.scope === "personal") return true;
  if (isEmployee(user)) return false;
  return canManageBase(base, user);
}

export function canMoveCrossLibrary(
  source: KnowledgeBase,
  target: KnowledgeBase,
  user: KnowledgeUser = getCurrentKnowledgeUser(),
) {
  if (isEmployee(user)) {
    return (
      source.scope === "personal" && target.scope === "public" && canViewBaseFiles(target, user)
    );
  }
  if (source.scope === "personal" && target.scope !== "personal") {
    return canUploadToBase(target, user);
  }
  if (source.scope !== "personal" && target.scope !== "personal") {
    return canManageBase(source, user) && canManageBase(target, user);
  }
  if (source.scope !== "personal") return false;
  return canManageFileList(source, user) && canManageFileList(target, user);
}

export function isFileEnabled(file: KnowledgeFile) {
  return file.enabled !== false;
}

export function getBaseById(id: string) {
  return getStoreBases().find((base) => base.id === id);
}

export function getFileById(id: string) {
  return getStoreFiles().find((file) => file.id === id) ?? getLearningMaterialFileById(id);
}

export function getCategoryById(id: string) {
  return getStoreCategories().find((category) => category.id === id);
}

export function getBrowsableBases() {
  return getStoreBases()
    .filter((base) => base.scope !== "personal")
    .sort((a, b) => a.name.localeCompare(b.name, "zh-CN"));
}

export function getPinnedBases() {
  return getStoreBases().filter((base) => base.isPinned);
}

export function getPersonalBases() {
  return getStoreBases()
    .filter((base) => base.scope === "personal")
    .sort((a, b) => a.name.localeCompare(b.name, "zh-CN"));
}

export const PERSONAL_DIRECTORY_ROOT_ID = "personal-root";
export const PERSONAL_TREE_ALL_ID = "__tree-personal-all__";
export const PROFESSIONAL_TREE_ALL_ID = "__tree-professional-all__";

export function isTreeAggregateId(id?: string) {
  return id === PERSONAL_TREE_ALL_ID || id === PROFESSIONAL_TREE_ALL_ID;
}

export function getPersonalBasesForDirectory(directoryId: string) {
  return getPersonalBases().filter((base) => base.personalDirectoryId === directoryId);
}

export function getPersonalBasesForDirectoryTree(
  directoryId: string,
  user: KnowledgeUser = getCurrentKnowledgeUser(),
) {
  return getStoreBases().filter(
    (base) =>
      base.scope === "personal" &&
      base.personalDirectoryId === directoryId &&
      (canManageBase(base, user) || canViewBaseFiles(base, user)),
  );
}

export function getPersonalDirectoryChildren(parentId?: string): PersonalDirectory[] {
  return getStorePersonalDirectories()
    .filter((directory) => (parentId ? directory.parentId === parentId : !directory.parentId))
    .sort((a, b) => a.name.localeCompare(b.name, "zh-CN"));
}

export function getPersonalDirectoryById(id: string) {
  return getStorePersonalDirectories().find((directory) => directory.id === id);
}

export function getPersonalDirectoryPathLabel(directoryId: string): string {
  const chain: string[] = [];
  let current = getPersonalDirectoryById(directoryId);
  while (current) {
    chain.unshift(current.name);
    current = current.parentId ? getPersonalDirectoryById(current.parentId) : undefined;
  }
  return chain.join(" / ");
}

export function getPersonalDirectoryTreeDirectories() {
  return getPersonalDirectoryChildren(PERSONAL_DIRECTORY_ROOT_ID);
}

export function getPersonalTreeBases(user: KnowledgeUser = getCurrentKnowledgeUser()) {
  return getPersonalBases().filter((base) => canViewBaseFiles(base, user));
}

export function getProfessionalTreeBases(user: KnowledgeUser = getCurrentKnowledgeUser()) {
  return getStoreBases().filter(
    (base) => base.scope !== "personal" && canViewBaseFiles(base, user),
  );
}

export function getFilesForPersonalTree(user: KnowledgeUser = getCurrentKnowledgeUser()) {
  return getPersonalTreeBases(user).flatMap((base) => getFilesForBase(base.id));
}

export function getFilesForProfessionalTree(user: KnowledgeUser = getCurrentKnowledgeUser()) {
  return getProfessionalTreeBases(user).flatMap((base) => getFilesForBase(base.id));
}

export function getReadableBases(user: KnowledgeUser = getCurrentKnowledgeUser()) {
  return getStoreBases().filter((base) => canViewBaseFiles(base, user));
}

export function getManageableBases(user: KnowledgeUser = getCurrentKnowledgeUser()) {
  const allBases = getStoreBases();
  if (isSuperAdmin(user) || isKnowledgeAdmin(user)) return allBases;
  return allBases.filter((base) => canManageBase(base, user));
}

/** 超级管理员：全部个人库文件集合（兼容旧调用；新页面请用 personalLibraryAudit） */
export function getGlobalAuditFiles(user: KnowledgeUser = getCurrentKnowledgeUser()) {
  if (!canSeeGlobalAudit(user)) return [];
  return getStoreFiles().filter((file) => {
    const base = getBaseById(file.knowledgeBaseId);
    return base?.scope === "personal";
  });
}

export function isFileVisibleToUser(
  file: KnowledgeFile,
  user: KnowledgeUser = getCurrentKnowledgeUser(),
) {
  const base = getBaseById(file.knowledgeBaseId);
  if (!base) return false;
  if (!isFileEnabled(file) && !canManageBase(base, user)) return false;
  if (file.status === "published") return canViewBaseFiles(base, user);
  return file.uploaderId === user.id || canManageBase(base, user);
}

export function getFilesForBase(baseId: string, user: KnowledgeUser = getCurrentKnowledgeUser()) {
  return getStoreFiles().filter(
    (file) => file.knowledgeBaseId === baseId && isFileVisibleToUser(file, user),
  );
}

export function getAllPublishedFiles(user: KnowledgeUser = getCurrentKnowledgeUser()) {
  return getStoreFiles().filter((file) => {
    const base = getBaseById(file.knowledgeBaseId);
    return (
      Boolean(base) &&
      file.status === "published" &&
      file.isCurrentVersion !== false &&
      canViewBaseFiles(base!, user)
    );
  });
}

export function getRecentFiles(): KnowledgeFile[] {
  const now = new Date();
  const result: KnowledgeFile[] = [];
  RECENT_FILE_IDS.forEach((id, index) => {
    const file = getFileById(id);
    if (!file) return;
    result.push({ ...file, lastAccessedAt: buildDemoRecentAccessTime(now, index) });
  });
  return result.sort((a, b) => (b.lastAccessedAt ?? "").localeCompare(a.lastAccessedAt ?? ""));
}

/** 演示用访问时间：前若干条落在今天，其次本周，其余更早 */
function buildDemoRecentAccessTime(now: Date, index: number) {
  const date = new Date(now);
  const weekday = (now.getDay() + 6) % 7; // Monday = 0

  if (index < 8) {
    date.setHours(18 - index, (index * 7) % 60, 0, 0);
  } else if (index < 16 && weekday > 0) {
    const daysAgo = 1 + ((index - 8) % weekday);
    date.setDate(date.getDate() - daysAgo);
    date.setHours(10 + ((index - 8) % 8), (index * 11) % 60, 0, 0);
  } else {
    const daysAgo = 8 + Math.max(0, index - 8) * 2;
    date.setDate(date.getDate() - daysAgo);
    date.setHours(9 + (index % 8), (index * 13) % 60, 0, 0);
  }

  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  return `${y}-${m}-${d} ${hh}:${mm}`;
}

export function getFavoriteFiles() {
  return FAVORITE_FILE_IDS.map((id) => getFileById(id)).filter((file): file is KnowledgeFile =>
    Boolean(file),
  );
}

export function getDefaultOverviewBaseId(user: KnowledgeUser = getCurrentKnowledgeUser()) {
  return (
    getPinnedBases().find((base) => base.scope !== "personal" && canViewBaseFiles(base, user))
      ?.id ??
    getBrowsableBases().find((base) => canViewBaseFiles(base, user))?.id ??
    getBrowsableBases()[0]?.id
  );
}

/** 用户置顶的文件（同步到左侧「快速访问」） */
export function getPinnedFiles(user: KnowledgeUser = getCurrentKnowledgeUser()) {
  return getStoreFiles().filter(
    (file) => file.pinned && file.isCurrentVersion !== false && isFileVisibleToUser(file, user),
  );
}

export function getInternalDirectoriesForBase(baseId: string) {
  return getStoreInternalDirectories().filter((directory) => directory.knowledgeBaseId === baseId);
}

export function getInternalDirectoryById(directoryId?: string) {
  if (!directoryId) return undefined;
  return getStoreInternalDirectories().find((directory) => directory.id === directoryId);
}

export function getInternalDirectoryChildren(baseId: string, parentId?: string) {
  return getStoreInternalDirectories().filter(
    (directory) =>
      directory.knowledgeBaseId === baseId &&
      (parentId ? directory.parentId === parentId : !directory.parentId),
  );
}

export function getInternalDirectoryChain(directoryId?: string) {
  const chain: KnowledgeInternalDirectory[] = [];
  let current = getInternalDirectoryById(directoryId);
  while (current) {
    chain.unshift(current);
    current = getInternalDirectoryById(current.parentId);
  }
  return chain;
}

export function getInternalDirectoryPathLabel(directoryId?: string, rootLabel = "根目录") {
  const names = getInternalDirectoryChain(directoryId).map((directory) => directory.name);
  return names.length ? names.join(" / ") : rootLabel;
}

export function getInternalDirectoryDescendantIds(baseId: string, directoryId: string) {
  const ids = new Set<string>([directoryId]);
  let changed = true;
  const directories = getInternalDirectoriesForBase(baseId);
  while (changed) {
    changed = false;
    for (const directory of directories) {
      if (directory.parentId && ids.has(directory.parentId) && !ids.has(directory.id)) {
        ids.add(directory.id);
        changed = true;
      }
    }
  }
  return ids;
}

/** 同一父级下是否已有同名库内目录（去空格后精确匹配） */
export function hasSiblingInternalDirectoryName(
  baseId: string,
  parentId: string | undefined,
  name: string,
  excludeId?: string,
) {
  const normalized = name.trim();
  return getInternalDirectoryChildren(baseId, parentId).some(
    (directory) => directory.id !== excludeId && directory.name === normalized,
  );
}

/** 文件可移动到的目标知识库 */
export function getMoveTargetBases(
  currentBaseId?: string,
  user: KnowledgeUser = getCurrentKnowledgeUser(),
) {
  const sourceBase = currentBaseId ? getBaseById(currentBaseId) : undefined;
  const sourceIsPersonal = sourceBase?.scope === "personal";

  return getStoreBases().filter((base) => {
    if (base.id === currentBaseId) return false;

    if (sourceBase) {
      if (isEmployee(user)) {
        return sourceIsPersonal && (base.scope === "personal" || canViewBaseFiles(base, user));
      }
      if (sourceIsPersonal && base.scope === "personal") {
        return canManageFileList(base, user);
      }
      if (sourceIsPersonal && base.scope !== "personal") {
        return canUploadToBase(base, user);
      }
      if (!sourceIsPersonal && base.scope === "personal") return false;
      return canMoveCrossLibrary(sourceBase, base, user);
    }

    return canManageFileList(base, user) || canUploadToBase(base, user);
  });
}

export function isSubmitToPublicMove(
  sourceBaseId: string | undefined,
  targetBaseId: string,
): boolean {
  const source = sourceBaseId ? getBaseById(sourceBaseId) : undefined;
  const target = getBaseById(targetBaseId);
  return source?.scope === "personal" && target?.scope !== "personal";
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
    searchMode?: FileSearchMode;
    categoryId?: string;
    baseId?: string;
    status?: FilePublishStatus | "all";
    metadataFilters?: Record<string, string>;
  },
) {
  const query = filters.query?.trim().toLowerCase();
  const searchMode = filters.searchMode ?? "filename";
  return files.filter((file) => {
    const base = getBaseById(file.knowledgeBaseId);
    if (filters.categoryId && base?.categoryId !== filters.categoryId) return false;
    if (filters.baseId && file.knowledgeBaseId !== filters.baseId) return false;
    if (filters.status && filters.status !== "all" && file.status !== filters.status) return false;

    if (filters.metadataFilters) {
      const metadataFieldMap = new Map(
        (base?.metadataFields ?? []).map((field) => [field.id, field]),
      );
      for (const [fieldId, rawValue] of Object.entries(filters.metadataFilters)) {
        const value = rawValue?.trim();
        if (!value || value === "all") continue;
        const fileValue = file.metadata?.[fieldId];
        const isText = metadataFieldMap.get(fieldId)?.type === "text";
        if (Array.isArray(fileValue)) {
          const matched = isText
            ? fileValue.some((item) => item.toLowerCase().includes(value.toLowerCase()))
            : fileValue.includes(value);
          if (!matched) return false;
        } else if (isText) {
          if (!fileValue || !fileValue.toLowerCase().includes(value.toLowerCase())) return false;
        } else if (fileValue !== value) {
          return false;
        }
      }
    }

    if (!query) return true;

    if (searchMode === "filename") {
      return file.name.toLowerCase().includes(query);
    }

    return (
      file.name.toLowerCase().includes(query) ||
      file.summary?.toLowerCase().includes(query) ||
      file.fullTextContent?.toLowerCase().includes(query) ||
      file.knowledgeBaseName?.toLowerCase().includes(query)
    );
  });
}

export function sortKnowledgeFiles(files: KnowledgeFile[], sortBy: KnowledgeSortBy) {
  const compare = resolveFileComparator(sortBy);
  return [...files].sort(compare);
}

function resolveFileComparator(
  sortBy: KnowledgeSortBy,
): (a: KnowledgeFile, b: KnowledgeFile) => number {
  if (sortBy === "name") return (a, b) => a.name.localeCompare(b.name, "zh-CN");
  if (sortBy === "size") return (a, b) => parseFileSize(b.size) - parseFileSize(a.size);
  if (sortBy === "status") {
    return (a, b) =>
      publishStatusLabel(a.status).localeCompare(publishStatusLabel(b.status), "zh-CN");
  }
  return (a, b) => (b.updatedAt ?? "").localeCompare(a.updatedAt ?? "");
}

function parseFileSize(size?: string) {
  if (!size) return 0;
  const match = size.trim().match(/^([\d.]+)\s*(B|KB|MB|GB)?$/i);
  if (!match) return 0;
  const value = Number.parseFloat(match[1]);
  const unit = (match[2] ?? "B").toUpperCase();
  const multipliers: Record<string, number> = {
    B: 1,
    KB: 1024,
    MB: 1024 ** 2,
    GB: 1024 ** 3,
  };
  return value * (multipliers[unit] ?? 1);
}

export function getMetadataFieldsForBase(baseId: string): KnowledgeMetadataField[] {
  return getBaseById(baseId)?.metadataFields ?? [];
}

export function getMetadataFilterOptions(
  files: KnowledgeFile[],
  field: KnowledgeMetadataField,
): string[] {
  const values = new Set<string>();
  for (const file of files) {
    const raw = file.metadata?.[field.id];
    if (Array.isArray(raw)) {
      raw.forEach((item) => values.add(item));
    } else if (raw) {
      values.add(raw);
    }
  }
  const fromData = Array.from(values);
  if (field.options?.length) {
    const merged = new Set([...field.options, ...fromData]);
    return Array.from(merged).sort((a, b) => a.localeCompare(b, "zh-CN"));
  }
  return fromData.sort((a, b) => a.localeCompare(b, "zh-CN"));
}

export function countActiveMetadataFilters(filters: Record<string, string>) {
  return Object.values(filters).filter((value) => value && value !== "all").length;
}

export function getCategoryChildren(parentId?: string): KnowledgeCategory[] {
  return getStoreCategories()
    .filter((category) => (parentId ? category.parentId === parentId : !category.parentId))
    .sort((a, b) => a.name.localeCompare(b.name, "zh-CN"));
}

export function getBasesForCategory(categoryId: string) {
  return getBrowsableBases().filter((base) => base.categoryId === categoryId);
}

/** 侧栏树：知识库全员可见（无权限时展示锁） */
export function getBasesForCategoryTree(categoryId: string) {
  return getStoreBases()
    .filter((base) => base.scope !== "personal" && base.categoryId === categoryId)
    .sort((a, b) => a.name.localeCompare(b.name, "zh-CN"));
}

export function countAllBasesInCategorySubtree(categoryId: string): number {
  let count = getStoreBases().filter(
    (base) => base.scope !== "personal" && base.categoryId === categoryId,
  ).length;
  for (const child of getCategoryChildren(categoryId)) {
    count += countAllBasesInCategorySubtree(child.id);
  }
  return count;
}

export function countAllBasesInPersonalDirectorySubtree(directoryId: string): number {
  let count = getStoreBases().filter(
    (base) => base.scope === "personal" && base.personalDirectoryId === directoryId,
  ).length;
  for (const child of getPersonalDirectoryChildren(directoryId)) {
    count += countAllBasesInPersonalDirectorySubtree(child.id);
  }
  return count;
}

export function canDisableCategory(categoryId: string) {
  return countAllBasesInCategorySubtree(categoryId) === 0;
}

export function canDisablePersonalDirectory(directoryId: string) {
  return countAllBasesInPersonalDirectorySubtree(directoryId) === 0;
}

export function hasSiblingPersonalDirectoryName(
  parentId: string | undefined,
  name: string,
  excludeId?: string,
) {
  const normalized = name.trim();
  return getPersonalDirectoryChildren(parentId).some(
    (directory) => directory.id !== excludeId && directory.name === normalized,
  );
}

export function getCategoryChain(categoryId: string): KnowledgeCategory[] {
  const chain: KnowledgeCategory[] = [];
  let current = getCategoryById(categoryId);
  while (current) {
    chain.unshift(current);
    current = current.parentId ? getCategoryById(current.parentId) : undefined;
  }
  return chain;
}

/** 完整目录路径，如「运行专业 / 规程制度」 */
export function getCategoryPathLabel(categoryId: string): string {
  return getCategoryChain(categoryId)
    .map((category) => category.name)
    .join(" / ");
}

export function listCategoryPathOptions(): { value: string; label: string }[] {
  return getStoreCategories().map((category) => ({
    value: category.id,
    label: getCategoryPathLabel(category.id),
  }));
}

const CATEGORY_NAME_MAX_LENGTH = 40;
const KNOWLEDGE_BASE_DESCRIPTION_MAX_LENGTH = 500;

export function getCategoryNameMaxLength() {
  return CATEGORY_NAME_MAX_LENGTH;
}

export function getKnowledgeBaseDescriptionMaxLength() {
  return KNOWLEDGE_BASE_DESCRIPTION_MAX_LENGTH;
}

/** 同一父级下是否已有同名目录（去空格后精确匹配） */
export function hasSiblingCategoryName(
  parentId: string | undefined,
  name: string,
  excludeId?: string,
) {
  const normalized = name.trim();
  return getCategoryChildren(parentId).some(
    (category) => category.id !== excludeId && category.name === normalized,
  );
}

export function getSiblingCategories(categoryId: string): KnowledgeCategory[] {
  const category = getCategoryById(categoryId);
  if (!category) return [];
  return getCategoryChildren(category.parentId);
}

export function getFirstBrowsableBaseInCategory(categoryId: string): KnowledgeBase | undefined {
  const direct = getBasesForCategory(categoryId);
  if (direct.length > 0) return direct[0];
  for (const child of getCategoryChildren(categoryId)) {
    const found = getFirstBrowsableBaseInCategory(child.id);
    if (found) return found;
  }
  return undefined;
}

export interface KnowledgeBreadcrumbOption {
  id: string;
  label: string;
  kind: "category" | "base";
}

export interface KnowledgeBreadcrumbSegment {
  id: string;
  label: string;
  kind: "scope" | "category" | "base";
  options: KnowledgeBreadcrumbOption[];
}

export function buildKnowledgeBaseBreadcrumb(base: KnowledgeBase): KnowledgeBreadcrumbSegment[] {
  if (base.scope === "personal") {
    return [
      {
        id: "scope-personal",
        label: "我的空间",
        kind: "scope",
        options: [],
      },
      {
        id: `base-${base.id}`,
        label: base.name,
        kind: "base",
        options: getPersonalBases().map((item) => ({
          id: item.id,
          label: item.name,
          kind: "base" as const,
        })),
      },
    ];
  }

  const segments: KnowledgeBreadcrumbSegment[] = [];

  if (base.categoryId) {
    for (const category of getCategoryChain(base.categoryId)) {
      segments.push({
        id: `cat-${category.id}`,
        label: category.name,
        kind: "category",
        options: getSiblingCategories(category.id).map((item) => ({
          id: item.id,
          label: item.name,
          kind: "category" as const,
        })),
      });
    }
  }

  const baseSiblings = base.categoryId
    ? getBasesForCategory(base.categoryId)
    : getBrowsableBases().filter((item) => !item.categoryId);

  segments.push({
    id: `base-${base.id}`,
    label: base.name,
    kind: "base",
    options: baseSiblings.map((item) => ({
      id: item.id,
      label: item.name,
      kind: "base" as const,
    })),
  });

  return segments;
}

export function resolveBreadcrumbSelection(option: KnowledgeBreadcrumbOption): string | undefined {
  if (option.kind === "base") return option.id;
  return getFirstBrowsableBaseInCategory(option.id)?.id;
}

export function permissionGroupLabel(group: KnowledgePermissionGroup) {
  const labels: Record<KnowledgePermissionGroup, string> = {
    view: "访问权限",
    upload: "访问权限",
    manage: "库管理",
  };
  return labels[group];
}

export function getPermissionRequestsForBase(baseId: string): PermissionRequest[] {
  return PERMISSION_REQUESTS.filter((request) => request.knowledgeBaseId === baseId);
}

export function getParseExceptionsForScope(
  user: KnowledgeUser = getCurrentKnowledgeUser(),
): ParseException[] {
  if (isSuperAdmin(user) || isKnowledgeAdmin(user)) return PARSE_EXCEPTIONS;
  return PARSE_EXCEPTIONS.filter((item) => {
    const file = getFileById(item.fileId);
    const base = file ? getBaseById(file.knowledgeBaseId) : undefined;
    return base ? canManageBase(base, user) : false;
  });
}

import {
  KB_VIEWER,
  KNOWLEDGE_BASES,
  KNOWLEDGE_DEPARTMENTS,
  KNOWLEDGE_DIRECTORIES,
  KNOWLEDGE_FILES,
  KNOWLEDGE_RECENT_BASES,
  KNOWLEDGE_RECENT_FILES,
  KNOWLEDGE_UPLOAD_RECORDS,
  KNOWLEDGE_VERSIONS,
  type KnowledgeBase,
  type KnowledgeDepartment,
  type KnowledgeDirectory,
  type KnowledgeFile,
  type KnowledgeParseStatus,
  type KnowledgePublishStatus,
  type KnowledgeSortBy,
  type KnowledgeVersion,
  type KnowledgeViewMode,
  type KnowledgeViewer,
  type UploadRecordStatus,
} from "./knowledge-space";

export type DirectoryNode = {
  directory: KnowledgeDirectory;
  files: KnowledgeFile[];
};

export function getDepartmentById(id: string): KnowledgeDepartment | undefined {
  return KNOWLEDGE_DEPARTMENTS.find((department) => department.id === id);
}

export function getKnowledgeBaseById(id: string): KnowledgeBase | undefined {
  return KNOWLEDGE_BASES.find((base) => base.id === id);
}

export function getDirectoryById(id: string): KnowledgeDirectory | undefined {
  return KNOWLEDGE_DIRECTORIES.find((directory) => directory.id === id);
}

export function getKnowledgeFileById(id: string): KnowledgeFile | undefined {
  return KNOWLEDGE_FILES.find((file) => file.id === id);
}

export function getPublicKnowledgeBases(): KnowledgeBase[] {
  return KNOWLEDGE_BASES.filter((base) => base.spaceType === "public");
}

export function getKnowledgeBasesByDepartment(departmentId: string): KnowledgeBase[] {
  return KNOWLEDGE_BASES.filter(
    (base) => base.spaceType === "department" && base.departmentId === departmentId,
  );
}

export function formatKnowledgeFileTime(iso: string): string {
  const normalized = iso.includes("T") ? iso : iso.replace(" ", "T");
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return iso;

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const dayDiff = Math.floor((startOfToday.getTime() - startOfDate.getTime()) / 86_400_000);

  if (dayDiff === 0) {
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `今天 ${hours}:${minutes}`;
  }
  if (dayDiff === 1) return "昨天";
  if (dayDiff < 7) return `${dayDiff} 天前`;
  if (dayDiff < 14) return "上周";
  if (dayDiff < 30) return `${Math.floor(dayDiff / 7)} 周前`;
  return `${date.getMonth() + 1}月${date.getDate()}日`;
}

export function getRecentFilesForKnowledgeBase(
  kbId: string,
  limit = 3,
  viewer: KnowledgeViewer = KB_VIEWER,
): Array<{ name: string; updatedAt: string }> {
  return sortFiles(getFilesByKnowledgeBase(kbId, undefined, viewer), "updated")
    .slice(0, limit)
    .map((file) => ({
      name: file.name,
      updatedAt: formatKnowledgeFileTime(file.updatedAt),
    }));
}

export function getDepartmentSpaces() {
  return KNOWLEDGE_DEPARTMENTS.map((department) => ({
    ...department,
    libraries: getKnowledgeBasesByDepartment(department.id),
  }));
}

export function getPersonalKnowledgeBases(viewer: KnowledgeViewer = KB_VIEWER): KnowledgeBase[] {
  return KNOWLEDGE_BASES.filter(
    (base) => base.spaceType === "personal" && base.departmentId === viewer.departmentId,
  );
}

export function getSiblingKnowledgeBases(kbId: string): KnowledgeBase[] {
  const current = getKnowledgeBaseById(kbId);
  if (!current) return [];
  if (current.spaceType === "public") return getPublicKnowledgeBases();
  if (current.spaceType === "personal") return getPersonalKnowledgeBases();
  if (current.departmentId) return getKnowledgeBasesByDepartment(current.departmentId);
  return [];
}

export function getDirectoriesByKnowledgeBase(kbId: string): KnowledgeDirectory[] {
  return KNOWLEDGE_DIRECTORIES.filter((directory) => directory.kbId === kbId).sort(
    (a, b) => a.sortOrder - b.sortOrder,
  );
}

export function getFilesByKnowledgeBase(
  kbId: string,
  directoryId?: string,
  viewer: KnowledgeViewer = KB_VIEWER,
): KnowledgeFile[] {
  let files = KNOWLEDGE_FILES.filter((file) => file.kbId === kbId);
  if (directoryId) files = files.filter((file) => file.directoryId === directoryId);
  return files.filter((file) => isFileVisible(file, viewer));
}

export function getDirectoryTree(
  kbId: string,
  viewer: KnowledgeViewer = KB_VIEWER,
): DirectoryNode[] {
  return getDirectoriesByKnowledgeBase(kbId).map((directory) => ({
    directory,
    files: getFilesByKnowledgeBase(kbId, directory.id, viewer),
  }));
}

export function getAllFilesDirectoryId(): string | null {
  return null;
}

export function getDefaultDirectoryId(kbId: string): string | null {
  return getDirectoriesByKnowledgeBase(kbId)[0]?.id ?? null;
}

export function getFileCountForDirectory(
  directoryId: string,
  viewer: KnowledgeViewer = KB_VIEWER,
): number {
  return KNOWLEDGE_FILES.filter(
    (file) => file.directoryId === directoryId && isFileVisible(file, viewer),
  ).length;
}

export function getVersionsByFile(fileId: string): KnowledgeVersion[] {
  const versions = KNOWLEDGE_VERSIONS.filter((version) => version.fileId === fileId);
  if (versions.length > 0) return versions;
  const file = getKnowledgeFileById(fileId);
  if (!file) return [];
  return [
    {
      id: `${fileId}-current`,
      fileId,
      versionNo: file.currentVersion,
      versionName: "当前版",
      description: "当前版本，参与默认 AI 问答召回",
      uploadedAt: file.updatedAt,
      uploadedBy: file.uploadedBy,
      isCurrent: true,
    },
  ];
}

export function isKnowledgeAdmin(viewer: KnowledgeViewer = KB_VIEWER): boolean {
  return viewer.role === "knowledgeAdmin";
}

export function isDepartmentAdmin(
  departmentId: string | undefined,
  viewer: KnowledgeViewer = KB_VIEWER,
): boolean {
  return viewer.role === "departmentAdmin" && departmentId === viewer.departmentId;
}

export function canCreateKnowledgeBase(
  base?: KnowledgeBase,
  viewer: KnowledgeViewer = KB_VIEWER,
): boolean {
  if (isKnowledgeAdmin(viewer)) return true;
  if (!base?.departmentId) return false;
  return isDepartmentAdmin(base.departmentId, viewer);
}

export function canCreateKnowledgeBaseInDepartment(
  departmentId: string,
  viewer: KnowledgeViewer = KB_VIEWER,
): boolean {
  return isKnowledgeAdmin(viewer) || isDepartmentAdmin(departmentId, viewer);
}

export function canUploadToKnowledgeBase(
  kbId: string,
  viewer: KnowledgeViewer = KB_VIEWER,
): boolean {
  return isKnowledgeAdmin(viewer) || viewer.uploadKbIds.includes(kbId);
}

export function canManageKnowledgeBase(
  base: KnowledgeBase,
  viewer: KnowledgeViewer = KB_VIEWER,
): boolean {
  return isKnowledgeAdmin(viewer) || isDepartmentAdmin(base.departmentId, viewer);
}

export function isFileVisible(file: KnowledgeFile, viewer: KnowledgeViewer = KB_VIEWER): boolean {
  if (file.publishStatus === "published" && file.parseStatus === "done") return true;
  if (viewer.role !== "employee") return true;
  return file.uploadedBy === viewer.name || viewer.id === file.uploadedBy;
}

export function filterKnowledgeBasesByQuery(bases: KnowledgeBase[], q: string): KnowledgeBase[] {
  const query = q.trim().toLowerCase();
  if (!query) return bases;
  return bases.filter(
    (base) =>
      base.name.toLowerCase().includes(query) ||
      base.description.toLowerCase().includes(query) ||
      base.latestFileName.toLowerCase().includes(query),
  );
}

export function filterFilesByQuery(files: KnowledgeFile[], q: string): KnowledgeFile[] {
  const query = q.trim().toLowerCase();
  if (!query) return files;
  return files.filter(
    (file) =>
      file.name.toLowerCase().includes(query) ||
      file.summary.toLowerCase().includes(query) ||
      file.tags.some((tag) => tag.toLowerCase().includes(query)),
  );
}

export function sortFiles(files: KnowledgeFile[], sortBy: KnowledgeSortBy): KnowledgeFile[] {
  const copy = [...files];
  if (sortBy === "name") return copy.sort((a, b) => a.name.localeCompare(b.name, "zh-CN"));
  if (sortBy === "uploaded") return copy.sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
  return copy.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function parseStatusLabel(status: KnowledgeParseStatus): string {
  const labels: Record<KnowledgeParseStatus, string> = {
    pending: "待解析",
    processing: "解析中",
    done: "已解析",
    failed: "解析失败",
  };
  return labels[status];
}

export function publishStatusLabel(status: KnowledgePublishStatus): string {
  const labels: Record<KnowledgePublishStatus, string> = {
    published: "已发布",
    reviewing: "待审批",
    rejected: "已驳回",
  };
  return labels[status];
}

export function uploadStatusLabel(status: UploadRecordStatus): string {
  const labels: Record<UploadRecordStatus, string> = {
    pending: "待审批",
    processing: "解析中",
    published: "已发布",
    rejected: "已驳回",
  };
  return labels[status];
}

export function canOpenFilePreview(
  file: KnowledgeFile,
): { ok: true } | { ok: false; reason: string } {
  if (!isFileVisible(file)) return { ok: false, reason: "该文件暂不可访问" };
  if (file.parseStatus === "failed") return { ok: false, reason: "文件解析失败，请联系管理员" };
  return { ok: true };
}

export function getRecentKnowledgeBases() {
  return KNOWLEDGE_RECENT_BASES.map((item) => {
    const base = getKnowledgeBaseById(item.kbId);
    return base ? { ...item, base } : null;
  }).filter(
    (item): item is { kbId: string; visitedAt: string; base: KnowledgeBase } => item !== null,
  );
}

export function getRecentKnowledgeFiles() {
  return KNOWLEDGE_RECENT_FILES.map((item) => {
    const file = getKnowledgeFileById(item.fileId);
    const base = file ? getKnowledgeBaseById(file.kbId) : undefined;
    return file && base ? { ...item, file, base } : null;
  }).filter(
    (
      item,
    ): item is { fileId: string; visitedAt: string; file: KnowledgeFile; base: KnowledgeBase } =>
      item !== null,
  );
}

export function getUploadRecords() {
  return KNOWLEDGE_UPLOAD_RECORDS.map((item) => {
    const file = getKnowledgeFileById(item.fileId);
    return file ? { ...item, file } : null;
  }).filter(
    (item): item is (typeof KNOWLEDGE_UPLOAD_RECORDS)[number] & { file: KnowledgeFile } =>
      item !== null,
  );
}

export function readLastDepartment(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("kb-last-department");
}

export function writeLastDepartment(departmentId: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("kb-last-department", departmentId);
}

export function readSpaceSidebarCollapsed(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem("kb-space-sidebar-collapsed") === "true";
}

export function writeSpaceSidebarCollapsed(collapsed: boolean): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("kb-space-sidebar-collapsed", String(collapsed));
}

export function readViewMode(): KnowledgeViewMode {
  if (typeof window === "undefined") return "grid";
  return localStorage.getItem("kb-view-mode") === "list" ? "list" : "grid";
}

export function writeViewMode(mode: KnowledgeViewMode): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("kb-view-mode", mode);
}

export type KbSortBy = KnowledgeSortBy;
export type KbViewMode = KnowledgeViewMode;
export const getDeptById = getDepartmentById;
export const getLibraryById = getKnowledgeBaseById;
export const getFolderById = getDirectoryById;
export const getFileById = getKnowledgeFileById;
export const getLibrariesByDept = getKnowledgeBasesByDepartment;
export const getFoldersByLibrary = getDirectoriesByKnowledgeBase;
export const getFilesByLibrary = getFilesByKnowledgeBase;
export const getVisibleFileById = getKnowledgeFileById;
export const filterLibrariesByQuery = filterKnowledgeBasesByQuery;
export const getDeptIdForLibrary = (kbId: string) => getKnowledgeBaseById(kbId)?.departmentId;
export const readLastDept = readLastDepartment;
export const writeLastDept = writeLastDepartment;
export const readSidebarCollapsed = readSpaceSidebarCollapsed;
export const writeSidebarCollapsed = writeSpaceSidebarCollapsed;
export const getFileCountForFolder = getFileCountForDirectory;

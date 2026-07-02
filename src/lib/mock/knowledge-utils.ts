import {
  KB_DEPTS,
  KB_FILES,
  KB_FOLDERS,
  KB_LIBRARIES,
  KB_VIEWER,
  type KbDept,
  type KbFile,
  type KbFolder,
  type KbLibrary,
  type KbParseStatus,
} from "./knowledge-space";

export type KbFileNavNode = {
  folder: KbFolder;
  files: KbFile[];
};

export type KbViewer = { id: string; isAdmin: boolean };

export function getDeptById(id: string): KbDept | undefined {
  return KB_DEPTS.find((d) => d.id === id);
}

export function getLibraryById(id: string): KbLibrary | undefined {
  return KB_LIBRARIES.find((l) => l.id === id);
}

export function getFolderById(id: string): KbFolder | undefined {
  return KB_FOLDERS.find((f) => f.id === id);
}

export function getFileById(id: string): KbFile | undefined {
  return KB_FILES.find((f) => f.id === id);
}

export function getLibrariesByDept(deptId: string): KbLibrary[] {
  return KB_LIBRARIES.filter((l) => l.deptId === deptId);
}

export function getFoldersByLibrary(libraryId: string): KbFolder[] {
  return KB_FOLDERS.filter((f) => f.libraryId === libraryId).sort(
    (a, b) => a.sortOrder - b.sortOrder,
  );
}

export function getDeptIdForLibrary(libraryId: string): string | undefined {
  return getLibraryById(libraryId)?.deptId;
}

export function isFileVisible(
  file: KbFile,
  viewer: KbViewer = KB_VIEWER,
): boolean {
  const { parseStatus, uploaderId } = file;
  if (parseStatus === "done") return true;
  if (viewer.isAdmin) return true;
  if (uploaderId === viewer.id) return true;
  return false;
}

export function getFilesByLibrary(
  libraryId: string,
  folderId?: string,
  viewer: KbViewer = KB_VIEWER,
): KbFile[] {
  let files = KB_FILES.filter((f) => f.libraryId === libraryId);
  if (folderId) files = files.filter((f) => f.folderId === folderId);
  return files.filter((f) => isFileVisible(f, viewer));
}

export function getFileCountForFolder(
  folderId: string,
  viewer: KbViewer = KB_VIEWER,
): number {
  return KB_FILES.filter((f) => f.folderId === folderId && isFileVisible(f, viewer)).length;
}

export function getFileNavTree(
  libraryId: string,
  viewer: KbViewer = KB_VIEWER,
): KbFileNavNode[] {
  const folders = getFoldersByLibrary(libraryId).filter((f) => f.name !== "未分类");
  return folders
    .map((folder) => ({
      folder,
      files: getFilesByLibrary(libraryId, folder.id, viewer),
    }))
    .filter((node) => node.files.length > 0 || folderHasVisibleFiles(node.folder.id, libraryId, viewer));
}

function folderHasVisibleFiles(
  folderId: string,
  libraryId: string,
  viewer: KbViewer,
): boolean {
  return getFilesByLibrary(libraryId, folderId, viewer).length > 0;
}

export type KbSortBy = "updated" | "name" | "size" | "created";

export function sortFiles(files: KbFile[], sortBy: KbSortBy): KbFile[] {
  const copy = [...files];
  switch (sortBy) {
    case "name":
      return copy.sort((a, b) => a.name.localeCompare(b.name, "zh-CN"));
    case "size":
      return copy.sort((a, b) => parseSize(b.size) - parseSize(a.size));
    case "created":
      return copy.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    case "updated":
    default:
      return copy.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }
}

function parseSize(size: string): number {
  const m = size.match(/^([\d.]+)\s*(KB|MB|GB)?/i);
  if (!m) return 0;
  const n = parseFloat(m[1]);
  const unit = (m[2] ?? "MB").toUpperCase();
  if (unit === "KB") return n;
  if (unit === "GB") return n * 1024;
  return n;
}

export function filterFilesByQuery(files: KbFile[], q: string): KbFile[] {
  const query = q.trim().toLowerCase();
  if (!query) return files;
  return files.filter(
    (f) =>
      f.name.toLowerCase().includes(query) ||
      f.summary.toLowerCase().includes(query),
  );
}

export function filterLibrariesByQuery(libraries: KbLibrary[], q: string): KbLibrary[] {
  const query = q.trim().toLowerCase();
  if (!query) return libraries;
  return libraries.filter(
    (l) =>
      l.name.toLowerCase().includes(query) ||
      (l.description?.toLowerCase().includes(query) ?? false),
  );
}

export function canOpenFilePreview(
  file: KbFile,
  viewer: KbViewer = KB_VIEWER,
): { ok: true } | { ok: false; reason: string } {
  if (!isFileVisible(file, viewer)) {
    return { ok: false, reason: "该文件暂不可访问" };
  }
  if (file.parseStatus === "done") return { ok: true };
  if (file.parseStatus === "processing" && file.uploaderId === viewer.id) {
    return { ok: true };
  }
  if (file.parseStatus === "processing") {
    return { ok: false, reason: "文件解析中，请稍候" };
  }
  if (file.parseStatus === "pending") {
    return { ok: false, reason: "文件等待解析中" };
  }
  if (file.parseStatus === "failed") {
    return { ok: false, reason: "文件解析失败，请联系管理员" };
  }
  return { ok: false, reason: "该文件已禁用" };
}

export function parseStatusLabel(status: KbParseStatus): string {
  const map: Record<KbParseStatus, string> = {
    pending: "待解析",
    processing: "解析中",
    done: "已解析",
    failed: "解析失败",
    disabled: "已禁用",
  };
  return map[status];
}

export function readLastDept(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("kb-last-dept");
}

export function writeLastDept(deptId: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("kb-last-dept", deptId);
}

export function readSidebarCollapsed(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem("kb-sidebar-collapsed") === "true";
}

export function writeSidebarCollapsed(collapsed: boolean): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("kb-sidebar-collapsed", String(collapsed));
}

export type KbViewMode = "grid" | "list";

export function readViewMode(): KbViewMode {
  if (typeof window === "undefined") return "grid";
  const v = localStorage.getItem("kb-view-mode");
  return v === "list" ? "list" : "grid";
}

export function writeViewMode(mode: KbViewMode): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("kb-view-mode", mode);
}

export function getVisibleFileById(
  id: string,
  viewer: KbViewer = KB_VIEWER,
): KbFile | undefined {
  const file = getFileById(id);
  if (!file || !isFileVisible(file, viewer)) return undefined;
  return file;
}

export function filterVisibleRecentFiles(
  items: { fileId: string; visitedAt: string }[],
  viewer: KbViewer = KB_VIEWER,
): { fileId: string; visitedAt: string; file: KbFile }[] {
  return items
    .map((item) => {
      const file = getVisibleFileById(item.fileId, viewer);
      return file ? { ...item, file } : null;
    })
    .filter((x): x is { fileId: string; visitedAt: string; file: KbFile } => x !== null);
}

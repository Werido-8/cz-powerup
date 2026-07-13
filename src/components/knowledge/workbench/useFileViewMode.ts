import { useEffect, useState } from "react";
import type { FileViewMode } from "./KnowledgeFileTable";

const STORAGE_KEY = "knowledge-file-view-mode";

function readStored(fallback: FileViewMode): FileViewMode {
  if (typeof window === "undefined") return fallback;
  const saved = localStorage.getItem(STORAGE_KEY);
  return saved === "card" || saved === "list" ? saved : fallback;
}

/** 文件列表/卡片视图模式，持久化到 localStorage，跨页面与刷新保持 */
export function useFileViewMode(fallback: FileViewMode = "list") {
  const [viewMode, setViewMode] = useState<FileViewMode>(() => readStored(fallback));

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, viewMode);
    }
  }, [viewMode]);

  return [viewMode, setViewMode] as const;
}

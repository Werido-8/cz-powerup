import { KNOWLEDGE_BASES } from "./data";

const STORAGE_KEY = "knowledge-pinned-base-ids";

function defaultPinnedIds(): string[] {
  return KNOWLEDGE_BASES.filter((b) => b.isPinned).map((b) => b.id);
}

export function loadPinnedIds(): string[] {
  if (typeof window === "undefined") return defaultPinnedIds();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as string[];
  } catch {
    // ignore
  }
  return defaultPinnedIds();
}

export function savePinnedIds(ids: string[]) {
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  }
}

export function togglePinnedId(ids: string[], baseId: string): string[] {
  const set = new Set(ids);
  if (set.has(baseId)) set.delete(baseId);
  else set.add(baseId);
  return [...set];
}

export function isPinnedId(ids: string[], baseId: string): boolean {
  return ids.includes(baseId);
}

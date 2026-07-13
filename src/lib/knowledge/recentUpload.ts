const STORAGE_KEY = "knowledge-recent-upload-base-ids";
const MAX_RECENT = 5;

export function loadRecentUploadBaseIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return (JSON.parse(raw) as string[]).slice(0, MAX_RECENT);
  } catch {
    // ignore
  }
  return [];
}

export function pushRecentUploadBaseId(baseId: string): string[] {
  const next = [
    baseId,
    ...loadRecentUploadBaseIds().filter((id) => id !== baseId),
  ].slice(0, MAX_RECENT);
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }
  return next;
}

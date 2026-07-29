import type { FileSearchMode, KnowledgeBase, KnowledgeFile } from "./types";

export type FileDetailSearchScope = "personal-all" | "professional-all";

export type FileDetailSearchOptions = {
  query?: string;
  searchMode?: FileSearchMode;
  resultFiles?: KnowledgeFile[];
  scope?: FileDetailSearchScope;
  /** 打开详情页前的列表页地址，用于返回时回到上层来源页 */
  from?: string;
};

/**
 * Builds the `search` object for navigating to /knowledge/file/$fileId.
 * Forwards `resultIds` whenever the caller supplies `resultFiles`, so the detail
 * page sidebar can mirror the list the user came from (search, metadata filter, or both).
 * `q` / `mode` are attached only when a non-empty query is present.
 */
export function buildFileDetailSearch(file: KnowledgeFile, opts: FileDetailSearchOptions = {}) {
  const trimmed = opts.query?.trim();
  const resultIds = opts.resultFiles?.map((f) => f.id);
  const hasResultList = Boolean(resultIds?.length);

  return {
    kbId: file.knowledgeBaseId,
    ...(trimmed ? { q: trimmed, mode: opts.searchMode ?? "filename" } : {}),
    ...(hasResultList ? { resultIds } : {}),
    ...(opts.scope ? { scope: opts.scope } : {}),
    ...(opts.from ? { from: opts.from } : {}),
  };
}

type FileDetailLocationBuilder = {
  buildLocation: (opts: {
    to: string;
    params: { fileId: string };
    search: ReturnType<typeof buildFileDetailSearch>;
  }) => { href: string };
};

function captureCurrentListLocation() {
  if (typeof window === "undefined") return undefined;
  return `${window.location.pathname}${window.location.search}${window.location.hash}`;
}

function pathnameOf(href: string) {
  const path = href.split(/[?#]/)[0] ?? href;
  return path;
}

/** 站内相对路径，且不是文件详情自身（避免返回死循环） */
export function isUsableFileDetailReturnFrom(from?: string): from is string {
  if (!from || !from.startsWith("/")) return false;
  const path = pathnameOf(from);
  return !path.startsWith("/knowledge/file/");
}

export function buildFileListReturnNavigation(opts: {
  searchScope?: FileDetailSearchScope;
  base?: KnowledgeBase;
}) {
  if (opts.searchScope === "personal-all" || opts.base?.scope === "personal") {
    return { to: "/knowledge/mine" as const, search: { panel: "personal" as const } };
  }
  if (opts.searchScope === "professional-all") {
    return { to: "/knowledge" as const, search: {} };
  }
  if (opts.base?.id) {
    return { to: "/knowledge" as const, search: { kbId: opts.base.id } };
  }
  return { to: "/knowledge" as const, search: {} };
}

/** 将 buildFileListReturnNavigation 结果拼成可 history.push 的地址 */
export function buildFileListReturnHref(opts: {
  searchScope?: FileDetailSearchScope;
  base?: KnowledgeBase;
}) {
  const nav = buildFileListReturnNavigation(opts);
  const params = new URLSearchParams();
  const search = nav.search as Record<string, string | undefined>;
  for (const [key, value] of Object.entries(search)) {
    if (value) params.set(key, value);
  }
  const query = params.toString();
  return query ? `${nav.to}?${query}` : nav.to;
}

/**
 * 解析详情页「返回」目标：优先打开时记录的上层页面，否则按库/范围推断。
 * 不使用浏览器历史后退，也不关闭当前标签。
 */
export function resolveFileDetailReturnHref(opts: {
  from?: string;
  searchScope?: FileDetailSearchScope;
  base?: KnowledgeBase;
}) {
  if (isUsableFileDetailReturnFrom(opts.from)) return opts.from;
  return buildFileListReturnHref(opts);
}

/** @deprecated 使用 resolveFileDetailReturnHref + 当前窗导航 */
export function returnToFileListTab(from?: string): boolean {
  if (typeof window === "undefined") return false;
  if (!isUsableFileDetailReturnFrom(from)) return false;
  window.location.assign(from);
  return true;
}

/** Opens file detail in a new browser tab, preserving optional search context. */
export function openFileDetailInNewTab(
  router: FileDetailLocationBuilder,
  file: KnowledgeFile,
  opts: FileDetailSearchOptions = {},
) {
  const href = router.buildLocation({
    to: "/knowledge/file/$fileId",
    params: { fileId: file.id },
    search: buildFileDetailSearch(file, {
      ...opts,
      from: opts.from ?? captureCurrentListLocation(),
    }),
  }).href;
  window.open(href, "_blank", "noreferrer");
}

/** 各模块文件列表点击文件时统一新开 tab 预览（审批台、详情页库内切换除外）。 */
export function shouldOpenFileDetailInNewTab(_query?: string, _searchMode?: FileSearchMode) {
  return true;
}

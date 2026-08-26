/**
 * 文件比对视图的页面级临时状态。
 *
 * 该对象只在当前前端会话中存活，用于在组件重新挂载后恢复右侧章节统计的滚动位置。
 */
export interface CompareViewCache {
  densityScroll: number;
}

const compareViewCache: CompareViewCache = {
  densityScroll: 0,
};

export function getCompareViewCache(): CompareViewCache {
  return compareViewCache;
}

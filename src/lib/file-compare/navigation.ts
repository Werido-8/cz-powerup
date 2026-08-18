import { z } from "zod";

export const diffTypeSchema = z.enum(["added", "removed", "modified", "moved"]);

/**
 * 差异概览 / 变更清单 / 文件信息 共用的查询参数。
 * 页签切换与页面跳转时保留章节、差异与类型筛选。
 */
export const compareOverviewSearchSchema = z.object({
  chapter: z.string().optional(),
  type: diffTypeSchema.optional(),
  diff: z.string().optional(),
});

export type CompareOverviewSearch = z.infer<typeof compareOverviewSearchSchema>;

/** 双栏对照阅读的查询参数，额外携带搜索关键词 */
export const compareReaderSearchSchema = compareOverviewSearchSchema.extend({
  q: z.string().optional(),
});

export type CompareReaderSearch = z.infer<typeof compareReaderSearchSchema>;

/** 从阅读页回到概览页时丢弃关键词，只保留定位与筛选 */
export function toOverviewSearch(search: CompareReaderSearch): CompareOverviewSearch {
  return { chapter: search.chapter, type: search.type, diff: search.diff };
}

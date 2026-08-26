import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { MySpacePage } from "@/components/knowledge/workbench/MySpacePage";
import type { UploadView } from "@/lib/knowledge/uploadTracking";

const mineSearchSchema = z.object({
  panel: z.enum(["recent", "uploads", "favorites", "personal"]).optional(),
  view: z.enum(["all", "review", "parse", "publish"]).optional(),
  status: z.string().optional(),
  q: z.string().optional(),
});

export type MineSearch = z.infer<typeof mineSearchSchema>;

export const Route = createFileRoute("/knowledge/mine")({
  validateSearch: mineSearchSchema,
  component: KnowledgeMinePage,
  head: () => ({ meta: [{ title: "我的空间 · 知识库 · 涉网运行能力智能提升平台" }] }),
});

function KnowledgeMinePage() {
  const search = Route.useSearch();
  return <MySpacePage search={search} />;
}

export function toUploadSearch(search: MineSearch) {
  return {
    panel: search.panel,
    view: search.view as UploadView | undefined,
    status: search.status,
    q: search.q,
  };
}

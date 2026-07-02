import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import {
  ChevronLeft,
  Download,
  MoreHorizontal,
  PanelRightClose,
  PanelRight,
} from "lucide-react";
import { toast } from "sonner";
import { getVisibleFileById, getLibraryById } from "@/lib/mock/knowledge-utils";
import { KbFilePreview } from "@/components/knowledge/KbFilePreview";
import { KbAiPanel } from "@/components/knowledge/KbAiPanel";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { KB_VIEWER } from "@/lib/mock/knowledge-space";
import { cn } from "@/lib/utils";

const fileSearchSchema = z.object({
  panel: z.enum(["ai"]).optional().catch(undefined),
});

export const Route = createFileRoute("/knowledge/file/$fileId")({
  validateSearch: fileSearchSchema,
  loader: ({ params }) => {
    const file = getVisibleFileById(params.fileId);
    if (!file) throw notFound();
    const library = getLibraryById(file.libraryId);
    if (!library) throw notFound();
    return { file, library };
  },
  component: KnowledgeFilePage,
  head: ({ loaderData }) => ({
    meta: [{ title: `${loaderData?.file.name ?? "预览"} · 知识库 · 涉网运行能力智能提升平台` }],
  }),
});

function KnowledgeFilePage() {
  const { file, library } = Route.useLoaderData();
  const [aiCollapsed, setAiCollapsed] = useState(false);

  const isProcessing = file.parseStatus === "processing";
  const canDownload = file.parseStatus === "done";

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* 解析中提示条 */}
      {isProcessing && (
        <div className="flex items-center justify-center gap-2 border-b border-warning/25 bg-warning-soft/60 px-4 py-2 text-[12px] text-warning-foreground">
          <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-warning" />
          文件解析中，AI 问答暂不可用
        </div>
      )}

      {/* 工具栏 */}
      <div className="flex items-center gap-2 border-b border-border bg-background/40 px-4 py-2.5">
        {/* 返回 */}
        <Link
          to="/knowledge/lib/$libId"
          params={{ libId: library.id }}
          search={{ folder: file.folderId }}
          className="flex shrink-0 items-center gap-1 rounded-md px-2 py-1.5 text-[12px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
          返回
        </Link>

        <div className="mx-1 h-4 w-px bg-border" />

        {/* 文件名 */}
        <h1
          className="min-w-0 flex-1 truncate text-[13px] font-semibold text-foreground"
          title={file.name}
        >
          {file.name}
        </h1>

        {/* 操作按钮组 */}
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            disabled={!canDownload}
            onClick={() => canDownload && toast.message("开始下载（演示占位）")}
            className={cn(
              "grid h-8 w-8 place-items-center rounded-md transition-colors",
              canDownload
                ? "text-muted-foreground hover:bg-muted hover:text-foreground"
                : "cursor-not-allowed text-muted-foreground/30",
            )}
            title="下载"
          >
            <Download className="h-4 w-4" />
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="grid h-8 w-8 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => toast.message("已复制链接")}>
                复制链接
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => toast.message("已收藏")}>收藏</DropdownMenuItem>
              {KB_VIEWER.isAdmin && (
                <>
                  <DropdownMenuItem onClick={() => toast.message("移动（演示占位）")}>
                    移动到
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => toast.message("重命名（演示占位）")}>
                    重命名
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => toast.message("已删除（演示占位）")}>
                    删除
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="mx-1 h-4 w-px bg-border" />

          <button
            type="button"
            onClick={() => setAiCollapsed((v) => !v)}
            className={cn(
              "grid h-8 w-8 place-items-center rounded-md transition-colors",
              aiCollapsed
                ? "text-muted-foreground hover:bg-muted"
                : "bg-primary-soft text-primary hover:bg-primary-soft/80",
            )}
            title={aiCollapsed ? "展开 AI 面板" : "收起 AI 面板"}
          >
            {aiCollapsed ? (
              <PanelRight className="h-4 w-4" />
            ) : (
              <PanelRightClose className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {/* 主内容 */}
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <KbFilePreview file={file} />
        <KbAiPanel
          libraryId={library.id}
          fileId={file.id}
          collapsed={aiCollapsed || isProcessing}
        />
      </div>
    </div>
  );
}

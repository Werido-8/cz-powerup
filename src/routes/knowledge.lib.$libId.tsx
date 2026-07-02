import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useMemo, useEffect } from "react";
import { z } from "zod";
import { toast } from "sonner";
import {
  LayoutGrid,
  List,
  Upload,
  Plus,
  ChevronRight,
  BookOpen,
} from "lucide-react";
import {
  getDeptById,
  getLibraryById,
  getFilesByLibrary,
  filterFilesByQuery,
  sortFiles,
  canOpenFilePreview,
  writeLastDept,
  readViewMode,
  writeViewMode,
  type KbSortBy,
} from "@/lib/mock/knowledge-utils";
import type { KbFile } from "@/lib/mock/knowledge-space";
import { KB_VIEWER } from "@/lib/mock/knowledge-space";
import { KbFolderList } from "@/components/knowledge/KbFolderList";
import { KbFileList } from "@/components/knowledge/KbFileList";
import { cn } from "@/lib/utils";

const libSearchSchema = z.object({
  folder: z.string().optional().catch(undefined),
  view: z.enum(["grid", "list"]).optional().catch("grid"),
  sort: z.enum(["updated", "name", "size", "created"]).optional().catch("updated"),
  q: z.string().optional().catch(undefined),
});

export const Route = createFileRoute("/knowledge/lib/$libId")({
  validateSearch: libSearchSchema,
  loader: ({ params }) => {
    const library = getLibraryById(params.libId);
    if (!library) throw notFound();
    const dept = getDeptById(library.deptId);
    return { library, dept };
  },
  component: KnowledgeLibPage,
  head: ({ loaderData }) => ({
    meta: [{ title: `${loaderData?.library.name ?? "知识库"} · 涉网运行能力智能提升平台` }],
  }),
});

function KnowledgeLibPage() {
  const { library, dept } = Route.useLoaderData();
  const search = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });

  const folderId = search.folder ?? null;
  const viewMode = search.view ?? "grid";
  const sortBy = (search.sort ?? "updated") as KbSortBy;
  const query = search.q ?? "";

  useEffect(() => {
    if (dept) writeLastDept(dept.id);
  }, [dept]);

  useEffect(() => {
    if (!search.view) {
      const stored = readViewMode();
      if (stored !== "grid") {
        navigate({ search: (prev) => ({ ...prev, view: stored }), replace: true });
      }
    }
  }, []);

  const files = useMemo(() => {
    let list = getFilesByLibrary(library.id, folderId ?? undefined);
    list = filterFilesByQuery(list, query);
    return sortFiles(list, sortBy);
  }, [library.id, folderId, query, sortBy]);

  const updateSearch = (patch: Partial<z.infer<typeof libSearchSchema>>) => {
    if (patch.view) writeViewMode(patch.view);
    navigate({ search: (prev) => ({ ...prev, ...patch }) });
  };

  const handleFileClick = (file: KbFile) => {
    const result = canOpenFilePreview(file);
    if (!result.ok) {
      toast.error(result.reason);
      return;
    }
    navigate({
      to: "/knowledge/file/$fileId",
      params: { fileId: file.id },
      search: { panel: "ai" },
    });
  };

  const coverColor = library.coverColor ?? "var(--primary)";

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* 顶部色带 */}
      <div className="h-1 w-full shrink-0" style={{ backgroundColor: coverColor }} />

      {/* 库标题区 */}
      <div className="border-b border-border px-5 py-4">
        <div className="flex items-center gap-2">
          {/* 库图标 */}
          <div
            className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-white"
            style={{ backgroundColor: coverColor }}
          >
            <BookOpen className="h-4 w-4" />
          </div>
          {/* 面包屑 */}
          <nav className="flex min-w-0 items-center gap-1 text-[12.5px]">
            <Link
              to="/knowledge/dept/$deptId"
              params={{ deptId: library.deptId }}
              className="shrink-0 text-muted-foreground transition-colors hover:text-primary"
            >
              {dept?.name ?? "—"}
            </Link>
            <ChevronRight className="h-3.5 w-3.5 shrink-0 text-border" />
            <span className="truncate font-semibold text-foreground">{library.name}</span>
          </nav>
        </div>
        {library.description && (
          <p className="mt-1.5 pl-10 text-[12px] text-muted-foreground">{library.description}</p>
        )}
      </div>

      {/* 工具栏 */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border bg-background/40 px-4 py-2.5">
        {/* 搜索框 */}
        <div className="relative min-w-[180px] flex-1 max-w-sm">
          <input
            value={query}
            onChange={(e) => updateSearch({ q: e.target.value || undefined })}
            placeholder="搜索本库文件…"
            className="h-8 w-full rounded-lg border border-border/80 bg-background px-3 text-[12.5px] outline-none placeholder:text-muted-foreground/60 focus:border-primary/40 focus:ring-2 focus:ring-primary/8"
          />
        </div>

        {/* 排序 */}
        <select
          value={sortBy}
          onChange={(e) => updateSearch({ sort: e.target.value as KbSortBy })}
          className="h-8 rounded-lg border border-border/80 bg-background px-2.5 text-[12px] text-foreground/80 outline-none"
        >
          <option value="updated">最近更新</option>
          <option value="created">创建时间</option>
          <option value="name">名称</option>
          <option value="size">大小</option>
        </select>

        {/* 视图切换 */}
        <div className="flex overflow-hidden rounded-lg border border-border/80">
          <button
            type="button"
            onClick={() => updateSearch({ view: "grid" })}
            className={cn(
              "grid h-8 w-8 place-items-center transition-colors",
              viewMode === "grid"
                ? "bg-primary-soft text-primary"
                : "bg-background text-muted-foreground hover:bg-muted",
            )}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => updateSearch({ view: "list" })}
            className={cn(
              "grid h-8 w-8 place-items-center border-l border-border/80 transition-colors",
              viewMode === "list"
                ? "bg-primary-soft text-primary"
                : "bg-background text-muted-foreground hover:bg-muted",
            )}
          >
            <List className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* 管理员操作 */}
        {KB_VIEWER.isAdmin && (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => toast.message("上传文件（演示占位）")}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border/80 bg-background px-3 text-[12px] text-foreground/70 transition-colors hover:bg-muted hover:text-foreground"
            >
              <Upload className="h-3.5 w-3.5" />
              上传
            </button>
            <button
              type="button"
              onClick={() => toast.message("新建目录（演示占位）")}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border/80 bg-background px-3 text-[12px] text-foreground/70 transition-colors hover:bg-muted hover:text-foreground"
            >
              <Plus className="h-3.5 w-3.5" />
              新建目录
            </button>
          </div>
        )}
      </div>

      {/* 主内容区 */}
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <KbFolderList
          libraryId={library.id}
          selectedFolderId={folderId}
          onSelectFolder={(id) => updateSearch({ folder: id ?? undefined })}
        />
        <KbFileList files={files} viewMode={viewMode} onFileClick={handleFileClick} />
      </div>

      {/* 本期暂不开放：底部 AI 问答栏
      <div className="flex items-center gap-3 border-t border-border bg-primary-soft/30 px-4 py-2.5">
        ...
      </div>
      */}
    </div>
  );
}

import { Link } from "@tanstack/react-router";
import { BookOpen, FileText, MoreHorizontal, Plus } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { KbLibrary } from "@/lib/mock/knowledge-space";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function KbLibraryCard({ library }: { library: KbLibrary }) {
  const color = library.coverColor ?? "var(--primary)";

  return (
    <Link
      to="/knowledge/lib/$libId"
      params={{ libId: library.id }}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[var(--shadow-card-hover)]"
    >
      {/* 顶部色带 */}
      <div className="h-1.5 w-full shrink-0" style={{ backgroundColor: color }} />

      <div className="flex flex-1 flex-col p-4">
        {/* 图标行 + 更多菜单 */}
        <div className="mb-3 flex items-start justify-between gap-2">
          <div
            className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-white"
            style={{ backgroundColor: color }}
          >
            <BookOpen className="h-4.5 w-4.5" />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                onClick={(e) => e.preventDefault()}
                className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-muted-foreground opacity-0 transition-opacity hover:bg-muted group-hover:opacity-100"
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => toast.message("已复制链接")}>
                复制链接
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => toast.message("已收藏")}>
                收藏
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => toast.message("已添加到快速访问（P1）")}>
                添加到快速访问
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* 名称 + 描述 */}
        <h3 className="line-clamp-1 text-[14px] font-semibold text-foreground">{library.name}</h3>
        {library.description && (
          <p className="mt-1 line-clamp-2 text-[12px] leading-relaxed text-muted-foreground">
            {library.description}
          </p>
        )}

        {/* 文件统计 */}
        <div className="mt-3 flex items-center gap-2 text-[11px]">
          <span className="rounded-md border border-border/80 bg-muted/60 px-2 py-0.5 tabular-nums text-muted-foreground">
            {library.fileCount} 个文件
          </span>
          <span className="rounded-md border border-primary/20 bg-primary-soft px-2 py-0.5 tabular-nums text-accent-foreground">
            {library.parsedCount} 已解析
          </span>
        </div>

        {/* 最近更新 */}
        {library.recentFiles.length > 0 && (
          <div className="mt-3 border-t border-divider pt-3">
            <div className="mb-1.5 flex items-center gap-[5px]">
              <span className="h-[1em] w-[3px] shrink-0 rounded-[1px] leading-none" style={{ backgroundColor: color, opacity: 0.6 }} />
              <span className="text-[10.5px] font-medium text-muted-foreground">最近更新</span>
            </div>
            <ul className="space-y-1">
              {library.recentFiles.slice(0, 2).map((f) => (
                <li key={f.id} className="flex items-center gap-1.5 text-[11px]">
                  <FileText className="h-3 w-3 shrink-0 text-muted-foreground/60" />
                  <span className="min-w-0 flex-1 truncate text-foreground/80">{f.name}</span>
                  <span className="shrink-0 tabular-nums text-muted-foreground/60">{f.updatedAt}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Link>
  );
}

export function KbNewLibraryCard({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex min-h-[180px] flex-col items-center justify-center gap-2 overflow-hidden rounded-2xl border border-dashed border-border bg-card/60 p-4",
        "text-muted-foreground transition-all hover:border-primary/40 hover:bg-primary-soft/20 hover:text-primary",
      )}
    >
      <div className="grid h-10 w-10 place-items-center rounded-xl border border-dashed border-current/30 bg-current/5">
        <Plus className="h-5 w-5" />
      </div>
      <span className="text-[13px] font-medium">新建知识库</span>
    </button>
  );
}

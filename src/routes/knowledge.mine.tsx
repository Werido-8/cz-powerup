import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { FileText, BookOpen, Star, Clock, ExternalLink } from "lucide-react";
import {
  ModuleTabs,
  ModulePanel,
} from "@/components/learning/ui";
import {
  KB_RECENT_FILES,
  KB_RECENT_LIBRARIES,
} from "@/lib/mock/knowledge-space";
import {
  getDeptById,
  getLibraryById,
  filterVisibleRecentFiles,
} from "@/lib/mock/knowledge-utils";
import { useMockStore } from "@/lib/mock/store";
import { DOCS } from "@/lib/mock/data";
import { KbEmptyState } from "@/components/knowledge/KbEmptyState";

export const Route = createFileRoute("/knowledge/mine")({
  component: KnowledgeMinePage,
  head: () => ({ meta: [{ title: "我的 · 知识库 · 涉网运行能力智能提升平台" }] }),
});

type Tab = "libs" | "files" | "fav";

const TABS = [
  { key: "libs" as const, label: "最近知识库", icon: <BookOpen className="h-4 w-4" /> },
  { key: "files" as const, label: "最近文件", icon: <FileText className="h-4 w-4" /> },
  { key: "fav" as const, label: "我的收藏", icon: <Star className="h-4 w-4" /> },
];

function KnowledgeMinePage() {
  const [tab, setTab] = useState<Tab>("libs");
  const { state } = useMockStore();

  const recentLibs = useMemo(
    () =>
      KB_RECENT_LIBRARIES.map((r) => {
        const lib = getLibraryById(r.libraryId);
        const dept = lib ? getDeptById(lib.deptId) : undefined;
        return lib ? { ...lib, deptName: dept?.name ?? "—", visitedAt: r.visitedAt } : null;
      }).filter(Boolean),
    [],
  );

  const recentFiles = useMemo(
    () =>
      filterVisibleRecentFiles(KB_RECENT_FILES).map((r) => {
        const lib = getLibraryById(r.file.libraryId);
        return { ...r.file, libName: lib?.name ?? "—", visitedAt: r.visitedAt };
      }),
    [],
  );

  const favDocs = useMemo(
    () => DOCS.filter((d) => state.favorites.includes(d.id)).slice(0, 10),
    [state.favorites],
  );

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* 页头 */}
      <div className="border-b border-border px-6 py-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-[18px] font-bold text-foreground">我的</h1>
            <p className="mt-0.5 text-[12.5px] text-muted-foreground">最近访问的知识库与文件</p>
          </div>
          <Link
            to="/knowledge/dept/$deptId"
            params={{ deptId: "dept-run" }}
            className="flex items-center gap-1 text-[12.5px] text-primary transition-colors hover:text-primary/80"
          >
            去部门知识库
            <ExternalLink className="h-3 w-3" />
          </Link>
        </div>
      </div>

      {/* 内容区 */}
      <div className="flex-1 overflow-y-auto px-6 py-5">
        <ModuleTabs tabs={TABS} value={tab} onChange={setTab} />

        <ModulePanel className="mt-0 border-t-0">
          <div className="p-4">
            {tab === "libs" &&
              (recentLibs.length === 0 ? (
                <KbEmptyState
                  title="还没有浏览记录"
                  description="去选一个部门看看吧"
                  actionLabel="浏览部门知识库"
                  actionTo="/knowledge/dept/$deptId"
                />
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {recentLibs.map((lib) => (
                    <Link
                      key={lib!.id}
                      to="/knowledge/lib/$libId"
                      params={{ libId: lib!.id }}
                      className="group flex items-start gap-3 overflow-hidden rounded-xl border border-border/80 bg-card p-4 shadow-[var(--shadow-card)] transition-all hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-[var(--shadow-card-hover)]"
                    >
                      <div
                        className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg text-white"
                        style={{ backgroundColor: "var(--primary)" }}
                      >
                        <BookOpen className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[13px] font-semibold text-foreground">
                          {lib!.name}
                        </div>
                        <div className="mt-0.5 text-[11px] text-muted-foreground">
                          {lib!.deptName}
                        </div>
                        <div className="mt-1.5 flex items-center gap-1 text-[10.5px] text-muted-foreground/70">
                          <Clock className="h-3 w-3" />
                          <span className="tabular-nums">{lib!.visitedAt}</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ))}

            {tab === "files" &&
              (recentFiles.length === 0 ? (
                <KbEmptyState
                  title="还没有浏览记录"
                  description="去选一个部门看看吧"
                  actionLabel="浏览部门知识库"
                  actionTo="/knowledge/dept/$deptId"
                />
              ) : (
                <div className="flex flex-col gap-1.5">
                  {recentFiles.map((file) => (
                    <Link
                      key={file!.id}
                      to="/knowledge/file/$fileId"
                      params={{ fileId: file!.id }}
                      search={{ panel: "ai" }}
                      className="flex items-center gap-3 rounded-xl border border-border/80 bg-card px-4 py-3 shadow-[var(--shadow-card)] transition-all hover:border-primary/20 hover:shadow-[var(--shadow-card-hover)]"
                    >
                      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-muted ring-1 ring-border/60">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[13px] font-semibold text-foreground">
                          {file!.name}
                        </div>
                        <div className="mt-0.5 text-[11px] text-muted-foreground">
                          {file!.libName}
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-1 text-[10.5px] text-muted-foreground/70">
                        <Clock className="h-3 w-3" />
                        <span className="tabular-nums">{file!.visitedAt}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              ))}

            {tab === "fav" &&
              (favDocs.length === 0 ? (
                <KbEmptyState title="暂无收藏" description="可在资料检索或个人沉淀中收藏内容" />
              ) : (
                <div className="flex flex-col gap-1.5">
                  {favDocs.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center gap-3 rounded-xl border border-border/80 bg-card px-4 py-3 shadow-[var(--shadow-card)]"
                    >
                      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-warning-soft ring-1 ring-warning/20">
                        <Star className="h-4 w-4 text-warning" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[13px] font-semibold text-foreground">
                          {doc.title}
                        </div>
                        <div className="mt-0.5 text-[11px] text-muted-foreground">
                          {doc.docType} · 更新 {doc.updatedAt}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
          </div>
        </ModulePanel>
      </div>
    </div>
  );
}

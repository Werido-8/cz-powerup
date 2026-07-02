import { createFileRoute, notFound } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Search } from "lucide-react";
import {
  getDeptById,
  getLibrariesByDept,
  filterLibrariesByQuery,
  writeLastDept,
} from "@/lib/mock/knowledge-utils";
import { KbLibraryCard, KbNewLibraryCard } from "@/components/knowledge/KbLibraryCard";
import { KB_VIEWER } from "@/lib/mock/knowledge-space";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/knowledge/dept/$deptId")({
  loader: ({ params }) => {
    const dept = getDeptById(params.deptId);
    if (!dept) throw notFound();
    return { dept };
  },
  component: KnowledgeDeptPage,
  head: ({ loaderData }) => ({
    meta: [{ title: `${loaderData?.dept.name ?? "部门"} · 知识库 · 涉网运行能力智能提升平台` }],
  }),
});

function KnowledgeDeptPage() {
  const { dept } = Route.useLoaderData();
  const [searchQ, setSearchQ] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newLibName, setNewLibName] = useState("");

  useEffect(() => {
    writeLastDept(dept.id);
  }, [dept.id]);

  const libraries = useMemo(() => {
    const all = getLibrariesByDept(dept.id);
    return filterLibrariesByQuery(all, searchQ);
  }, [dept.id, searchQ]);

  const handleCreate = () => {
    if (!newLibName.trim()) return;
    toast.success(`知识库「${newLibName}」创建成功（演示）`);
    setDialogOpen(false);
    setNewLibName("");
  };

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* 页头 */}
      <div className="border-b border-border px-6 py-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-[18px] font-bold text-foreground">{dept.name}</h1>
            {dept.description && (
              <p className="mt-1 text-[12.5px] text-muted-foreground">{dept.description}</p>
            )}
          </div>
          {/* 搜索框 */}
          <div className="relative w-full max-w-[260px]">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/60" />
            <input
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
              placeholder="搜索知识库…"
              className="h-8 w-full rounded-lg border border-border/80 bg-background pl-8 pr-3 text-[12.5px] outline-none placeholder:text-muted-foreground/60 focus:border-primary/40"
            />
          </div>
        </div>
      </div>

      {/* 内容区 */}
      <div className="flex-1 overflow-y-auto px-6 py-5">
        {/* 区块标题带装饰块 */}
        <div className="mb-4 flex items-center gap-[5px]">
          <span className="h-[1em] w-[5px] shrink-0 rounded-[1px] bg-primary leading-none" />
          <h2 className="text-base font-bold text-foreground">部门知识库</h2>
        </div>

        {libraries.length === 0 ? (
          <div className="py-16 text-center text-[13px] text-muted-foreground">
            暂无搜索结果
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {libraries.map((lib) => (
              <KbLibraryCard key={lib.id} library={lib} />
            ))}
            {KB_VIEWER.isAdmin && (
              <KbNewLibraryCard onClick={() => setDialogOpen(true)} />
            )}
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>新建知识库</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <label className="text-[12px] text-muted-foreground">知识库名称</label>
              <input
                value={newLibName}
                onChange={(e) => setNewLibName(e.target.value)}
                maxLength={50}
                placeholder="请输入知识库名称"
                className="mt-1 h-9 w-full rounded-lg border border-border px-3 text-[13px] outline-none focus:border-primary/40"
              />
            </div>
            <div>
              <label className="text-[12px] text-muted-foreground">归属部门</label>
              <div className="mt-1 h-9 rounded-lg border border-border/60 bg-muted/50 px-3 text-[13px] leading-9">
                {dept.name}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              取消
            </Button>
            <Button disabled={!newLibName.trim()} onClick={handleCreate}>
              新建
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

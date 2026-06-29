import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useMemo, useState } from "react";
import {
  Zap,
  Plus,
  ChevronRight,
  ChevronDown,
  Folder,
  PanelLeftClose,
  PanelLeft,
  History,
  LayoutGrid,
  List,
  Search,
  SlidersHorizontal,
  PenSquare,
  Upload,
  MoreHorizontal,
  Database,
  Send,
  FileText,
} from "lucide-react";
import { PageShell } from "@/components/workbench/PageShell";
import {
  DEFAULT_KB_FOLDER_ID,
  KB_TREE,
  type KbFile,
  type KbFileStatus,
  type KbTreeNode,
  getFilesForFolder,
  getKbBreadcrumb,
  getSpaceIdForNode,
  findKbNode,
} from "@/lib/mock/knowledge-space";
import { toast } from "sonner";

export const Route = createFileRoute("/knowledge")({
  component: KnowledgePage,
  head: () => ({ meta: [{ title: "知识库 · 涉网运行能力智能提升平台" }] }),
});

const DEFAULT_EXPANDED = new Set(["space-public", "cat-tech", "space-personal"]);

function PdfIcon() {
  return (
    <div className="relative mx-auto h-[72px] w-[56px]">
      <div className="absolute inset-0 rounded-md bg-[#f0f5f6] shadow-sm ring-1 ring-border/60" />
      <div className="absolute left-0 top-0 h-3 w-3 rounded-br-md bg-[#e2ecef]" />
      <div className="absolute inset-x-0 bottom-0 flex items-end justify-center pb-2">
        <span className="rounded bg-[#e74c3c] px-1.5 py-0.5 text-[10px] font-bold text-white">PDF</span>
      </div>
    </div>
  );
}

function StatusTag({ status }: { status: KbFileStatus }) {
  if (status === "已禁用") {
    return (
      <span className="rounded border border-border bg-[#f5f5f5] px-1.5 py-0.5 text-[10px] text-muted-foreground">
        已禁用
      </span>
    );
  }
  if (status === "进行中") {
    return (
      <span className="rounded border border-[#c8e6f0] bg-[#e8f4f8] px-1.5 py-0.5 text-[10px] text-primary">
        进行中
      </span>
    );
  }
  if (status === "已完成") {
    return (
      <span className="rounded border border-[#c8e6f0] bg-[#e8f4f8] px-1.5 py-0.5 text-[10px] text-primary">
        已完成
      </span>
    );
  }
  return (
    <span className="rounded border border-[#ffe4c4] bg-[#fff5e8] px-1.5 py-0.5 text-[10px] text-[#b45309]">
      未开始
    </span>
  );
}

function FileCard({ file, viewMode }: { file: KbFile; viewMode: "grid" | "list" }) {
  const disabled = file.status === "已禁用";

  if (viewMode === "list") {
    return (
      <div
        className={`flex items-center gap-4 rounded-lg border border-border bg-white px-4 py-3 transition-shadow hover:shadow-sm ${
          disabled ? "opacity-60" : ""
        }`}
      >
        <FileText className="h-8 w-8 shrink-0 text-[#e74c3c]" />
        <div className="min-w-0 flex-1">
          <div className="truncate text-[13px] font-semibold">{file.name}</div>
          <div className="mt-0.5 text-[11px] text-muted-foreground">{file.summary}</div>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <span className="rounded border border-[#c8e6f0] bg-[#e8f4f8] px-1.5 py-0.5 text-[10px] text-primary">
            {file.scope}
          </span>
          <StatusTag status={file.status} />
        </div>
        <div className="shrink-0 text-right text-[11px] text-muted-foreground">
          <div>{file.updatedAt}</div>
          <div>{file.size}</div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`group flex flex-col rounded-lg border border-border bg-white p-4 transition-shadow hover:shadow-[0_4px_16px_-4px_rgba(52,155,172,0.12)] ${
        disabled ? "opacity-60" : ""
      }`}
    >
      <div className="mb-3 flex items-start justify-between gap-2">
        <span className="rounded border border-[#c8e6f0] bg-[#e8f4f8] px-1.5 py-0.5 text-[10px] text-primary">
          {file.scope}
        </span>
        <StatusTag status={file.status} />
      </div>
      <PdfIcon />
      <h3 className="mt-3 line-clamp-2 text-[13px] font-semibold leading-snug text-foreground">
        {file.name}
      </h3>
      <p className="mt-2 line-clamp-2 flex-1 text-[11px] leading-relaxed text-muted-foreground">
        {file.summary}
      </p>
      <div className="mt-3 border-t border-divider pt-2.5 text-[10.5px] text-muted-foreground">
        <div>{file.updatedAt}</div>
        <div className="mt-0.5">{file.size}</div>
      </div>
    </div>
  );
}

function TreeRow({
  node,
  depth,
  selectedId,
  activeSpaceId,
  expanded,
  onToggle,
  onSelect,
}: {
  node: KbTreeNode;
  depth: number;
  selectedId: string;
  activeSpaceId: string;
  expanded: Set<string>;
  onToggle: (id: string) => void;
  onSelect: (id: string) => void;
}) {
  const hasChildren = (node.children?.length ?? 0) > 0;
  const isOpen = expanded.has(node.id);
  const isSpace = Boolean(node.kind);
  const isSpaceActive = isSpace && node.id === activeSpaceId;
  const isFolderSelected = !isSpace && selectedId === node.id;
  const isChildSelected =
    !isSpace &&
    hasChildren &&
    node.children!.some((c) => c.id === selectedId);

  return (
    <>
      <div
        className={`group flex cursor-pointer items-center gap-1 rounded-lg py-1.5 pr-2 transition-colors ${
          isSpaceActive
            ? "bg-primary text-white"
            : isFolderSelected || isChildSelected
              ? "text-primary"
              : "text-foreground/85 hover:bg-[#f0f6f7]"
        }`}
        style={{ paddingLeft: `${depth * 14 + 8}px` }}
        onClick={() => onSelect(node.id)}
      >
        <button
          type="button"
          className={`grid h-5 w-5 shrink-0 place-items-center rounded ${
            isSpaceActive ? "text-white/90 hover:bg-white/10" : "text-muted-foreground hover:bg-muted"
          }`}
          onClick={(e) => {
            e.stopPropagation();
            if (hasChildren) onToggle(node.id);
          }}
        >
          {hasChildren ? (
            isOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />
          ) : (
            <span className="h-3.5 w-3.5" />
          )}
        </button>
        {!isSpace && (
          <Folder
            className={`h-4 w-4 shrink-0 ${
              isFolderSelected || isChildSelected ? "text-primary" : "text-[#e8a04a]"
            }`}
          />
        )}
        <span
          className={`min-w-0 flex-1 truncate text-[12.5px] ${
            isFolderSelected || isChildSelected || isSpaceActive ? "font-semibold" : ""
          }`}
        >
          {node.name}
        </span>
        {isSpace && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toast.message(`新建「${node.name}」子目录`);
            }}
            className={`grid h-5 w-5 shrink-0 place-items-center rounded opacity-0 transition-opacity group-hover:opacity-100 ${
              isSpaceActive ? "text-white/80 hover:bg-white/15" : "text-muted-foreground hover:bg-muted"
            }`}
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      {hasChildren &&
        isOpen &&
        node.children!.map((child) => (
          <TreeRow
            key={child.id}
            node={child}
            depth={depth + 1}
            selectedId={selectedId}
            activeSpaceId={activeSpaceId}
            expanded={expanded}
            onToggle={onToggle}
            onSelect={onSelect}
          />
        ))}
    </>
  );
}

function KnowledgePage() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedId, setSelectedId] = useState(DEFAULT_KB_FOLDER_ID);
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(DEFAULT_EXPANDED));
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQ, setSearchQ] = useState("");
  const [kbPromptDismissed, setKbPromptDismissed] = useState(false);
  const [aiInput, setAiInput] = useState("");
  const [kbAdded, setKbAdded] = useState(false);

  const activeSpaceId = useMemo(
    () => getSpaceIdForNode(selectedId) ?? "space-public",
    [selectedId],
  );

  const breadcrumb = useMemo(() => {
    const trail = getKbBreadcrumb(selectedId);
    if (!trail) return [{ id: "root", name: "根目录" }];
    const withoutSpaces = trail.filter((n) => !n.kind);
    const crumbs = [{ id: "root", name: "根目录" }, ...withoutSpaces];
    const leaf = withoutSpaces[withoutSpaces.length - 1];
    if (leaf?.libraryName) {
      crumbs.push({ id: `${leaf.id}-lib`, name: leaf.libraryName });
    }
    return crumbs;
  }, [selectedId]);

  const folderName =
    findKbNode(selectedId)?.libraryName ??
    breadcrumb[breadcrumb.length - 1]?.name ??
    "根目录";
  const files = useMemo(() => {
    const list = getFilesForFolder(selectedId);
    const q = searchQ.trim();
    if (!q) return list;
    return list.filter((f) => f.name.includes(q));
  }, [selectedId, searchQ]);

  const toggleExpand = useCallback((id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const selectNode = useCallback((id: string) => {
    const node = findKbNode(id);
    if (node?.kind) {
      setExpanded((prev) => new Set(prev).add(id));
      return;
    }
    setSelectedId(id);
    setKbPromptDismissed(false);
    setKbAdded(false);
  }, []);

  const handleSend = () => {
    const q = aiInput.trim();
    if (!q) {
      toast.message("请输入问题或选择知识库");
      return;
    }
    navigate({ to: "/chat", search: { prefill: q } });
  };

  const toolBtn =
    "grid h-8 w-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground";

  return (
    <PageShell compact>
      <div className="flex h-full overflow-hidden rounded-lg border border-border bg-white shadow-sm">
        {/* ── Sidebar ── */}
        {sidebarOpen && (
          <aside className="relative flex w-[248px] shrink-0 flex-col border-r border-border bg-[#fafcfd]">
            <div className="flex items-center gap-2 border-b border-divider px-4 py-3.5">
              <div className="grid h-7 w-7 place-items-center rounded-lg bg-primary-soft text-primary">
                <Zap className="h-4 w-4" />
              </div>
              <span className="text-[14px] font-semibold text-foreground">知识空间目录</span>
            </div>
            <div className="scrollbar-hide min-h-0 flex-1 overflow-y-auto py-2 pr-1">
              {KB_TREE.map((node) => (
                <TreeRow
                  key={node.id}
                  node={node}
                  depth={0}
                  selectedId={selectedId}
                  activeSpaceId={activeSpaceId}
                  expanded={expanded}
                  onToggle={toggleExpand}
                  onSelect={selectNode}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={() => setSidebarOpen(false)}
              title="收起目录"
              className="absolute -right-3 top-1/2 z-10 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-full border border-border bg-white text-muted-foreground shadow-sm hover:text-primary"
            >
              <PanelLeftClose className="h-3.5 w-3.5" />
            </button>
          </aside>
        )}

        {/* ── Main ── */}
        <div className="relative flex min-w-0 flex-1 flex-col bg-[#f6fafb]">
          {!sidebarOpen && (
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              title="展开目录"
              className="absolute left-3 top-4 z-10 grid h-8 w-8 place-items-center rounded-lg border border-border bg-white text-muted-foreground shadow-sm hover:text-primary"
            >
              <PanelLeft className="h-4 w-4" />
            </button>
          )}

          {/* Header */}
          <div className="flex shrink-0 items-center justify-between gap-4 border-b border-border bg-white px-5 py-3">
            <div className={`min-w-0 flex-1 ${!sidebarOpen ? "pl-10" : ""}`}>
              <nav className="flex flex-wrap items-center gap-1 text-[12.5px] text-muted-foreground">
                {breadcrumb.map((item, i) => (
                  <span key={item.id} className="inline-flex items-center gap-1">
                    {i > 0 && <ChevronRight className="h-3 w-3 shrink-0 text-border" />}
                    <button
                      type="button"
                      onClick={() => item.id !== "root" && selectNode(item.id)}
                      className={`truncate transition-colors hover:text-primary ${
                        i === breadcrumb.length - 1
                          ? "font-semibold text-foreground"
                          : item.id !== "root"
                            ? "hover:underline"
                            : ""
                      }`}
                    >
                      {item.name}
                    </button>
                  </span>
                ))}
              </nav>
            </div>
            <div className="flex shrink-0 items-center gap-0.5">
              <button type="button" className={toolBtn} title="历史记录" onClick={() => toast.message("查看浏览历史")}>
                <History className="h-4 w-4" />
              </button>
              <button
                type="button"
                className={`${toolBtn} ${viewMode === "grid" ? "bg-primary-soft text-primary" : ""}`}
                title="网格视图"
                onClick={() => setViewMode("grid")}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                type="button"
                className={`${toolBtn} ${viewMode === "list" ? "bg-primary-soft text-primary" : ""}`}
                title="列表视图"
                onClick={() => setViewMode("list")}
              >
                <List className="h-4 w-4" />
              </button>
              <button
                type="button"
                className={`${toolBtn} ${searchOpen ? "bg-primary-soft text-primary" : ""}`}
                title="搜索"
                onClick={() => setSearchOpen((v) => !v)}
              >
                <Search className="h-4 w-4" />
              </button>
              <button type="button" className={toolBtn} title="筛选" onClick={() => toast.message("筛选条件")}>
                <SlidersHorizontal className="h-4 w-4" />
              </button>
              <button type="button" className={toolBtn} title="编辑" onClick={() => toast.message("进入编辑模式")}>
                <PenSquare className="h-4 w-4" />
              </button>
              <button type="button" className={toolBtn} title="上传" onClick={() => toast.message("上传资料")}>
                <Upload className="h-4 w-4" />
              </button>
              <button type="button" className={toolBtn} title="更多" onClick={() => toast.message("更多操作")}>
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </div>
          </div>

          {searchOpen && (
            <div className="shrink-0 border-b border-divider bg-white px-5 py-2.5">
              <div className="relative max-w-md">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={searchQ}
                  onChange={(e) => setSearchQ(e.target.value)}
                  placeholder="搜索当前目录文件…"
                  className="h-9 w-full rounded-lg border border-border bg-[#f6fafb] pl-9 pr-3 text-[13px] outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/15"
                />
              </div>
            </div>
          )}

          {/* File grid */}
          <div className="scrollbar-hide min-h-0 flex-1 overflow-y-auto px-5 py-5 pb-36">
            {files.length === 0 ? (
              <div className="flex h-full min-h-[280px] flex-col items-center justify-center text-center">
                <Folder className="mb-3 h-12 w-12 text-[#e8a04a]/60" />
                <p className="text-[14px] font-medium text-foreground/80">当前目录暂无文件</p>
                <p className="mt-1 text-[12px] text-muted-foreground">可点击右上角上传，或切换左侧目录查看</p>
              </div>
            ) : viewMode === "grid" ? (
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                {files.map((f) => (
                  <FileCard key={f.id} file={f} viewMode="grid" />
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {files.map((f) => (
                  <FileCard key={f.id} file={f} viewMode="list" />
                ))}
              </div>
            )}
          </div>

          {/* Bottom AI bar */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col items-center px-5 pb-5 pt-8">
            <div
              className="pointer-events-auto w-full max-w-[720px]"
              style={{
                background: "linear-gradient(to top, #f6fafb 60%, transparent)",
              }}
            >
              {!kbPromptDismissed && !kbAdded && (
                <div className="mb-3 flex justify-center">
                  <div className="inline-flex items-center gap-2 rounded-md border border-border bg-white px-4 py-2 text-[12px] shadow-sm">
                    <span className="text-muted-foreground">
                      是否添加 <span className="font-medium text-foreground">{folderName}</span>？
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setKbAdded(true);
                        toast.success(`已添加「${folderName}」到问答知识库`);
                      }}
                      className="rounded-md bg-primary px-3 py-0.5 text-[11px] font-medium text-white hover:bg-primary/90"
                    >
                      添加
                    </button>
                    <button
                      type="button"
                      onClick={() => setKbPromptDismissed(true)}
                      className="text-[11px] text-muted-foreground hover:text-foreground"
                    >
                      忽略
                    </button>
                  </div>
                </div>
              )}
              {kbAdded && (
                <div className="mb-3 flex justify-center">
                  <span className="rounded-md border border-[#c8e6f0] bg-[#e8f4f8] px-3 py-1 text-[11px] text-primary">
                    已添加「{folderName}」·{" "}
                    <Link to="/chat" className="font-medium underline-offset-2 hover:underline">
                      去智能问答
                    </Link>
                  </span>
                </div>
              )}
              <div className="flex items-center gap-2 rounded-lg border border-[#dce8ea] bg-white px-3 py-2 shadow-[0_4px_24px_-4px_rgba(52,155,172,0.15)]">
                <button
                  type="button"
                  onClick={() => toast.message(`当前知识库：${folderName}`)}
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-md text-primary hover:bg-primary-soft"
                  title="选择知识库"
                >
                  <Database className="h-[18px] w-[18px]" />
                </button>
                <input
                  value={aiInput}
                  onChange={(e) => setAiInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  placeholder="请选择知识库或直接输入问题..."
                  className="min-w-0 flex-1 bg-transparent text-[13.5px] outline-none placeholder:text-muted-foreground/70"
                />
                <button
                  type="button"
                  onClick={handleSend}
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-primary text-white transition-colors hover:bg-primary/90"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}

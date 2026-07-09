import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  ChevronRight,
  Database,
  Folder,
  FolderOpen,
  Library,
  LockKeyhole,
  Pin,
  PinOff,
  ShieldCheck,
  Star,
  Upload,
  UserRound,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  KbButton,
  KbDragUploadOverlay,
  KbEmptyState,
  KbFilterBar,
  KbFilterCombo,
  KbFilterSelect,
  KbSidebar,
  KbSidebarSection,
} from "@/components/knowledge/ui";
import { KNOWLEDGE_BASES, KNOWLEDGE_CATEGORIES } from "@/lib/knowledge/data";
import {
  canUploadToBase,
  canViewBaseFiles,
  filterFiles,
  getBaseById,
  getBasesForCategory,
  getCategoryChildren,
  getDefaultOverviewBaseId,
  getFilesForBase,
  sortKnowledgeFiles,
} from "@/lib/knowledge/model";
import {
  isPinnedId,
  loadPinnedIds,
  savePinnedIds,
  togglePinnedId,
} from "@/lib/knowledge/pinned";
import type {
  KnowledgeBase,
  KnowledgeCategory,
  KnowledgeFile,
  KnowledgeSortBy,
} from "@/lib/knowledge/types";
import { kbCardShell, kbMainPanel, kbRadius } from "@/lib/knowledge/tokens";
import { TableListPager, CardBatchPager, TABLE_PAGE_SIZE_DEFAULT, ActionButton } from "@/components/learning/ui";
import { cn } from "@/lib/utils";
import {
  FileViewModeToggle,
  FileListSortButton,
  FileListRefreshButton,
  KnowledgeFileCardGrid,
  KnowledgeFileTable,
  type FileViewMode,
} from "./KnowledgeFileTable";
import { KnowledgeBaseDetailHeader } from "./KnowledgeBaseDetailHeader";
import { KnowledgeOverviewTitleBanner } from "./KnowledgeOverviewTitleBanner";

const CARD_PAGE_SIZE = 8;

function OverviewSidebarQuickLinks() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const links = [
    { to: "/knowledge/mine", label: "我的空间", icon: UserRound, active: pathname.startsWith("/knowledge/mine") },
    { to: "/knowledge/all", label: "全库资料", icon: Database, active: pathname.startsWith("/knowledge/all") },
  ] as const;

  return (
    <div className="space-y-0.5 border-b border-[#E8F0F2] p-2">
      {links.map((item) => {
        const Icon = item.icon;
        return (
          <Link
            key={item.to}
            to={item.to}
            className={cn(
              "flex h-8 w-full items-center gap-2 rounded-[8px] px-2.5 text-[12.5px] transition-colors",
              item.active
                ? "bg-primary-soft font-medium text-accent-foreground"
                : "text-kb-body hover:bg-[#F4FAFB]",
            )}
          >
            <Icon
              className={cn(
                "h-3.5 w-3.5 shrink-0 stroke-[1.8]",
                item.active ? "text-primary" : "text-kb-muted",
              )}
            />
            <span className="min-w-0 flex-1 truncate">{item.label}</span>
          </Link>
        );
      })}
    </div>
  );
}

export function KnowledgeOverviewPage({ initialBaseId }: { initialBaseId?: string }) {
  const navigate = useNavigate();
  const [pinnedIds, setPinnedIds] = useState<string[]>(() => loadPinnedIds());
  const [selectedBaseId, setSelectedBaseId] = useState(() => {
    if (initialBaseId) return initialBaseId;
    if (typeof window !== "undefined") {
      return window.localStorage.getItem("knowledge-last-base") ?? getDefaultOverviewBaseId();
    }
    return getDefaultOverviewBaseId();
  });
  const [query, setQuery] = useState("");
  const [professionalType, setProfessionalType] = useState("all");
  const [tag, setTag] = useState("all");
  const [sortBy, setSortBy] = useState<KnowledgeSortBy>("updated");
  const [viewMode, setViewMode] = useState<FileViewMode>("list");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(TABLE_PAGE_SIZE_DEFAULT);
  const [refreshSeed, setRefreshSeed] = useState(0);
  const [permissionBase, setPermissionBase] = useState<KnowledgeBase | null>(null);

  useEffect(() => {
    if (initialBaseId) setSelectedBaseId(initialBaseId);
  }, [initialBaseId]);

  useEffect(() => {
    if (selectedBaseId && typeof window !== "undefined") {
      window.localStorage.setItem("knowledge-last-base", selectedBaseId);
    }
  }, [selectedBaseId]);

  const pinnedBases = useMemo(
    () => KNOWLEDGE_BASES.filter((b) => isPinnedId(pinnedIds, b.id) && b.status === "enabled"),
    [pinnedIds],
  );

  const selectedBase = selectedBaseId ? getBaseById(selectedBaseId) : undefined;
  const allCurrentBaseFiles = selectedBase ? getFilesForBase(selectedBase.id) : [];
  const selectedFiles = useMemo(() => {
    if (!selectedBase || !canViewBaseFiles(selectedBase)) return [];
    return sortKnowledgeFiles(
      filterFiles(allCurrentBaseFiles, {
        query,
        professionalType: professionalType === "all" ? undefined : professionalType,
        tag: tag === "all" ? undefined : tag,
      }),
      sortBy,
    );
  }, [allCurrentBaseFiles, professionalType, query, selectedBase, sortBy, tag]);

  useEffect(() => {
    setPage(1);
  }, [selectedBaseId, query, professionalType, tag, sortBy, viewMode]);

  const effectivePageSize = viewMode === "card" ? CARD_PAGE_SIZE : pageSize;
  const totalPages = Math.max(1, Math.ceil(selectedFiles.length / effectivePageSize) || 1);
  const safePage = Math.min(page, totalPages);
  const pagedFiles = useMemo(() => {
    const start = (safePage - 1) * effectivePageSize;
    return selectedFiles.slice(start, start + effectivePageSize);
  }, [effectivePageSize, safePage, selectedFiles]);

  const professionalTypes = Array.from(
    new Set(allCurrentBaseFiles.map((file) => file.professionalType).filter(Boolean)),
  ) as string[];
  const tags = Array.from(new Set(allCurrentBaseFiles.flatMap((file) => file.tags ?? [])));

  const handleTogglePin = (baseId: string) => {
    setPinnedIds((prev) => {
      const next = togglePinnedId(prev, baseId);
      savePinnedIds(next);
      toast.message(isPinnedId(prev, baseId) ? "已取消置顶" : "已置顶到快速访问");
      return next;
    });
  };

  const handleSelectBase = (baseId: string) => {
    setSelectedBaseId(baseId);
    navigate({ to: "/knowledge/kb/$kbId", params: { kbId: baseId }, replace: true });
  };

  const handleOpenFile = (file: KnowledgeFile) => {
    navigate({
      to: "/knowledge/file/$fileId",
      params: { fileId: file.id },
      search: { kbId: file.knowledgeBaseId },
    });
  };

  const handleUploadFiles = (files: FileList) => {
    toast.success(`已选择 ${files.length} 个文件，上传面板即将打开`);
  };

  const handleRefresh = () => {
    setPage(1);
    setRefreshSeed((v) => v + 1);
    toast.message("列表已刷新");
  };

  const emptyFiles = (
    <KbEmptyState
      title="当前筛选下暂无文件"
      description="调整关键词、标签或专业类型后再试。"
    />
  );

  return (
    <>
      <KbSidebar
        width="browse"
        withDecor
        header={
          <>
            <KnowledgeOverviewTitleBanner />
            <OverviewSidebarQuickLinks />
          </>
        }
      >
        <KbSidebarSection title="快速访问">
          {pinnedBases.length === 0 ? (
            <p className="px-2.5 py-1 text-[11px] text-kb-muted">悬浮知识库可置顶</p>
          ) : (
            pinnedBases.map((base) =>
              base.scope === "personal" ? (
                <button
                  key={base.id}
                  type="button"
                  onClick={() => navigate({ to: "/knowledge/mine", hash: "personal" })}
                  className="flex h-8 w-full items-center gap-2 rounded-[8px] px-2.5 text-left text-[12.5px] text-kb-body hover:bg-[#F4FAFB]"
                >
                  <Star className="h-3.5 w-3.5 text-primary fill-primary-soft stroke-[1.8]" />
                  <span className="min-w-0 flex-1 truncate">{base.name}</span>
                </button>
              ) : (
                <button
                  key={base.id}
                  type="button"
                  onClick={() => handleSelectBase(base.id)}
                  className={cn(
                    "flex h-8 w-full items-center gap-2 rounded-[8px] px-2.5 text-left text-[12.5px] transition-colors",
                    selectedBaseId === base.id
                      ? "bg-primary-soft font-medium text-accent-foreground"
                      : "text-kb-body hover:bg-[#F4FAFB]",
                  )}
                >
                  <Star className="h-3.5 w-3.5 text-primary fill-primary-soft stroke-[1.8]" />
                  <span className="min-w-0 flex-1 truncate">{base.name}</span>
                </button>
              ),
            )
          )}
        </KbSidebarSection>

        <KbSidebarSection title="分类知识库树">
          <KnowledgeCategoryTree
            selectedBaseId={selectedBaseId}
            pinnedIds={pinnedIds}
            onSelectBase={(base) => handleSelectBase(base.id)}
            onTogglePin={handleTogglePin}
          />
        </KbSidebarSection>
      </KbSidebar>

      <main className={cn("scrollbar-thin", kbMainPanel)}>
        {!selectedBase ? (
          <div className="flex flex-1 items-center justify-center p-8">
            <KbEmptyState
              title="请选择知识库"
              description="从左侧快速访问或分类知识库树中选择一个知识库，右侧会展示该库资料。"
            />
          </div>
        ) : !canViewBaseFiles(selectedBase) ? (
          <div className="p-5">
            <NoPermissionState base={selectedBase} onApply={() => setPermissionBase(selectedBase)} />
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col">
            <KnowledgeBaseDetailHeader
              base={selectedBase}
              fileCount={selectedBase.fileCount ?? selectedFiles.length}
              onSelectBase={handleSelectBase}
            />

            <KbDragUploadOverlay
              onFiles={canUploadToBase(selectedBase) ? handleUploadFiles : undefined}
              disabled={!canUploadToBase(selectedBase)}
              className="flex min-h-0 flex-1 flex-col"
            >
              <div className="border-b border-divider bg-[#FAFCFD] px-4 py-2.5">
                <KbFilterBar
                  className="mb-0"
                  searchValue={query}
                  onSearchChange={setQuery}
                  searchPlaceholder="搜索本库文件"
                  searchClassName="max-w-[280px] !rounded-[8px]"
                  filters={
                    <>
                      <KbFilterCombo
                        value={professionalType}
                        onChange={setProfessionalType}
                        placeholder="全部专业"
                        options={[
                          { value: "all", label: "全部专业" },
                          ...professionalTypes.map((item) => ({ value: item, label: item })),
                        ]}
                      />
                      <KbFilterCombo
                        value={tag}
                        onChange={setTag}
                        placeholder="全部标签"
                        options={[
                          { value: "all", label: "全部标签" },
                          ...tags.map((item) => ({ value: item, label: item })),
                        ]}
                      />
                    </>
                  }
                  trailing={
                    <>
                      {canUploadToBase(selectedBase) && (
                        <ActionButton variant="primary" size="sm" onClick={() => toast.message("打开上传面板")}>
                          <Upload className="h-3.5 w-3.5 stroke-[1.8]" />
                          上传
                        </ActionButton>
                      )}
                      <FileViewModeToggle value={viewMode} onChange={setViewMode} />
                      <FileListSortButton value={sortBy} onChange={setSortBy} />
                      <FileListRefreshButton onClick={handleRefresh} />
                    </>
                  }
                />
              </div>

              <div key={refreshSeed} className="min-h-0 flex-1 overflow-y-auto">
                {viewMode === "list" ? (
                  <KnowledgeFileTable
                    files={pagedFiles}
                    showLibrary={false}
                    overviewMode
                    onOpen={handleOpenFile}
                    empty={emptyFiles}
                  />
                ) : (
                  <KnowledgeFileCardGrid
                    files={pagedFiles}
                    onOpen={handleOpenFile}
                    empty={emptyFiles}
                  />
                )}
              </div>

              {selectedFiles.length > 0 &&
                (viewMode === "list" ? (
                  <TableListPager
                    page={safePage}
                    totalPages={totalPages}
                    totalItems={selectedFiles.length}
                    pageSize={pageSize}
                    onPageChange={setPage}
                    onPageSizeChange={(size) => {
                      setPageSize(size);
                      setPage(1);
                    }}
                  />
                ) : (
                  <div className="border-t border-divider px-4 py-2">
                    <CardBatchPager
                      page={safePage}
                      totalPages={totalPages}
                      totalItems={selectedFiles.length}
                      pageSize={CARD_PAGE_SIZE}
                      unitLabel="个文件"
                      onPageChange={setPage}
                      compact
                    />
                  </div>
                ))}
            </KbDragUploadOverlay>
          </div>
        )}
      </main>

      {permissionBase && (
        <PermissionApplyModal base={permissionBase} onClose={() => setPermissionBase(null)} />
      )}
    </>
  );
}

function KnowledgeCategoryTree({
  selectedBaseId,
  pinnedIds,
  onSelectBase,
  onTogglePin,
}: {
  selectedBaseId?: string;
  pinnedIds: string[];
  onSelectBase: (base: KnowledgeBase) => void;
  onTogglePin: (baseId: string) => void;
}) {
  const [expanded, setExpanded] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set(KNOWLEDGE_CATEGORIES.map((item) => item.id));
    const saved = window.localStorage.getItem("knowledge-expanded-categories");
    return saved
      ? new Set(JSON.parse(saved) as string[])
      : new Set(KNOWLEDGE_CATEGORIES.map((item) => item.id));
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("knowledge-expanded-categories", JSON.stringify([...expanded]));
    }
  }, [expanded]);

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="space-y-0.5 px-1">
      {getCategoryChildren().map((category) => (
        <CategoryNode
          key={category.id}
          category={category}
          depth={0}
          expanded={expanded}
          selectedBaseId={selectedBaseId}
          pinnedIds={pinnedIds}
          onToggle={toggle}
          onSelectBase={onSelectBase}
          onTogglePin={onTogglePin}
        />
      ))}
    </div>
  );
}

function CategoryNode({
  category,
  depth,
  expanded,
  selectedBaseId,
  pinnedIds,
  onToggle,
  onSelectBase,
  onTogglePin,
}: {
  category: KnowledgeCategory;
  depth: number;
  expanded: Set<string>;
  selectedBaseId?: string;
  pinnedIds: string[];
  onToggle: (id: string) => void;
  onSelectBase: (base: KnowledgeBase) => void;
  onTogglePin: (baseId: string) => void;
}) {
  const open = expanded.has(category.id);
  const children = getCategoryChildren(category.id);
  const bases = getBasesForCategory(category.id);
  const FolderIcon = open ? FolderOpen : Folder;

  return (
    <div>
      <button
        type="button"
        onClick={() => onToggle(category.id)}
        className="flex h-8 w-full items-center gap-1.5 rounded-[8px] px-2 text-left text-[12.5px] text-kb-muted transition-colors hover:bg-card hover:text-kb-body"
        style={{ paddingLeft: 8 + depth * 14 }}
      >
        <ChevronRight className={cn("h-3.5 w-3.5 transition-transform", open && "rotate-90")} />
        <FolderIcon className="h-3.5 w-3.5 text-warning stroke-[1.8]" />
        <span className="min-w-0 flex-1 truncate">{category.name}</span>
      </button>
      {open && (
        <div className="space-y-0.5">
          {children.map((child) => (
            <CategoryNode
              key={child.id}
              category={child}
              depth={depth + 1}
              expanded={expanded}
              selectedBaseId={selectedBaseId}
              pinnedIds={pinnedIds}
              onToggle={onToggle}
              onSelectBase={onSelectBase}
              onTogglePin={onTogglePin}
            />
          ))}
          {bases.map((base) => (
            <BaseTreeItem
              key={base.id}
              base={base}
              depth={depth}
              selected={selectedBaseId === base.id}
              pinned={isPinnedId(pinnedIds, base.id)}
              onSelect={() => onSelectBase(base)}
              onTogglePin={() => onTogglePin(base.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function BaseTreeItem({
  base,
  depth,
  selected,
  pinned,
  onSelect,
  onTogglePin,
}: {
  base: KnowledgeBase;
  depth: number;
  selected: boolean;
  pinned: boolean;
  onSelect: () => void;
  onTogglePin: () => void;
}) {
  const canView = canViewBaseFiles(base);

  return (
    <div
      className={cn(
        "group relative flex h-8 w-full items-center gap-1 rounded-[8px] pr-1.5 transition-colors",
        selected ? "bg-primary-soft" : "hover:bg-card",
      )}
      style={{ paddingLeft: 30 + depth * 14 }}
    >
      {selected && (
        <span className="absolute left-0 top-1/2 h-4 w-[3px] -translate-y-1/2 rounded-r-full bg-primary" />
      )}
      <button
        type="button"
        onClick={onSelect}
        className={cn(
          "flex min-w-0 flex-1 items-center gap-2 text-left text-[12.5px]",
          selected ? "font-medium text-accent-foreground" : "text-kb-body",
        )}
      >
        <Library
          className={cn(
            "h-3.5 w-3.5 shrink-0 stroke-[1.8]",
            selected ? "text-primary" : "text-kb-muted",
          )}
        />
        <span className="min-w-0 flex-1 truncate">{base.name}</span>
      </button>
      {!canView ? (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="grid h-6 w-6 shrink-0 place-items-center text-warning-foreground/80">
                <LockKeyhole className="h-3.5 w-3.5" />
              </span>
            </TooltipTrigger>
            <TooltipContent className="text-[12px]">无浏览权限</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ) : (
        <button
          type="button"
          aria-label={pinned ? "取消置顶" : "置顶"}
          onClick={(e) => {
            e.stopPropagation();
            onTogglePin();
          }}
          className="grid h-6 w-6 shrink-0 place-items-center rounded-[6px] text-kb-muted opacity-0 transition-all hover:bg-kb-surface-hover hover:text-kb-primary group-hover:opacity-100"
        >
          {pinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
        </button>
      )}
    </div>
  );
}

function NoPermissionState({ base, onApply }: { base: KnowledgeBase; onApply: () => void }) {
  return (
    <div className="space-y-3">
      <div className={cn(kbCardShell, kbRadius.md, "px-4 py-3")}>
        <h1 className="text-[17px] font-semibold text-kb-heading">{base.name}</h1>
        <p className="mt-1 text-[12px] text-kb-muted">{base.description}</p>
      </div>
      <KbEmptyState
        title="暂无浏览权限"
        description="你可以看到该知识库的存在，但当前不能查看文件列表。提交权限申请后由对应管理员审批。"
        action={
          <KbButton onClick={onApply}>
            <ShieldCheck className="h-4 w-4 stroke-[1.8]" />
            申请权限
          </KbButton>
        }
      />
    </div>
  );
}

function PermissionApplyModal({ base, onClose }: { base: KnowledgeBase; onClose: () => void }) {
  const [group, setGroup] = useState("view");
  const [reason, setReason] = useState("");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-kb-heading/40 px-4">
      <div className={cn(kbCardShell, kbRadius.lg, "w-full max-w-[460px] p-5 shadow-card-hover")}>
        <div className="text-[16px] font-semibold text-kb-heading">申请权限</div>
        <p className="mt-1 text-[12.5px] text-kb-muted">{base.name}</p>
        <div className="mt-4">
          <span className="mb-1.5 block text-[12px] font-medium text-kb-muted">权限组</span>
          <KbFilterSelect
            value={group}
            onChange={setGroup}
            options={[
              { value: "view", label: "浏览组" },
              { value: "upload", label: "上传组" },
            ]}
          />
        </div>
        <label className="mt-3 block text-[12px] font-medium text-kb-muted">
          申请理由
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="mt-1 min-h-[92px] w-full resize-none rounded-[8px] border border-kb-border px-3 py-2 text-[12.5px] text-kb-body outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
            placeholder="请说明使用场景，便于管理员审批"
          />
        </label>
        <div className="mt-5 flex justify-end gap-2">
          <KbButton variant="outline" onClick={onClose}>
            取消
          </KbButton>
          <KbButton
            onClick={() => {
              toast.success(group === "view" ? "已提交浏览权限申请" : "已提交上传权限申请");
              onClose();
            }}
          >
            提交申请
          </KbButton>
        </div>
      </div>
    </div>
  );
}

import { useNavigate } from "@tanstack/react-router";
import {
  ShieldCheck,
  Star,
  Upload,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
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
import { KNOWLEDGE_BASES } from "@/lib/knowledge/data";
import {
  canUploadToBase,
  canViewBaseFiles,
  filterFiles,
  getBaseById,
  getDefaultOverviewBaseId,
  getFilesForBase,
  getFilesForPersonalTree,
  getFilesForProfessionalTree,
  isTreeAggregateId,
  PERSONAL_TREE_ALL_ID,
  PROFESSIONAL_TREE_ALL_ID,
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
import { KnowledgeAggregateDetailHeader } from "./KnowledgeAggregateDetailHeader";
import { KnowledgeBaseDetailHeader } from "./KnowledgeBaseDetailHeader";
import { KnowledgeCategoryTree } from "./KnowledgeCategoryTree";
import { KnowledgeOverviewTitleBanner } from "./KnowledgeOverviewTitleBanner";
import { KnowledgeSidebarQuickLinks } from "./KnowledgeSidebarQuickLinks";
import { KnowledgeTreeSectionActions } from "./KnowledgeTreeSectionActions";
import { PersonalDirectoryTree } from "./PersonalDirectoryTree";

const CARD_PAGE_SIZE = 8;

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

  const isPersonalAll = selectedBaseId === PERSONAL_TREE_ALL_ID;
  const isProfessionalAll = selectedBaseId === PROFESSIONAL_TREE_ALL_ID;
  const isAggregate = isPersonalAll || isProfessionalAll;

  const selectedBase =
    selectedBaseId && !isAggregate ? getBaseById(selectedBaseId) : undefined;

  const allCurrentBaseFiles = useMemo(() => {
    if (isPersonalAll) return getFilesForPersonalTree();
    if (isProfessionalAll) return getFilesForProfessionalTree();
    if (selectedBase) return getFilesForBase(selectedBase.id);
    return [];
  }, [isPersonalAll, isProfessionalAll, selectedBase]);

  const selectedFiles = useMemo(() => {
    if (isAggregate) {
      return sortKnowledgeFiles(filterFiles(allCurrentBaseFiles, { query }), sortBy);
    }
    if (!selectedBase || !canViewBaseFiles(selectedBase)) return [];
    return sortKnowledgeFiles(
      filterFiles(allCurrentBaseFiles, {
        query,
        professionalType: professionalType === "all" ? undefined : professionalType,
        tag: tag === "all" ? undefined : tag,
      }),
      sortBy,
    );
  }, [allCurrentBaseFiles, isAggregate, professionalType, query, selectedBase, sortBy, tag]);

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

  const handleSelectTreeId = (id: string) => {
    setSelectedBaseId(id);
    if (isTreeAggregateId(id)) {
      navigate({ to: "/knowledge", replace: true });
    } else {
      navigate({ to: "/knowledge/kb/$kbId", params: { kbId: id }, replace: true });
    }
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
            <KnowledgeSidebarQuickLinks />
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
                  onClick={() => handleSelectTreeId(base.id)}
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

        <KbSidebarSection
          title="专业知识库"
          action={
            <KnowledgeTreeSectionActions
              directoryLabel="新建分类目录"
              knowledgeBaseLabel="新建专业知识库"
              onAddDirectory={() => toast.success("已预留新建分类目录入口")}
              onAddKnowledgeBase={() => toast.success("已预留新建专业知识库入口")}
            />
          }
        >
          <KnowledgeCategoryTree
            selectedBaseId={selectedBaseId}
            pinnedIds={pinnedIds}
            onSelectBase={(base) => handleSelectTreeId(base.id)}
            onSelectAll={() => handleSelectTreeId(PROFESSIONAL_TREE_ALL_ID)}
            onTogglePin={handleTogglePin}
          />
        </KbSidebarSection>

        <KbSidebarSection
          title="个人知识库"
          className="border-t border-[#E8F0F2] pt-2"
          action={
            <KnowledgeTreeSectionActions
              directoryLabel="新建个人目录"
              knowledgeBaseLabel="新建个人知识库"
              onAddDirectory={() => toast.success("已预留新建个人目录入口")}
              onAddKnowledgeBase={() => toast.success("已预留新建个人知识库入口")}
            />
          }
        >
          <PersonalDirectoryTree
            selectedBaseId={selectedBaseId}
            onSelectBase={handleSelectTreeId}
          />
        </KbSidebarSection>
      </KbSidebar>

      <main className={cn("scrollbar-thin", kbMainPanel)}>
        {!selectedBaseId ? (
          <div className="flex flex-1 items-center justify-center p-8">
            <KbEmptyState
              title="请选择知识库"
              description="从左侧个人知识库、专业知识库或快速访问中选择一个知识库，右侧会展示该库资料。"
            />
          </div>
        ) : isAggregate ? (
          <TreeAggregatePanel
            scopeLabel={isPersonalAll ? "个人知识库" : "专业知识库"}
            description={
              isPersonalAll
                ? "汇总展示个人知识库中有权访问的全部文件。"
                : "汇总展示专业知识库中有权访问的全部文件。"
            }
            files={selectedFiles}
            query={query}
            sortBy={sortBy}
            viewMode={viewMode}
            page={page}
            pageSize={pageSize}
            refreshSeed={refreshSeed}
            onNavigateRoot={() => handleSelectTreeId(getDefaultOverviewBaseId())}
            onQueryChange={setQuery}
            onSortChange={setSortBy}
            onViewModeChange={setViewMode}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            onRefresh={handleRefresh}
            onOpen={handleOpenFile}
          />
        ) : !selectedBase ? (
          <div className="flex flex-1 items-center justify-center p-8">
            <KbEmptyState
              title="知识库不存在"
              description="该知识库可能已被删除或你暂无访问权限，请从左侧重新选择。"
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
              onSelectBase={handleSelectTreeId}
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

function TreeAggregatePanel({
  scopeLabel,
  description,
  files,
  query,
  sortBy,
  viewMode,
  page,
  pageSize,
  refreshSeed,
  onNavigateRoot,
  onQueryChange,
  onSortChange,
  onViewModeChange,
  onPageChange,
  onPageSizeChange,
  onRefresh,
  onOpen,
}: {
  scopeLabel: string;
  description: string;
  files: KnowledgeFile[];
  query: string;
  sortBy: KnowledgeSortBy;
  viewMode: FileViewMode;
  page: number;
  pageSize: number;
  refreshSeed: number;
  onNavigateRoot?: () => void;
  onQueryChange: (value: string) => void;
  onSortChange: (value: KnowledgeSortBy) => void;
  onViewModeChange: (mode: FileViewMode) => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onRefresh: () => void;
  onOpen: (file: KnowledgeFile) => void;
}) {
  const effectivePageSize = viewMode === "card" ? CARD_PAGE_SIZE : pageSize;
  const totalPages = Math.max(1, Math.ceil(files.length / effectivePageSize) || 1);
  const safePage = Math.min(page, totalPages);
  const pagedFiles = useMemo(() => {
    const start = (safePage - 1) * effectivePageSize;
    return files.slice(start, start + effectivePageSize);
  }, [effectivePageSize, files, safePage]);

  const empty = (
    <KbEmptyState
      title="当前筛选下暂无文件"
      description="调整关键词后再试。"
    />
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <KnowledgeAggregateDetailHeader
        fileCount={files.length}
        description={description}
        scopeLabel={scopeLabel}
        onNavigateRoot={onNavigateRoot}
      />

      <div className="border-b border-divider bg-[#FAFCFD] px-4 py-2.5">
        <KbFilterBar
          className="mb-0"
          searchValue={query}
          onSearchChange={onQueryChange}
          searchPlaceholder="搜索文件"
          searchClassName="max-w-[280px] !rounded-[8px]"
          trailing={
            <>
              <FileViewModeToggle value={viewMode} onChange={onViewModeChange} />
              <FileListSortButton value={sortBy} onChange={onSortChange} />
              <FileListRefreshButton onClick={onRefresh} />
            </>
          }
        />
      </div>

      <div key={refreshSeed} className="min-h-0 flex-1 overflow-y-auto">
        {viewMode === "list" ? (
          <KnowledgeFileTable
            files={pagedFiles}
            showLibrary
            overviewMode
            onOpen={onOpen}
            empty={empty}
          />
        ) : (
          <KnowledgeFileCardGrid files={pagedFiles} onOpen={onOpen} empty={empty} />
        )}
      </div>

      {files.length > 0 &&
        (viewMode === "list" ? (
          <TableListPager
            page={safePage}
            totalPages={totalPages}
            totalItems={files.length}
            pageSize={pageSize}
            onPageChange={onPageChange}
            onPageSizeChange={(size) => {
              onPageSizeChange(size);
              onPageChange(1);
            }}
          />
        ) : (
          <div className="border-t border-divider px-4 py-2">
            <CardBatchPager
              page={safePage}
              totalPages={totalPages}
              totalItems={files.length}
              pageSize={CARD_PAGE_SIZE}
              unitLabel="个文件"
              onPageChange={onPageChange}
              compact
            />
          </div>
        ))}
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

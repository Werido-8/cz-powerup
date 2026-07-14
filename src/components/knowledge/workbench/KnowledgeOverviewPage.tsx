import { useNavigate, useRouter } from "@tanstack/react-router";
import {
  MessageSquareText,
  ShieldCheck,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState, type ComponentProps } from "react";
import { toast } from "sonner";
import knowledgeNoPermissionIllustration from "@/assets/knowledge-no-permission.png";
import {
  KbButton,
  KbDragUploadOverlay,
  KbEmptyState,
  KbFileSearchInput,
  KbMetadataFilter,
  KbFormDialog,
  KbFormField,
  KbSidebar,
  KbSidebarSection,
} from "@/components/knowledge/ui";
import { AppDialogButton } from "@/components/ui/app-dialog";
import { AppFormTextarea } from "@/components/ui/app-form";
import {
  canUploadToBase,
  canViewBaseFiles,
  canManageFileList,
  filterFiles,
  getBaseById,
  getCategoryChain,
  getDefaultOverviewBaseId,
  getFilesForBase,
  getFilesForPersonalTree,
  getFilesForProfessionalTree,
  getMetadataFieldsForBase,
  getPinnedFiles,
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
import {
  addStoreBase,
  getKnowledgeStoreVersion,
  getStoreBases,
  removeStoreCategoryCascade,
  removeStoreFiles,
  subscribeKnowledgeStore,
  updateStoreCategory,
  updateStoreFile,
  PROFESSIONAL_CATEGORY_ROOT_ID,
} from "@/lib/knowledge/store";
import type {
  KnowledgeBase,
  KnowledgeCategory,
  KnowledgeFile,
  KnowledgeSortBy,
  FileSearchMode,
} from "@/lib/knowledge/types";
import { kbMainPanel } from "@/lib/knowledge/tokens";
import { TableListPager, CardBatchPager, PillSelect, TABLE_PAGE_SIZE_DEFAULT } from "@/components/learning/ui";
import { cn } from "@/lib/utils";
import {
  FileListToolbarActions,
  KnowledgeFileCardGrid,
  KnowledgeFileTable,
  type FileViewMode,
} from "./KnowledgeFileTable";
import { DirectoryForm } from "./DirectoryForm";
import { KnowledgeAggregateDetailHeader } from "./KnowledgeAggregateDetailHeader";
import { KnowledgeBaseDetailHeader } from "./KnowledgeBaseDetailHeader";
import { KnowledgeCategoryTree } from "./KnowledgeCategoryTree";
import { KnowledgeOverviewTitleBanner } from "./KnowledgeOverviewTitleBanner";
import { KnowledgeSidebarQuickLinks } from "./KnowledgeSidebarQuickLinks";
import { KnowledgeTreeSectionActions } from "./KnowledgeTreeSectionActions";
import { PersonalDirectoryTree } from "./PersonalDirectoryTree";
import { CreateKnowledgeBaseDialog } from "./admin/CreateKnowledgeBaseDialog";
import { FileListToolbar } from "./FileListToolbar";
import { FileBatchDeleteDialog } from "./FileBatchDeleteDialog";
import { FileMoveDialog } from "./FileMoveDialog";
import { FileVersionHistoryDialog } from "./FileVersionHistoryDialog";
import { DirectoryMoveDialog, type DirectoryMoveTarget } from "./DirectoryMoveDialog";
import { DirectoryRenameDialog } from "./DirectoryRenameDialog";
import { DirectoryDeleteDialog } from "./DirectoryDeleteDialog";
import { KnowledgeEmptyFilesState } from "./KnowledgeEmptyFilesState";
import { PinnedQuickAccessSection } from "./PinnedQuickAccessSection";
import { useFileSelection } from "./useFileSelection";
import { useFileViewMode } from "./useFileViewMode";

const CARD_PAGE_SIZE = 8;
const HIGHLIGHT_MS = 2400;

type DirectoryFormState = {
  open: boolean;
  defaultParentId?: string;
};

type KnowledgeBaseFormState = {
  open: boolean;
  defaultCategoryId?: string;
};

function useKnowledgeStoreVersion() {
  const [version, setVersion] = useState(getKnowledgeStoreVersion);
  useEffect(() => subscribeKnowledgeStore(() => setVersion(getKnowledgeStoreVersion())), []);
  return version;
}

function collectExpandIds(categoryId?: string) {
  if (!categoryId) return [] as string[];
  return getCategoryChain(categoryId).map((item) => item.id);
}

export function KnowledgeOverviewPage({ initialBaseId }: { initialBaseId?: string }) {
  const navigate = useNavigate();
  const router = useRouter();
  const storeVersion = useKnowledgeStoreVersion();
  const [pinnedIds, setPinnedIds] = useState<string[]>(() => loadPinnedIds());
  const [selectedBaseId, setSelectedBaseId] = useState(() => {
    if (initialBaseId) return initialBaseId;
    if (typeof window !== "undefined") {
      return window.localStorage.getItem("knowledge-last-base") ?? getDefaultOverviewBaseId();
    }
    return getDefaultOverviewBaseId();
  });
  const [query, setQuery] = useState("");
  const [searchMode, setSearchMode] = useState<FileSearchMode>("fulltext");
  const [metadataFilters, setMetadataFilters] = useState<Record<string, string>>({});
  const [sortBy, setSortBy] = useState<KnowledgeSortBy>("updated");
  const fileSelection = useFileSelection();
  const [viewMode, setViewMode] = useFileViewMode();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(TABLE_PAGE_SIZE_DEFAULT);
  const [refreshSeed, setRefreshSeed] = useState(0);
  const [permissionBase, setPermissionBase] = useState<KnowledgeBase | null>(null);
  const [directoryForm, setDirectoryForm] = useState<DirectoryFormState>({ open: false });
  const [knowledgeBaseForm, setKnowledgeBaseForm] = useState<KnowledgeBaseFormState>({
    open: false,
  });
  const [forceExpandIds, setForceExpandIds] = useState<string[]>([]);
  const [highlightedCategoryId, setHighlightedCategoryId] = useState<string>();
  const [highlightedBaseId, setHighlightedBaseId] = useState<string>();
  const [batchLoading, setBatchLoading] = useState<
    "download" | "disable" | "delete" | "move" | null
  >(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [moveFiles, setMoveFiles] = useState<KnowledgeFile[]>([]);
  const [moveLoading, setMoveLoading] = useState(false);
  const [historyFile, setHistoryFile] = useState<KnowledgeFile | null>(null);
  const [directoryMoveTarget, setDirectoryMoveTarget] = useState<DirectoryMoveTarget | null>(null);
  const [directoryMoveLoading, setDirectoryMoveLoading] = useState(false);
  const [renameCategory, setRenameCategory] = useState<KnowledgeCategory | null>(null);
  const [renameLoading, setRenameLoading] = useState(false);
  const [deleteCategory, setDeleteCategory] = useState<KnowledgeCategory | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    if (initialBaseId) setSelectedBaseId(initialBaseId);
  }, [initialBaseId]);

  useEffect(() => {
    if (selectedBaseId && typeof window !== "undefined") {
      window.localStorage.setItem("knowledge-last-base", selectedBaseId);
    }
  }, [selectedBaseId]);

  useEffect(() => {
    if (!highlightedCategoryId && !highlightedBaseId) return;
    const timer = window.setTimeout(() => {
      setHighlightedCategoryId(undefined);
      setHighlightedBaseId(undefined);
    }, HIGHLIGHT_MS);
    return () => window.clearTimeout(timer);
  }, [highlightedCategoryId, highlightedBaseId, storeVersion]);

  const pinnedBases = useMemo(
    () => getStoreBases().filter((b) => isPinnedId(pinnedIds, b.id) && b.status === "enabled"),
    [pinnedIds, storeVersion],
  );

  const pinnedFiles = useMemo(() => getPinnedFiles(), [storeVersion]);

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
  }, [isPersonalAll, isProfessionalAll, selectedBase, storeVersion]);

  const selectedFiles = useMemo(() => {
    if (isAggregate) {
      return sortKnowledgeFiles(
        filterFiles(allCurrentBaseFiles, { query, searchMode }),
        sortBy,
      );
    }
    if (!selectedBase || !canViewBaseFiles(selectedBase)) return [];
    return sortKnowledgeFiles(
      filterFiles(allCurrentBaseFiles, {
        query,
        searchMode,
        metadataFilters,
      }),
      sortBy,
    );
  }, [allCurrentBaseFiles, isAggregate, metadataFilters, query, searchMode, selectedBase, sortBy]);

  useEffect(() => {
    setPage(1);
  }, [selectedBaseId, query, searchMode, metadataFilters, sortBy, viewMode]);

  useEffect(() => {
    setMetadataFilters({});
    fileSelection.clear();
  }, [selectedBaseId]);

  useEffect(() => {
    fileSelection.clear();
  }, [query, searchMode, metadataFilters]);

  const effectivePageSize = viewMode === "card" ? CARD_PAGE_SIZE : pageSize;
  const totalPages = Math.max(1, Math.ceil(selectedFiles.length / effectivePageSize) || 1);
  const safePage = Math.min(page, totalPages);
  const pagedFiles = useMemo(() => {
    const start = (safePage - 1) * effectivePageSize;
    return selectedFiles.slice(start, start + effectivePageSize);
  }, [effectivePageSize, safePage, selectedFiles]);

  const showManageColumn = selectedBase ? canManageFileList(selectedBase) : canManageFileList();
  const metadataFields = selectedBase ? getMetadataFieldsForBase(selectedBase.id) : [];
  const pageFileIds = pagedFiles.map((file) => file.id);
  const listSelection = {
    isSelected: fileSelection.isSelected,
    onToggle: fileSelection.toggle,
    onToggleAll: fileSelection.toggleAll,
    pageIds: pageFileIds,
  };
  const cardSelection = {
    isSelected: fileSelection.isSelected,
    onToggle: fileSelection.toggle,
  };

  const handleToggleEnabled = (file: KnowledgeFile, enabled: boolean) => {
    updateStoreFile(file.id, { enabled });
    toast.message(enabled ? "文件已启用" : "文件已停用");
  };

  const handleToggleFilePin = (file: KnowledgeFile) => {
    const nextPinned = !file.pinned;
    updateStoreFile(file.id, { pinned: nextPinned });
    toast.message(nextPinned ? "文件已置顶" : "已取消置顶");
  };

  const handleConfirmMove = (files: KnowledgeFile[], targetBaseId: string) => {
    const targetBase = getBaseById(targetBaseId);
    setMoveLoading(true);
    for (const file of files) {
      updateStoreFile(file.id, {
        knowledgeBaseId: targetBaseId,
        knowledgeBaseName: targetBase?.name,
      });
    }
    window.setTimeout(() => {
      const label = files.length > 1 ? `${files.length} 个文件` : `「${files[0]?.name}」`;
      toast.success(`已将 ${label} 移动到「${targetBase?.name ?? "目标知识库"}」`);
      setMoveLoading(false);
      setMoveFiles([]);
      fileSelection.clear();
    }, 300);
  };

  const handleBatchMove = () => {
    const ids = [...fileSelection.selectedArray];
    const files = ids
      .map((id) => selectedFiles.find((file) => file.id === id))
      .filter((file): file is KnowledgeFile => Boolean(file));
    setMoveFiles(files);
  };

  const fileRowActions = {
    ...(showManageColumn
      ? { onMove: (file: KnowledgeFile) => setMoveFiles([file]) }
      : {}),
    onTogglePin: handleToggleFilePin,
    onViewHistory: (file: KnowledgeFile) => setHistoryFile(file),
  };

  const handleBatchDownload = () => {
    setBatchLoading("download");
    window.setTimeout(() => {
      toast.message(`开始下载 ${fileSelection.selectedCount} 个文件`);
      setBatchLoading(null);
    }, 400);
  };

  const handleBatchDisable = () => {
    setBatchLoading("disable");
    for (const id of fileSelection.selectedArray) {
      updateStoreFile(id, { enabled: false });
    }
    window.setTimeout(() => {
      toast.success(`已停用 ${fileSelection.selectedCount} 个文件`);
      fileSelection.clear();
      setBatchLoading(null);
    }, 300);
  };

  const handleConfirmBatchDelete = () => {
    const count = fileSelection.selectedCount;
    const ids = [...fileSelection.selectedArray];
    setBatchLoading("delete");
    removeStoreFiles(ids);
    window.setTimeout(() => {
      toast.success(`已删除 ${count} 个文件`);
      fileSelection.clear();
      setBatchLoading(null);
      setDeleteDialogOpen(false);
    }, 300);
  };

  const batchToolbarProps = (pageIds: string[], totalCount: number) => ({
    selectedCount: fileSelection.selectedCount,
    totalCount,
    pageFileCount: pageIds.length,
    isAllResultsSelected: fileSelection.isAllResultsSelected,
    onSelectAllResults: () => fileSelection.selectAllResults(selectedFiles.map((file) => file.id)),
    onBatchDownload: handleBatchDownload,
    onBatchMove: showManageColumn ? handleBatchMove : undefined,
    onBatchDisable: showManageColumn ? handleBatchDisable : undefined,
    onBatchDelete: () => setDeleteDialogOpen(true),
    onClearSelection: fileSelection.clear,
    showBatchMove: showManageColumn,
    showBatchDisable: showManageColumn,
    batchLoading,
  });

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

  const openDirectoryForm = (defaultParentId?: string) => {
    setDirectoryForm({ open: true, defaultParentId });
  };

  const openKnowledgeBaseForm = (defaultCategoryId?: string) => {
    setKnowledgeBaseForm({ open: true, defaultCategoryId });
  };

  const handleDirectorySuccess = (directory: KnowledgeCategory) => {
    if (directory.parentId) {
      setForceExpandIds(collectExpandIds(directory.parentId));
    }
    setHighlightedCategoryId(directory.id);
  };

  const handleKnowledgeBaseCreated = (base: KnowledgeBase) => {
    addStoreBase(base);
    toast.success("知识库已创建");
    if (base.categoryId) {
      setForceExpandIds(collectExpandIds(base.categoryId));
    }
    setHighlightedBaseId(base.id);
    handleSelectTreeId(base.id);
    setKnowledgeBaseForm({ open: false });
  };

  const handleOpenFile = (file: KnowledgeFile) => {
    navigate({
      to: "/knowledge/file/$fileId",
      params: { fileId: file.id },
      search: { kbId: file.knowledgeBaseId },
    });
  };

  // 仅用于「知识总览 · 全部」汇总列表：在新浏览器 tab 中打开文件详情
  const handleOpenFileNewTab = (file: KnowledgeFile) => {
    const href = router.buildLocation({
      to: "/knowledge/file/$fileId",
      params: { fileId: file.id },
      search: { kbId: file.knowledgeBaseId },
    }).href;
    window.open(href, "_blank", "noopener,noreferrer");
  };

  const handleUploadFiles = (files: FileList) => {
    toast.success(`已选择 ${files.length} 个文件，上传面板即将打开`);
  };

  const handleRefresh = () => {
    setPage(1);
    setRefreshSeed((v) => v + 1);
    toast.message("列表已刷新");
  };

  const isBaseTrulyEmpty = Boolean(selectedBase) && allCurrentBaseFiles.length === 0;
  const emptyFiles = isBaseTrulyEmpty ? (
    <KnowledgeEmptyFilesState
      canUpload={selectedBase ? canUploadToBase(selectedBase) : false}
      onUpload={
        selectedBase && canUploadToBase(selectedBase)
          ? () => toast.message("打开上传面板")
          : undefined
      }
    />
  ) : (
    <KbEmptyState
      title="当前筛选下暂无文件"
      description="调整搜索关键词或元数据筛选后再试。"
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
        <PinnedQuickAccessSection
          pinnedBases={pinnedBases}
          pinnedFiles={pinnedFiles}
          selectedBaseId={selectedBaseId}
          onSelectBase={(baseId) => {
            const base = getBaseById(baseId);
            if (base?.scope === "personal") {
              navigate({ to: "/knowledge/mine", hash: "personal" });
              return;
            }
            handleSelectTreeId(baseId);
          }}
          onOpenFile={handleOpenFile}
          onUnpinBase={handleTogglePin}
          onUnpinFile={(file) => handleToggleFilePin(file)}
        />

        <KbSidebarSection
          title="专业知识库"
          action={
            <KnowledgeTreeSectionActions
              directoryLabel="新建目录"
              knowledgeBaseLabel="新增知识库"
              onAddDirectory={() => openDirectoryForm()}
              onAddKnowledgeBase={() => openKnowledgeBaseForm()}
            />
          }
        >
          <KnowledgeCategoryTree
            selectedBaseId={selectedBaseId}
            pinnedIds={pinnedIds}
            forceExpandIds={forceExpandIds}
            highlightedCategoryId={highlightedCategoryId}
            highlightedBaseId={highlightedBaseId}
            onSelectBase={(base) => handleSelectTreeId(base.id)}
            onSelectAll={() => handleSelectTreeId(PROFESSIONAL_TREE_ALL_ID)}
            onTogglePin={handleTogglePin}
            onCreateDirectory={(category) => openDirectoryForm(category.id)}
            onCreateKnowledgeBase={(category) => openKnowledgeBaseForm(category.id)}
            onMoveDirectory={(category) =>
              setDirectoryMoveTarget({ kind: "category", item: category })
            }
            onRenameDirectory={(category) => setRenameCategory(category)}
            onDeleteDirectory={(category) => setDeleteCategory(category)}
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
            pinnedIds={pinnedIds}
            highlightedBaseId={highlightedBaseId}
            onSelectBase={handleSelectTreeId}
            onTogglePin={handleTogglePin}
            onCreateDirectory={(directory) =>
              toast.success(`已预留：在「${directory.name}」下新建个人目录`)
            }
            onCreateKnowledgeBase={(directory) =>
              toast.success(`已预留：在「${directory.name}」下新建个人知识库`)
            }
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
            searchMode={searchMode}
            sortBy={sortBy}
            viewMode={viewMode}
            page={page}
            pageSize={pageSize}
            refreshSeed={refreshSeed}
            showManageColumn={canManageFileList()}
            onNavigateRoot={() => handleSelectTreeId(getDefaultOverviewBaseId())}
            onQueryChange={setQuery}
            onSearchModeChange={setSearchMode}
            onSortChange={setSortBy}
            onViewModeChange={setViewMode}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            onRefresh={handleRefresh}
            onOpen={handleOpenFileNewTab}
            onToggleEnabled={handleToggleEnabled}
            selection={listSelection}
            cardSelection={cardSelection}
            batchToolbarProps={batchToolbarProps}
            fileRowActions={fileRowActions}
          />
        ) : !selectedBase ? (
          <div className="flex flex-1 items-center justify-center p-8">
            <KbEmptyState
              title="知识库不存在"
              description="该知识库可能已被删除或你暂无访问权限，请从左侧重新选择。"
            />
          </div>
        ) : !canViewBaseFiles(selectedBase) ? (
          <div className="flex min-h-0 flex-1 flex-col">
            <KnowledgeBaseDetailHeader
              base={selectedBase}
              fileCount={selectedBase.fileCount ?? 0}
              onSelectBase={handleSelectTreeId}
            />
            <NoPermissionState onApply={() => setPermissionBase(selectedBase)} />
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
              <FileListToolbar
                {...batchToolbarProps(pageFileIds, selectedFiles.length)}
                left={
                  <>
                    <KbFileSearchInput
                      value={query}
                      onChange={setQuery}
                      mode={searchMode}
                      onModeChange={setSearchMode}
                    />
                    <KbMetadataFilter
                      fields={metadataFields}
                      files={allCurrentBaseFiles}
                      value={metadataFilters}
                      onChange={setMetadataFilters}
                    />
                  </>
                }
                right={
                  <FileListToolbarActions
                    viewMode={viewMode}
                    onViewModeChange={setViewMode}
                    sortBy={sortBy}
                    onSortChange={setSortBy}
                    onRefresh={handleRefresh}
                    onUpload={
                      canUploadToBase(selectedBase)
                        ? () => toast.message("打开上传面板")
                        : undefined
                    }
                  />
                }
              />

              <div key={refreshSeed} className="min-h-0 flex-1 overflow-y-auto">
                {viewMode === "list" ? (
                  <KnowledgeFileTable
                    files={pagedFiles}
                    showLibrary={false}
                    overviewMode
                    showManageColumn={showManageColumn}
                    selection={listSelection}
                    onToggleEnabled={handleToggleEnabled}
                    onOpen={handleOpenFile}
                    empty={emptyFiles}
                    {...fileRowActions}
                  />
                ) : (
                  <KnowledgeFileCardGrid
                    files={pagedFiles}
                    selection={cardSelection}
                    onOpen={handleOpenFile}
                    empty={emptyFiles}
                    {...fileRowActions}
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

      <DirectoryForm
        open={directoryForm.open}
        defaultParentId={directoryForm.defaultParentId}
        onClose={() => setDirectoryForm({ open: false })}
        onSuccess={handleDirectorySuccess}
      />

      {knowledgeBaseForm.open && (
        <CreateKnowledgeBaseDialog
          open={knowledgeBaseForm.open}
          defaultCategoryId={knowledgeBaseForm.defaultCategoryId}
          onClose={() => setKnowledgeBaseForm({ open: false })}
          onSubmit={handleKnowledgeBaseCreated}
        />
      )}

      <FileBatchDeleteDialog
        open={deleteDialogOpen}
        count={fileSelection.selectedCount}
        loading={batchLoading === "delete"}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleConfirmBatchDelete}
      />

      <FileMoveDialog
        files={moveFiles}
        currentBaseId={selectedBase?.id}
        loading={moveLoading}
        onClose={() => setMoveFiles([])}
        onConfirm={handleConfirmMove}
      />

      <FileVersionHistoryDialog
        file={historyFile}
        onClose={() => setHistoryFile(null)}
      />
      <DirectoryMoveDialog
        target={directoryMoveTarget}
        loading={directoryMoveLoading}
        onClose={() => setDirectoryMoveTarget(null)}
        onConfirm={(targetParentId) => {
          const moving = directoryMoveTarget;
          setDirectoryMoveLoading(true);
          window.setTimeout(() => {
            if (moving?.kind === "category") {
              const resolvedParentId =
                targetParentId === PROFESSIONAL_CATEGORY_ROOT_ID ? undefined : targetParentId;
              updateStoreCategory(moving.item.id, { parentId: resolvedParentId });
              if (resolvedParentId) {
                setForceExpandIds(collectExpandIds(resolvedParentId));
              }
              setHighlightedCategoryId(moving.item.id);
            }
            toast.success(`目录「${moving?.item.name}」已移动`);
            setDirectoryMoveLoading(false);
            setDirectoryMoveTarget(null);
          }, 300);
        }}
      />

      <DirectoryRenameDialog
        category={renameCategory}
        loading={renameLoading}
        onClose={() => setRenameCategory(null)}
        onConfirm={(name) => {
          const target = renameCategory;
          if (!target) return;
          setRenameLoading(true);
          window.setTimeout(() => {
            updateStoreCategory(target.id, { name });
            setHighlightedCategoryId(target.id);
            toast.success(`目录已重命名为「${name}」`);
            setRenameLoading(false);
            setRenameCategory(null);
          }, 300);
        }}
      />

      <DirectoryDeleteDialog
        category={deleteCategory}
        loading={deleteLoading}
        onClose={() => setDeleteCategory(null)}
        onConfirm={() => {
          const target = deleteCategory;
          if (!target) return;
          setDeleteLoading(true);
          window.setTimeout(() => {
            removeStoreCategoryCascade(target.id);
            toast.success(`目录「${target.name}」已删除`);
            setDeleteLoading(false);
            setDeleteCategory(null);
          }, 300);
        }}
      />
    </>
  );
}

function TreeAggregatePanel({
  scopeLabel,
  description,
  files,
  query,
  searchMode,
  sortBy,
  viewMode,
  page,
  pageSize,
  refreshSeed,
  showManageColumn,
  onNavigateRoot,
  onQueryChange,
  onSearchModeChange,
  onSortChange,
  onViewModeChange,
  onPageChange,
  onPageSizeChange,
  onRefresh,
  onOpen,
  onToggleEnabled,
  selection,
  cardSelection,
  batchToolbarProps,
  fileRowActions,
}: {
  scopeLabel: string;
  description: string;
  files: KnowledgeFile[];
  query: string;
  searchMode: FileSearchMode;
  sortBy: KnowledgeSortBy;
  viewMode: FileViewMode;
  page: number;
  pageSize: number;
  refreshSeed: number;
  showManageColumn: boolean;
  onNavigateRoot?: () => void;
  onQueryChange: (value: string) => void;
  onSearchModeChange: (mode: FileSearchMode) => void;
  onSortChange: (value: KnowledgeSortBy) => void;
  onViewModeChange: (mode: FileViewMode) => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onRefresh: () => void;
  onOpen: (file: KnowledgeFile) => void;
  onToggleEnabled: (file: KnowledgeFile, enabled: boolean) => void;
  selection: {
    isSelected: (id: string) => boolean;
    onToggle: (id: string) => void;
    onToggleAll: (ids: string[], checked: boolean) => void;
    pageIds: string[];
  };
  cardSelection: {
    isSelected: (id: string) => boolean;
    onToggle: (id: string) => void;
  };
  batchToolbarProps: (pageIds: string[], totalCount: number) => ComponentProps<typeof FileListToolbar>;
  fileRowActions: {
    onMove?: (file: KnowledgeFile) => void;
    onTogglePin: (file: KnowledgeFile) => void;
    onViewHistory: (file: KnowledgeFile) => void;
  };
}) {
  const effectivePageSize = viewMode === "card" ? CARD_PAGE_SIZE : pageSize;
  const totalPages = Math.max(1, Math.ceil(files.length / effectivePageSize) || 1);
  const safePage = Math.min(page, totalPages);
  const pagedFiles = useMemo(() => {
    const start = (safePage - 1) * effectivePageSize;
    return files.slice(start, start + effectivePageSize);
  }, [effectivePageSize, files, safePage]);
  const aggregatePageIds = pagedFiles.map((file) => file.id);

  const empty = (
    <KbEmptyState
      title="当前筛选下暂无文件"
      description="调整搜索关键词后再试。"
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

      <FileListToolbar
        {...batchToolbarProps(aggregatePageIds, files.length)}
        left={
          <KbFileSearchInput
            value={query}
            onChange={onQueryChange}
            mode={searchMode}
            onModeChange={onSearchModeChange}
          />
        }
        right={
          <FileListToolbarActions
            viewMode={viewMode}
            onViewModeChange={onViewModeChange}
            sortBy={sortBy}
            onSortChange={onSortChange}
            onRefresh={onRefresh}
          />
        }
      />

      <div key={refreshSeed} className="min-h-0 flex-1 overflow-y-auto">
        {viewMode === "list" ? (
          <KnowledgeFileTable
            files={pagedFiles}
            showLibrary
            overviewMode
            showManageColumn={showManageColumn}
            selection={selection}
            onToggleEnabled={onToggleEnabled}
            onOpen={onOpen}
            empty={empty}
            {...fileRowActions}
          />
        ) : (
          <KnowledgeFileCardGrid
            files={pagedFiles}
            selection={cardSelection}
            onOpen={onOpen}
            empty={empty}
            {...fileRowActions}
          />
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

function NoPermissionState({ onApply }: { onApply: () => void }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-6 py-10">
      <div className="relative flex w-full max-w-[300px] flex-col items-center">
        <img
          src={knowledgeNoPermissionIllustration}
          alt=""
          aria-hidden
          draggable={false}
          className="pointer-events-none h-auto w-full select-none"
        />
        <div className="absolute left-1/2 top-[92%] -translate-x-1/2 -translate-y-1/2">
          <KbButton
            onClick={onApply}
            className="shadow-[0_8px_20px_rgba(52,155,172,0.28)]"
          >
            <ShieldCheck className="h-4 w-4 stroke-[1.8]" />
            申请权限
          </KbButton>
        </div>
      </div>

      <div className="mt-5 max-w-[360px] text-center">
        <h1 className="text-[16px] font-semibold text-kb-heading">暂无浏览权限</h1>
        <p className="mt-2 text-[12.5px] leading-relaxed text-kb-muted">
          提交申请，待管理员审核通过后即可查看该知识库文件。
        </p>
      </div>
    </div>
  );
}

function PermissionApplyModal({ base, onClose }: { base: KnowledgeBase; onClose: () => void }) {
  const [group, setGroup] = useState("view");
  const [reason, setReason] = useState("");
  return (
    <KbFormDialog
      open
      size="compact"
      variant="form"
      title="申请权限"
      titleIcon={ShieldCheck}
      onClose={onClose}
      footer={
        <>
          <AppDialogButton variant="outline" onClick={onClose}>
            取消
          </AppDialogButton>
          <AppDialogButton
            variant="primary"
            onClick={() => {
              toast.success(group === "view" ? "已提交浏览权限申请" : "已提交上传权限申请");
              onClose();
            }}
          >
            提交申请
          </AppDialogButton>
        </>
      }
    >
      <div className="mb-5 flex items-center gap-2 rounded-[8px] border border-[var(--form-control-border)] bg-[#f7fafb] px-3 py-2.5">
        <span className="text-[12px] text-kb-muted">目标知识库</span>
        <span className="truncate text-[13px] font-medium text-kb-heading">{base.name}</span>
      </div>
      <KbFormField label="权限组" icon={Users} required>
        <PillSelect
          value={group}
          onChange={setGroup}
          options={[
            { value: "view", label: "浏览组" },
            { value: "upload", label: "上传组" },
          ]}
        />
      </KbFormField>
      <KbFormField label="申请理由" icon={MessageSquareText} className="mb-0">
        <AppFormTextarea
          value={reason}
          maxLength={200}
          onChange={(e) => setReason(e.target.value)}
          className="min-h-[96px] resize-none"
          placeholder="请说明使用场景，便于管理员审批"
        />
      </KbFormField>
    </KbFormDialog>
  );
}

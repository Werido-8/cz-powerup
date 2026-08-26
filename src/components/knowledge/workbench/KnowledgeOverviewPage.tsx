import { useNavigate, useRouter } from "@tanstack/react-router";
import {
  MessageSquareText,
  ShieldCheck,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState, useSyncExternalStore, type ComponentProps } from "react";
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
  canSeeCategoryManager,
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
  getPersonalDirectoryChildren,
  getPinnedFiles,
  isSubmitToPublicMove,
  isTreeAggregateId,
  PERSONAL_DIRECTORY_ROOT_ID,
  PERSONAL_TREE_ALL_ID,
  PROFESSIONAL_TREE_ALL_ID,
  sortKnowledgeFiles,
} from "@/lib/knowledge/model";
import {
  getDemoRoleKey,
  getDemoRoleServerSnapshot,
  getCurrentKnowledgeUser,
  subscribeDemoRole,
} from "@/lib/knowledge/demoRole";
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
  removeStoreBase,
  removeStoreCategoryCascade,
  removeStoreFiles,
  removeStorePersonalDirectory,
  subscribeKnowledgeStore,
  submitStoreFileMove,
  submitStorePermissionRequest,
  updateStoreBase,
  updateStoreCategory,
  updateStoreFile,
  updateStorePersonalDirectory,
  PROFESSIONAL_CATEGORY_ROOT_ID,
} from "@/lib/knowledge/store";
import type {
  KnowledgeBase,
  KnowledgeCategory,
  KnowledgeFile,
  KnowledgeSortBy,
  FileSearchMode,
  PersonalDirectory,
} from "@/lib/knowledge/types";
import { kbMainPanel } from "@/lib/knowledge/tokens";
import { openFileDetailInNewTab, type FileDetailSearchScope } from "@/lib/knowledge/searchNav";
import { TableListPager, CardBatchPager, PillSelect, TABLE_PAGE_SIZE_DEFAULT } from "@/components/learning/ui";
import { cn } from "@/lib/utils";
import {
  FileListToolbarActions,
  KnowledgeFileCardGrid,
  KnowledgeFileTable,
  type FileViewMode,
} from "./KnowledgeFileTable";
import { DirectoryForm } from "./DirectoryForm";
import { FullTextSearchResultPanel } from "./FullTextSearchResultPanel";
import { KnowledgeAggregateDetailHeader } from "./KnowledgeAggregateDetailHeader";
import { KnowledgeBaseDetailHeader } from "./KnowledgeBaseDetailHeader";
import { KnowledgeCategoryTree } from "./KnowledgeCategoryTree";
import { KnowledgeOverviewTitleBanner } from "./KnowledgeOverviewTitleBanner";
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
import { KnowledgeBaseDeleteDialog } from "./KnowledgeBaseDeleteDialog";
import { KnowledgeBaseMoveDialog } from "./KnowledgeBaseMoveDialog";
import { KnowledgeBaseRenameDialog } from "./KnowledgeBaseRenameDialog";
import { PersonalDirectoryRenameDialog } from "./PersonalDirectoryRenameDialog";
import { KnowledgeEmptyFilesState } from "./KnowledgeEmptyFilesState";
import { PinnedQuickAccessSection } from "./PinnedQuickAccessSection";
import { useFileSelection } from "./useFileSelection";
import { useFileViewMode } from "./useFileViewMode";
import { MyPendingReviewWidget } from "./MyPendingReviewWidget";
import { UploadSimilarityFlowDialog } from "./UploadSimilarityFlowDialog";

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
  const role = useSyncExternalStore(
    subscribeDemoRole,
    getDemoRoleKey,
    getDemoRoleServerSnapshot,
  );
  const employee = role === "employee";
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
  const [searchMode, setSearchMode] = useState<FileSearchMode>("filename");
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
  const [renameBase, setRenameBase] = useState<KnowledgeBase | null>(null);
  const [renameBaseLoading, setRenameBaseLoading] = useState(false);
  const [moveBase, setMoveBase] = useState<KnowledgeBase | null>(null);
  const [moveBaseLoading, setMoveBaseLoading] = useState(false);
  const [deleteBase, setDeleteBase] = useState<KnowledgeBase | null>(null);
  const [deleteBaseLoading, setDeleteBaseLoading] = useState(false);
  const [renamePersonalDirectory, setRenamePersonalDirectory] = useState<PersonalDirectory | null>(
    null,
  );
  const [renamePersonalDirectoryLoading, setRenamePersonalDirectoryLoading] = useState(false);
  const [uploadFlow, setUploadFlow] = useState<{
    base: KnowledgeBase;
    files?: File[];
  } | null>(null);

  const showCategoryManageActions = canSeeCategoryManager();
  const showPersonalManageActions = !employee;
  // 个人知识库由当前用户维护，普通员工同样需要节点快捷操作。
  const showPersonalTreeNodeActions = true;

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
    () => getStoreBases().filter((b) => isPinnedId(pinnedIds, b.id)),
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

  const isFullTextSearchActive = searchMode === "fulltext" && query.trim().length > 0;

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

  const showManageColumn =
    selectedBase?.scope === "personal" ||
    selectedBaseId === PERSONAL_TREE_ALL_ID ||
    (selectedBase ? canManageFileList(selectedBase) : canManageFileList());
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

  const handleConfirmMove = (files: KnowledgeFile[], targetBaseId: string, keepSource: boolean) => {
    const targetBase = getBaseById(targetBaseId);
    if (!targetBase) {
      toast.error("目标知识库不存在");
      return;
    }
    const toSubmit = files.filter((file) =>
      isSubmitToPublicMove(file.knowledgeBaseId, targetBaseId),
    );
    const movable = files.filter(
      (file) => !isSubmitToPublicMove(file.knowledgeBaseId, targetBaseId),
    );
    setMoveLoading(true);
    for (const file of toSubmit) {
      submitStoreFileMove(file, targetBase, keepSource);
    }
    for (const file of movable) {
      if (keepSource) {
        updateStoreFile(file.id, {});
      } else {
        updateStoreFile(file.id, {
          knowledgeBaseId: targetBaseId,
          knowledgeBaseName: targetBase.name,
        });
      }
    }
    window.setTimeout(() => {
      if (toSubmit.length > 0) {
        toast.success(
          `已提交「${toSubmit[0]?.name}」${keepSource ? "复制" : "移入"}「${targetBase.name}」的申请，请等待管理员审批`,
        );
      } else {
        toast.success(
          keepSource
            ? `已在「${targetBase.name}」创建「${movable[0]?.name}」的副本`
            : `已将「${movable[0]?.name}」移动到「${targetBase.name}」`,
        );
      }
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
    onBatchDisable: showManageColumn ? handleBatchDisable : undefined,
    onBatchDelete: () => setDeleteDialogOpen(true),
    onClearSelection: fileSelection.clear,
    showBatchMove: false,
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

  const handleDisableDirectory = (category: KnowledgeCategory) => {
    toast.success(`目录「${category.name}」已停用`);
  };

  const handleDisablePersonalDirectory = (directory: PersonalDirectory) => {
    toast.success(`个人目录「${directory.name}」已停用`);
  };

  const handleDeletePersonalDirectory = (directory: PersonalDirectory) => {
    const childCount = getPersonalDirectoryChildren(directory.id).length;
    const baseCount = getStoreBases().filter(
      (base) => base.scope === "personal" && base.personalDirectoryId === directory.id,
    ).length;
    if (childCount > 0) {
      toast.error("该目录下仍有子目录，请先删除或移动子目录");
      return;
    }
    if (baseCount > 0) {
      toast.error("该目录下仍有知识库，无法删除");
      return;
    }
    if (
      typeof window !== "undefined" &&
      !window.confirm(`确认删除个人目录「${directory.name}」？该操作不可恢复。`)
    ) {
      return;
    }
    removeStorePersonalDirectory(directory.id);
    toast.success("个人目录已删除");
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

  const handleOpenFile = (file: KnowledgeFile, opts?: { scope?: FileDetailSearchScope }) => {
    openFileDetailInNewTab(router, file, {
      query,
      searchMode,
      resultFiles: selectedFiles,
      scope: opts?.scope,
    });
  };

  const handleUploadFiles = (files: FileList) => {
    if (!selectedBase) return;
    setUploadFlow({ base: selectedBase, files: Array.from(files) });
  };

  const openUploadFlow = () => {
    if (!selectedBase) return;
    setUploadFlow({ base: selectedBase });
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
          ? openUploadFlow
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
        header={<KnowledgeOverviewTitleBanner />}
      >
        <PinnedQuickAccessSection
          pinnedBases={pinnedBases}
          pinnedFiles={pinnedFiles}
          selectedBaseId={selectedBaseId}
          onSelectBase={handleSelectTreeId}
          onOpenFile={handleOpenFile}
          onUnpinBase={handleTogglePin}
          onUnpinFile={(file) => handleToggleFilePin(file)}
        />

        <KbSidebarSection
          title="公共知识库"
          action={
            showCategoryManageActions ? (
              <KnowledgeTreeSectionActions
                directoryLabel="新建目录"
                knowledgeBaseLabel="新增知识库"
                onAddDirectory={() => openDirectoryForm()}
                onAddKnowledgeBase={() => openKnowledgeBaseForm()}
              />
            ) : undefined
          }
        >
          <KnowledgeCategoryTree
            selectedBaseId={selectedBaseId}
            pinnedIds={pinnedIds}
            forceExpandIds={forceExpandIds}
            highlightedCategoryId={highlightedCategoryId}
            highlightedBaseId={highlightedBaseId}
            showCategoryManageActions={showCategoryManageActions}
            onSelectBase={(base) => handleSelectTreeId(base.id)}
            onSelectAll={() => handleSelectTreeId(PROFESSIONAL_TREE_ALL_ID)}
            onTogglePin={handleTogglePin}
            onCreateDirectory={
              showCategoryManageActions
                ? (category) => openDirectoryForm(category.id)
                : undefined
            }
            onCreateKnowledgeBase={
              showCategoryManageActions
                ? (category) => openKnowledgeBaseForm(category.id)
                : undefined
            }
            onMoveDirectory={
              showCategoryManageActions
                ? (category) => setDirectoryMoveTarget({ kind: "category", item: category })
                : undefined
            }
            onRenameDirectory={
              showCategoryManageActions ? (category) => setRenameCategory(category) : undefined
            }
            onDeleteDirectory={
              showCategoryManageActions ? (category) => setDeleteCategory(category) : undefined
            }
            onDisableDirectory={
              showCategoryManageActions ? handleDisableDirectory : undefined
            }
            onRenameBase={(base) => setRenameBase(base)}
            onMoveBase={(base) => setMoveBase(base)}
            onDeleteBase={(base) => setDeleteBase(base)}
          />
        </KbSidebarSection>

        <KbSidebarSection
          title="个人知识库"
          className="border-t border-[#E8F0F2] pt-2"
          action={
            showPersonalManageActions ? (
              <KnowledgeTreeSectionActions
                directoryLabel="新建个人目录"
                knowledgeBaseLabel="新建个人知识库"
                onAddDirectory={() => toast.success("已预留新建个人目录入口")}
                onAddKnowledgeBase={() => toast.success("已预留新建个人知识库入口")}
              />
            ) : undefined
          }
        >
          <PersonalDirectoryTree
            selectedBaseId={selectedBaseId}
            pinnedIds={pinnedIds}
            highlightedBaseId={highlightedBaseId}
            showDirectoryManageActions={showPersonalTreeNodeActions}
            onSelectBase={handleSelectTreeId}
            onTogglePin={handleTogglePin}
            onCreateDirectory={
              showPersonalTreeNodeActions
                ? (directory) => toast.success(`已预留：在「${directory.name}」下新建个人目录`)
                : undefined
            }
            onCreateKnowledgeBase={
              showPersonalTreeNodeActions
                ? (directory) => toast.success(`已预留：在「${directory.name}」下新建个人知识库`)
                : undefined
            }
            onMoveDirectory={
              showPersonalTreeNodeActions
                ? (directory) => setDirectoryMoveTarget({ kind: "personal", item: directory })
                : undefined
            }
            onRenameDirectory={
              showPersonalTreeNodeActions
                ? (directory) => setRenamePersonalDirectory(directory)
                : undefined
            }
            onDeleteDirectory={
              showPersonalTreeNodeActions ? handleDeletePersonalDirectory : undefined
            }
            onDisableDirectory={
              showPersonalTreeNodeActions ? handleDisablePersonalDirectory : undefined
            }
            onRenameBase={(base) => setRenameBase(base)}
            onMoveBase={(base) => setMoveBase(base)}
            onDeleteBase={(base) => setDeleteBase(base)}
          />
        </KbSidebarSection>
      </KbSidebar>

      <main className={cn("scrollbar-thin", kbMainPanel)}>
        {!selectedBaseId ? (
          <div className="flex flex-1 items-center justify-center p-8">
            <KbEmptyState
              title="请选择知识库"
              description="从左侧公共知识库、个人知识库或快速访问中选择一个知识库，右侧会展示该库资料。"
            />
          </div>
        ) : isAggregate ? (
          <TreeAggregatePanel
            scopeLabel={isPersonalAll ? "个人知识库" : "公共知识库"}
            description={
              isPersonalAll
                ? "汇总展示个人知识库中有权访问的全部文件。"
                : "汇总展示公共知识库中有权访问的全部文件。"
            }
            files={selectedFiles}
            query={query}
            searchMode={searchMode}
            scope={isPersonalAll ? "personal-all" : "professional-all"}
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
            onOpen={(file) =>
              handleOpenFile(file, {
                scope: isPersonalAll ? "personal-all" : "professional-all",
              })
            }
            onToggleEnabled={handleToggleEnabled}
            selection={listSelection}
            cardSelection={cardSelection}
            batchToolbarProps={batchToolbarProps}
            fileRowActions={fileRowActions}
            processingBaseId={selectedBaseId}
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
          <div className="relative flex min-h-0 flex-1 flex-col">
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
                    showViewModeToggle={!isFullTextSearchActive}
                    onUpload={
                      canUploadToBase(selectedBase)
                        ? openUploadFlow
                        : undefined
                    }
                  />
                }
              />

              {isFullTextSearchActive ? (
                <FullTextSearchResultPanel
                  files={selectedFiles}
                  query={query}
                  showLibrary={false}
                  onToggleEnabled={handleToggleEnabled}
                />
              ) : (
                <>
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

                  {selectedFiles.length > 0 ? (
                    viewMode === "list" ? (
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
                        leading={<MyPendingReviewWidget knowledgeBaseId={selectedBase.id} />}
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
                          leading={<MyPendingReviewWidget knowledgeBaseId={selectedBase.id} />}
                        />
                      </div>
                    )
                  ) : (
                    <div className="flex items-center border-t border-divider px-5 py-2.5 empty:hidden">
                      <MyPendingReviewWidget knowledgeBaseId={selectedBase.id} />
                    </div>
                  )}
                </>
              )}
            </KbDragUploadOverlay>
          </div>
        )}
      </main>

      {permissionBase && (
        <PermissionApplyModal base={permissionBase} onClose={() => setPermissionBase(null)} />
      )}

      <UploadSimilarityFlowDialog
        base={uploadFlow?.base ?? null}
        initialFiles={uploadFlow?.files}
        onClose={() => setUploadFlow(null)}
      />

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
              toast.success(`目录「${moving.item.name}」已移动`);
            } else if (moving?.kind === "personal") {
              const resolvedParentId =
                targetParentId === PERSONAL_DIRECTORY_ROOT_ID ? PERSONAL_DIRECTORY_ROOT_ID : targetParentId;
              updateStorePersonalDirectory(moving.item.id, {
                parentId:
                  resolvedParentId === PERSONAL_DIRECTORY_ROOT_ID
                    ? PERSONAL_DIRECTORY_ROOT_ID
                    : resolvedParentId,
              });
              toast.success(`个人目录「${moving.item.name}」已移动`);
            }
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

      <KnowledgeBaseRenameDialog
        base={renameBase}
        loading={renameBaseLoading}
        onClose={() => setRenameBase(null)}
        onConfirm={(name) => {
          const target = renameBase;
          if (!target) return;
          setRenameBaseLoading(true);
          window.setTimeout(() => {
            updateStoreBase({ ...target, name });
            setHighlightedBaseId(target.id);
            toast.success(`知识库已重命名为「${name}」`);
            setRenameBaseLoading(false);
            setRenameBase(null);
          }, 300);
        }}
      />

      <KnowledgeBaseMoveDialog
        base={moveBase}
        loading={moveBaseLoading}
        onClose={() => setMoveBase(null)}
        onConfirm={(targetId) => {
          const target = moveBase;
          if (!target) return;
          setMoveBaseLoading(true);
          window.setTimeout(() => {
            if (target.scope === "personal") {
              const directoryId =
                targetId === PERSONAL_DIRECTORY_ROOT_ID ? undefined : targetId;
              updateStoreBase({ ...target, personalDirectoryId: directoryId });
            } else {
              const categoryId =
                targetId === PROFESSIONAL_CATEGORY_ROOT_ID ? undefined : targetId;
              updateStoreBase({ ...target, categoryId });
              if (categoryId) {
                setForceExpandIds(collectExpandIds(categoryId));
              }
            }
            setHighlightedBaseId(target.id);
            toast.success(`知识库「${target.name}」已移动`);
            setMoveBaseLoading(false);
            setMoveBase(null);
          }, 300);
        }}
      />

      <KnowledgeBaseDeleteDialog
        base={deleteBase}
        loading={deleteBaseLoading}
        onClose={() => setDeleteBase(null)}
        onConfirm={() => {
          const target = deleteBase;
          if (!target) return;
          setDeleteBaseLoading(true);
          window.setTimeout(() => {
            removeStoreBase(target.id);
            if (selectedBaseId === target.id) {
              handleSelectTreeId(
                target.scope === "personal" ? PERSONAL_TREE_ALL_ID : PROFESSIONAL_TREE_ALL_ID,
              );
            }
            toast.success(`知识库「${target.name}」已删除`);
            setDeleteBaseLoading(false);
            setDeleteBase(null);
          }, 300);
        }}
      />

      <PersonalDirectoryRenameDialog
        directory={renamePersonalDirectory}
        loading={renamePersonalDirectoryLoading}
        onClose={() => setRenamePersonalDirectory(null)}
        onConfirm={(name) => {
          const target = renamePersonalDirectory;
          if (!target) return;
          setRenamePersonalDirectoryLoading(true);
          window.setTimeout(() => {
            updateStorePersonalDirectory(target.id, { name });
            toast.success(`个人目录已重命名为「${name}」`);
            setRenamePersonalDirectoryLoading(false);
            setRenamePersonalDirectory(null);
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
  scope,
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
  processingBaseId,
}: {
  scopeLabel: string;
  description: string;
  files: KnowledgeFile[];
  query: string;
  searchMode: FileSearchMode;
  scope: FileDetailSearchScope;
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
  processingBaseId: string;
}) {
  const effectivePageSize = viewMode === "card" ? CARD_PAGE_SIZE : pageSize;
  const totalPages = Math.max(1, Math.ceil(files.length / effectivePageSize) || 1);
  const safePage = Math.min(page, totalPages);
  const pagedFiles = useMemo(() => {
    const start = (safePage - 1) * effectivePageSize;
    return files.slice(start, start + effectivePageSize);
  }, [effectivePageSize, files, safePage]);
  const aggregatePageIds = pagedFiles.map((file) => file.id);
  const isFullTextSearchActive = searchMode === "fulltext" && query.trim().length > 0;

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
            showViewModeToggle={!isFullTextSearchActive}
          />
        }
      />

      {isFullTextSearchActive ? (
        <FullTextSearchResultPanel
          files={files}
          query={query}
          showLibrary
          scope={scope}
          onToggleEnabled={onToggleEnabled}
        />
      ) : (
        <>
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

          {files.length > 0 ? (
            viewMode === "list" ? (
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
                leading={<MyPendingReviewWidget knowledgeBaseId={processingBaseId} />}
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
                  leading={<MyPendingReviewWidget knowledgeBaseId={processingBaseId} />}
                />
              </div>
            )
          ) : (
            <div className="flex items-center border-t border-divider px-5 py-2.5 empty:hidden">
              <MyPendingReviewWidget knowledgeBaseId={processingBaseId} />
            </div>
          )}
        </>
      )}
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
              if (!reason.trim()) {
                toast.error("请填写申请理由");
                return;
              }
              submitStorePermissionRequest({
                applicantId: getCurrentKnowledgeUser().id,
                applicantName: getCurrentKnowledgeUser().name,
                knowledgeBaseId: base.id,
                knowledgeBaseName: base.name,
                group: group as import("@/lib/knowledge/types").KnowledgePermissionGroup,
                reason: reason.trim(),
                submittedAt: new Date().toLocaleString("zh-CN", {
                  year: "numeric",
                  month: "2-digit",
                  day: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                }),
              });
              toast.success("权限申请已提交，等待管理员审批");
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

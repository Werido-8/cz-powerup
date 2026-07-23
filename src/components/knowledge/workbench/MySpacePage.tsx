import { useNavigate } from "@tanstack/react-router";
import {
  ArrowUpDown,
  ChevronDown,
  Clock3,
  Eye,
  Heart,
  MoreHorizontal,
  RefreshCw,
  UploadCloud,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ComponentProps,
  type ReactNode,
  type UIEvent,
} from "react";
import { toast } from "sonner";
import {
  CardBatchPager,
  SearchBar,
  StatCardDecor,
  StatIconFrame,
  TABLE_PAGE_SIZE_DEFAULT,
  TableListPager,
} from "@/components/learning/ui";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  KbButton,
  KbDataTable,
  KbDataTableRow,
  KbDragUploadOverlay,
  KbEmptyState,
  KbFileSearchInput,
  KbFileTypeIcon,
  KbFilterSelect,
  KbMetadataFilter,
  KbSidebar,
  KbSidebarSection,
  KbStatusTag,
  KbTableCellFile,
} from "@/components/knowledge/ui";
import {
  canManageFileList,
  filterFiles,
  getFavoriteFiles,
  getFileById,
  getFilesForBase,
  getFilesForPersonalTree,
  getMetadataFieldsForBase,
  getBaseById,
  getPersonalBases,
  getPersonalDirectoryChildren,
  getPinnedFiles,
  getRecentFiles,
  isSubmitToPublicMove,
  listCategoryPathOptions,
  PERSONAL_DIRECTORY_ROOT_ID,
  PERSONAL_TREE_ALL_ID,
  sortKnowledgeFiles,
} from "@/lib/knowledge/model";
import {
  getDemoRoleKey,
  getDemoRoleServerSnapshot,
  subscribeDemoRole,
} from "@/lib/knowledge/demoRole";
import {
  getKnowledgeStoreServerSnapshot,
  getKnowledgeStoreVersion,
  getStoreBases,
  removeStoreBase,
  removeStoreFiles,
  removeStorePersonalDirectory,
  subscribeKnowledgeStore,
  updateStoreBase,
  updateStoreFile,
  updateStorePersonalDirectory,
} from "@/lib/knowledge/store";
import { isPinnedId, loadPinnedIds, savePinnedIds, togglePinnedId } from "@/lib/knowledge/pinned";
import { kbFileTypeConfig, kbMainPanel } from "@/lib/knowledge/tokens";
import type {
  KnowledgeBase,
  KnowledgeBaseStatus,
  KnowledgeFile,
  KnowledgeSortBy,
  FileSearchMode,
  PersonalDirectory,
} from "@/lib/knowledge/types";
import type { UploadView } from "@/lib/knowledge/uploadTracking";
import { cn } from "@/lib/utils";
import {
  FileListToolbarActions,
  KnowledgeFileCardGrid,
  KnowledgeFileTable,
  type FileViewMode,
} from "./KnowledgeFileTable";
import { FileMoveDialog } from "./FileMoveDialog";
import { FileVersionHistoryDialog } from "./FileVersionHistoryDialog";
import { DirectoryMoveDialog, type DirectoryMoveTarget } from "./DirectoryMoveDialog";
import { KnowledgeBaseDeleteDialog } from "./KnowledgeBaseDeleteDialog";
import { KnowledgeBaseMoveDialog } from "./KnowledgeBaseMoveDialog";
import { KnowledgeBaseRenameDialog } from "./KnowledgeBaseRenameDialog";
import { PersonalDirectoryRenameDialog } from "./PersonalDirectoryRenameDialog";
import { PinnedQuickAccessSection } from "./PinnedQuickAccessSection";
import { KnowledgeAggregateDetailHeader } from "./KnowledgeAggregateDetailHeader";
import { KnowledgeBaseDetailHeader } from "./KnowledgeBaseDetailHeader";
import { KnowledgeTreeNavItem } from "./KnowledgeCategoryTree";
import { KnowledgeTreeSectionActions } from "./KnowledgeTreeSectionActions";
import { MySpaceTitleBanner } from "./MySpaceTitleBanner";
import { PersonalDirectoryTree } from "./PersonalDirectoryTree";
import { FileListToolbar } from "./FileListToolbar";
import { FileBatchDeleteDialog } from "./FileBatchDeleteDialog";
import { useFileSelection } from "./useFileSelection";
import { useFileViewMode } from "./useFileViewMode";
import { UploadTrackingPanel, type UploadSearch } from "./UploadTrackingPanel";

export type MySpacePageSearch = {
  panel?: "recent" | "uploads" | "favorites" | "personal";
  view?: UploadView;
  status?: string;
  q?: string;
};

type MySpaceSelection =
  | { kind: "recent" }
  | { kind: "uploads" }
  | { kind: "favorites" }
  | { kind: "personalAll" }
  | { kind: "personalBase"; baseId: string };

const CARD_PAGE_SIZE = 8;
const RECENT_ACCESS_BATCH_SIZE = 8;

const mySpaceSortOptions: Array<{ value: KnowledgeSortBy; label: string }> = [
  { value: "updated", label: "按时间排序" },
  { value: "name", label: "按名称排序" },
  { value: "size", label: "按大小排序" },
  { value: "status", label: "按状态排序" },
];

export function MySpacePage({ search = {} }: { search?: MySpacePageSearch }) {
  const navigate = useNavigate({ from: "/knowledge/mine" });
  const role = useSyncExternalStore(subscribeDemoRole, getDemoRoleKey, getDemoRoleServerSnapshot);
  const showPersonalManageActions = role !== "employee";
  // 个人知识库由当前用户维护，普通员工同样需要节点快捷操作。
  const showPersonalTreeNodeActions = true;
  const storeVersion = useSyncExternalStore(
    subscribeKnowledgeStore,
    getKnowledgeStoreVersion,
    getKnowledgeStoreServerSnapshot,
  );
  const personalBases = useMemo(() => getPersonalBases(), [storeVersion]);
  const [selection, setSelection] = useState<MySpaceSelection>({ kind: "recent" });
  const [query, setQuery] = useState("");
  const [searchMode, setSearchMode] = useState<FileSearchMode>("fulltext");
  const [metadataFilters, setMetadataFilters] = useState<Record<string, string>>({});
  const [sortBy, setSortBy] = useState<KnowledgeSortBy>("updated");
  const fileSelection = useFileSelection();
  const [viewMode, setViewMode] = useFileViewMode();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(TABLE_PAGE_SIZE_DEFAULT);
  const [refreshSeed, setRefreshSeed] = useState(0);
  const [pinnedIds, setPinnedIds] = useState<string[]>(() => loadPinnedIds());
  const [batchLoading, setBatchLoading] = useState<
    "download" | "disable" | "delete" | "move" | null
  >(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [moveFiles, setMoveFiles] = useState<KnowledgeFile[]>([]);
  const [moveLoading, setMoveLoading] = useState(false);
  const [historyFile, setHistoryFile] = useState<KnowledgeFile | null>(null);
  const [directoryMoveTarget, setDirectoryMoveTarget] = useState<DirectoryMoveTarget | null>(null);
  const [directoryMoveLoading, setDirectoryMoveLoading] = useState(false);
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

  const handleTogglePin = (baseId: string) => {
    setPinnedIds((prev) => {
      const next = togglePinnedId(prev, baseId);
      savePinnedIds(next);
      toast.message(isPinnedId(prev, baseId) ? "已取消置顶" : "已置顶到快速访问");
      return next;
    });
  };

  const handleToggleBaseStatus = (base: KnowledgeBase) => {
    const nextStatus: KnowledgeBaseStatus = base.status === "enabled" ? "disabled" : "enabled";
    const message =
      nextStatus === "disabled"
        ? "停用后该知识库将不可访问。确认停用？"
        : "确认重新启用该知识库？";
    if (typeof window !== "undefined" && !window.confirm(message)) return;
    updateStoreBase({ ...base, status: nextStatus });
    toast.success(nextStatus === "disabled" ? "知识库已停用" : "知识库已重新启用");
    if (nextStatus === "disabled" && selection.kind === "personalBase" && selection.baseId === base.id) {
      setSelection({ kind: "personalAll" });
    }
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

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.location.hash === "#personal") {
      setSelection({ kind: "personalAll" });
    }
    if (window.location.hash === "#uploads") {
      setSelection({ kind: "uploads" });
      navigate({ to: "/knowledge/mine", search: { panel: "uploads" }, replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    if (search.panel === "uploads") {
      setSelection({ kind: "uploads" });
    } else if (search.panel === "favorites") {
      setSelection({ kind: "favorites" });
    } else if (search.panel === "personal") {
      setSelection({ kind: "personalAll" });
    } else if (search.panel === "recent") {
      setSelection({ kind: "recent" });
    }
  }, [search.panel]);

  useEffect(() => {
    setPage(1);
    setQuery("");
    setSearchMode("fulltext");
    setMetadataFilters({});
    fileSelection.clear();
  }, [selection]);

  useEffect(() => {
    setPage(1);
  }, [query, searchMode, metadataFilters, sortBy, viewMode]);

  useEffect(() => {
    fileSelection.clear();
  }, [query, searchMode, metadataFilters]);

  const handleUploadFiles = (files: FileList) => {
    toast.success(`已选择 ${files.length} 个文件，上传面板即将打开`);
  };

  const openFile = (file: KnowledgeFile) => {
    navigate({
      to: "/knowledge/file/$fileId",
      params: { fileId: file.id },
      search: { kbId: file.knowledgeBaseId },
    });
  };

  const pinnedBases = useMemo(
    () => personalBases.filter((base) => isPinnedId(pinnedIds, base.id)),
    [personalBases, pinnedIds],
  );
  const pinnedFiles = useMemo(() => getPinnedFiles(), [storeVersion]);

  const selectedBase =
    selection.kind === "personalBase"
      ? personalBases.find((base) => base.id === selection.baseId)
      : undefined;

  const personalAllFiles = useMemo(() => {
    return sortKnowledgeFiles(
      filterFiles(getFilesForPersonalTree(), { query, searchMode }),
      sortBy,
    );
  }, [query, searchMode, sortBy, storeVersion]);

  const personalFiles = useMemo(() => {
    if (!selectedBase) return [];
    return sortKnowledgeFiles(
      filterFiles(getFilesForBase(selectedBase.id), {
        query,
        searchMode,
        metadataFilters,
      }),
      sortBy,
    );
  }, [selectedBase, query, searchMode, metadataFilters, sortBy, storeVersion]);

  const activePersonalFiles =
    selection.kind === "personalAll"
      ? personalAllFiles
      : selection.kind === "personalBase"
        ? personalFiles
        : [];

  const handleToggleEnabled = (file: KnowledgeFile, enabled: boolean) => {
    updateStoreFile(file.id, { enabled });
    toast.message(enabled ? "文件已启用" : "文件已停用");
  };

  const handleToggleFilePin = (file: KnowledgeFile) => {
    const nextPinned = !file.pinned;
    updateStoreFile(file.id, { pinned: nextPinned });
    toast.message(nextPinned ? "文件已置顶" : "已取消置顶");
  };

  const handleConfirmMove = (movingFiles: KnowledgeFile[], targetBaseId: string) => {
    const targetBase = getBaseById(targetBaseId);
    const submittedForApproval = movingFiles.filter((file) =>
      isSubmitToPublicMove(file.knowledgeBaseId, targetBaseId),
    );
    setMoveLoading(true);
    for (const file of movingFiles) {
      if (isSubmitToPublicMove(file.knowledgeBaseId, targetBaseId)) {
        updateStoreFile(file.id, { status: "pendingApproval" });
        continue;
      }
      updateStoreFile(file.id, {
        knowledgeBaseId: targetBaseId,
        knowledgeBaseName: targetBase?.name,
      });
    }
    window.setTimeout(() => {
      const label =
        movingFiles.length > 1 ? `${movingFiles.length} 个文件` : `「${movingFiles[0]?.name}」`;
      toast.success(
        submittedForApproval.length > 0
          ? `已提交 ${label} 至「${targetBase?.name ?? "公共知识库"}」审批`
          : `已将 ${label} 移动到「${targetBase?.name ?? "目标知识库"}」`,
      );
      setMoveLoading(false);
      setMoveFiles([]);
      fileSelection.clear();
    }, 300);
  };

  const handleBatchMove = () => {
    const ids = [...fileSelection.selectedArray];
    const movingFiles = ids
      .map((id) => activePersonalFiles.find((file) => file.id === id))
      .filter((file): file is KnowledgeFile => Boolean(file));
    setMoveFiles(movingFiles);
  };

  const showManageActions = selectedBase ? canManageFileList(selectedBase) : true;

  const fileRowActions = {
    ...(showManageActions ? { onMove: (file: KnowledgeFile) => setMoveFiles([file]) } : {}),
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

  const batchToolbarProps = (
    pageIds: string[],
    totalCount: number,
    showDisable = true,
  ): ComponentProps<typeof FileListToolbar> => ({
    selectedCount: fileSelection.selectedCount,
    totalCount,
    pageFileCount: pageIds.length,
    isAllResultsSelected: fileSelection.isAllResultsSelected,
    onSelectAllResults: () =>
      fileSelection.selectAllResults(activePersonalFiles.map((file) => file.id)),
    onBatchDownload: handleBatchDownload,
    onBatchMove: showDisable ? handleBatchMove : undefined,
    onBatchDisable: showDisable ? handleBatchDisable : undefined,
    onBatchDelete: () => setDeleteDialogOpen(true),
    onClearSelection: fileSelection.clear,
    showBatchMove: showDisable,
    showBatchDisable: showDisable,
    batchLoading,
  });

  const handleRefresh = () => {
    setPage(1);
    setRefreshSeed((v) => v + 1);
    toast.message("列表已刷新");
  };

  const uploadSearch: UploadSearch = {
    panel: search.panel,
    view: search.view,
    status: search.status,
    q: search.q,
  };

  const handleUploadSearchChange = (next: UploadSearch) => {
    navigate({
      to: "/knowledge/mine",
      search: {
        panel: "uploads",
        view: next.view,
        status: next.status,
        q: next.q,
      },
      replace: true,
    });
  };

  const openUploadsPanel = () => {
    setSelection({ kind: "uploads" });
    navigate({ to: "/knowledge/mine", search: { panel: "uploads" }, replace: true });
  };

  return (
    <>
      <KbSidebar
        width="browse"
        withDecor
        header={<MySpaceTitleBanner />}
      >
        <PinnedQuickAccessSection
          pinnedBases={pinnedBases}
          pinnedFiles={pinnedFiles}
          selectedBaseId={selection.kind === "personalBase" ? selection.baseId : undefined}
          onSelectBase={(baseId) => setSelection({ kind: "personalBase", baseId })}
          onOpenFile={openFile}
          onUnpinBase={handleTogglePin}
          onUnpinFile={handleToggleFilePin}
        />

        <KbSidebarSection title="个人事务" className="border-t border-[#E8F0F2] pt-2">
          <div className="space-y-0.5 px-1">
            <KnowledgeTreeNavItem
              icon={Clock3}
              label="最近访问"
              selected={selection.kind === "recent"}
              onClick={() => setSelection({ kind: "recent" })}
            />
            <KnowledgeTreeNavItem
              icon={UploadCloud}
              label="我的上传"
              selected={selection.kind === "uploads"}
              onClick={openUploadsPanel}
            />
            <KnowledgeTreeNavItem
              icon={Heart}
              label="我的收藏"
              selected={selection.kind === "favorites"}
              onClick={() => setSelection({ kind: "favorites" })}
            />
          </div>
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
            selectedBaseId={
              selection.kind === "personalBase"
                ? selection.baseId
                : selection.kind === "personalAll"
                  ? PERSONAL_TREE_ALL_ID
                  : undefined
            }
            pinnedIds={pinnedIds}
            showDirectoryManageActions={showPersonalTreeNodeActions}
            onSelectBase={(baseId) => {
              if (baseId === PERSONAL_TREE_ALL_ID) {
                setSelection({ kind: "personalAll" });
              } else {
                setSelection({ kind: "personalBase", baseId });
              }
            }}
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
            onToggleBaseStatus={handleToggleBaseStatus}
          />
        </KbSidebarSection>
      </KbSidebar>

      <main className={cn("scrollbar-thin", kbMainPanel)}>
        {selection.kind === "recent" && (
          <RecentAccessPanel
            files={getRecentFiles()}
            sortBy={sortBy}
            refreshSeed={refreshSeed}
            onOpen={openFile}
          />
        )}

        {selection.kind === "uploads" && (
          <UploadTrackingPanel
            embedded
            search={uploadSearch}
            onSearchChange={handleUploadSearchChange}
          />
        )}

        {selection.kind === "favorites" && (
          <FavoriteKnowledgePanel
            files={getFavoriteFiles()}
            refreshSeed={refreshSeed}
            onRefresh={handleRefresh}
            onOpen={openFile}
          />
        )}

        {selection.kind === "personalAll" && (
          <PersonalAllPanel
            files={personalAllFiles}
            query={query}
            searchMode={searchMode}
            sortBy={sortBy}
            viewMode={viewMode}
            page={page}
            pageSize={pageSize}
            refreshSeed={refreshSeed}
            showManageColumn={showManageActions}
            onNavigateRoot={() => setSelection({ kind: "recent" })}
            onQueryChange={setQuery}
            onSearchModeChange={setSearchMode}
            onSortChange={setSortBy}
            onViewModeChange={setViewMode}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            onRefresh={handleRefresh}
            onOpen={openFile}
            onToggleEnabled={handleToggleEnabled}
            selection={fileSelection}
            batchToolbarProps={batchToolbarProps}
            fileRowActions={fileRowActions}
          />
        )}

        {selection.kind === "personalBase" && selectedBase && (
          <PersonalBasePanel
            base={selectedBase}
            files={personalFiles}
            query={query}
            searchMode={searchMode}
            metadataFilters={metadataFilters}
            sortBy={sortBy}
            viewMode={viewMode}
            page={page}
            pageSize={pageSize}
            refreshSeed={refreshSeed}
            onQueryChange={setQuery}
            onSearchModeChange={setSearchMode}
            onMetadataFiltersChange={setMetadataFilters}
            onSortChange={setSortBy}
            onViewModeChange={setViewMode}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            onRefresh={handleRefresh}
            onOpen={openFile}
            onUploadFiles={handleUploadFiles}
            onSelectBase={(baseId) => setSelection({ kind: "personalBase", baseId })}
            onToggleEnabled={handleToggleEnabled}
            selection={fileSelection}
            batchToolbarProps={batchToolbarProps}
            fileRowActions={fileRowActions}
          />
        )}
      </main>

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
      <FileVersionHistoryDialog file={historyFile} onClose={() => setHistoryFile(null)} />
      <DirectoryMoveDialog
        target={directoryMoveTarget}
        loading={directoryMoveLoading}
        onClose={() => setDirectoryMoveTarget(null)}
        onConfirm={(targetParentId) => {
          const moving = directoryMoveTarget;
          setDirectoryMoveLoading(true);
          window.setTimeout(() => {
            if (moving?.kind === "personal") {
              const resolvedParentId =
                targetParentId === PERSONAL_DIRECTORY_ROOT_ID
                  ? PERSONAL_DIRECTORY_ROOT_ID
                  : targetParentId;
              updateStorePersonalDirectory(moving.item.id, {
                parentId:
                  resolvedParentId === PERSONAL_DIRECTORY_ROOT_ID
                    ? PERSONAL_DIRECTORY_ROOT_ID
                    : resolvedParentId,
              });
            }
            toast.success(`目录「${moving?.item.name}」已移动`);
            setDirectoryMoveLoading(false);
            setDirectoryMoveTarget(null);
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
            const directoryId = targetId === PERSONAL_DIRECTORY_ROOT_ID ? undefined : targetId;
            updateStoreBase({ ...target, personalDirectoryId: directoryId });
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
            if (selection.kind === "personalBase" && selection.baseId === target.id) {
              setSelection({ kind: "personalAll" });
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

function RecentAccessPanel({
  files,
  sortBy,
  refreshSeed,
  onOpen,
}: {
  files: KnowledgeFile[];
  sortBy: KnowledgeSortBy;
  refreshSeed: number;
  onOpen: (file: KnowledgeFile) => void;
}) {
  const [visibleCount, setVisibleCount] = useState(RECENT_ACCESS_BATCH_SIZE);
  const scrollRootRef = useRef<HTMLDivElement | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const sorted = useMemo(() => sortKnowledgeFiles(files, sortBy), [files, sortBy]);
  const visibleFiles = useMemo(() => sorted.slice(0, visibleCount), [sorted, visibleCount]);
  const groups = useMemo(() => groupRecentAccessFiles(visibleFiles), [visibleFiles]);
  const hasMore = visibleCount < sorted.length;

  useEffect(() => {
    setVisibleCount(RECENT_ACCESS_BATCH_SIZE);
  }, [refreshSeed, sortBy, sorted.length]);

  const empty = (
    <KbEmptyState
      title="暂无最近访问"
      description="打开知识资料后会自动记录在这里，方便再次访问。"
    />
  );

  const loadMoreRecentFiles = () => {
    setVisibleCount((current) => Math.min(current + RECENT_ACCESS_BATCH_SIZE, sorted.length));
  };

  useEffect(() => {
    const scrollRoot = scrollRootRef.current;
    const loadTarget = loadMoreRef.current;

    if (!hasMore || !scrollRoot || !loadTarget || typeof IntersectionObserver === "undefined") {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisibleCount((current) => Math.min(current + RECENT_ACCESS_BATCH_SIZE, sorted.length));
        }
      },
      { root: scrollRoot, rootMargin: "160px 0px" },
    );

    observer.observe(loadTarget);

    return () => observer.disconnect();
  }, [hasMore, sorted.length, visibleCount]);

  const handleRecentListScroll = (event: UIEvent<HTMLDivElement>) => {
    if (!hasMore) return;

    const target = event.currentTarget;
    const distanceToBottom = target.scrollHeight - target.scrollTop - target.clientHeight;

    if (distanceToBottom < 120) {
      loadMoreRecentFiles();
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-white">
      <div
        key={refreshSeed}
        ref={scrollRootRef}
        onScroll={handleRecentListScroll}
        className="min-h-0 flex-1 overflow-y-auto scrollbar-thin px-6 py-4"
      >
        {sorted.length === 0 ? (
          empty
        ) : (
          <div className="space-y-4">
            {groups.map((group) => {
              return <RecentAccessListGroup key={group.label} group={group} onOpen={onOpen} />;
            })}
            <RecentAccessLoadState
              visibleCount={visibleFiles.length}
              totalCount={sorted.length}
              hasMore={hasMore}
            />
            <div ref={loadMoreRef} className="h-px" aria-hidden />
          </div>
        )}
      </div>
    </div>
  );
}

function RecentAccessEmptyGroup({ label }: { label: string }) {
  return (
    <div className="rounded-[8px] bg-[#FAFCFD]/70 px-4 py-5 text-center">
      <RecentAccessEmptyIllustration />
      <div className="text-[12.5px] text-[#7C8D95]">暂无{label}访问记录</div>
      <div className="mt-1 text-[12px] text-[#9AAAB0]">打开知识资料后会自动归入对应时间段。</div>
    </div>
  );
}

function RecentAccessEmptyIllustration() {
  return (
    <svg viewBox="0 0 118 62" className="mx-auto mb-2.5 h-[54px] w-[104px]" fill="none" aria-hidden>
      <path
        d="M18 49.5H100"
        stroke="rgb(52,155,172)"
        strokeOpacity="0.12"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <rect x="34" y="12" width="38" height="42" rx="7" fill="rgb(52,155,172)" fillOpacity="0.08" />
      <path
        d="M46 22H61M46 31H65M46 40H58"
        stroke="rgb(52,155,172)"
        strokeOpacity="0.42"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M66 13V24H77"
        stroke="rgb(52,155,172)"
        strokeOpacity="0.24"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="79" cy="41" r="12" fill="#F7FBFC" stroke="rgb(52,155,172)" strokeOpacity="0.22" />
      <path
        d="M79 34.5V41L83.5 43.5"
        stroke="rgb(52,155,172)"
        strokeOpacity="0.5"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="29" cy="21" r="4" fill="rgb(52,155,172)" fillOpacity="0.12" />
      <circle cx="91" cy="19" r="5" fill="rgb(52,155,172)" fillOpacity="0.08" />
    </svg>
  );
}

function RecentAccessListGroup({
  group,
  onOpen,
}: {
  group: ReturnType<typeof groupRecentAccessFiles>[number];
  onOpen: (file: KnowledgeFile) => void;
}) {
  return (
    <section className="space-y-1">
      <div className="flex items-center gap-2 px-2 py-1.5">
        <span className="h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_0_4px_rgba(52,155,172,0.1)]" />
        <h2 className="text-[13px] font-normal text-[#203A43]">{group.label}</h2>
        <span className="rounded-full bg-[#EEF6F8] px-2 py-0.5 text-[11px] font-normal text-[#6B7F88]">
          {group.items.length} 项
        </span>
      </div>

      {group.items.length === 0 ? (
        <div className="px-1">
          <RecentAccessEmptyGroup label={group.label} />
        </div>
      ) : (
        <div className="space-y-0.5">
          {group.items.map((item) => (
            <RecentAccessListItem
              key={item.file.id}
              file={item.file}
              accessTime={item.accessTime}
              tags={item.tags}
              onOpen={() => onOpen(item.file)}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function RecentAccessLoadState({
  visibleCount,
  totalCount,
  hasMore,
}: {
  visibleCount: number;
  totalCount: number;
  hasMore: boolean;
}) {
  return (
    <div className="py-2 text-center text-[12px] text-[#7C8D95]">
      {hasMore ? (
        <span>继续向下滚动，加载更多访问记录</span>
      ) : (
        <span>
          已显示全部 {totalCount} 项访问记录
          {visibleCount < totalCount ? `，当前 ${visibleCount} 项` : ""}
        </span>
      )}
    </div>
  );
}

function RecentAccessListItem({
  file,
  accessTime,
  tags,
  onOpen,
}: {
  file: KnowledgeFile;
  accessTime: string;
  tags: string[];
  onOpen: () => void;
}) {
  const sourceName = file.knowledgeBaseName ?? "个人知识库";
  const displayName = stripFileExtension(file.name);

  return (
    <article className="group rounded-[8px] transition-colors hover:bg-[#F6FBFC]">
      <button
        type="button"
        onClick={onOpen}
        className="grid min-h-[50px] w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2.5 px-3 py-1.5 text-left"
      >
        <KbFileTypeIcon type={file.type} fileName={file.name} size="sm" />
        <div className="min-w-0">
          <div className="flex min-w-0 items-center gap-1.5 overflow-hidden">
            <h3 className="truncate text-[13px] font-normal text-[#102A33]">{displayName}</h3>
            {tags.map((tag) => (
              <RecentAccessTag key={tag}>{tag}</RecentAccessTag>
            ))}
          </div>
          <div className="mt-0.5 truncate text-[12px] text-[#6B7F88]">来源知识库：{sourceName}</div>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <span className="whitespace-nowrap text-[12px] text-[#7C8D95]">
            最近访问
            <span className="ml-1.5 font-medium text-[#334E59]">{accessTime}</span>
          </span>
          <span className="inline-flex h-7 items-center gap-1 rounded-[7px] border border-primary/25 bg-primary-soft/55 px-2 text-[12px] font-normal text-primary transition-colors group-hover:bg-primary group-hover:text-white">
            <Eye className="h-3 w-3 stroke-[1.8]" />
            访问
          </span>
        </div>
      </button>
    </article>
  );
}

function stripFileExtension(name: string) {
  return name.replace(/\.[^.]+$/, "");
}

function RecentAccessTag({ children }: { children: string }) {
  return (
    <span className="inline-flex h-[18px] shrink-0 items-center rounded-[4px] border border-[#DCEBED] bg-[#F7FAFB] px-1.5 text-[10px] font-normal text-[#6B7F88]">
      {children}
    </span>
  );
}

function groupRecentAccessFiles(files: KnowledgeFile[]) {
  const groups: Array<{
    label: string;
    items: Array<{ file: KnowledgeFile; accessTime: string; tags: string[] }>;
  }> = [
    { label: "今天", items: [] },
    { label: "本周", items: [] },
    { label: "更早", items: [] },
  ];

  files.forEach((file, index) => {
    const group = index < 4 ? groups[0] : index < 6 ? groups[1] : groups[2];
    group.items.push({
      file,
      accessTime: formatAccessTime(file.updatedAt, index),
      tags: (file.tags ?? []).slice(0, 2),
    });
  });

  return groups;
}

function FavoriteKnowledgePanel({
  files,
  refreshSeed,
  onRefresh,
  onOpen,
}: {
  files: KnowledgeFile[];
  refreshSeed: number;
  onRefresh: () => void;
  onOpen: (file: KnowledgeFile) => void;
}) {
  const [query, setQuery] = useState("");
  const [searchMode, setSearchMode] = useState<FileSearchMode>("filename");
  const [categoryId, setCategoryId] = useState("all");
  const [sortBy, setSortBy] = useState<KnowledgeSortBy>("updated");
  const [viewMode, setViewMode] = useState<FileViewMode>("list");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(TABLE_PAGE_SIZE_DEFAULT);

  const categoryOptions = useMemo(
    () => [{ value: "all", label: "全部分类" }, ...listCategoryPathOptions()],
    [refreshSeed],
  );
  const filteredFiles = useMemo(
    () =>
      sortKnowledgeFiles(
        filterFiles(files, {
          query,
          searchMode,
          categoryId: categoryId === "all" ? undefined : categoryId,
        }),
        sortBy,
      ),
    [files, query, searchMode, categoryId, sortBy],
  );
  const effectivePageSize = viewMode === "card" ? CARD_PAGE_SIZE : pageSize;
  const totalPages = Math.max(1, Math.ceil(filteredFiles.length / effectivePageSize) || 1);
  const safePage = Math.min(page, totalPages);
  const pagedFiles = useMemo(() => {
    const start = (safePage - 1) * effectivePageSize;
    return filteredFiles.slice(start, start + effectivePageSize);
  }, [effectivePageSize, filteredFiles, safePage]);

  useEffect(() => {
    setPage(1);
  }, [query, searchMode, categoryId, sortBy, viewMode]);

  const empty = (
    <KbEmptyState
      title="暂无收藏文件"
      description="在文件详情页收藏后，文件会显示在这里。"
    />
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-white">
      <div className="min-h-0 flex-1 overflow-y-auto scrollbar-thin p-4">
        <section className="overflow-hidden rounded-[12px] border border-[#DCEBED] bg-white/95 shadow-[0_8px_24px_rgba(31,52,64,0.025)]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E8F0F2] px-5 py-4">
            <div>
              <h2 className="text-[16px] font-semibold text-[#102A33]">我的收藏</h2>
              <p className="mt-0.5 text-[12px] text-[#6B7F88]">
                集中管理已收藏的文件，方便再次查看与检索。
              </p>
            </div>
            <div className="text-[12px] text-[#6B7F88]">
              共 <span className="font-semibold tabular-nums text-[#102A33]">{filteredFiles.length}</span> 个文件
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 border-b border-[#E8F0F2] bg-[#FAFCFD] px-4 py-3">
            <KbFileSearchInput
              value={query}
              onChange={setQuery}
              mode={searchMode}
              onModeChange={setSearchMode}
              className="max-w-[360px]"
            />
            <KbFilterSelect
              value={categoryId}
              onChange={setCategoryId}
              options={categoryOptions}
              placeholder="全部分类"
            />
            <div className="ml-auto flex shrink-0 items-center gap-2">
              <FileListToolbarActions
                viewMode={viewMode}
                onViewModeChange={setViewMode}
                sortBy={sortBy}
                onSortChange={setSortBy}
                onRefresh={() => {
                  setPage(1);
                  onRefresh();
                }}
              />
            </div>
          </div>

          <div key={refreshSeed} className="min-h-0 overflow-x-auto">
            {viewMode === "list" ? (
              <FavoriteFilesTable files={pagedFiles} onOpen={onOpen} empty={empty} />
            ) : (
              <KnowledgeFileCardGrid files={pagedFiles} onOpen={onOpen} empty={empty} />
            )}
          </div>
        </section>
      </div>

      {filteredFiles.length > 0 &&
        (viewMode === "list" ? (
          <TableListPager
            page={safePage}
            totalPages={totalPages}
            totalItems={filteredFiles.length}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        ) : (
          <div className="border-t border-divider px-4 py-2">
            <CardBatchPager
              page={safePage}
              totalPages={totalPages}
              totalItems={filteredFiles.length}
              pageSize={CARD_PAGE_SIZE}
              unitLabel="个文件"
              onPageChange={setPage}
              compact
            />
          </div>
        ))}
    </div>
  );
}

const FAVORITE_FILE_GRID =
  "grid-cols-[minmax(240px,1.5fr)_88px_minmax(150px,0.9fr)_130px_100px_84px] min-w-[900px]";

function FavoriteFilesTable({
  files,
  onOpen,
  empty,
}: {
  files: KnowledgeFile[];
  onOpen: (file: KnowledgeFile) => void;
  empty: ReactNode;
}) {
  if (files.length === 0) return <>{empty}</>;

  return (
    <KbDataTable
      variant="flat"
      minWidth={FAVORITE_FILE_GRID}
      className="border-0 shadow-none"
      header={
        <>
          <span>文件信息</span>
          <span>类型</span>
          <span>所属知识库</span>
          <span>最近更新</span>
          <span>上传人</span>
          <span className="text-right">操作</span>
        </>
      }
    >
      {files.map((file) => {
        const type = kbFileTypeConfig[file.type ?? "other"];
        return (
          <KbDataTableRow key={file.id} variant="flat" className={FAVORITE_FILE_GRID} onClick={() => onOpen(file)}>
            <KbTableCellFile name={file.name} type={file.type ?? "other"} size="sm" nameWeight="normal" />
            <span className="text-kb-muted">{type.label}</span>
            <span className="truncate text-kb-muted">{file.knowledgeBaseName ?? "个人知识库"}</span>
            <span className="truncate tabular-nums text-kb-muted">{file.updatedAt ?? "-"}</span>
            <span className="truncate text-kb-muted">{file.uploaderName ?? "-"}</span>
            <span className="flex justify-end" onClick={(event) => event.stopPropagation()}>
              <button
                type="button"
                onClick={() => onOpen(file)}
                className="inline-flex items-center gap-1 rounded-[6px] px-2 py-1 text-[12px] text-primary transition-colors hover:bg-primary-soft/40"
              >
                <Eye className="h-3.5 w-3.5 stroke-[1.8]" />
                查看
              </button>
            </span>
          </KbDataTableRow>
        );
      })}
    </KbDataTable>
  );
}

type MetricTone = "primary" | "blue" | "violet" | "success" | "warning" | "danger";

const recentOverviewTintStyles = [
  "bg-white",
  "bg-primary-soft/20 border-primary/12",
  "bg-white",
  "bg-primary-soft/15 border-primary/10",
] as const;

const recentOverviewValueStyles: Record<MetricTone, string> = {
  primary: "text-primary",
  blue: "text-primary",
  violet: "text-primary",
  success: "text-emerald-700",
  warning: "text-orange-700",
  danger: "text-red-600",
};

function RecentOverviewMetricCard({
  label,
  value,
  desc,
  detail,
  icon: Icon,
  tint = 0,
  tone = "primary",
}: {
  label: string;
  value: number | string;
  desc?: string;
  detail?: string;
  icon: LucideIcon;
  tint?: number;
  tone?: MetricTone;
}) {
  return (
    <article
      className={cn(
        "relative overflow-hidden rounded-2xl border border-[#D4E8EC] bg-white p-0 text-left shadow-[var(--shadow-card)] transition-colors duration-200 hover:border-primary/30",
        recentOverviewTintStyles[tint % recentOverviewTintStyles.length],
      )}
    >
      <StatCardDecor />
      <div className="relative p-4">
        <div className="flex items-start gap-3">
          <StatIconFrame icon={<Icon className="h-[18px] w-[18px]" />} size="sm" />
          <div className="min-w-0 flex-1">
            <div className="text-[12px] font-medium tracking-wide text-[#5E737C]">{label}</div>
            <div
              className={cn(
                "mt-1.5 text-[26px] font-bold leading-none tracking-tight tabular-nums",
                recentOverviewValueStyles[tone],
              )}
            >
              {value}
            </div>
            {desc && <div className="mt-1 text-[11.5px] text-[#5E737C]">{desc}</div>}
          </div>
        </div>
        {detail && (
          <div className="mt-3 flex items-center gap-2 border-t border-[#DCEBED] pt-2.5">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary/70" aria-hidden />
            <span className="min-w-0 flex-1 truncate text-[11.5px] text-[#5E737C]">{detail}</span>
          </div>
        )}
      </div>
    </article>
  );
}

function SortSelectButton({
  value,
  onChange,
  triggerLabel,
}: {
  value: KnowledgeSortBy;
  onChange: (value: KnowledgeSortBy) => void;
  triggerLabel?: string;
}) {
  const selected =
    mySpaceSortOptions.find((option) => option.value === value) ?? mySpaceSortOptions[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="inline-flex h-10 items-center gap-2 rounded-[8px] border border-[#DCEBED] bg-white px-3 text-[13px] font-medium text-[#334E59] shadow-[0_4px_10px_rgba(31,52,64,0.03)] transition-colors hover:border-primary/35 hover:text-primary"
        >
          <ArrowUpDown className="h-4 w-4 stroke-[1.8]" />
          <span>{triggerLabel ?? selected.label}</span>
          <ChevronDown className="h-3.5 w-3.5 stroke-[1.8] text-[#7C8D95]" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-36 rounded-[10px] border-[#DCEBED]">
        <DropdownMenuRadioGroup
          value={value}
          onValueChange={(nextValue) => onChange(nextValue as KnowledgeSortBy)}
        >
          {mySpaceSortOptions.map((option) => (
            <DropdownMenuRadioItem key={option.value} value={option.value} className="text-[13px]">
              {option.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function PanelActionButton({
  icon: Icon,
  label,
  onClick,
  compact,
}: {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  compact?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex h-10 items-center gap-2 rounded-[8px] border border-[#DCEBED] bg-white px-3 text-[13px] font-medium text-[#334E59] shadow-[0_4px_10px_rgba(31,52,64,0.03)] transition-colors hover:border-primary/35 hover:text-primary",
        compact && "h-9 px-2.5 text-[12px]",
      )}
    >
      <Icon className="h-4 w-4 stroke-[1.8]" />
      <span>{label}</span>
    </button>
  );
}

function SegmentedFilterTabs({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <div className="inline-flex shrink-0 items-center rounded-full border border-[#E2E8EF] bg-white p-1">
      {options.map((option) => {
        const selected = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(option.value)}
            className={cn(
              "rounded-full px-4 py-1.5 text-[13px] font-medium transition-colors",
              selected ? "bg-[#E8F6F8] text-primary" : "text-[#6B7F88] hover:text-primary",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

function formatAccessTime(value: string | undefined, index: number) {
  const fallbackTimes = ["09:15", "08:36", "07:42", "07:11", "07-04 16:48", "07-02 13:08"];
  const time = value?.match(/\d{2}:\d{2}/)?.[0] ?? fallbackTimes[index] ?? "刚刚";

  if (index < 4) {
    return `今天 ${time}`;
  }

  return (
    value
      ?.replace(/^\d{4}-/, "")
      .slice(0, 11)
      .trim() ??
    fallbackTimes[index] ??
    time
  );
}

function PersonalAllPanel({
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
  batchToolbarProps,
  fileRowActions,
}: {
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
  selection: ReturnType<typeof useFileSelection>;
  batchToolbarProps: (
    pageIds: string[],
    totalCount: number,
    showDisable?: boolean,
  ) => ComponentProps<typeof FileListToolbar>;
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

  const pageFileIds = pagedFiles.map((file) => file.id);
  const listSelection = {
    isSelected: selection.isSelected,
    onToggle: selection.toggle,
    onToggleAll: selection.toggleAll,
    pageIds: pageFileIds,
  };
  const cardSelection = {
    isSelected: selection.isSelected,
    onToggle: selection.toggle,
  };

  const empty = (
    <KbEmptyState title="个人库暂无文件" description="当前个人知识库下还没有可查看的文件。" />
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <KnowledgeAggregateDetailHeader
        fileCount={files.length}
        description="汇总展示个人知识库中有权访问的全部文件。"
        scopeLabel="个人知识库"
        breadcrumb={{
          label: "我的空间",
          icon: UserRound,
          ariaLabel: "我的空间路径",
        }}
        onNavigateRoot={onNavigateRoot}
      />

      <FileListToolbar
        {...batchToolbarProps(pageFileIds, files.length, showManageColumn)}
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
            onOpen={onOpen}
            showLibrary
            overviewMode
            showManageColumn={showManageColumn}
            selection={listSelection}
            onToggleEnabled={onToggleEnabled}
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
            onPageSizeChange={onPageSizeChange}
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

function PersonalBasePanel({
  base,
  files,
  query,
  searchMode,
  metadataFilters,
  sortBy,
  viewMode,
  page,
  pageSize,
  refreshSeed,
  onQueryChange,
  onSearchModeChange,
  onMetadataFiltersChange,
  onSortChange,
  onViewModeChange,
  onPageChange,
  onPageSizeChange,
  onRefresh,
  onOpen,
  onUploadFiles,
  onSelectBase,
  onToggleEnabled,
  selection,
  batchToolbarProps,
  fileRowActions,
}: {
  base: KnowledgeBase;
  files: KnowledgeFile[];
  query: string;
  searchMode: FileSearchMode;
  metadataFilters: Record<string, string>;
  sortBy: KnowledgeSortBy;
  viewMode: FileViewMode;
  page: number;
  pageSize: number;
  refreshSeed: number;
  onQueryChange: (value: string) => void;
  onSearchModeChange: (mode: FileSearchMode) => void;
  onMetadataFiltersChange: (value: Record<string, string>) => void;
  onSortChange: (value: KnowledgeSortBy) => void;
  onViewModeChange: (mode: FileViewMode) => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onRefresh: () => void;
  onOpen: (file: KnowledgeFile) => void;
  onUploadFiles: (files: FileList) => void;
  onSelectBase: (baseId: string) => void;
  onToggleEnabled: (file: KnowledgeFile, enabled: boolean) => void;
  selection: ReturnType<typeof useFileSelection>;
  batchToolbarProps: (
    pageIds: string[],
    totalCount: number,
    showDisable?: boolean,
  ) => ComponentProps<typeof FileListToolbar>;
  fileRowActions: {
    onMove?: (file: KnowledgeFile) => void;
    onTogglePin: (file: KnowledgeFile) => void;
    onViewHistory: (file: KnowledgeFile) => void;
  };
}) {
  const allFiles = getFilesForBase(base.id);
  const metadataFields = getMetadataFieldsForBase(base.id);

  const effectivePageSize = viewMode === "card" ? CARD_PAGE_SIZE : pageSize;
  const totalPages = Math.max(1, Math.ceil(files.length / effectivePageSize) || 1);
  const safePage = Math.min(page, totalPages);
  const pagedFiles = useMemo(() => {
    const start = (safePage - 1) * effectivePageSize;
    return files.slice(start, start + effectivePageSize);
  }, [effectivePageSize, files, safePage]);

  const pageFileIds = pagedFiles.map((file) => file.id);
  const listSelection = {
    isSelected: selection.isSelected,
    onToggle: selection.toggle,
    onToggleAll: selection.toggleAll,
    pageIds: pageFileIds,
  };
  const cardSelection = {
    isSelected: selection.isSelected,
    onToggle: selection.toggle,
  };

  const empty = (
    <KbEmptyState title="个人库暂无文件" description="可拖拽上传，上传后直接进入解析流程。" />
  );

  return (
    <KbDragUploadOverlay onFiles={onUploadFiles} className="flex min-h-0 flex-1 flex-col">
      <KnowledgeBaseDetailHeader
        base={base}
        fileCount={allFiles.length}
        onSelectBase={onSelectBase}
      />

      <FileListToolbar
        {...batchToolbarProps(pageFileIds, files.length, canManageFileList(base))}
        left={
          <>
            <KbFileSearchInput
              value={query}
              onChange={onQueryChange}
              mode={searchMode}
              onModeChange={onSearchModeChange}
            />
            <KbMetadataFilter
              fields={metadataFields}
              files={allFiles}
              value={metadataFilters}
              onChange={onMetadataFiltersChange}
            />
          </>
        }
        right={
          <FileListToolbarActions
            viewMode={viewMode}
            onViewModeChange={onViewModeChange}
            sortBy={sortBy}
            onSortChange={onSortChange}
            onRefresh={onRefresh}
            onUpload={() => toast.message("打开上传面板")}
          />
        }
      />

      <div key={refreshSeed} className="min-h-0 flex-1 overflow-y-auto">
        {viewMode === "list" ? (
          <KnowledgeFileTable
            files={pagedFiles}
            onOpen={onOpen}
            showLibrary={false}
            overviewMode
            showManageColumn={canManageFileList(base)}
            selection={listSelection}
            onToggleEnabled={onToggleEnabled}
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
            onPageSizeChange={onPageSizeChange}
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
    </KbDragUploadOverlay>
  );
}

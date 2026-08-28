import { useRouter } from "@tanstack/react-router";
import { CheckCircle2, Database } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  CardBatchPager,
  StatIconFrame,
  TABLE_PAGE_SIZE_DEFAULT,
  TableListPager,
  Tag,
} from "@/components/learning/ui";
import { toast } from "sonner";
import { KbEmptyState, KbFileSearchInput, KbFilterCombo } from "@/components/knowledge/ui";
import { KNOWLEDGE_BASES, KNOWLEDGE_CATEGORIES } from "@/lib/knowledge/data";
import {
  canManageFileList,
  filterFiles,
  getAllPublishedFiles,
  getBaseById,
  isSubmitToPublicMove,
  sortKnowledgeFiles,
} from "@/lib/knowledge/model";
import { removeStoreFiles, submitStoreFileMove, updateStoreFile } from "@/lib/knowledge/store";
import { kbMainPanel } from "@/lib/knowledge/tokens";
import { openFileDetailInNewTab } from "@/lib/knowledge/searchNav";
import type { FileSearchMode, KnowledgeFile, KnowledgeSortBy } from "@/lib/knowledge/types";
import { cn } from "@/lib/utils";
import { FullTextSearchResultPanel } from "./FullTextSearchResultPanel";
import { FileListToolbar } from "./FileListToolbar";
import { FileBatchDeleteDialog } from "./FileBatchDeleteDialog";
import { FileMoveDialog } from "./FileMoveDialog";
import { FileVersionHistoryDialog } from "./FileVersionHistoryDialog";
import {
  FileListToolbarActions,
  KnowledgeFileCardGrid,
  KnowledgeFileTable,
} from "./KnowledgeFileTable";
import { useFileSelection } from "./useFileSelection";
import { useFileViewMode } from "./useFileViewMode";

const CARD_PAGE_SIZE = 16;

export function AllKnowledgeFilesPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [searchMode, setSearchMode] = useState<FileSearchMode>("filename");
  const [categoryId, setCategoryId] = useState("all");
  const [baseId, setBaseId] = useState("all");
  const [sortBy, setSortBy] = useState<KnowledgeSortBy>("updated");
  const [viewMode, setViewMode] = useFileViewMode();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(TABLE_PAGE_SIZE_DEFAULT);
  const [refreshSeed, setRefreshSeed] = useState(0);
  const [batchLoading, setBatchLoading] = useState<
    "download" | "disable" | "delete" | "move" | null
  >(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [moveFiles, setMoveFiles] = useState<KnowledgeFile[]>([]);
  const [moveLoading, setMoveLoading] = useState(false);
  const [historyFile, setHistoryFile] = useState<KnowledgeFile | null>(null);
  const fileSelection = useFileSelection();
  const showManageColumn = canManageFileList();
  const isFullTextSearchActive = searchMode === "fulltext" && query.trim().length > 0;

  const allFiles = useMemo(() => getAllPublishedFiles(), [refreshSeed]);
  const files = useMemo(
    () =>
      sortKnowledgeFiles(
        filterFiles(allFiles, {
          query,
          searchMode,
          categoryId: categoryId === "all" ? undefined : categoryId,
          baseId: baseId === "all" ? undefined : baseId,
        }),
        sortBy,
      ),
    [allFiles, baseId, categoryId, query, searchMode, sortBy],
  );

  useEffect(() => {
    setPage(1);
  }, [query, searchMode, categoryId, baseId, sortBy, viewMode]);

  useEffect(() => {
    fileSelection.clear();
  }, [query, searchMode, categoryId, baseId, sortBy, viewMode]);

  const effectivePageSize = viewMode === "card" ? CARD_PAGE_SIZE : pageSize;
  const totalPages = Math.max(1, Math.ceil(files.length / effectivePageSize) || 1);
  const safePage = Math.min(page, totalPages);
  const pagedFiles = useMemo(() => {
    const start = (safePage - 1) * effectivePageSize;
    return files.slice(start, start + effectivePageSize);
  }, [effectivePageSize, files, safePage]);

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

  const handleOpen = (file: KnowledgeFile) => {
    openFileDetailInNewTab(router, file, { query, searchMode, resultFiles: files });
  };

  const handleRefresh = () => {
    setPage(1);
    setRefreshSeed((v) => v + 1);
    toast.message("列表已刷新");
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

  const handleConfirmMove = (
    movingFiles: KnowledgeFile[],
    targetBaseId: string,
    targetDirectoryId: string | undefined,
    keepSource: boolean,
  ) => {
    const targetBase = getBaseById(targetBaseId);
    if (!targetBase) {
      toast.error("目标知识库不存在");
      return;
    }
    const toSubmit = movingFiles.filter((file) =>
      isSubmitToPublicMove(file.knowledgeBaseId, targetBaseId),
    );
    const movable = movingFiles.filter(
      (file) => !isSubmitToPublicMove(file.knowledgeBaseId, targetBaseId),
    );
    setMoveLoading(true);
    for (const file of toSubmit) {
      submitStoreFileMove(file, targetBase, keepSource, targetDirectoryId);
    }
    for (const file of movable) {
      updateStoreFile(file.id, {
        knowledgeBaseId: targetBaseId,
        knowledgeBaseName: targetBase.name,
        directoryId: targetDirectoryId,
      });
    }
    window.setTimeout(() => {
      if (toSubmit.length > 0) {
        toast.success(
          `已提交「${toSubmit[0]?.name}」移入「${targetBase.name}」的申请，请等待管理员审批`,
        );
      } else {
        toast.success(`已将「${movingFiles[0]?.name}」移动到「${targetBase.name}」`);
      }
      setMoveLoading(false);
      setMoveFiles([]);
      fileSelection.clear();
    }, 300);
  };

  const handleBatchMove = () => {
    const ids = [...fileSelection.selectedArray];
    const movingFiles = ids
      .map((id) => files.find((file) => file.id === id))
      .filter((file): file is KnowledgeFile => Boolean(file));
    setMoveFiles(movingFiles);
  };

  const fileRowActions = {
    ...(showManageColumn ? { onMove: (file: KnowledgeFile) => setMoveFiles([file]) } : {}),
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
      setRefreshSeed((v) => v + 1);
    }, 300);
  };

  const emptyState = (
    <KbEmptyState
      title="没有匹配的资料"
      description="全库资料只展示当前有权访问的已发布文档。可以调整筛选条件后再试。"
    />
  );

  return (
    <main className={cn("scrollbar-thin", kbMainPanel)}>
      <section className="shrink-0 border-b border-divider px-4 py-3">
        <div className="flex min-w-0 items-start gap-3">
          <StatIconFrame icon={<Database className="stroke-[1.8]" />} size="sm" />
          <div className="min-w-0">
            <h1 className="text-[20px] font-semibold tracking-tight text-foreground">全库资料</h1>
            <p className="mt-1 text-[12.5px] text-muted-foreground">
              当前展示有权限访问且已发布的文档。
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Tag variant="primary" className="h-6 gap-1 rounded-[6px] px-2.5 text-[11px]">
                <CheckCircle2 className="h-3 w-3 stroke-[1.9]" />
                全部可访问资料
              </Tag>
              <Tag variant="outline" className="h-6 rounded-[6px] px-2.5 text-[11px]">
                共 {files.length} 篇
              </Tag>
            </div>
          </div>
        </div>
      </section>

      <FileListToolbar
        selectedCount={fileSelection.selectedCount}
        totalCount={files.length}
        pageFileCount={pageFileIds.length}
        isAllResultsSelected={fileSelection.isAllResultsSelected}
        onSelectAllResults={() => fileSelection.selectAllResults(files.map((file) => file.id))}
        onBatchDownload={handleBatchDownload}
        onBatchDisable={showManageColumn ? handleBatchDisable : undefined}
        onBatchDelete={() => setDeleteDialogOpen(true)}
        onClearSelection={fileSelection.clear}
        showBatchMove={false}
        showBatchDisable={showManageColumn}
        batchLoading={batchLoading}
        left={
          <>
            <KbFileSearchInput
              value={query}
              onChange={setQuery}
              mode={searchMode}
              onModeChange={setSearchMode}
            />
            <KbFilterCombo
              value={categoryId}
              onChange={setCategoryId}
              placeholder="全部分类"
              options={[
                { value: "all", label: "全部分类" },
                ...KNOWLEDGE_CATEGORIES.map((item) => ({
                  value: item.id,
                  label: item.name,
                })),
              ]}
            />
            <KbFilterCombo
              value={baseId}
              onChange={setBaseId}
              placeholder="全部知识库"
              options={[
                { value: "all", label: "全部知识库" },
                ...KNOWLEDGE_BASES.filter((base) => base.permission.canView).map((base) => ({
                  value: base.id,
                  label: base.name,
                })),
              ]}
            />
          </>
        }
        right={
          <>
            <span className="text-[12px] text-muted-foreground">共 {files.length} 篇</span>
            <FileListToolbarActions
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              sortBy={sortBy}
              onSortChange={setSortBy}
              onRefresh={handleRefresh}
              showViewModeToggle={!isFullTextSearchActive}
            />
          </>
        }
      />

      {isFullTextSearchActive ? (
        <FullTextSearchResultPanel
          files={files}
          query={query}
          showLibrary
          onToggleEnabled={handleToggleEnabled}
        />
      ) : (
        <div key={refreshSeed} className="min-h-0 flex-1 overflow-y-auto">
          {viewMode === "list" ? (
            <KnowledgeFileTable
              files={pagedFiles}
              allLibraryMode
              showManageColumn={showManageColumn}
              selection={listSelection}
              onToggleEnabled={handleToggleEnabled}
              onOpen={handleOpen}
              className="rounded-none border-0 shadow-none"
              empty={<div className="px-4 py-8">{emptyState}</div>}
              {...fileRowActions}
            />
          ) : (
            <KnowledgeFileCardGrid
              files={pagedFiles}
              selection={cardSelection}
              onOpen={handleOpen}
              columns={4}
              compact
              empty={<div className="px-4 py-8">{emptyState}</div>}
              {...fileRowActions}
            />
          )}
        </div>
      )}

      {!isFullTextSearchActive &&
        files.length > 0 &&
        (viewMode === "list" ? (
          <TableListPager
            page={safePage}
            totalPages={totalPages}
            totalItems={files.length}
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
              totalItems={files.length}
              pageSize={CARD_PAGE_SIZE}
              unitLabel="篇资料"
              onPageChange={setPage}
              compact
            />
          </div>
        ))}
      <FileBatchDeleteDialog
        open={deleteDialogOpen}
        count={fileSelection.selectedCount}
        loading={batchLoading === "delete"}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleConfirmBatchDelete}
      />
      <FileMoveDialog
        files={moveFiles}
        loading={moveLoading}
        onClose={() => setMoveFiles([])}
        onConfirm={handleConfirmMove}
      />
      <FileVersionHistoryDialog file={historyFile} onClose={() => setHistoryFile(null)} />
    </main>
  );
}

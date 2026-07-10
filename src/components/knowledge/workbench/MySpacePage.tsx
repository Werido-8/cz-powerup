import { useNavigate } from "@tanstack/react-router";
import {
  Clock3,
  Heart,
  Layers,
  Upload,
  UploadCloud,
} from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";
import {
  ActionButton,
  CardBatchPager,
  TABLE_PAGE_SIZE_DEFAULT,
  TableListPager,
} from "@/components/learning/ui";
import {
  KbButton,
  KbDataTable,
  KbDataTableRow,
  KbDragUploadOverlay,
  KbEmptyState,
  KbFilterBar,
  KbFilterCombo,
  KbSegmentControl,
  KbSidebar,
  KbSidebarSection,
  KbStatusTag,
  KbTableCellFile,
} from "@/components/knowledge/ui";
import { KNOWLEDGE_BASES, UPLOAD_RECORDS } from "@/lib/knowledge/data";
import {
  filterFiles,
  getAllTags,
  getFavoriteFiles,
  getFilesForBase,
  getFilesForPersonalTree,
  getPersonalBases,
  getProfessionalTypes,
  getRecentFiles,
  PERSONAL_TREE_ALL_ID,
  sortKnowledgeFiles,
} from "@/lib/knowledge/model";
import { publishStatusLabel, publishStatusTone } from "@/lib/knowledge/status";
import { kbMainPanel } from "@/lib/knowledge/tokens";
import type {
  KnowledgeBase,
  KnowledgeFile,
  KnowledgeSortBy,
  UploadRecord,
} from "@/lib/knowledge/types";
import { cn } from "@/lib/utils";
import {
  FileListRefreshButton,
  FileListSortButton,
  FileViewModeToggle,
  KnowledgeFileCardGrid,
  KnowledgeFileTable,
  type FileViewMode,
} from "./KnowledgeFileTable";
import { KnowledgeBaseDetailHeader } from "./KnowledgeBaseDetailHeader";
import { KnowledgeTreeNavItem } from "./KnowledgeCategoryTree";
import { KnowledgeSectionDetailHeader } from "./KnowledgeSectionDetailHeader";
import { KnowledgeSidebarQuickLinks } from "./KnowledgeSidebarQuickLinks";
import { KnowledgeTreeSectionActions } from "./KnowledgeTreeSectionActions";
import { MySpaceTitleBanner } from "./MySpaceTitleBanner";
import { PersonalDirectoryTree } from "./PersonalDirectoryTree";

type MySpaceSelection =
  | { kind: "recent" }
  | { kind: "uploads" }
  | { kind: "favorites" }
  | { kind: "personalAll" }
  | { kind: "personalBase"; baseId: string };

const CARD_PAGE_SIZE = 8;

const uploadStatusOptions: Array<{ value: string; label: string }> = [
  { value: "all", label: "全部" },
  { value: "pendingApproval", label: publishStatusLabel("pendingApproval") },
  { value: "rejected", label: publishStatusLabel("rejected") },
  { value: "parsing", label: publishStatusLabel("parsing") },
  { value: "parseFailed", label: publishStatusLabel("parseFailed") },
  { value: "published", label: publishStatusLabel("published") },
  { value: "archived", label: publishStatusLabel("archived") },
];

const UPLOAD_GRID =
  "grid-cols-[minmax(240px,1.4fr)_minmax(160px,1fr)_100px_130px_minmax(180px,1fr)] min-w-[900px]";

export function MySpacePage() {
  const navigate = useNavigate({ from: "/knowledge/mine" });
  const personalBases = useMemo(() => getPersonalBases(), []);
  const [selection, setSelection] = useState<MySpaceSelection>({ kind: "recent" });
  const [query, setQuery] = useState("");
  const [professionalType, setProfessionalType] = useState("all");
  const [tag, setTag] = useState("all");
  const [sortBy, setSortBy] = useState<KnowledgeSortBy>("updated");
  const [viewMode, setViewMode] = useState<FileViewMode>("list");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(TABLE_PAGE_SIZE_DEFAULT);
  const [refreshSeed, setRefreshSeed] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<string>("all");

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.location.hash === "#personal") {
      setSelection({ kind: "personalAll" });
    }
    if (window.location.hash === "#uploads") {
      setSelection({ kind: "uploads" });
    }
  }, []);

  useEffect(() => {
    setPage(1);
    setQuery("");
    setProfessionalType("all");
    setTag("all");
  }, [selection]);

  useEffect(() => {
    setPage(1);
  }, [query, professionalType, tag, sortBy, viewMode, uploadStatus]);

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

  const selectedBase =
    selection.kind === "personalBase"
      ? personalBases.find((base) => base.id === selection.baseId)
      : undefined;

  const personalAllFiles = useMemo(() => {
    return sortKnowledgeFiles(filterFiles(getFilesForPersonalTree(), { query }), sortBy);
  }, [query, sortBy]);

  const personalFiles = useMemo(() => {
    if (!selectedBase) return [];
    return sortKnowledgeFiles(
      filterFiles(getFilesForBase(selectedBase.id), {
        query,
        professionalType: professionalType === "all" ? undefined : professionalType,
        tag: tag === "all" ? undefined : tag,
      }),
      sortBy,
    );
  }, [selectedBase, query, professionalType, tag, sortBy]);

  const handleRefresh = () => {
    setPage(1);
    setRefreshSeed((v) => v + 1);
    toast.message("列表已刷新");
  };

  return (
    <>
      <KbSidebar
        width="browse"
        withDecor
        header={
          <>
            <MySpaceTitleBanner />
            <KnowledgeSidebarQuickLinks />
          </>
        }
      >
        <KbSidebarSection title="个人事务">
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
              onClick={() => setSelection({ kind: "uploads" })}
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
            <KnowledgeTreeSectionActions
              directoryLabel="新建个人目录"
              knowledgeBaseLabel="新建个人知识库"
              onAddDirectory={() => toast.success("已预留新建个人目录入口")}
              onAddKnowledgeBase={() => toast.success("已预留新建个人知识库入口")}
            />
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
            onSelectBase={(baseId) => {
              if (baseId === PERSONAL_TREE_ALL_ID) {
                setSelection({ kind: "personalAll" });
              } else {
                setSelection({ kind: "personalBase", baseId });
              }
            }}
          />
        </KbSidebarSection>
      </KbSidebar>

      <main className={cn("scrollbar-thin", kbMainPanel)}>
        {selection.kind === "recent" && (
          <FileListSection
            icon={<Clock3 className="stroke-[1.8]" />}
            title="最近访问"
            description="按最近打开顺序展示资料，便于继续阅读和追踪版本。"
            files={getRecentFiles()}
            showLibrary
            viewMode={viewMode}
            sortBy={sortBy}
            page={page}
            pageSize={pageSize}
            refreshSeed={refreshSeed}
            onViewModeChange={setViewMode}
            onSortChange={setSortBy}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            onRefresh={handleRefresh}
            onOpen={openFile}
            emptyTitle="暂无最近访问"
            emptyDescription="打开文件详情后会自动记录在这里。"
          />
        )}

        {selection.kind === "favorites" && (
          <FileListSection
            icon={<Heart className="stroke-[1.8]" />}
            title="我的收藏"
            description="收藏文件可跨知识库聚合查看，后续可同步到学习计划。"
            files={getFavoriteFiles()}
            showLibrary
            viewMode={viewMode}
            sortBy={sortBy}
            page={page}
            pageSize={pageSize}
            refreshSeed={refreshSeed}
            onViewModeChange={setViewMode}
            onSortChange={setSortBy}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            onRefresh={handleRefresh}
            onOpen={openFile}
            emptyTitle="暂无收藏文件"
            emptyDescription="在文件详情页点击收藏后会出现在这里。"
          />
        )}

        {selection.kind === "uploads" && (
          <MyUploadPanel
            status={uploadStatus}
            onStatusChange={setUploadStatus}
            refreshSeed={refreshSeed}
            onRefresh={handleRefresh}
          />
        )}

        {selection.kind === "personalAll" && (
          <PersonalAllPanel
            files={personalAllFiles}
            query={query}
            sortBy={sortBy}
            viewMode={viewMode}
            page={page}
            pageSize={pageSize}
            refreshSeed={refreshSeed}
            onQueryChange={setQuery}
            onSortChange={setSortBy}
            onViewModeChange={setViewMode}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            onRefresh={handleRefresh}
            onOpen={openFile}
          />
        )}

        {selection.kind === "personalBase" && selectedBase && (
          <PersonalBasePanel
            base={selectedBase}
            files={personalFiles}
            query={query}
            professionalType={professionalType}
            tag={tag}
            sortBy={sortBy}
            viewMode={viewMode}
            page={page}
            pageSize={pageSize}
            refreshSeed={refreshSeed}
            onQueryChange={setQuery}
            onProfessionalTypeChange={setProfessionalType}
            onTagChange={setTag}
            onSortChange={setSortBy}
            onViewModeChange={setViewMode}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            onRefresh={handleRefresh}
            onOpen={openFile}
            onUploadFiles={handleUploadFiles}
            onSelectBase={(baseId) => setSelection({ kind: "personalBase", baseId })}
          />
        )}
      </main>
    </>
  );
}

function FileListSection({
  icon,
  title,
  description,
  files,
  showLibrary,
  viewMode,
  sortBy,
  page,
  pageSize,
  refreshSeed,
  onViewModeChange,
  onSortChange,
  onPageChange,
  onPageSizeChange,
  onRefresh,
  onOpen,
  emptyTitle,
  emptyDescription,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  files: KnowledgeFile[];
  showLibrary: boolean;
  viewMode: FileViewMode;
  sortBy: KnowledgeSortBy;
  page: number;
  pageSize: number;
  refreshSeed: number;
  onViewModeChange: (mode: FileViewMode) => void;
  onSortChange: (sort: KnowledgeSortBy) => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onRefresh: () => void;
  onOpen: (file: KnowledgeFile) => void;
  emptyTitle: string;
  emptyDescription: string;
}) {
  const sorted = useMemo(() => sortKnowledgeFiles(files, sortBy), [files, sortBy]);
  const effectivePageSize = viewMode === "card" ? CARD_PAGE_SIZE : pageSize;
  const totalPages = Math.max(1, Math.ceil(sorted.length / effectivePageSize) || 1);
  const safePage = Math.min(page, totalPages);
  const pagedFiles = useMemo(() => {
    const start = (safePage - 1) * effectivePageSize;
    return sorted.slice(start, start + effectivePageSize);
  }, [effectivePageSize, safePage, sorted]);

  const empty = <KbEmptyState title={emptyTitle} description={emptyDescription} />;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <KnowledgeSectionDetailHeader
        icon={icon}
        title={title}
        badge={`共 ${files.length} 篇`}
        description={description}
      />

      <div className="shrink-0 border-b border-divider bg-[#FAFCFD] px-4 py-2.5">
        <KbFilterBar
          className="mb-0"
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
            onOpen={onOpen}
            showLibrary={showLibrary}
            empty={empty}
          />
        ) : (
          <KnowledgeFileCardGrid files={pagedFiles} onOpen={onOpen} empty={empty} />
        )}
      </div>

      {sorted.length > 0 &&
        (viewMode === "list" ? (
          <TableListPager
            page={safePage}
            totalPages={totalPages}
            totalItems={sorted.length}
            pageSize={pageSize}
            onPageChange={onPageChange}
            onPageSizeChange={onPageSizeChange}
          />
        ) : (
          <div className="border-t border-divider px-4 py-2">
            <CardBatchPager
              page={safePage}
              totalPages={totalPages}
              totalItems={sorted.length}
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

function MyUploadPanel({
  status,
  onStatusChange,
  refreshSeed,
  onRefresh,
}: {
  status: string;
  onStatusChange: (status: string) => void;
  refreshSeed: number;
  onRefresh: () => void;
}) {
  const records = UPLOAD_RECORDS.filter(
    (record) => status === "all" || record.status === status,
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <KnowledgeSectionDetailHeader
        icon={<UploadCloud className="stroke-[1.8]" />}
        title="我的上传"
        badge={`共 ${records.length} 条记录`}
        description="跟踪上传后的审批、解析、驳回和发布状态。个人库上传免审批，公共和部门库按权限进入审批。"
      />

      <div className="shrink-0 border-b border-divider bg-[#FAFCFD] px-4 py-2.5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <KbSegmentControl
            value={status}
            onChange={onStatusChange}
            options={uploadStatusOptions}
          />
          <FileListRefreshButton onClick={onRefresh} />
        </div>
      </div>

      <div key={refreshSeed} className="min-h-0 flex-1 overflow-y-auto scrollbar-thin p-4">
        <KbDataTable
          minWidth={UPLOAD_GRID}
          header={
            <>
              <span>文件名</span>
              <span>目标知识库</span>
              <span>状态</span>
              <span>提交时间</span>
              <span>说明</span>
            </>
          }
          empty={
            <KbEmptyState
              title="暂无上传记录"
              description="上传文件后可在这里追踪审批与解析进度。"
            />
          }
        >
          {records.map((record) => (
            <UploadRecordRow key={record.id} record={record} />
          ))}
        </KbDataTable>
      </div>
    </div>
  );
}

function UploadRecordRow({ record }: { record: UploadRecord }) {
  return (
    <KbDataTableRow className={UPLOAD_GRID}>
      <KbTableCellFile name={record.fileName} type="pdf" />
      <span className="truncate text-kb-muted">{record.targetKnowledgeBaseName}</span>
      <span>
        <KbStatusTag tone={publishStatusTone(record.status)}>
          {publishStatusLabel(record.status)}
        </KbStatusTag>
      </span>
      <span className="text-kb-muted">{record.submittedAt}</span>
      <span className="truncate text-kb-muted">
        {record.rejectReason ??
          (record.status === "pendingApproval" ? "等待管理员处理" : "状态已同步")}
      </span>
    </KbDataTableRow>
  );
}

function PersonalAllPanel({
  files,
  query,
  sortBy,
  viewMode,
  page,
  pageSize,
  refreshSeed,
  onQueryChange,
  onSortChange,
  onViewModeChange,
  onPageChange,
  onPageSizeChange,
  onRefresh,
  onOpen,
}: {
  files: KnowledgeFile[];
  query: string;
  sortBy: KnowledgeSortBy;
  viewMode: FileViewMode;
  page: number;
  pageSize: number;
  refreshSeed: number;
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
      title="个人库暂无文件"
      description="当前个人知识库下还没有可查看的文件。"
    />
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <KnowledgeSectionDetailHeader
        icon={<Layers className="stroke-[1.8]" />}
        title="全部"
        badge={`共 ${files.length} 篇`}
        description="汇总展示个人知识库中有权访问的全部文件。"
      />

      <div className="shrink-0 border-b border-divider bg-[#FAFCFD] px-4 py-2.5">
        <KbFilterBar
          className="mb-0"
          searchValue={query}
          onSearchChange={onQueryChange}
          searchPlaceholder="搜索个人库文件"
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
            onOpen={onOpen}
            showLibrary
            overviewMode
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
  professionalType,
  tag,
  sortBy,
  viewMode,
  page,
  pageSize,
  refreshSeed,
  onQueryChange,
  onProfessionalTypeChange,
  onTagChange,
  onSortChange,
  onViewModeChange,
  onPageChange,
  onPageSizeChange,
  onRefresh,
  onOpen,
  onUploadFiles,
  onSelectBase,
}: {
  base: KnowledgeBase;
  files: KnowledgeFile[];
  query: string;
  professionalType: string;
  tag: string;
  sortBy: KnowledgeSortBy;
  viewMode: FileViewMode;
  page: number;
  pageSize: number;
  refreshSeed: number;
  onQueryChange: (value: string) => void;
  onProfessionalTypeChange: (value: string) => void;
  onTagChange: (value: string) => void;
  onSortChange: (value: KnowledgeSortBy) => void;
  onViewModeChange: (mode: FileViewMode) => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onRefresh: () => void;
  onOpen: (file: KnowledgeFile) => void;
  onUploadFiles: (files: FileList) => void;
  onSelectBase: (baseId: string) => void;
}) {
  const allFiles = getFilesForBase(base.id);
  const professionalTypes = getProfessionalTypes(allFiles);
  const tags = getAllTags(allFiles);
  const movableBases = KNOWLEDGE_BASES.filter(
    (item) => item.scope !== "personal" && item.status === "enabled" && item.permission.canUpload,
  );

  const effectivePageSize = viewMode === "card" ? CARD_PAGE_SIZE : pageSize;
  const totalPages = Math.max(1, Math.ceil(files.length / effectivePageSize) || 1);
  const safePage = Math.min(page, totalPages);
  const pagedFiles = useMemo(() => {
    const start = (safePage - 1) * effectivePageSize;
    return files.slice(start, start + effectivePageSize);
  }, [effectivePageSize, files, safePage]);

  const empty = (
    <KbEmptyState
      title="个人库暂无文件"
      description="可拖拽上传，上传后直接进入解析流程。"
    />
  );

  return (
    <KbDragUploadOverlay
      onFiles={onUploadFiles}
      className="flex min-h-0 flex-1 flex-col"
    >
      <KnowledgeBaseDetailHeader
        base={base}
        fileCount={allFiles.length}
        onSelectBase={onSelectBase}
        action={
          <KbButton
            variant="outline"
            size="sm"
            disabled={movableBases.length === 0}
            onClick={() => toast.success("已打开移动到公共库流程")}
          >
            移动到公共库
          </KbButton>
        }
      />

      <div className="shrink-0 border-b border-divider bg-[#FAFCFD] px-4 py-2.5">
        <KbFilterBar
          className="mb-0"
          searchValue={query}
          onSearchChange={onQueryChange}
          searchPlaceholder="搜索个人库文件"
          searchClassName="max-w-[280px] !rounded-[8px]"
          filters={
            <>
              <KbFilterCombo
                value={professionalType}
                onChange={onProfessionalTypeChange}
                placeholder="全部专业"
                options={[
                  { value: "all", label: "全部专业" },
                  ...professionalTypes.map((item) => ({ value: item, label: item })),
                ]}
              />
              <KbFilterCombo
                value={tag}
                onChange={onTagChange}
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
              <ActionButton
                variant="primary"
                size="sm"
                onClick={() => toast.message("打开上传面板")}
              >
                <Upload className="h-3.5 w-3.5 stroke-[1.8]" />
                上传
              </ActionButton>
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
            onOpen={onOpen}
            showLibrary={false}
            overviewMode
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

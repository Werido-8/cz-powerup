import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Clock3,
  Database,
  Folder,
  FolderPlus,
  Heart,
  Library,
  Plus,
  Upload,
  UploadCloud,
  UserRound,
} from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";
import {
  ActionButton,
  CardBatchPager,
  StatIconFrame,
  TABLE_PAGE_SIZE_DEFAULT,
  TableListPager,
  Tag,
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
  KbSidebarItem,
  KbSidebarSection,
  KbStatusTag,
  KbTableCellFile,
} from "@/components/knowledge/ui";
import { KNOWLEDGE_BASES, PERSONAL_DIRECTORIES, UPLOAD_RECORDS } from "@/lib/knowledge/data";
import {
  filterFiles,
  getAllTags,
  getFavoriteFiles,
  getFilesForBase,
  getPersonalBases,
  getPersonalBasesForDirectory,
  getProfessionalTypes,
  getRecentFiles,
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

type MySpaceSelection =
  | { kind: "recent" }
  | { kind: "uploads" }
  | { kind: "favorites" }
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

function MySpaceQuickLinks() {
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

function MySpacePanelHeader({
  icon,
  title,
  description,
  meta,
  action,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  meta?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <section className="shrink-0 border-b border-divider px-4 py-3">
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <StatIconFrame icon={icon} size="sm" />
          <div className="min-w-0">
            <h1 className="text-[20px] font-semibold tracking-tight text-foreground">{title}</h1>
            <p className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground">{description}</p>
            {meta && <div className="mt-2 flex flex-wrap items-center gap-2">{meta}</div>}
          </div>
        </div>
        {action}
      </div>
    </section>
  );
}

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
    if (window.location.hash === "#personal" && personalBases[0]) {
      setSelection({ kind: "personalBase", baseId: personalBases[0].id });
    }
  }, [personalBases]);

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
        header={
          <div className="border-b border-[#E8F0F2] px-4 py-3.5">
            <p className="text-[11px] font-medium text-kb-muted">个人空间</p>
            <div className="mt-1.5 flex items-center gap-2">
              <StatIconFrame icon={<UserRound className="stroke-[1.8]" />} size="sm" />
              <h1 className="text-[15px] font-semibold text-kb-heading">我的空间</h1>
            </div>
          </div>
        }
      >
        <MySpaceQuickLinks />

        <KbSidebarSection>
          <KbSidebarItem
            icon={Clock3}
            label="最近访问"
            active={selection.kind === "recent"}
            onClick={() => setSelection({ kind: "recent" })}
          />
          <KbSidebarItem
            icon={UploadCloud}
            label="我的上传"
            active={selection.kind === "uploads"}
            onClick={() => setSelection({ kind: "uploads" })}
          />
          <KbSidebarItem
            icon={Heart}
            label="我的收藏"
            active={selection.kind === "favorites"}
            onClick={() => setSelection({ kind: "favorites" })}
          />
        </KbSidebarSection>

        <KbSidebarSection
          title="个人目录与知识库"
          className="border-t border-[#E8F0F2] pt-2"
        >
          <div className="mb-1 flex items-center justify-end gap-1 px-1">
            <KbButton
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => toast.success("已预留新建个人目录入口")}
              aria-label="新建个人目录"
            >
              <FolderPlus className="h-3.5 w-3.5 stroke-[1.8]" />
            </KbButton>
            <KbButton
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => toast.success("已预留新建个人知识库入口")}
              aria-label="新建个人知识库"
            >
              <Plus className="h-3.5 w-3.5 stroke-[1.8]" />
            </KbButton>
          </div>
          {PERSONAL_DIRECTORIES.map((directory) => {
            const bases = getPersonalBasesForDirectory(directory.id);
            if (bases.length === 0) return null;
            return (
              <div key={directory.id} className="mb-1.5">
                <div className="flex h-8 items-center gap-2 px-3 text-[12px] font-medium text-kb-muted">
                  <Folder className="h-3.5 w-3.5 shrink-0 stroke-[1.8]" />
                  <span className="min-w-0 truncate">{directory.name}</span>
                </div>
                {bases.map((base) => (
                  <KbSidebarItem
                    key={base.id}
                    icon={Library}
                    label={base.name}
                    badge={base.fileCount ?? 0}
                    active={selection.kind === "personalBase" && selection.baseId === base.id}
                    onClick={() => setSelection({ kind: "personalBase", baseId: base.id })}
                    indent={1}
                  />
                ))}
              </div>
            );
          })}
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
  const pagedFiles = useMemo(() => {
    const size = viewMode === "card" ? CARD_PAGE_SIZE : pageSize;
    const start = (page - 1) * size;
    return sorted.slice(start, start + size);
  }, [sorted, viewMode, page, pageSize]);

  const empty = <KbEmptyState title={emptyTitle} description={emptyDescription} />;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <MySpacePanelHeader
        icon={icon}
        title={title}
        description={description}
        meta={
          <Tag variant="outline" className="h-6 rounded-[6px] px-2.5 text-[11px]">
            共 {files.length} 篇
          </Tag>
        }
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

      <div key={refreshSeed} className="min-h-0 flex-1 overflow-y-auto scrollbar-thin">
        {viewMode === "list" ? (
          <KnowledgeFileTable
            files={pagedFiles}
            onOpen={onOpen}
            showLibrary={showLibrary}
            empty={empty}
            className="rounded-none border-0 shadow-none"
          />
        ) : (
          <KnowledgeFileCardGrid files={pagedFiles} onOpen={onOpen} empty={empty} />
        )}
      </div>

      <div className="shrink-0 border-t border-divider bg-white px-4 py-2">
        {viewMode === "list" ? (
          <TableListPager
            total={sorted.length}
            page={page}
            pageSize={pageSize}
            onPageChange={onPageChange}
            onPageSizeChange={onPageSizeChange}
          />
        ) : (
          <CardBatchPager
            total={sorted.length}
            page={page}
            pageSize={CARD_PAGE_SIZE}
            onPageChange={onPageChange}
          />
        )}
      </div>
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
      <MySpacePanelHeader
        icon={<UploadCloud className="stroke-[1.8]" />}
        title="我的上传"
        description="跟踪上传后的审批、解析、驳回和发布状态。个人库上传免审批，公共和部门库按权限进入审批。"
        meta={
          <Tag variant="outline" className="h-6 rounded-[6px] px-2.5 text-[11px]">
            共 {records.length} 条记录
          </Tag>
        }
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
}) {
  const allFiles = getFilesForBase(base.id);
  const professionalTypes = getProfessionalTypes(allFiles);
  const tags = getAllTags(allFiles);
  const movableBases = KNOWLEDGE_BASES.filter(
    (item) => item.scope !== "personal" && item.status === "enabled" && item.permission.canUpload,
  );

  const pagedFiles = useMemo(() => {
    const size = viewMode === "card" ? CARD_PAGE_SIZE : pageSize;
    const start = (page - 1) * size;
    return files.slice(start, start + size);
  }, [files, viewMode, page, pageSize]);

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
      <MySpacePanelHeader
        icon={<Library className="stroke-[1.8]" />}
        title={base.name}
        description={
          base.description ?? "个人知识库仅本人可见，文件可申请移动到公共或专业知识库。"
        }
        meta={
          <>
            <Tag variant="primary" className="h-6 px-2.5 text-[11px]">
              {allFiles.length} 个文件
            </Tag>
            {base.updatedAt && (
              <Tag variant="outline" className="h-6 rounded-[6px] px-2.5 text-[11px]">
                更新于 {base.updatedAt}
              </Tag>
            )}
          </>
        }
        action={
          <div className="flex shrink-0 flex-wrap gap-2">
            <KbButton
              variant="outline"
              size="sm"
              disabled={movableBases.length === 0}
              onClick={() => toast.success("已打开移动到公共库流程")}
            >
              移动到公共库
            </KbButton>
          </div>
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

      <div key={refreshSeed} className="min-h-0 flex-1 overflow-y-auto scrollbar-thin">
        {viewMode === "list" ? (
          <KnowledgeFileTable
            files={pagedFiles}
            onOpen={onOpen}
            showLibrary={false}
            overviewMode
            empty={empty}
            className="rounded-none border-0 shadow-none"
          />
        ) : (
          <KnowledgeFileCardGrid files={pagedFiles} onOpen={onOpen} empty={empty} />
        )}
      </div>

      <div className="shrink-0 border-t border-divider bg-white px-4 py-2">
        {viewMode === "list" ? (
          <TableListPager
            total={files.length}
            page={page}
            pageSize={pageSize}
            onPageChange={onPageChange}
            onPageSizeChange={onPageSizeChange}
          />
        ) : (
          <CardBatchPager
            total={files.length}
            page={page}
            pageSize={CARD_PAGE_SIZE}
            onPageChange={onPageChange}
          />
        )}
      </div>
    </KbDragUploadOverlay>
  );
}

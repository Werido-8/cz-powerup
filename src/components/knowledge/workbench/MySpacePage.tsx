import { useNavigate } from "@tanstack/react-router";
import {
  ArrowUpDown,
  ChevronDown,
  CheckCircle2,
  CircleAlert,
  CircleDashed,
  Clock3,
  Eye,
  Heart,
  MoreHorizontal,
  RefreshCw,
  Upload,
  UploadCloud,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState, type UIEvent } from "react";
import { toast } from "sonner";
import {
  ActionButton,
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
  KbFilterBar,
  KbFilterCombo,
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
  getFileById,
  getFilesForBase,
  getFilesForPersonalTree,
  getPersonalBases,
  getProfessionalTypes,
  getRecentFiles,
  PERSONAL_TREE_ALL_ID,
  sortKnowledgeFiles,
} from "@/lib/knowledge/model";
import { publishStatusLabel, publishStatusTone } from "@/lib/knowledge/status";
import { kbFileTypeConfig, kbMainPanel } from "@/lib/knowledge/tokens";
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
import { KnowledgeAggregateDetailHeader } from "./KnowledgeAggregateDetailHeader";
import { KnowledgeBaseDetailHeader } from "./KnowledgeBaseDetailHeader";
import { KnowledgeTreeNavItem } from "./KnowledgeCategoryTree";
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

type FavoriteCategory = "all" | "file" | "knowledgePoint" | "question";

const CARD_PAGE_SIZE = 8;
const RECENT_ACCESS_BATCH_SIZE = 8;

const uploadPanelStatusOptions: Array<{ value: string; label: string }> = [
  { value: "all", label: "全部" },
  { value: "pendingApproval", label: "待审核" },
  { value: "rejected", label: "被驳回" },
  { value: "published", label: "已发布" },
  { value: "parsing", label: "解析中" },
];

const UPLOAD_TABLE_GRID =
  "grid-cols-[minmax(240px,1.5fr)_minmax(140px,1fr)_88px_130px_minmax(160px,1fr)_72px] min-w-[960px]";

const favoriteCategoryOptions: Array<{ value: FavoriteCategory; label: string }> = [
  { value: "all", label: "全部" },
  { value: "file", label: "文件" },
  { value: "knowledgePoint", label: "知识点" },
  { value: "question", label: "题目" },
];

const mySpaceSortOptions: Array<{ value: KnowledgeSortBy; label: string }> = [
  { value: "updated", label: "按时间排序" },
  { value: "name", label: "按名称排序" },
  { value: "size", label: "按大小排序" },
  { value: "status", label: "按状态排序" },
];

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
  const [uploadStatus, setUploadStatus] = useState<string>("pendingApproval");
  const [favoriteCategory, setFavoriteCategory] = useState<FavoriteCategory>("all");

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
  }, [query, professionalType, tag, sortBy, viewMode, uploadStatus, favoriteCategory]);

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
          <RecentAccessPanel
            files={getRecentFiles()}
            sortBy={sortBy}
            refreshSeed={refreshSeed}
            onOpen={openFile}
          />
        )}

        {selection.kind === "favorites" && (
          <FavoriteKnowledgePanel
            files={getFavoriteFiles()}
            category={favoriteCategory}
            page={page}
            refreshSeed={refreshSeed}
            onCategoryChange={setFavoriteCategory}
            onPageChange={setPage}
            onRefresh={handleRefresh}
            onOpen={openFile}
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
            onNavigateRoot={() => setSelection({ kind: "recent" })}
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
  const type = kbFileTypeConfig[file.type ?? "other"];
  const TypeIcon = type.icon;
  const sourceName = file.knowledgeBaseName ?? "个人知识库";
  const displayName = stripFileExtension(file.name);

  return (
    <article className="group rounded-[8px] transition-colors hover:bg-[#F6FBFC]">
      <button
        type="button"
        onClick={onOpen}
        className="grid min-h-[50px] w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2.5 px-3 py-1.5 text-left"
      >
        <div
          className={cn(
            "grid h-7 w-7 place-items-center rounded-[7px] ring-1 ring-inset",
            type.color,
          )}
        >
          <TypeIcon className="h-[15px] w-[15px] stroke-[1.8]" />
        </div>
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
  category,
  page,
  refreshSeed,
  onCategoryChange,
  onPageChange,
  onRefresh,
  onOpen,
}: {
  files: KnowledgeFile[];
  category: FavoriteCategory;
  page: number;
  refreshSeed: number;
  onCategoryChange: (category: FavoriteCategory) => void;
  onPageChange: (page: number) => void;
  onRefresh: () => void;
  onOpen: (file: KnowledgeFile) => void;
}) {
  const assets = useMemo(
    () =>
      files.map((file, index) => ({
        file,
        assetType: getFavoriteAssetType(file, index),
      })),
    [files],
  );
  const filteredAssets = useMemo(
    () =>
      category === "all" ? assets : assets.filter((asset) => asset.assetType.category === category),
    [assets, category],
  );
  const totalPages = Math.max(1, Math.ceil(filteredAssets.length / CARD_PAGE_SIZE) || 1);
  const safePage = Math.min(page, totalPages);
  const pagedAssets = useMemo(() => {
    const start = (safePage - 1) * CARD_PAGE_SIZE;
    return filteredAssets.slice(start, start + CARD_PAGE_SIZE);
  }, [filteredAssets, safePage]);
  const categoryTabs = favoriteCategoryOptions.map((option) => ({
    ...option,
    count:
      option.value === "all"
        ? assets.length
        : assets.filter((asset) => asset.assetType.category === option.value).length,
  }));

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-white">
      <div className="min-h-0 flex-1 overflow-y-auto scrollbar-thin p-4">
        <section className="overflow-hidden rounded-[12px] border border-[#DCEBED] bg-white/95 shadow-[0_8px_24px_rgba(31,52,64,0.025)]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E8F0F2] px-5 py-4">
            <div>
              <h2 className="text-[18px] font-semibold text-[#102A33]">收藏内容</h2>
              <p className="mt-0.5 text-[12px] text-[#6B7F88]">
                按文件、知识点和题目归类，沉淀个人常用知识资产
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="rounded-full bg-[#EEF6F8] px-3 py-1 text-[12px] text-[#6B7F88]">
                共{" "}
                <span className="font-semibold tabular-nums text-[#102A33]">
                  {filteredAssets.length}
                </span>{" "}
                项
              </div>
              <PanelActionButton icon={RefreshCw} label="刷新" onClick={onRefresh} />
            </div>
          </div>

          <div className="border-b border-[#E8F0F2] bg-[#FAFCFD] px-5 py-3">
            <StatusPillTabs
              value={category}
              onChange={(value) => onCategoryChange(value as FavoriteCategory)}
              options={categoryTabs}
            />
          </div>

          <div key={refreshSeed} className="p-4">
            {filteredAssets.length === 0 ? (
              <KbEmptyState
                title="暂无收藏内容"
                description="在资料检索或文件详情页收藏后，会沉淀到这里。"
              />
            ) : (
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 2xl:grid-cols-3">
                {pagedAssets.map(({ file, assetType }) => (
                  <FavoriteKnowledgeCard
                    key={file.id}
                    file={file}
                    assetType={assetType}
                    onOpen={() => onOpen(file)}
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      </div>

      {filteredAssets.length > 0 && (
        <div className="border-t border-divider bg-white px-4 py-2">
          <CardBatchPager
            page={safePage}
            totalPages={totalPages}
            totalItems={filteredAssets.length}
            pageSize={CARD_PAGE_SIZE}
            unitLabel="项"
            onPageChange={onPageChange}
            compact
          />
        </div>
      )}
    </div>
  );
}

function FavoriteKnowledgeCard({
  file,
  assetType,
  onOpen,
}: {
  file: KnowledgeFile;
  assetType: FavoriteAssetType;
  onOpen: () => void;
}) {
  const type = kbFileTypeConfig[file.type ?? "other"];
  const TypeIcon = type.icon;

  return (
    <article className="group min-h-[208px] rounded-[12px] border border-[#DCEBED] bg-white shadow-[0_8px_20px_rgba(31,52,64,0.02)] transition-colors hover:border-primary/35 hover:bg-[#FBFEFE]">
      <button type="button" onClick={onOpen} className="flex h-full w-full flex-col p-4 text-left">
        <div className="flex min-w-0 items-start gap-3">
          <div
            className={cn(
              "grid h-12 w-12 shrink-0 place-items-center rounded-[10px] ring-1 ring-inset",
              type.color,
            )}
          >
            <TypeIcon className="h-5 w-5 stroke-[1.8]" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex h-6 items-center rounded-[6px] bg-primary-soft px-2 text-[11.5px] font-medium text-primary">
                {assetType.label}
              </span>
              <span className="truncate text-[12px] font-medium text-[#6B7F88]">{type.label}</span>
            </div>
            <h2 className="mt-2 line-clamp-2 text-[16px] font-semibold leading-snug text-[#102A33]">
              {file.name}
            </h2>
          </div>
        </div>

        <p className="mt-3 line-clamp-2 min-h-[40px] text-[12.5px] leading-relaxed text-[#6B7F88]">
          {file.summary ?? "已加入个人收藏，可在个人空间中快速访问。"}
        </p>

        <div className="mt-auto border-t border-[#EEF4F5] pt-3">
          <div className="mb-2 truncate text-[12px] font-medium text-[#6B7F88]">
            来源知识库：{file.knowledgeBaseName ?? "个人知识库"}
          </div>
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 flex-wrap items-center gap-1.5">
              {(file.tags ?? []).slice(0, 3).map((tag) => (
                <KnowledgeChip key={tag}>{tag}</KnowledgeChip>
              ))}
            </div>
            <span className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-[8px] border border-primary/25 bg-primary-soft/70 px-2.5 text-[12px] font-medium text-primary transition-colors group-hover:bg-primary group-hover:text-white">
              <Eye className="h-3.5 w-3.5 stroke-[1.8]" />
              查看
            </span>
          </div>
        </div>
      </button>
    </article>
  );
}

interface FavoriteAssetType {
  category: Exclude<FavoriteCategory, "all">;
  label: string;
}

function getFavoriteAssetType(file: KnowledgeFile, index: number): FavoriteAssetType {
  const keywordText = `${file.name} ${(file.tags ?? []).join(" ")}`;

  if (/题|自测|考核|测评/.test(keywordText)) {
    return { category: "question", label: "题目" };
  }

  if (/摘录|复盘|纪要|笔记|要点|处置卡/.test(keywordText)) {
    return { category: "knowledgePoint", label: "知识点" };
  }

  if (index % 5 === 3) {
    return { category: "knowledgePoint", label: "知识点" };
  }

  return { category: "file", label: "文件" };
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
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<KnowledgeSortBy>("updated");

  const pendingCount = UPLOAD_RECORDS.filter(
    (record) => record.status === "pendingApproval",
  ).length;
  const publishedCount = UPLOAD_RECORDS.filter((record) => record.status === "published").length;
  const rejectedCount = UPLOAD_RECORDS.filter((record) =>
    ["rejected", "parseFailed"].includes(record.status),
  ).length;

  const uploadStats = [
    {
      label: "上传数量",
      value: UPLOAD_RECORDS.length,
      desc: "累计上传资料",
      detail: `共 ${UPLOAD_RECORDS.length} 份资料`,
      icon: UploadCloud,
      tone: "primary" as const,
    },
    {
      label: "待审核",
      value: pendingCount,
      desc: "等待审批",
      detail: `待处理 ${pendingCount} 份资料`,
      icon: CircleDashed,
      tone: "warning" as const,
    },
    {
      label: "已发布",
      value: publishedCount,
      desc: "已发布到知识库",
      detail: `已入库 ${publishedCount} 份资料`,
      icon: CheckCircle2,
      tone: "success" as const,
    },
    {
      label: "被驳回",
      value: rejectedCount,
      desc: "需要修改后重提",
      detail: `需处理 ${rejectedCount} 份资料`,
      icon: CircleAlert,
      tone: "danger" as const,
    },
  ];

  const records = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    const filtered = UPLOAD_RECORDS.filter((record) => {
      if (status !== "all") {
        if (status === "rejected") {
          if (!["rejected", "parseFailed"].includes(record.status)) return false;
        } else if (record.status !== status) {
          return false;
        }
      }

      if (!normalizedQuery) return true;
      return (
        record.fileName.toLowerCase().includes(normalizedQuery) ||
        record.targetKnowledgeBaseName.toLowerCase().includes(normalizedQuery)
      );
    });

    return sortUploadRecords(filtered, sortBy);
  }, [searchQuery, sortBy, status]);

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-white">
      <div className="min-h-0 flex-1 overflow-y-auto scrollbar-thin p-4">
        <div className="grid grid-cols-2 gap-3 2xl:grid-cols-4">
          {uploadStats.map((stat, index) => (
            <RecentOverviewMetricCard key={stat.label} {...stat} tint={index} />
          ))}
        </div>

        <section className="mt-4 overflow-hidden rounded-[12px] border border-[#DCEBED] bg-white shadow-[0_8px_24px_rgba(31,52,64,0.025)]">
          <div className="flex flex-wrap items-center gap-3 border-b border-[#E8F0F2] px-4 py-3">
            <SearchBar
              value={searchInput}
              onChange={setSearchInput}
              onSearch={() => setSearchQuery(searchInput)}
              placeholder="搜索资料名称 / 目标知识库"
              className="min-w-[220px] max-w-[320px] shrink-0"
            />
            <SegmentedFilterTabs
              value={status}
              onChange={onStatusChange}
              options={uploadPanelStatusOptions}
            />
            <div className="ml-auto flex items-center gap-2">
              <SortSelectButton value={sortBy} onChange={setSortBy} triggerLabel="快速排序" />
              <PanelActionButton icon={RefreshCw} label="刷新" onClick={onRefresh} />
            </div>
          </div>

          <div key={refreshSeed} className="overflow-x-auto">
            <KbDataTable
              variant="flat"
              minWidth={UPLOAD_TABLE_GRID}
              className="border-0 shadow-none"
              header={
                <>
                  <span>文件名</span>
                  <span>目标知识库</span>
                  <span>状态</span>
                  <span>提交时间</span>
                  <span>流程说明</span>
                  <span className="text-right">操作</span>
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
                <UploadRecordTableRow key={record.id} record={record} />
              ))}
            </KbDataTable>
          </div>
        </section>
      </div>
    </div>
  );
}

function sortUploadRecords(records: UploadRecord[], sortBy: KnowledgeSortBy) {
  return [...records].sort((a, b) => {
    if (sortBy === "name") return a.fileName.localeCompare(b.fileName, "zh-CN");
    if (sortBy === "status") return a.status.localeCompare(b.status, "zh-CN");
    return b.submittedAt.localeCompare(a.submittedAt, "zh-CN");
  });
}

function UploadRecordTableRow({ record }: { record: UploadRecord }) {
  const file = getFileById(record.fileId);
  const note =
    record.rejectReason ??
    (record.status === "pendingApproval"
      ? "等待审核"
      : record.status === "parsing"
        ? "系统解析中"
        : record.status === "published"
          ? "已进入目标知识库"
          : "状态已同步");

  return (
    <KbDataTableRow variant="flat" className={UPLOAD_TABLE_GRID}>
      <KbTableCellFile
        name={record.fileName}
        type={file?.type ?? "pdf"}
        size="sm"
        nameWeight="normal"
      />
      <span className="truncate text-kb-muted">{record.targetKnowledgeBaseName}</span>
      <KbStatusTag tone={publishStatusTone(record.status)}>
        {publishStatusLabel(record.status)}
      </KbStatusTag>
      <span className="truncate tabular-nums text-kb-muted">{record.submittedAt}</span>
      <span className="truncate text-kb-muted">{note}</span>
      <span className="flex justify-end">
        <button
          type="button"
          aria-label="更多操作"
          onClick={() => toast.message("更多操作")}
          className="grid h-8 w-8 place-items-center rounded-[8px] text-kb-muted hover:bg-kb-surface-hover hover:text-kb-body"
        >
          <MoreHorizontal className="h-4 w-4 stroke-[1.8]" />
        </button>
      </span>
    </KbDataTableRow>
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

function StatusPillTabs({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string; count?: number }>;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {options.map((option) => {
        const selected = value === option.value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(option.value)}
            className={cn(
              "inline-flex h-9 items-center gap-2 rounded-[8px] border px-3 text-[13px] font-medium transition-colors",
              selected
                ? "border-primary bg-primary text-white shadow-[0_6px_14px_rgba(52,155,172,0.18)]"
                : "border-[#DCEBED] bg-white text-[#5E737C] hover:border-primary/30 hover:text-primary",
            )}
          >
            <span>{option.label}</span>
            {typeof option.count === "number" && (
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[11px] tabular-nums",
                  selected ? "bg-white/20 text-white" : "bg-[#EEF6F8] text-[#6B7F88]",
                )}
              >
                {option.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

function KnowledgeChip({ children }: { children: string }) {
  return (
    <span className="inline-flex h-6 items-center rounded-[6px] border border-[#DCEBED] bg-[#F7FAFB] px-2 text-[11px] font-medium text-[#4E5969]">
      {children}
    </span>
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
    <KbEmptyState title="个人库暂无文件" description="可拖拽上传，上传后直接进入解析流程。" />
  );

  return (
    <KbDragUploadOverlay onFiles={onUploadFiles} className="flex min-h-0 flex-1 flex-col">
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

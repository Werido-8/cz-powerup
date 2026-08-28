import {
  AlertTriangle,
  ArrowUpFromLine,
  Ban,
  CheckCircle2,
  ChevronDown,
  Circle,
  CircleDashed,
  ClipboardList,
  FileStack,
  Info,
  ListChecks,
  Loader2,
  MoreHorizontal,
  Pencil,
  RefreshCw,
  RotateCcw,
  Trash2,
  UploadCloud,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { useRouter } from "@tanstack/react-router";
import { toast } from "sonner";
import { SearchBar, TABLE_PAGE_SIZE_DEFAULT, TableListPager } from "@/components/learning/ui";
import { AppDialogButton, AppFormDialog } from "@/components/ui/app-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  KbDataTable,
  KbDataTableRow,
  KbEmptyState,
  KbStatusTag,
  KbTableCellFile,
  KbUploadCard,
} from "@/components/knowledge/ui";
import {
  getBaseById,
  getFileById,
  listCategoryPathOptions,
} from "@/lib/knowledge/model";
import { pushRecentUploadBaseId } from "@/lib/knowledge/recentUpload";
import { openFileDetailInNewTab } from "@/lib/knowledge/searchNav";
import {
  getKnowledgeStoreServerSnapshot,
  getKnowledgeStoreVersion,
  getStoreUploadRecords,
  removeStoreUploadRecord,
  subscribeKnowledgeStore,
  withdrawStoreUpload,
} from "@/lib/knowledge/store";
import { kbMainPanel } from "@/lib/knowledge/tokens";
import type { KnowledgeBase, UploadRecord } from "@/lib/knowledge/types";
import {
  UPLOAD_VIEW_META,
  belongsToView,
  currentStatusOf,
  enabledStateOf,
  fileStatusOf,
  getCurrentStage,
  getParseStage,
  getPublishStage,
  getReviewStatus,
  getTrackingActions,
  getUploadCounts,
  getViewStatusFilterLabel,
  getViewStatusOptions,
  matchViewStatus,
  parseStageLabel,
  parseStageTone,
  publishStageLabel,
  publishStageTone,
  reviewStatusLabel,
  reviewStatusTone,
  stageLabel,
  type UploadActionItem,
  type UploadActionKind,
  type UploadView,
} from "@/lib/knowledge/uploadTracking";
import { cn } from "@/lib/utils";
import { FileVersionHistoryDialog } from "./FileVersionHistoryDialog";
import { UploadBasePickerDialog } from "./UploadBasePickerDialog";
import { UploadSimilarityFlowDialog } from "./UploadSimilarityFlowDialog";

export type UploadSearch = {
  panel?: string;
  view?: UploadView;
  status?: string;
  q?: string;
};

/* ─── 各视图表格栅格 ─── */

const VIEW_GRIDS: Record<UploadView, string> = {
  all: "grid-cols-[minmax(200px,1.4fr)_minmax(110px,0.85fr)_76px_88px_80px_104px_104px_minmax(196px,1fr)] min-w-[1100px]",
  review:
    "grid-cols-[minmax(200px,1.4fr)_minmax(130px,1fr)_96px_150px_150px_minmax(200px,1fr)] min-w-[960px]",
  parse:
    "grid-cols-[minmax(200px,1.4fr)_minmax(130px,1fr)_96px_150px_150px_minmax(220px,1fr)] min-w-[980px]",
  publish:
    "grid-cols-[minmax(200px,1.4fr)_minmax(130px,1fr)_96px_88px_150px_96px_minmax(200px,1fr)] min-w-[980px]",
};

const VIEW_HEADERS: Record<UploadView, ReactNode> = {
  all: (
    <>
      <span>文件信息</span>
      <span>目标知识库</span>
      <span>当前阶段</span>
      <span>文件状态</span>
      <span>启用状态</span>
      <span>提交时间</span>
      <span>最近更新</span>
      <span className="text-right">操作</span>
    </>
  ),
  review: (
    <>
      <span>文件信息</span>
      <span>目标知识库</span>
      <span>审核状态</span>
      <span>提交时间</span>
      <span>审核时间</span>
      <span className="text-right">操作</span>
    </>
  ),
  parse: (
    <>
      <span>文件信息</span>
      <span>目标知识库</span>
      <span>解析状态</span>
      <span>开始时间</span>
      <span>更新时间</span>
      <span className="text-right">操作</span>
    </>
  ),
  publish: (
    <>
      <span>文件信息</span>
      <span>目标知识库</span>
      <span>发布状态</span>
      <span>当前版本</span>
      <span>发布时间</span>
      <span>发布人</span>
      <span className="text-right">操作</span>
    </>
  ),
};

type ActionDialog =
  | { kind: UploadActionKind; record: UploadRecord }
  | null;

/* ─── 主页面 ─── */

export function UploadTrackingPanel({
  search,
  onSearchChange,
  embedded = false,
}: {
  search: UploadSearch;
  onSearchChange: (next: UploadSearch) => void;
  embedded?: boolean;
}) {
  const router = useRouter();
  const storeVersion = useSyncExternalStore(
    subscribeKnowledgeStore,
    getKnowledgeStoreVersion,
    getKnowledgeStoreServerSnapshot,
  );

  const currentView: UploadView = search.view ?? "review";
  const statusFilter = search.status ?? "all";
  const searchQuery = search.q ?? "";

  const [searchInput, setSearchInput] = useState(searchQuery);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [refreshSeed, setRefreshSeed] = useState(0);
  const [historyFileId, setHistoryFileId] = useState<string | null>(null);
  const [uploadBase, setUploadBase] = useState<KnowledgeBase | null>(null);
  const [basePickerOpen, setBasePickerOpen] = useState(false);
  const [actionDialog, setActionDialog] = useState<ActionDialog>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(TABLE_PAGE_SIZE_DEFAULT);

  const historyFile = historyFileId ? (getFileById(historyFileId) ?? null) : null;
  const meta = UPLOAD_VIEW_META[currentView];
  const uploadRecords = useSyncExternalStore(
    subscribeKnowledgeStore,
    getStoreUploadRecords,
    getStoreUploadRecords,
  );
  const counts = useMemo(() => getUploadCounts(uploadRecords), [uploadRecords, storeVersion]);

  const categoryFilterOptions = useMemo(
    () => [{ value: "all", label: "全部分类" }, ...listCategoryPathOptions()],
    [storeVersion],
  );

  const records = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return uploadRecords.filter((record) => {
      if (!belongsToView(currentView, record)) return false;
      if (currentView !== "all" && !matchViewStatus(currentView, record, statusFilter)) return false;
      const base = getBaseById(record.targetKnowledgeBaseId);
      if (categoryFilter !== "all" && base?.categoryId !== categoryFilter) return false;
      if (!q) return true;
      return (
        record.fileName.toLowerCase().includes(q) ||
        record.targetKnowledgeBaseName.toLowerCase().includes(q)
      );
    }).sort((a, b) => (b.updatedAt ?? b.submittedAt).localeCompare(a.updatedAt ?? a.submittedAt));
  }, [uploadRecords, currentView, statusFilter, categoryFilter, searchQuery, storeVersion]);

  useEffect(() => {
    setPage(1);
  }, [currentView, statusFilter, categoryFilter, searchQuery, pageSize]);

  const totalPages = Math.max(1, Math.ceil(records.length / pageSize) || 1);
  const safePage = Math.min(page, totalPages);
  const pagedRecords = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return records.slice(start, start + pageSize);
  }, [records, pageSize, safePage]);

  const setView = (view: UploadView, status = "all") => {
    onSearchChange({ ...search, view, status: status === "all" ? undefined : status });
    setCategoryFilter("all");
  };

  const handleSearch = () => {
    onSearchChange({ ...search, q: searchInput || undefined });
  };

  const openRecordFile = (record: UploadRecord) => {
    const file = getFileById(record.fileId);
    if (file) {
      openFileDetailInNewTab(router, file);
      return;
    }
    toast.message(`预览 ${record.fileName}`);
  };

  const handleUploadAction = (kind: UploadActionKind, record: UploadRecord) => {
    const instant: Partial<Record<UploadActionKind, () => void>> = {
      preview: () => openRecordFile(record),
      history: () => setHistoryFileId(record.fileId),
      download: () => toast.message(`下载 ${record.fileName}`),
      gotoBase: () => toast.message(`进入 ${record.targetKnowledgeBaseName}`),
      chunks: () => toast.message(`查看 ${record.fileName} 分块内容`),
      parseResult: () => setActionDialog({ kind: "parseResult", record }),
      approveRecord: () => setActionDialog({ kind: "approveRecord", record }),
      confirmContent: () => toast.message("文件确认已移除，解析完成将自动发布"),
    };
    if (instant[kind]) {
      instant[kind]!();
      return;
    }
    const dialogKinds: UploadActionKind[] = [
      "withdraw",
      "delete",
      "reason",
      "progress",
      "detail",
      "submitDetail",
      "startParse",
      "reparse",
      "terminate",
      "takedown",
      "restore",
      "replace",
    ];
    if (dialogKinds.includes(kind)) {
      setActionDialog({ kind, record });
    }
  };

  const openUploadWithBase = (base: KnowledgeBase) => {
    pushRecentUploadBaseId(base.id);
    setUploadBase(base);
  };

  return (
    <div className="flex min-h-0 flex-1">
      <main className={cn("scrollbar-thin min-w-0 flex-1", kbMainPanel, embedded && "w-full")}>
        <div className="flex min-h-0 flex-1 flex-col bg-white">
          <div className="min-h-0 flex-1 overflow-y-auto scrollbar-thin p-4">
            <section className="overflow-hidden rounded-[12px] border border-[#DCEBED] bg-white shadow-[0_8px_24px_rgba(31,52,64,0.025)]">
              <div className="px-5 pt-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-[15px] font-semibold text-kb-heading">上传跟踪</h2>
                  <button
                    type="button"
                    onClick={() => setBasePickerOpen(true)}
                    className="inline-flex h-8 items-center gap-1.5 rounded-[8px] bg-primary px-3 text-[12.5px] font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                  >
                    <UploadCloud className="h-3.5 w-3.5 stroke-[1.8]" />
                    上传文件
                  </button>
                </div>

                <div role="tablist" aria-label="上传跟踪" className="mt-3 flex items-center gap-1">
                  {[
                    { view: "all" as const, label: "全部上传", icon: ListChecks, count: counts.all },
                    { view: "parse" as const, label: "解析进度", icon: Loader2, count: counts.needParseError },
                    {
                      view: "review" as const,
                      label: "审核进度",
                      icon: CircleDashed,
                      count: counts.reviewInProgress,
                    },
                  ].map(({ view, label, icon: Icon, count }) => {
                    const active = currentView === view;
                    const hasAlert = view !== "all" && count > 0;
                    return (
                      <button
                        key={view}
                        type="button"
                        role="tab"
                        aria-selected={active}
                        onClick={() => setView(view)}
                        className={cn(
                          "inline-flex h-9 items-center gap-1.5 border-b-2 px-3 text-[12.5px] font-medium transition-colors",
                          active
                            ? "border-primary text-primary"
                            : "border-transparent text-kb-muted hover:text-kb-body",
                        )}
                      >
                        <Icon className={cn("h-3.5 w-3.5 stroke-[1.8]", view === "parse" && active && "animate-spin")} />
                        {label}
                        {count > 0 && (
                          <span
                            className={cn(
                              "min-w-4 rounded-full px-1.5 py-px text-center text-[10px] leading-4",
                              hasAlert ? "bg-danger-soft text-destructive" : "bg-primary-soft text-primary",
                            )}
                          >
                            {count}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="border-y border-[#E8F0F2] "
              
              style={{borderTop: 'none', paddingTop: '0px'}}>
              
              </div>

              {(
                <div className="flex flex-wrap items-center gap-3 border-b border-[#E8F0F2] px-4 py-3">
                  <SearchBar
                    value={searchInput}
                    onChange={setSearchInput}
                    onSearch={handleSearch}
                    placeholder="搜索文件名 / 目标知识库"
                    className="min-w-[220px] max-w-[320px] shrink-0"
                  />
                  {currentView !== "all" && (
                    <FilterPills
                      value={statusFilter}
                      onChange={(v) =>
                        onSearchChange({
                          ...search,
                          status: v === "all" ? undefined : v,
                        })
                      }
                      options={getViewStatusOptions(currentView)}
                      label={getViewStatusFilterLabel(currentView)}
                    />
                  )}
                  {currentView === "all" && (
                    <FilterPills
                      value={categoryFilter}
                      onChange={setCategoryFilter}
                      options={categoryFilterOptions}
                      label="分类"
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setRefreshSeed((v) => v + 1);
                      toast.message("列表已刷新");
                    }}
                    className="ml-auto inline-flex h-9 items-center gap-1.5 rounded-[8px] border border-[#DCEBED] bg-white px-3 text-[12.5px] text-[#334E59] transition-colors hover:border-primary/35 hover:text-primary"
                  >
                    <RefreshCw className="h-3.5 w-3.5 stroke-[1.8]" />
                    刷新
                  </button>
                </div>
              )}

              <div key={`${refreshSeed}-${currentView}`} className="overflow-x-auto animate-in fade-in duration-150">
                <KbDataTable
                  variant="flat"
                  minWidth={VIEW_GRIDS[currentView]}
                  className="border-0 shadow-none"
                  header={VIEW_HEADERS[currentView]}
                  empty={
                    <KbEmptyState
                      title={meta.emptyTitle}
                      description={meta.emptyDesc}
                      action={
                        currentView === "all" ? (
                          <button
                            type="button"
                            onClick={() => setBasePickerOpen(true)}
                            className="inline-flex h-9 items-center gap-1.5 rounded-[8px] bg-primary px-4 text-[13px] font-medium text-primary-foreground hover:bg-primary/90"
                          >
                            <UploadCloud className="h-3.5 w-3.5 stroke-[1.8]" />
                            上传文件
                          </button>
                        ) : undefined
                      }
                    />
                  }
                >
                  {pagedRecords.map((record) => (
                    <UploadTrackingRow
                      key={record.id}
                      view={currentView}
                      record={record}
                      onAction={handleUploadAction}
                      onOpenFile={openRecordFile}
                    />
                  ))}
                </KbDataTable>
              </div>

              {records.length > 0 && (
                <TableListPager
                  page={safePage}
                  totalPages={totalPages}
                  totalItems={records.length}
                  pageSize={pageSize}
                  onPageChange={setPage}
                  onPageSizeChange={(size) => {
                    setPageSize(size);
                    setPage(1);
                  }}
                />
              )}
            </section>
          </div>
        </div>
      </main>

      <UploadBasePickerDialog
        open={basePickerOpen}
        title="选择目标知识库"
        onClose={() => setBasePickerOpen(false)}
        onSelect={(base) => openUploadWithBase(base)}
      />
      <UploadSimilarityFlowDialog base={uploadBase} onClose={() => setUploadBase(null)} onChangeBase={() => { setUploadBase(null); setBasePickerOpen(true); }} />
      <FileVersionHistoryDialog file={historyFile} onClose={() => setHistoryFileId(null)} />
      <TrackingActionDialogs
        dialog={actionDialog}
        onClose={() => setActionDialog(null)}
        onConfirm={(msg, kind, record) => {
          if (record && (kind === "withdraw" || kind === "delete")) {
            if (kind === "withdraw") withdrawStoreUpload(record.id);
            else removeStoreUploadRecord(record.id);
          }
          toast.success(msg);
          setActionDialog(null);
          setRefreshSeed((v) => v + 1);
        }}
      />
    </div>
  );
}

/* ─── 动态行 ─── */

function UploadTrackingRow({
  view,
  record,
  onAction,
  onOpenFile,
  selected,
  onToggleSelect,
}: {
  view: UploadView;
  record: UploadRecord;
  onAction: (kind: UploadActionKind, record: UploadRecord) => void;
  onOpenFile: (record: UploadRecord) => void;
  selected?: boolean;
  onToggleSelect?: () => void;
}) {
  const file = getFileById(record.fileId);
  const actions = getTrackingActions(view, record);
  return (
    <KbDataTableRow
      variant="flat"
      className={VIEW_GRIDS[view]}
      onClick={() => onOpenFile(record)}
    >
      <span className="flex min-w-0 items-center gap-1.5 overflow-hidden">
        <span className="min-w-0 flex-1 overflow-hidden">
          <KbTableCellFile name={record.fileName} type={file?.type ?? "pdf"} size="sm" nameWeight="normal" />
        </span>
      </span>
      <span className="truncate text-kb-muted">{record.targetKnowledgeBaseName}</span>

      {view === "all" && <AllViewCells record={record} />}
      {view === "review" && <ReviewViewCells record={record} />}
      {view === "parse" && <ParseViewCells record={record} />}
      {view === "publish" && <PublishViewCells record={record} />}

      <UploadActionCell actions={actions} record={record} onAction={onAction} />
    </KbDataTableRow>
  );
}

function AllViewCells({ record }: { record: UploadRecord }) {
  const stage = getCurrentStage(record);
  const status = fileStatusOf(record);
  const enabled = enabledStateOf(record);
  return (
    <>
      <span className="text-[12px] text-kb-muted">{stageLabel(stage)}</span>
      <span>
        <KbStatusTag tone={status.tone} variant="outline" dot>
          {status.label}
        </KbStatusTag>
      </span>
      <span>
        {enabled.label === "未生效" ? (
          <span className="text-[12px] text-kb-muted">—</span>
        ) : (
          <KbStatusTag tone={enabled.tone} variant="outline" dot>
            {enabled.label}
          </KbStatusTag>
        )}
      </span>
      <span className="truncate tabular-nums text-kb-muted">{record.submittedAt}</span>
      <span className="truncate tabular-nums text-kb-muted">{record.updatedAt ?? record.submittedAt}</span>
    </>
  );
}

function ReviewViewCells({ record }: { record: UploadRecord }) {
  const rs = getReviewStatus(record);
  return (
    <>
      <span>
        <KbStatusTag tone={reviewStatusTone(rs)} variant="outline" dot>
          {reviewStatusLabel(rs)}
        </KbStatusTag>
      </span>
      <span className="tabular-nums text-kb-muted">{record.submittedAt}</span>
      <span className="tabular-nums text-kb-muted">{record.reviewedAt ?? "—"}</span>
    </>
  );
}

function ParseViewCells({ record }: { record: UploadRecord }) {
  const ps = getParseStage(record);
  return (
    <>
      <span>
        <KbStatusTag tone={parseStageTone(ps)} variant="outline" dot>
          {parseStageLabel(ps)}
        </KbStatusTag>
      </span>
      <span className="tabular-nums text-kb-muted">{record.parseStartedAt ?? "—"}</span>
      <span className="tabular-nums text-kb-muted">{record.parseUpdatedAt ?? "—"}</span>
    </>
  );
}

function PublishViewCells({ record }: { record: UploadRecord }) {
  const pub = getPublishStage(record);
  return (
    <>
      <span>
        <KbStatusTag tone={publishStageTone(pub)} variant="outline" dot>
          {publishStageLabel(pub)}
        </KbStatusTag>
      </span>
      <span className="truncate text-kb-muted">{record.version ?? "—"}</span>
      <span className="tabular-nums text-kb-muted">{record.publishedAt ?? "—"}</span>
      <span className="truncate text-kb-muted">{record.publisherName ?? "—"}</span>
    </>
  );
}

/* ─── 操作列 ─── */

function useHoverMenu(closeDelay = 160) {
  const [open, setOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clearTimer = () => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  };
  return {
    open,
    setOpen,
    hoverProps: {
      onMouseEnter: () => { clearTimer(); setOpen(true); },
      onMouseLeave: () => { clearTimer(); timer.current = setTimeout(() => setOpen(false), closeDelay); },
    },
  };
}

function UploadActionCell({
  actions,
  record,
  onAction,
}: {
  actions: UploadActionItem[];
  record: UploadRecord;
  onAction: (kind: UploadActionKind, record: UploadRecord) => void;
}) {
  const MAX_INLINE = 3;
  const inline = actions.slice(0, MAX_INLINE);
  const menu = actions.slice(MAX_INLINE);
  const { open, setOpen, hoverProps } = useHoverMenu();

  return (
    <span className="flex shrink-0 flex-nowrap items-center justify-end gap-0.5" onClick={(e) => e.stopPropagation()}>
      {inline.map((action) => (
        <button
          key={`${action.kind}-${action.label}`}
          type="button"
          onClick={() => onAction(action.kind, record)}
          className={cn(
            "inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-[7px] px-2 py-1 text-[12px] font-medium transition-colors",
            action.danger
              ? "text-destructive hover:bg-destructive/8"
              : "text-primary hover:bg-primary-soft/40",
          )}
        >
          <action.icon className="h-3.5 w-3.5 shrink-0 stroke-[1.8]" />
          <span>{action.label}</span>
        </button>
      ))}
      {menu.length > 0 && (
        <DropdownMenu open={open} onOpenChange={setOpen} modal={false}>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label="更多操作"
              {...hoverProps}
              className="grid h-8 w-8 shrink-0 place-items-center rounded-[7px] text-kb-muted transition-colors hover:bg-kb-surface-hover hover:text-kb-body data-[state=open]:text-primary"
            >
              <MoreHorizontal className="h-4 w-4 stroke-[1.8]" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-[140px]" onCloseAutoFocus={(e) => e.preventDefault()} {...hoverProps}>
            {menu.map((action, index) => (
              <span key={`${action.kind}-${action.label}`}>
                {action.separatorBefore && index > 0 && <DropdownMenuSeparator />}
                <DropdownMenuItem
                  className={cn("gap-2 text-[12.5px]", action.danger && "text-destructive focus:text-destructive")}
                  onClick={() => onAction(action.kind, record)}
                >
                  <action.icon className="h-3.5 w-3.5 stroke-[1.8]" />
                  {action.label}
                </DropdownMenuItem>
              </span>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </span>
  );
}

function FilterPills<T extends string>({ value, onChange, options, label }: { value: T; onChange: (v: T) => void; options: ReadonlyArray<{ value: T; label: string }>; label: string }) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value) ?? options[0];
  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button type="button" className="inline-flex h-9 items-center gap-1.5 rounded-[8px] border border-[#DCEBED] bg-white px-3 text-[12.5px] text-[#334E59] hover:border-primary/35 hover:text-primary data-[state=open]:border-primary/30 data-[state=open]:text-primary">
          <span className="text-kb-muted">{label}</span>
          <span className="font-medium">{selected.label}</span>
          <ChevronDown className="h-3.5 w-3.5 stroke-[1.8] text-kb-muted" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-[120px]">
        {options.map((option) => (
          <DropdownMenuItem key={option.value} className={cn("text-[12.5px]", value === option.value && "font-medium text-primary")} onClick={() => { onChange(option.value); setOpen(false); }}>
            {option.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/* ─── 操作弹框（复用并扩展） ─── */

function TrackingActionDialogs({
  dialog,
  onClose,
  onConfirm,
}: {
  dialog: ActionDialog;
  onClose: () => void;
  onConfirm: (msg: string, kind?: UploadActionKind, record?: UploadRecord) => void;
}) {
  if (!dialog) return null;
  const { record, kind } = dialog;
  const file = getFileById(record.fileId);

  const confirm = (
    title: string,
    icon: LucideIcon,
    desc: ReactNode,
    label: string,
    msg: string,
    danger?: boolean,
  ) => (
    <ConfirmDialog
      open
      title={title}
      titleIcon={icon}
      fileName={record.fileName}
      description={desc}
      confirmLabel={label}
      danger={danger}
      onClose={onClose}
      onConfirm={() => onConfirm(msg, kind, record)}
    />
  );

  switch (kind) {
    case "withdraw":
      return confirm(
        "撤回审核",
        RotateCcw,
        <>文件将撤回并删除此文件，是否继续？</>,
        "确认撤回",
        "已撤回审核并删除文件",
        true,
      );
    case "delete":
      return confirm(
        "删除文件",
        Trash2,
        <>
          确定删除已驳回文件{" "}
          <strong className="font-medium text-kb-heading">{record.fileName}</strong>
          ？删除后不可恢复。
        </>,
        "确认删除",
        "文件已删除",
        true,
      );
    case "terminate":
      return confirm("终止文件解析", Ban, <>终止后，本次解析任务将停止，文件将恢复为待解析状态。</>, "确认终止", "已终止解析");
    case "startParse":
      return confirm("开始解析", RefreshCw, <>确认开始解析 <strong className="font-medium text-kb-heading">{record.fileName}</strong>？</>, "确认解析", "已开始解析");
    case "reparse":
      return confirm("重新解析", RefreshCw, <>重新解析会覆盖当前解析结果，是否继续？</>, "确认解析", "已重新发起解析");
    case "takedown":
      return confirm("申请下架", Ban, <>提交下架申请后，<strong className="font-medium text-kb-heading">{record.fileName}</strong> 将不再对外可见。</>, "提交申请", "下架申请已提交");
    case "restore":
      return confirm("申请恢复", RotateCcw, <>申请恢复后，需管理员审核通过后重新启用。</>, "提交申请", "恢复申请已提交");
    case "reason": {
      const reasonTitle =
        getReviewStatus(record) === "REJECTED"
          ? "驳回原因"
          : getParseStage(record) === "ERROR"
            ? "异常原因"
            : "查看原因";
      return (
        <InfoDialog open title={reasonTitle} titleIcon={Info} onClose={onClose}>
          <ReasonBody record={record} file={file} />
        </InfoDialog>
      );
    }
    case "progress":
      return <InfoDialog open size="compact" className="upload-progress-dialog" title="解析进度" titleIcon={RefreshCw} onClose={onClose}><ProgressBody record={record} /></InfoDialog>;
    case "detail":
    case "submitDetail":
      return <InfoDialog open title={kind === "submitDetail" ? "查看提交详情" : "查看详情"} titleIcon={Info} onClose={onClose}><DetailBody record={record} file={file} /></InfoDialog>;
    case "parseResult":
      return <InfoDialog open title="查看解析结果" titleIcon={FileStack} onClose={onClose}><ParseResultBody record={record} /></InfoDialog>;
    case "approveRecord":
      return <InfoDialog open title="查看审批记录" titleIcon={ClipboardList} onClose={onClose}><ApproveRecordBody record={record} /></InfoDialog>;
    case "replace":
      return <NewVersionBody open record={record} title="替换文件" onClose={onClose} onConfirm={() => onConfirm("文件已替换并重新提交")} />;
    default:
      return null;
  }
}

function ConfirmDialog({ open, title, titleIcon, fileName, description, confirmLabel, danger, onClose, onConfirm }: { open: boolean; title: string; titleIcon: LucideIcon; fileName: string; description: ReactNode; confirmLabel: string; danger?: boolean; onClose: () => void; onConfirm: () => void }) {
  return (
    <AppFormDialog open={open} size="small" variant="confirm" className="upload-confirm-dialog" title={title} titleIcon={titleIcon} onClose={onClose} footer={<><AppDialogButton variant="outline" className="h-10 min-w-[104px]" onClick={onClose}>取消</AppDialogButton><AppDialogButton variant="primary" className={cn("h-10 min-w-[112px]", danger && "border-destructive bg-destructive hover:border-destructive/90 hover:bg-destructive/90")} onClick={onConfirm}>{confirmLabel}</AppDialogButton></>}>
      <div className="px-7 py-5">
        <div className="rounded-[10px] border border-[#DDECEF] bg-[#F7FBFC] px-4 py-3.5">
          <div className="text-[11.5px] font-medium text-kb-muted">操作文件</div>
          <div className="mt-1 truncate text-[13px] font-medium text-kb-heading">{fileName}</div>
        </div>
        <p className="mt-3.5 text-[13.5px] leading-6 text-kb-body">{description}</p>
      </div>
    </AppFormDialog>
  );
}

function InfoDialog({ open, title, titleIcon, onClose, children, size = "small", className }: { open: boolean; title: string; titleIcon: LucideIcon; onClose: () => void; children: ReactNode; size?: "small" | "compact"; className?: string }) {
  return <AppFormDialog open={open} size={size} variant="detail" className={className} title={title} titleIcon={titleIcon} onClose={onClose}><div className="px-7 py-5">{children}</div></AppFormDialog>;
}

function DetailRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-start gap-3 border-b border-[#EEF2F4] py-2.5 last:border-0">
      <span className="w-20 shrink-0 text-[12.5px] text-kb-muted">{label}</span>
      <span className="min-w-0 flex-1 text-[13px] text-kb-body">{value}</span>
    </div>
  );
}

function DetailBody({ record, file }: { record: UploadRecord; file: ReturnType<typeof getFileById> }) {
  const status = currentStatusOf(record);
  return (
    <div>
      <DetailRow label="文件名" value={record.fileName} />
      <DetailRow label="目标知识库" value={record.targetKnowledgeBaseName} />
      <DetailRow label="当前阶段" value={stageLabel(getCurrentStage(record))} />
      <DetailRow label="当前状态" value={<KbStatusTag tone={status.tone} variant="outline" dot>{status.label}</KbStatusTag>} />
      <DetailRow label="提交时间" value={record.submittedAt} />
      {file?.size && <DetailRow label="文件大小" value={file.size} />}
    </div>
  );
}

function ReasonBody({ record, file }: { record: UploadRecord; file: ReturnType<typeof getFileById> }) {
  const pub = getPublishStage(record);
  const isReject = getReviewStatus(record) === "REJECTED";
  const isParseErr = getParseStage(record) === "ERROR";
  const isDisabled = pub === "DISABLED";
  const reason = isDisabled
    ? (record.disabledReason ?? "已停用")
    : isReject
      ? (record.rejectReason ?? "暂无驳回原因")
      : (record.parseError ?? file?.parseError ?? "暂无异常原因");
  const title = isDisabled ? "已停用" : isReject ? "审核驳回" : "解析异常";
  return (
    <div className="space-y-3">
      <div className="flex items-start gap-2.5 rounded-[8px] border border-[#F4DEC2] bg-[#FEF6EC] px-3.5 py-3">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[#C0691A]" />
        <div>
          <div className="text-[12px] font-medium text-[#C0691A]">{title}</div>
          <p className="mt-1 text-[13px] leading-relaxed text-kb-body">{reason}</p>
        </div>
      </div>
      {(isParseErr || isReject) && (
        <p className="text-[12.5px] text-kb-muted">
          {isReject ? "驳回后流程已结束，如需重新上传请新建文件。" : "修正文件后可点击「重新解析」。"}
        </p>
      )}
    </div>
  );
}

const PARSE_STEPS = ["文件读取", "内容提取", "OCR识别", "内容分块", "索引构建"] as const;

function ProgressBody({ record }: { record: UploadRecord }) {
  const progress = record.parseProgress ?? 46;
  const active = Math.min(PARSE_STEPS.length - 1, Math.max(0, Math.floor(progress / 20)));
  return (
    <div className="space-y-5">
      <section className="rounded-[10px] border border-[#DCEBED] bg-[#F8FBFC] px-4 py-3.5">
        <div className="flex items-start gap-3">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-[8px] bg-primary-soft text-primary">
            <FileStack className="h-4 w-4 stroke-[1.8]" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-[11.5px] font-medium text-kb-muted">正在解析文件</div>
            <div className="mt-1 truncate text-[13.5px] font-medium text-kb-heading">{record.fileName}</div>
          </div>
          <span className="shrink-0 rounded-full bg-primary-soft px-2 py-1 text-[11px] font-semibold tabular-nums text-primary">{progress}%</span>
        </div>
      </section>
      <div className="flex items-center justify-between text-[12px]">
        <span className="font-medium text-kb-body">{PARSE_STEPS[active]}</span>
        <span className="text-kb-muted">第 {active + 1} / {PARSE_STEPS.length} 步</span>
      </div>
      {progress != null && (
        <div className="h-1.5 overflow-hidden rounded-full bg-[#E9F1F3]">
          <div className="h-full rounded-full bg-primary transition-[width] duration-300" style={{ width: `${progress}%` }} />
        </div>
      )}
      {PARSE_STEPS.map((label, idx) => {
        const done = idx < active;
        const cur = idx === active;
        return (
          <div key={label} className="flex items-center gap-3 py-1.5">
            <span className={cn("grid h-7 w-7 place-items-center rounded-full ring-4 ring-white", done && "bg-[#EAF9F1] text-[#159463]", cur && "bg-primary text-white shadow-[0_3px_8px_rgba(52,155,172,0.24)]", !done && !cur && "bg-[#F1F6F7] text-[#91A3AA]")}>
              {done ? <CheckCircle2 className="h-3.5 w-3.5" /> : cur ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Circle className="h-3.5 w-3.5" />}
            </span>
            <span className={cn("text-[13px]", cur && "font-medium text-primary")}>{label}{cur && <span className="ml-1.5 text-[11.5px] font-normal text-kb-muted">进行中…</span>}</span>
          </div>
        );
      })}
    </div>
  );
}

function ParseResultBody({ record }: { record: UploadRecord }) {
  return (
    <div className="space-y-2">
      <p className="text-[13px] text-kb-body">{record.parseResult ?? "解析已完成，暂无详细摘要。"}</p>
      <button type="button" className="text-[12.5px] text-primary hover:underline" onClick={() => toast.message("查看分块内容")}>查看分块内容</button>
    </div>
  );
}

function ApproveRecordBody({ record }: { record: UploadRecord }) {
  const rs = getReviewStatus(record);
  return (
    <div>
      <DetailRow label="审核状态" value={<KbStatusTag tone={reviewStatusTone(rs)} variant="outline" dot>{reviewStatusLabel(rs)}</KbStatusTag>} />
      <DetailRow label="审核人" value={record.reviewerName ?? "—"} />
      <DetailRow label="审核时间" value={record.reviewedAt ?? "—"} />
      <DetailRow label="审核说明" value={record.reviewNote ?? "—"} />
    </div>
  );
}

function ResubmitBody({ open, record, onClose, onConfirm }: { open: boolean; record: UploadRecord; onClose: () => void; onConfirm: () => void }) {
  const [note, setNote] = useState("");
  return (
    <AppFormDialog open={open} size="small" title="修改并重新提交" titleIcon={Pencil} onClose={onClose} footer={<><AppDialogButton variant="outline" onClick={onClose}>取消</AppDialogButton><AppDialogButton variant="primary" onClick={onConfirm}>提交审核</AppDialogButton></>}>
      <div className="space-y-3">
        <div className="rounded-[8px] border border-[#DCEBED] bg-[#F8FAFB] px-3 py-2.5">
          <div className="text-[11px] text-kb-muted">文件</div>
          <div className="mt-0.5 text-[13px] font-medium">{record.fileName}</div>
        </div>
        <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder="补充说明本次修改内容…" className="w-full resize-none rounded-[8px] border border-[#DCEBED] px-3 py-2 text-[13px] outline-none focus:border-primary/40" />
        {record.rejectReason && <p className="text-[12px] text-kb-muted">驳回原因：{record.rejectReason}</p>}
      </div>
    </AppFormDialog>
  );
}

function NewVersionBody({ open, record, title = "上传新版本", onClose, onConfirm }: { open: boolean; record: UploadRecord; title?: string; onClose: () => void; onConfirm: () => void }) {
  return (
    <AppFormDialog open={open} size="small" title={title} titleIcon={ArrowUpFromLine} onClose={onClose} footer={<><AppDialogButton variant="outline" onClick={onClose}>取消</AppDialogButton><AppDialogButton variant="primary" onClick={onConfirm}>提交审核</AppDialogButton></>}>
      <div className="space-y-3">
        <div className="rounded-[8px] border border-[#DCEBED] bg-[#F8FAFB] px-3 py-2.5 text-[13px] font-medium">{record.fileName}</div>
        <KbUploadCard compact title="选择文件" hint="上传后将进入审批流程。" onUpload={onConfirm} />
      </div>
    </AppFormDialog>
  );
}

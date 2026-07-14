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
  Library,
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
import { useMemo, useRef, useState, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { SearchBar } from "@/components/learning/ui";
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
  KbSidebar,
  KbSidebarItem,
  KbSidebarSection,
  KbStatusTag,
  KbTableCellFile,
  KbUploadCard,
} from "@/components/knowledge/ui";
import { UPLOAD_RECORDS } from "@/lib/knowledge/data";
import {
  getBaseById,
  getFileById,
  getMoveTargetBases,
  getPinnedBases,
  listCategoryPathOptions,
} from "@/lib/knowledge/model";
import { loadRecentUploadBaseIds, pushRecentUploadBaseId } from "@/lib/knowledge/recentUpload";
import { getKnowledgeStoreVersion, subscribeKnowledgeStore } from "@/lib/knowledge/store";
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
import type { UploadSearch } from "@/routes/knowledge.uploads";
import { cn } from "@/lib/utils";
import { useSyncExternalStore } from "react";
import { FileVersionHistoryDialog } from "./FileVersionHistoryDialog";
import { KnowledgeSidebarQuickLinks } from "./KnowledgeSidebarQuickLinks";
import { MyUploadTitleBanner } from "./MyUploadTitleBanner";
import { UploadBasePickerDialog } from "./UploadBasePickerDialog";

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

export function MyUploadPage({ search }: { search: UploadSearch }) {
  const navigate = useNavigate({ from: "/knowledge/uploads" });
  const storeVersion = useSyncExternalStore(subscribeKnowledgeStore, getKnowledgeStoreVersion);

  const currentView: UploadView = search.view ?? "all";
  const statusFilter = search.status ?? "all";
  const searchQuery = search.q ?? "";

  const [searchInput, setSearchInput] = useState(searchQuery);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [refreshSeed, setRefreshSeed] = useState(0);
  const [historyFileId, setHistoryFileId] = useState<string | null>(null);
  const [uploadBase, setUploadBase] = useState<KnowledgeBase | null>(null);
  const [basePickerOpen, setBasePickerOpen] = useState(false);
  const [actionDialog, setActionDialog] = useState<ActionDialog>(null);

  const historyFile = historyFileId ? (getFileById(historyFileId) ?? null) : null;
  const meta = UPLOAD_VIEW_META[currentView];
  const counts = useMemo(() => getUploadCounts(UPLOAD_RECORDS), []);

  const categoryFilterOptions = useMemo(
    () => [{ value: "all", label: "全部分类" }, ...listCategoryPathOptions()],
    [storeVersion],
  );

  const commonBases = useMemo(() => {
    const uploadable = getMoveTargetBases();
    const uploadableMap = new Map(uploadable.map((b) => [b.id, b]));
    const seen = new Set<string>();
    const result: KnowledgeBase[] = [];
    for (const id of loadRecentUploadBaseIds()) {
      const base = uploadableMap.get(id);
      if (base && !seen.has(base.id)) {
        result.push(base);
        seen.add(base.id);
      }
    }
    for (const base of getPinnedBases()) {
      const match = uploadableMap.get(base.id);
      if (match && !seen.has(match.id)) {
        result.push(match);
        seen.add(match.id);
      }
    }
    for (const base of uploadable) {
      if (!seen.has(base.id) && result.length < 5) {
        result.push(base);
        seen.add(base.id);
      }
    }
    return result.slice(0, 5);
  }, [storeVersion]);

  const records = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return UPLOAD_RECORDS.filter((record) => {
      if (!belongsToView(currentView, record)) return false;
      if (!matchViewStatus(currentView, record, statusFilter)) return false;
      const base = getBaseById(record.targetKnowledgeBaseId);
      if (categoryFilter !== "all" && base?.categoryId !== categoryFilter) return false;
      if (!q) return true;
      return (
        record.fileName.toLowerCase().includes(q) ||
        record.targetKnowledgeBaseName.toLowerCase().includes(q)
      );
    }).sort((a, b) => (b.updatedAt ?? b.submittedAt).localeCompare(a.updatedAt ?? a.submittedAt));
  }, [currentView, statusFilter, categoryFilter, searchQuery]);

  const setView = (view: UploadView, status = "all") => {
    navigate({ search: (prev) => ({ ...prev, view, status }) });
    setCategoryFilter("all");
  };

  const handleSearch = () => {
    navigate({ search: (prev) => ({ ...prev, q: searchInput || undefined }) });
  };

  const handleUploadAction = (kind: UploadActionKind, record: UploadRecord) => {
    const instant: Partial<Record<UploadActionKind, () => void>> = {
      preview: () => toast.message(`预览 ${record.fileName}`),
      history: () => setHistoryFileId(record.fileId),
      download: () => toast.message(`下载 ${record.fileName}`),
      gotoBase: () => toast.message(`进入 ${record.targetKnowledgeBaseName}`),
      chunks: () => toast.message(`查看 ${record.fileName} 分块内容`),
      parseResult: () => setActionDialog({ kind: "parseResult", record }),
      approveRecord: () => setActionDialog({ kind: "approveRecord", record }),
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
      "newVersion",
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
    <>
      <KbSidebar
        width="browse"
        withDecor
        header={
          <>
            <MyUploadTitleBanner />
            <KnowledgeSidebarQuickLinks />
          </>
        }
      >
        <div className="px-1 pb-3">
          <KbSidebarSection title="上传跟踪">
            <KbSidebarItem
              icon={ListChecks}
              label="全部上传"
              active={currentView === "all" && statusFilter === "all"}
              badge={counts.all || undefined}
              onClick={() => setView("all")}
            />
            <KbSidebarItem
              icon={CircleDashed}
              label="审核进度"
              active={currentView === "review"}
              badge={counts.needRejected || undefined}
              badgeTone={counts.needRejected > 0 ? "danger" : "neutral"}
              badgeTooltip="审核驳回，需修改后重新提交"
              onClick={() => setView("review")}
            />
            <KbSidebarItem
              icon={Loader2}
              label="解析进度"
              active={currentView === "parse"}
              badge={counts.needParseError || undefined}
              badgeTone={counts.needParseError > 0 ? "danger" : "neutral"}
              badgeTooltip="解析异常，需重试"
              onClick={() => setView("parse")}
            />
          </KbSidebarSection>

          <KbSidebarSection title="待我处理">
            <KbSidebarItem
              icon={RefreshCw}
              label="解析异常待重试"
              badge={counts.needParseError || undefined}
              badgeTone={counts.needParseError > 0 ? "danger" : "neutral"}
              active={currentView === "parse" && statusFilter === "ERROR"}
              onClick={() => setView("parse", "ERROR")}
            />
          </KbSidebarSection>

          <KbSidebarSection
            title="最近上传的知识库"
            action={
              <button
                type="button"
                aria-label="上传文件"
                title="上传文件"
                onClick={() => {
                  const recent = loadRecentUploadBaseIds()[0];
                  const uploadable = getMoveTargetBases();
                  const recentBase = recent ? uploadable.find((b) => b.id === recent) : undefined;
                  if (recentBase) openUploadWithBase(recentBase);
                  else setBasePickerOpen(true);
                }}
                className="grid h-6 w-6 place-items-center rounded-[6px] text-kb-muted transition-colors hover:bg-primary-soft/40 hover:text-primary"
              >
                <UploadCloud className="h-4 w-4 stroke-[1.8]" />
              </button>
            }
          >
            {commonBases.map((base) => (
              <div
                key={base.id}
                className="flex min-h-9 items-center gap-1 rounded-[8px] px-3 py-1 text-[12.5px] text-kb-body hover:bg-kb-surface-hover"
              >
                <Library className="h-3.5 w-3.5 shrink-0 stroke-[1.8] text-kb-muted" />
                <span className="min-w-0 flex-1 truncate">{base.name}</span>
                <button
                  type="button"
                  onClick={() => openUploadWithBase(base)}
                  className="shrink-0 rounded-[6px] px-1.5 py-0.5 text-[11px] font-medium text-primary transition-colors hover:bg-primary-soft/40"
                >
                  上传到此库
                </button>
              </div>
            ))}
          </KbSidebarSection>
        </div>
      </KbSidebar>

      <main className={cn("scrollbar-thin", kbMainPanel)}>
        <div className="flex min-h-0 flex-1 flex-col bg-white">
          <div className="min-h-0 flex-1 overflow-y-auto scrollbar-thin p-4">
            <section className="overflow-hidden rounded-[12px] border border-[#DCEBED] bg-white shadow-[0_8px_24px_rgba(31,52,64,0.025)]">
              <div className="border-b border-[#E8F0F2] px-5 py-4">
                <h2 className="text-[15px] font-semibold text-kb-heading">{meta.title}</h2>
                <p className="mt-0.5 text-[12.5px] text-kb-muted">{meta.description}</p>
                <p className="mt-2 text-[12px] text-kb-muted">
                  共 <span className="font-medium text-kb-body">{records.length}</span> 条
                  {meta.countUnit}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 border-b border-[#E8F0F2] px-4 py-3">
                <SearchBar
                  value={searchInput}
                  onChange={setSearchInput}
                  onSearch={handleSearch}
                  placeholder="搜索文件名 / 目标知识库"
                  className="min-w-[220px] max-w-[320px] shrink-0"
                />
                <FilterPills
                  value={statusFilter}
                  onChange={(v) => navigate({ search: (prev) => ({ ...prev, status: v === "all" ? undefined : v }) })}
                  options={getViewStatusOptions(currentView)}
                  label={getViewStatusFilterLabel(currentView)}
                />
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
                  {records.map((record) => (
                    <UploadTrackingRow
                      key={record.id}
                      view={currentView}
                      record={record}
                      onAction={handleUploadAction}
                    />
                  ))}
                </KbDataTable>
              </div>
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
      <UploadFlowDialog base={uploadBase} onClose={() => setUploadBase(null)} onChangeBase={() => { setUploadBase(null); setBasePickerOpen(true); }} />
      <FileVersionHistoryDialog file={historyFile} onClose={() => setHistoryFileId(null)} />
      <TrackingActionDialogs
        dialog={actionDialog}
        onClose={() => setActionDialog(null)}
        onConfirm={(msg) => {
          toast.success(msg);
          setActionDialog(null);
          setRefreshSeed((v) => v + 1);
        }}
      />
    </>
  );
}

/* ─── 动态行 ─── */

function UploadTrackingRow({
  view,
  record,
  onAction,
}: {
  view: UploadView;
  record: UploadRecord;
  onAction: (kind: UploadActionKind, record: UploadRecord) => void;
}) {
  const file = getFileById(record.fileId);
  const actions = getTrackingActions(view, record);

  return (
    <KbDataTableRow variant="flat" className={VIEW_GRIDS[view]}>
      <KbTableCellFile name={record.fileName} type={file?.type ?? "pdf"} size="sm" nameWeight="normal" />
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

/* ─── 上传弹框 ─── */

function UploadFlowDialog({ base, onClose, onChangeBase }: { base: KnowledgeBase | null; onClose: () => void; onChangeBase: () => void }) {
  return (
    <AppFormDialog open={Boolean(base)} size="small" title="上传文件" titleIcon={UploadCloud} onClose={onClose}>
      {base && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 rounded-[8px] border border-[#DCEBED] bg-[#F8FAFB] px-3 py-2">
            <Library className="h-4 w-4 shrink-0 text-primary stroke-[1.8]" />
            <div className="min-w-0">
              <div className="text-[11px] text-kb-muted">目标知识库</div>
              <div className="truncate text-[13px] font-medium text-kb-heading">{base.name}</div>
            </div>
            <button type="button" onClick={onChangeBase} className="ml-auto shrink-0 text-[11.5px] text-primary hover:underline">更换</button>
          </div>
          <KbUploadCard
            compact={false}
            title="拖入文件或选择上传"
            hint={base.scope === "personal" ? "个人库上传免审批，提交后系统自动解析。" : "提交后进入审批，审批通过后系统自动解析。"}
            onUpload={() => {
              pushRecentUploadBaseId(base.id);
              toast.success(base.scope === "personal" ? "文件已进入解析队列" : "文件已提交上传流程");
              onClose();
            }}
          />
        </div>
      )}
    </AppFormDialog>
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

function TrackingActionDialogs({ dialog, onClose, onConfirm }: { dialog: ActionDialog; onClose: () => void; onConfirm: (msg: string) => void }) {
  if (!dialog) return null;
  const { record, kind } = dialog;
  const file = getFileById(record.fileId);

  const confirm = (title: string, icon: LucideIcon, desc: ReactNode, label: string, msg: string, danger?: boolean) => (
    <ConfirmDialog open title={title} titleIcon={icon} description={desc} confirmLabel={label} danger={danger} onClose={onClose} onConfirm={() => onConfirm(msg)} />
  );

  switch (kind) {
    case "withdraw":
      return confirm("撤回审核申请", RotateCcw, <>撤回后，<strong className="font-medium text-kb-heading">{record.fileName}</strong> 将不再进入审批流程，你可以修改文件信息后重新提交。</>, "确认撤回", "已撤回审核申请");
    case "delete":
      return confirm("删除上传记录", Trash2, <>确定删除 <strong className="font-medium text-kb-heading">{record.fileName}</strong> 的上传记录？删除后不可恢复。</>, "确认删除", "上传记录已删除", true);
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
      return <InfoDialog open title="解析进度" titleIcon={RefreshCw} onClose={onClose}><ProgressBody record={record} /></InfoDialog>;
    case "detail":
    case "submitDetail":
      return <InfoDialog open title={kind === "submitDetail" ? "查看提交详情" : "查看详情"} titleIcon={Info} onClose={onClose}><DetailBody record={record} file={file} /></InfoDialog>;
    case "parseResult":
      return <InfoDialog open title="查看解析结果" titleIcon={FileStack} onClose={onClose}><ParseResultBody record={record} /></InfoDialog>;
    case "approveRecord":
      return <InfoDialog open title="查看审批记录" titleIcon={ClipboardList} onClose={onClose}><ApproveRecordBody record={record} /></InfoDialog>;
    case "resubmit":
      return <ResubmitBody open record={record} onClose={onClose} onConfirm={() => onConfirm("已重新提交审核")} />;
    case "newVersion":
      return <NewVersionBody open record={record} onClose={onClose} onConfirm={() => onConfirm("新版本已提交审核")} />;
    case "replace":
      return <NewVersionBody open record={record} title="替换文件" onClose={onClose} onConfirm={() => onConfirm("文件已替换并重新提交")} />;
    default:
      return null;
  }
}

function ConfirmDialog({ open, title, titleIcon, description, confirmLabel, danger, onClose, onConfirm }: { open: boolean; title: string; titleIcon: LucideIcon; description: ReactNode; confirmLabel: string; danger?: boolean; onClose: () => void; onConfirm: () => void }) {
  return (
    <AppFormDialog open={open} size="small" variant="confirm" title={title} titleIcon={titleIcon} onClose={onClose} footer={<><AppDialogButton variant="outline" onClick={onClose}>取消</AppDialogButton><AppDialogButton variant="primary" className={danger ? "border-destructive bg-destructive hover:border-destructive/90 hover:bg-destructive/90" : undefined} onClick={onConfirm}>{confirmLabel}</AppDialogButton></>}>
      <p className="text-[13.5px] leading-relaxed text-kb-body">{description}</p>
    </AppFormDialog>
  );
}

function InfoDialog({ open, title, titleIcon, onClose, children }: { open: boolean; title: string; titleIcon: LucideIcon; onClose: () => void; children: ReactNode }) {
  return <AppFormDialog open={open} size="small" variant="detail" title={title} titleIcon={titleIcon} onClose={onClose}>{children}</AppFormDialog>;
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
          {isReject ? "请根据驳回原因修改后重新提交。" : "修正文件后可点击「重新解析」。"}
        </p>
      )}
    </div>
  );
}

const PARSE_STEPS = ["文件读取", "内容提取", "OCR识别", "内容分块", "索引构建"] as const;

function ProgressBody({ record }: { record: UploadRecord }) {
  const active = 2;
  return (
    <div className="space-y-4">
      <p className="text-[13px] text-kb-muted">正在解析 <span className="font-medium text-kb-body">{record.fileName}</span></p>
      {record.parseProgress != null && (
        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${record.parseProgress}%` }} />
        </div>
      )}
      {PARSE_STEPS.map((label, idx) => {
        const done = idx < active;
        const cur = idx === active;
        return (
          <div key={label} className="flex items-center gap-3 py-1">
            <span className={cn("grid h-6 w-6 place-items-center rounded-full", done && "bg-[#EEFBF3] text-[#159463]", cur && "bg-primary-soft text-primary", !done && !cur && "bg-muted text-kb-muted")}>
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

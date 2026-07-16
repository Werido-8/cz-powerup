import { Check, FileUp, Info, ShieldCheck, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { SearchBar, TABLE_PAGE_SIZE_DEFAULT, TableListPager } from "@/components/learning/ui";
import {
  KbDataTable,
  KbDataTableRow,
  KbDrawer,
  KbEmptyState,
  KbFilterPills,
  KbIconTextButton,
  KbPageContent,
  KbPageHeader,
  KbStatusTag,
  KbTableCellBase,
  KbTableCellFile,
  KbTableCellUser,
} from "@/components/knowledge/ui";
import { PERMISSION_REQUESTS, UPLOAD_APPROVALS } from "@/lib/knowledge/data";
import { listCategoryPathOptions } from "@/lib/knowledge/model";
import type {
  ApprovalStatus,
  KnowledgeBase,
  PermissionRequest,
  UploadApproval,
} from "@/lib/knowledge/types";
import { cn } from "@/lib/utils";
import { FileListCheckbox } from "../FileListCheckbox";
import { useFileSelection } from "../useFileSelection";
import { ApprovalListToolbar } from "./ApprovalListToolbar";

type ApprovalTab = "uploads" | "permissions";

const APPROVAL_TABS: {
  key: ApprovalTab;
  label: string;
  desc: string;
  icon: typeof FileUp;
}[] = [
  {
    key: "uploads",
    label: "文件上传",
    desc: "解析完成后审核文件与 AI 生成内容",
    icon: FileUp,
  },
  {
    key: "permissions",
    label: "权限申请",
    desc: "处理访问权限与库管理权限申请",
    icon: ShieldCheck,
  },
];

const UPLOAD_GRID =
  "grid-cols-[36px_minmax(220px,1.3fr)_minmax(140px,1fr)_100px_96px_120px_minmax(200px,auto)] min-w-[980px]";

const PERMISSION_GRID =
  "grid-cols-[36px_120px_minmax(200px,1.2fr)_minmax(200px,1fr)_100px_minmax(180px,auto)] min-w-[860px]";

function approvalStatusLabel(status?: ApprovalStatus) {
  if (status === "parsing") return "解析中";
  if (status === "approved") return "已通过";
  if (status === "rejected") return "已驳回";
  return "待审批";
}

function approvalStatusTone(status?: ApprovalStatus) {
  if (status === "parsing") return "warning" as const;
  if (status === "approved") return "success" as const;
  if (status === "rejected") return "danger" as const;
  return "warning" as const;
}

export function ApprovalCenterSection({
  manageableBases,
  embedded = false,
}: {
  manageableBases: KnowledgeBase[];
  embedded?: boolean;
}) {
  const manageableIds = new Set(manageableBases.map((base) => base.id));
  const [tab, setTab] = useState<ApprovalTab>("uploads");
  const [uploadItems, setUploadItems] = useState(UPLOAD_APPROVALS);
  const [permissionItems, setPermissionItems] = useState(() =>
    PERMISSION_REQUESTS.filter((request) => manageableIds.has(request.knowledgeBaseId)),
  );
  const [batchLoading, setBatchLoading] = useState<"approve" | "reject" | null>(null);
  const [fileQuery, setFileQuery] = useState("");
  const [submitterFilter, setSubmitterFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(TABLE_PAGE_SIZE_DEFAULT);

  const selection = useFileSelection();

  const submitterOptions = useMemo(() => {
    const names = Array.from(new Set(uploadItems.map((item) => item.submitterName)));
    return [{ value: "all", label: "全部提交人" }, ...names.map((n) => ({ value: n, label: n }))];
  }, [uploadItems]);

  const filteredUploadItems = useMemo(() => {
    const q = fileQuery.trim().toLowerCase();
    return uploadItems.filter((item) => {
      if (submitterFilter !== "all" && item.submitterName !== submitterFilter) return false;
      const status = item.status ?? "pendingApproval";
      if (statusFilter !== "all" && status !== statusFilter) return false;
      if (!q) return true;
      return (
        item.fileName.toLowerCase().includes(q) ||
        item.knowledgeBaseName.toLowerCase().includes(q) ||
        item.submitterName.toLowerCase().includes(q)
      );
    });
  }, [fileQuery, statusFilter, submitterFilter, uploadItems]);

  const currentItems = tab === "uploads" ? filteredUploadItems : permissionItems;
  const filteredIds = useMemo(() => currentItems.map((item) => item.id), [currentItems]);

  useEffect(() => {
    setPage(1);
  }, [tab, fileQuery, submitterFilter, statusFilter, pageSize]);

  useEffect(() => {
    selection.clear();
  }, [tab, fileQuery, submitterFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(currentItems.length / pageSize) || 1);
  const safePage = Math.min(page, totalPages);
  const pagedItems = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return currentItems.slice(start, start + pageSize);
  }, [currentItems, pageSize, safePage]);

  const pageIds = useMemo(() => pagedItems.map((item) => item.id), [pagedItems]);
  const allPageSelected = pageIds.length > 0 && pageIds.every((id) => selection.isSelected(id));
  const somePageSelected = pageIds.some((id) => selection.isSelected(id));

  const handleTabChange = (next: ApprovalTab) => {
    setTab(next);
    selection.clear();
  };

  const removeSelected = useCallback(
    (ids: string[]) => {
      const idSet = new Set(ids);
      if (tab === "uploads") {
        setUploadItems((previous) => previous.filter((item) => !idSet.has(item.id)));
      } else {
        setPermissionItems((previous) => previous.filter((item) => !idSet.has(item.id)));
      }
      selection.clear();
    },
    [selection, tab],
  );

  const handleBatchApprove = useCallback(async () => {
    const ids = selection.selectedArray;
    if (ids.length === 0) return;
    const confirmed =
      typeof window === "undefined" ||
      window.confirm(`确认通过选中的 ${ids.length} ${tab === "uploads" ? "个文件上传" : "条权限申请"}？`);
    if (!confirmed) return;
    setBatchLoading("approve");
    try {
      removeSelected(ids);
      toast.success(
        tab === "uploads" ? `已通过 ${ids.length} 个文件并发布` : `已通过 ${ids.length} 条权限申请`,
      );
    } finally {
      setBatchLoading(null);
    }
  }, [removeSelected, selection.selectedArray, tab]);

  const handleBatchReject = useCallback(async () => {
    const ids = selection.selectedArray;
    if (ids.length === 0) return;
    const reason =
      typeof window !== "undefined"
        ? window.prompt(`请输入驳回原因（将应用于选中的 ${ids.length} 项）`)
        : "";
    if (!reason) return;
    setBatchLoading("reject");
    try {
      removeSelected(ids);
      toast.success(
        tab === "uploads"
          ? `已驳回 ${ids.length} 个文件并记录原因`
          : `已驳回 ${ids.length} 条权限申请`,
      );
    } finally {
      setBatchLoading(null);
    }
  }, [removeSelected, selection.selectedArray, tab]);

  const filterBar =
    tab === "uploads" ? (
      <div className="flex flex-wrap items-center gap-2 border-b border-[#E8F0F2] px-4 py-3">
        <SearchBar
          value={fileQuery}
          onChange={setFileQuery}
          onSearch={() => undefined}
          placeholder="搜索文件名 / 提交人"
          className="min-w-[200px] max-w-[280px]"
        />
        <KbFilterPills
          label="提交人"
          value={submitterFilter}
          onChange={setSubmitterFilter}
          options={submitterOptions}
        />
        <KbFilterPills
          label="状态"
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { value: "all", label: "全部状态" },
            { value: "parsing", label: "解析中" },
            { value: "pendingApproval", label: "待审批" },
            { value: "approved", label: "已通过" },
            { value: "rejected", label: "已驳回" },
          ]}
        />
      </div>
    ) : null;

  const tabPanel = (
    <div
      className={cn(
        "flex min-h-0 flex-1 flex-col overflow-hidden rounded-[12px] border border-[#DCEBED] bg-white shadow-[0_8px_24px_rgba(31,52,64,0.025)]",
        embedded && "rounded-none border-0 shadow-none",
      )}
    >
      <div className="px-5 pt-4">
        <div role="tablist" aria-label="审批台" className="flex items-center gap-1">
          {APPROVAL_TABS.map((item) => {
            const active = tab === item.key;
            const count = item.key === "uploads" ? uploadItems.length : permissionItems.length;
            return (
              <button
                key={item.key}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => handleTabChange(item.key)}
                className={cn(
                  "inline-flex h-9 items-center gap-1.5 border-b-2 px-3 text-[12.5px] font-medium transition-colors",
                  active
                    ? "border-primary text-primary"
                    : "border-transparent text-kb-muted hover:text-kb-body",
                )}
              >
                <item.icon className="h-3.5 w-3.5 stroke-[1.8]" />
                {item.label}
                {count > 0 && (
                  <span
                    className={cn(
                      "min-w-4 rounded-full px-1.5 py-px text-center text-[10px] leading-4",
                      active ? "bg-primary-soft text-primary" : "bg-muted text-kb-muted",
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

      {filterBar}

      <ApprovalListToolbar
        selectedCount={selection.selectedCount}
        totalCount={currentItems.length}
        pageItemCount={pageIds.length}
        isAllResultsSelected={selection.isAllResultsSelected}
        onSelectAllResults={() => selection.selectAllResults(filteredIds)}
        onBatchApprove={handleBatchApprove}
        onBatchReject={handleBatchReject}
        onClearSelection={selection.clear}
        batchLoading={batchLoading}
        entityLabel={tab === "uploads" ? "个文件" : "条申请"}
        left={
          <p className="text-[13px] text-muted-foreground">
            {tab === "uploads"
              ? "公共库文件先解析后审批，可在详情中调整 AI 内容"
              : "勾选申请后可批量通过或驳回"}
          </p>
        }
      />

      <div className="min-h-0 flex-1 overflow-x-auto">
        {tab === "uploads" ? (
          <UploadApprovalTable
            items={pagedItems as UploadApproval[]}
            selection={selection}
            allPageSelected={allPageSelected}
            somePageSelected={somePageSelected}
            pageIds={pageIds}
            onRemove={(id) => removeSelected([id])}
          />
        ) : (
          <PermissionApprovalTable
            items={pagedItems as PermissionRequest[]}
            selection={selection}
            allPageSelected={allPageSelected}
            somePageSelected={somePageSelected}
            pageIds={pageIds}
            onRemove={(id) => removeSelected([id])}
          />
        )}
      </div>

      {currentItems.length > 0 && (
        <TableListPager
          page={safePage}
          totalPages={totalPages}
          totalItems={currentItems.length}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setPage(1);
          }}
        />
      )}
    </div>
  );

  if (embedded) {
    return <div className="flex min-h-0 flex-1 flex-col">{tabPanel}</div>;
  }

  return (
    <KbPageContent>
      <KbPageHeader
        label="状态流转"
        title="审批台"
        description="集中处理文件上传审批与权限申请；公共库上传先解析后进入待审。"
      />
      <div className="mb-4">{tabPanel}</div>
    </KbPageContent>
  );
}

type SelectionApi = ReturnType<typeof useFileSelection>;

function UploadApprovalTable({
  items,
  selection,
  allPageSelected,
  somePageSelected,
  pageIds,
  onRemove,
}: {
  items: UploadApproval[];
  selection: SelectionApi;
  allPageSelected: boolean;
  somePageSelected: boolean;
  pageIds: string[];
  onRemove: (id: string) => void;
}) {
  const [detailItem, setDetailItem] = useState<UploadApproval | null>(null);
  const [editSummary, setEditSummary] = useState("");
  const [editKeywords, setEditKeywords] = useState("");
  const categoryOptions = listCategoryPathOptions();

  const openDetail = (item: UploadApproval) => {
    setDetailItem(item);
    setEditSummary(item.summary ?? "");
    setEditKeywords((item.aiKeywords ?? []).join("、"));
  };

  return (
    <>
      <KbDataTable
        variant="flat"
        minWidth={UPLOAD_GRID}
        header={
          <>
            <span className="flex items-center justify-center">
              <FileListCheckbox
                checked={allPageSelected}
                indeterminate={!allPageSelected && somePageSelected}
                onCheckedChange={(checked) => selection.toggleAll(pageIds, checked)}
                aria-label="全选当前列表"
              />
            </span>
            <span>文件名</span>
            <span>归属知识库</span>
            <span>提交人</span>
            <span>状态</span>
            <span>提交时间</span>
            <span className="text-right">操作</span>
          </>
        }
        empty={
          <KbEmptyState title="暂无待审批上传" description="解析完成后的文件上传申请会出现在这里。" />
        }
      >
        {items.map((item) => {
          const selected = selection.isSelected(item.id);
          const status = item.status ?? "pendingApproval";
          const canApprove = status === "pendingApproval";
          return (
            <KbDataTableRow key={item.id} variant="flat" className={UPLOAD_GRID} selected={selected}>
              <span className="flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
                <FileListCheckbox
                  checked={selected}
                  onCheckedChange={() => selection.toggle(item.id)}
                  aria-label={`选择 ${item.fileName}`}
                />
              </span>
              <KbTableCellFile
                name={item.fileName}
                subtitle={[item.uploadNote, item.fileSize].filter(Boolean).join(" / ")}
                type={item.fileName.endsWith(".pdf") ? "pdf" : "docx"}
              />
              <KbTableCellBase name={item.knowledgeBaseName} />
              <KbTableCellUser name={item.submitterName} />
              <span>
                <KbStatusTag tone={approvalStatusTone(status)} variant="outline" dot>
                  {approvalStatusLabel(status)}
                </KbStatusTag>
              </span>
              <span className="text-kb-muted">{item.submittedAt}</span>
              <span className="flex items-center justify-end gap-2">
                <KbIconTextButton
                  icon={Check}
                  label="通过"
                  variant="primary-text"
                  disabled={!canApprove}
                  onClick={() => {
                    if (!canApprove) {
                      toast.message("需等待解析完成后再审批");
                      return;
                    }
                    onRemove(item.id);
                    toast.success("已通过并发布");
                  }}
                />
                <KbIconTextButton
                  icon={X}
                  label="驳回"
                  variant="danger-text"
                  disabled={!canApprove}
                  onClick={() => {
                    const reason =
                      typeof window !== "undefined" ? window.prompt("请输入驳回原因") : "";
                    if (!reason) return;
                    onRemove(item.id);
                    toast.success("已驳回并记录原因");
                  }}
                />
                <KbIconTextButton icon={Info} label="详情" onClick={() => openDetail(item)} />
              </span>
            </KbDataTableRow>
          );
        })}
      </KbDataTable>

      <KbDrawer
        open={Boolean(detailItem)}
        title="审批详情"
        subtitle={detailItem?.fileName}
        onClose={() => setDetailItem(null)}
      >
        {detailItem && (
          <div className="space-y-4 text-[13px]">
            <DetailRow label="归属知识库" value={detailItem.knowledgeBaseName} />
            <DetailRow label="提交人" value={detailItem.submitterName} />
            <DetailRow label="提交时间" value={detailItem.submittedAt} />
            <DetailRow label="状态" value={approvalStatusLabel(detailItem.status)} />
            <div>
              <div className="text-[12px] font-medium text-kb-muted">分类</div>
              <select
                className="mt-1 w-full rounded-[8px] border border-kb-border px-3 py-2 text-[13px]"
                defaultValue={detailItem.categoryId ?? categoryOptions[0]?.value}
              >
                {categoryOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <div className="text-[12px] font-medium text-kb-muted">摘要（可编辑）</div>
              <textarea
                value={editSummary}
                onChange={(e) => setEditSummary(e.target.value)}
                rows={3}
                className="mt-1 w-full resize-none rounded-[8px] border border-kb-border px-3 py-2 text-[13px]"
              />
            </div>
            <div>
              <div className="text-[12px] font-medium text-kb-muted">关键词（可编辑，顿号分隔）</div>
              <input
                value={editKeywords}
                onChange={(e) => setEditKeywords(e.target.value)}
                className="mt-1 w-full rounded-[8px] border border-kb-border px-3 py-2 text-[13px]"
              />
            </div>
            {(detailItem.aiQuestions ?? []).length > 0 && (
              <div>
                <div className="text-[12px] font-medium text-kb-muted">训练题预览</div>
                <ul className="mt-1 list-inside list-disc text-kb-body">
                  {detailItem.aiQuestions!.map((q) => (
                    <li key={q}>{q}</li>
                  ))}
                </ul>
              </div>
            )}
            {detailItem.riskHint && (
              <div className="rounded-[8px] border border-warning/30 bg-warning-soft p-3 text-warning-foreground">
                {detailItem.riskHint}
              </div>
            )}
          </div>
        )}
      </KbDrawer>
    </>
  );
}

function PermissionApprovalTable({
  items,
  selection,
  allPageSelected,
  somePageSelected,
  pageIds,
  onRemove,
}: {
  items: PermissionRequest[];
  selection: SelectionApi;
  allPageSelected: boolean;
  somePageSelected: boolean;
  pageIds: string[];
  onRemove: (id: string) => void;
}) {
  if (items.length === 0) {
    return (
      <KbEmptyState
        title="暂无权限申请"
        description="用户申请访问或库管理权限后会出现在这里。"
      />
    );
  }

  return (
    <KbDataTable
      variant="flat"
      minWidth={PERMISSION_GRID}
      header={
        <>
          <span className="flex items-center justify-center">
            <FileListCheckbox
              checked={allPageSelected}
              indeterminate={!allPageSelected && somePageSelected}
              onCheckedChange={(checked) => selection.toggleAll(pageIds, checked)}
              aria-label="全选当前列表"
            />
          </span>
          <span>申请人</span>
          <span>目标知识库</span>
          <span>申请理由</span>
          <span>通知</span>
          <span className="text-right">操作</span>
        </>
      }
    >
      {items.map((item) => {
        const selected = selection.isSelected(item.id);
        return (
          <KbDataTableRow key={item.id} variant="flat" className={PERMISSION_GRID} selected={selected}>
            <span className="flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
              <FileListCheckbox
                checked={selected}
                onCheckedChange={() => selection.toggle(item.id)}
                aria-label={`选择 ${item.applicantName}`}
              />
            </span>
            <KbTableCellUser name={item.applicantName} />
            <span className="truncate text-kb-body">{item.knowledgeBaseName}</span>
            <span className="truncate text-kb-muted">{item.reason}</span>
            <span className="text-kb-muted">{item.notifyStatus === "sent" ? "已通知" : "待通知"}</span>
            <span className="flex justify-end gap-2">
              <KbIconTextButton
                icon={Check}
                label="通过"
                variant="primary-text"
                onClick={() => {
                  onRemove(item.id);
                  toast.success("权限申请已通过");
                }}
              />
              <KbIconTextButton
                icon={X}
                label="驳回"
                variant="danger-text"
                onClick={() => {
                  const reason =
                    typeof window !== "undefined" ? window.prompt("请输入驳回原因") : "";
                  if (!reason) return;
                  onRemove(item.id);
                  toast.success("权限申请已驳回");
                }}
              />
            </span>
          </KbDataTableRow>
        );
      })}
    </KbDataTable>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[12px] font-medium text-kb-muted">{label}</div>
      <div className="mt-1 text-kb-body">{value}</div>
    </div>
  );
}

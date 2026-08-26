import { Check, ClipboardCheck, FileText, FileUp, ShieldCheck, X } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { toast } from "sonner";
import { SearchInput, TABLE_PAGE_SIZE_DEFAULT, TableListPager } from "@/components/learning/ui";
import {
  KbDataTable,
  KbDataTableRow,
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
import {
  uploadApprovalReviewLabel,
  uploadApprovalReviewTone,
  uploadSourceTypeLabel,
} from "@/lib/knowledge/status";
import {
  approveStorePermissionRequest,
  getKnowledgeStoreServerSnapshot,
  getKnowledgeStoreVersion,
  getStorePermissionRequests,
  getStoreUploadApprovals,
  rejectStorePermissionRequest,
  subscribeKnowledgeStore,
} from "@/lib/knowledge/store";
import type {
  KnowledgeBase,
  PermissionRequest,
  UploadApproval,
} from "@/lib/knowledge/types";
import { cn } from "@/lib/utils";
import { FileListCheckbox } from "../FileListCheckbox";
import { useFileSelection } from "../useFileSelection";
import { ApprovalListToolbar } from "./ApprovalListToolbar";

type ApprovalTab = "uploads" | "permissions";

const UPLOAD_GRID =
  "grid-cols-[minmax(220px,1.3fr)_minmax(140px,0.95fr)_80px_96px_100px_108px_120px_96px] min-w-[1080px]";

const PERMISSION_GRID =
  "grid-cols-[36px_120px_minmax(200px,1.2fr)_minmax(200px,1fr)_90px_120px_minmax(160px,auto)] min-w-[940px]";

function parseApprovalStatusLabel() {
  return "解析完成";
}

export function ApprovalCenterSection({
  manageableBases,
  embedded = false,
}: {
  manageableBases: KnowledgeBase[];
  embedded?: boolean;
}) {
  const navigate = useNavigate();
  useSyncExternalStore(
    subscribeKnowledgeStore,
    getKnowledgeStoreVersion,
    getKnowledgeStoreServerSnapshot,
  );
  const manageableIds = new Set(manageableBases.map((base) => base.id));
  const [tab, setTab] = useState<ApprovalTab>("uploads");
  const uploadItems = getStoreUploadApprovals();
  const allPermissionItems = getStorePermissionRequests().filter((r) =>
    manageableIds.has(r.knowledgeBaseId),
  );
  const [permissionStatusFilter, setPermissionStatusFilter] = useState("pendingApproval");
  const [batchLoading, setBatchLoading] = useState<"approve" | "reject" | null>(null);
  const [fileQuery, setFileQuery] = useState("");
  const [submitterFilter, setSubmitterFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("pendingApproval");
  const [uploadTypeFilter, setUploadTypeFilter] = useState("all");
  const [permissionQuery, setPermissionQuery] = useState("");
  const [applicantFilter, setApplicantFilter] = useState("all");
  const [permissionBaseFilter, setPermissionBaseFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(TABLE_PAGE_SIZE_DEFAULT);

  const selection = useFileSelection();

  const submitterOptions = useMemo(() => {
    const names = Array.from(new Set(uploadItems.map((item) => item.submitterName)));
    return [{ value: "all", label: "全部提交人" }, ...names.map((n) => ({ value: n, label: n }))];
  }, [uploadItems]);

  const applicantOptions = useMemo(() => {
    const names = Array.from(new Set(allPermissionItems.map((item) => item.applicantName)));
    return [{ value: "all", label: "全部申请人" }, ...names.map((n) => ({ value: n, label: n }))];
  }, [allPermissionItems]);

  const permissionBaseOptions = useMemo(() => {
    const bs = Array.from(new Set(allPermissionItems.map((item) => item.knowledgeBaseName)));
    return [{ value: "all", label: "全部知识库" }, ...bs.map((n) => ({ value: n, label: n }))];
  }, [allPermissionItems]);

  const filteredUploadItems = useMemo(() => {
    const q = fileQuery.trim().toLowerCase();
    return uploadItems
      .filter((item) => {
        if (submitterFilter !== "all" && item.submitterName !== submitterFilter) return false;
        const status = item.status ?? "pendingApproval";
        if (statusFilter !== "all" && status !== statusFilter) return false;
        const uploadType = item.uploadType ?? "direct";
        if (uploadTypeFilter !== "all" && uploadType !== uploadTypeFilter) return false;
        if (!q) return true;
        return (
          item.fileName.toLowerCase().includes(q) ||
          item.knowledgeBaseName.toLowerCase().includes(q) ||
          item.submitterName.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        const aPending = (a.status ?? "pendingApproval") === "pendingApproval";
        const bPending = (b.status ?? "pendingApproval") === "pendingApproval";
        if (aPending !== bPending) return aPending ? -1 : 1;
        return b.submittedAt.localeCompare(a.submittedAt);
      });
  }, [fileQuery, statusFilter, submitterFilter, uploadItems, uploadTypeFilter]);

  const filteredPermissionItems = useMemo(() => {
    const q = permissionQuery.trim().toLowerCase();
    return allPermissionItems
      .filter((item) => {
        if (applicantFilter !== "all" && item.applicantName !== applicantFilter) return false;
        if (permissionBaseFilter !== "all" && item.knowledgeBaseName !== permissionBaseFilter)
          return false;
        if (permissionStatusFilter !== "all" && item.status !== permissionStatusFilter) return false;
        if (!q) return true;
        return (
          item.applicantName.toLowerCase().includes(q) ||
          item.knowledgeBaseName.toLowerCase().includes(q) ||
          item.reason.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        const ap = a.status === "pendingApproval";
        const bp = b.status === "pendingApproval";
        if (ap !== bp) return ap ? -1 : 1;
        return b.submittedAt.localeCompare(a.submittedAt);
      });
  }, [
    allPermissionItems,
    applicantFilter,
    permissionBaseFilter,
    permissionStatusFilter,
    permissionQuery,
  ]);

  const currentItems = tab === "uploads" ? filteredUploadItems : filteredPermissionItems;
  const filteredIds = useMemo(() => currentItems.map((item) => item.id), [currentItems]);

  useEffect(() => {
    setPage(1);
  }, [
    tab,
    fileQuery,
    submitterFilter,
    statusFilter,
    uploadTypeFilter,
    permissionQuery,
    applicantFilter,
    permissionBaseFilter,
    permissionStatusFilter,
    pageSize,
  ]);

  useEffect(() => {
    selection.clear();
  }, [
    tab,
    fileQuery,
    submitterFilter,
    statusFilter,
    uploadTypeFilter,
    permissionQuery,
    applicantFilter,
    permissionBaseFilter,
    permissionStatusFilter,
  ]);

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

  const handleBatchApprove = useCallback(async () => {
    const ids = selection.selectedArray;
    if (ids.length === 0) return;
    const confirmed =
      typeof window === "undefined" ||
      window.confirm(`确认通过选中的 ${ids.length} 条权限申请？`);
    if (!confirmed) return;
    setBatchLoading("approve");
    try {
      ids.forEach((id) => approveStorePermissionRequest(id));
      selection.clear();
      toast.success(`已通过 ${ids.length} 条权限申请`);
    } finally {
      setBatchLoading(null);
    }
  }, [selection]);

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
      ids.forEach((id) => rejectStorePermissionRequest(id, reason));
      selection.clear();
      toast.success(`已驳回 ${ids.length} 条权限申请`);
    } finally {
      setBatchLoading(null);
    }
  }, [selection]);

  const filterBar =
    tab === "uploads" ? (
      <div className="flex flex-wrap items-center gap-2 border-b border-[#E8F0F2] px-4 py-3">
        <SearchInput
          value={fileQuery}
          onChange={setFileQuery}
          placeholder="搜索文件名 / 提交人"
          className="h-9 min-w-[200px] max-w-[280px] flex-1 !rounded-[8px] py-0"
        />
        <KbFilterPills
          label="提交人"
          value={submitterFilter}
          onChange={setSubmitterFilter}
          options={submitterOptions}
        />
        <KbFilterPills
          label="来源"
          value={uploadTypeFilter}
          onChange={setUploadTypeFilter}
          options={[
            { value: "all", label: "全部来源" },
            { value: "direct", label: "文件上传" },
            { value: "move", label: "移动入库" },
            { value: "copy", label: "复制入库" },
          ]}
        />
        <KbFilterPills
          label="状态"
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { value: "all", label: "全部状态" },
            { value: "pendingApproval", label: "待审批" },
            { value: "approved", label: "已通过" },
            { value: "rejected", label: "已驳回" },
          ]}
        />
      </div>
    ) : (
      <div className="flex flex-wrap items-center gap-2 border-b border-[#E8F0F2] px-4 py-3">
        <SearchInput
          value={permissionQuery}
          onChange={setPermissionQuery}
          placeholder="搜索申请人 / 目标知识库"
          className="h-9 min-w-[200px] max-w-[280px] flex-1 !rounded-[8px] py-0"
        />
        <KbFilterPills
          label="申请人"
          value={applicantFilter}
          onChange={setApplicantFilter}
          options={applicantOptions}
        />
        <KbFilterPills
          label="知识库"
          value={permissionBaseFilter}
          onChange={setPermissionBaseFilter}
          options={permissionBaseOptions}
        />
        <KbFilterPills
          label="状态"
          value={permissionStatusFilter}
          onChange={setPermissionStatusFilter}
          options={[
            { value: "all", label: "全部状态" },
            { value: "pendingApproval", label: "待审批" },
            { value: "approved", label: "已通过" },
            { value: "rejected", label: "已驳回" },
          ]}
        />
      </div>
    );

  const tabPanel = (
    <div
      className={cn(
        "flex min-h-0 flex-1 flex-col overflow-hidden rounded-[12px] border border-[#DCEBED] bg-white shadow-[0_8px_24px_rgba(31,52,64,0.025)]",
        embedded && "rounded-none border-0 shadow-none",
      )}
    >
      <div className="px-5 pt-4">
        <div role="tablist" aria-label="审批台" className="flex items-center gap-1">
          {(
            [
              { key: "uploads" as const, label: "文件入库", icon: FileUp },
              { key: "permissions" as const, label: "权限申请", icon: ShieldCheck },
            ] satisfies { key: ApprovalTab; label: string; icon: typeof FileUp }[]
          ).map((item) => {
            const active = tab === item.key;
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
              </button>
            );
          })}
        </div>
      </div>

      <div
        className="border-y border-[#E8F0F2]"
        style={{ borderTop: "none", paddingTop: "0px" }}
      />

      {filterBar}

      {tab === "uploads" ? null : tab === "permissions" ? (
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
          entityLabel="条申请"
          left={<p className="text-[13px] text-muted-foreground">可批量通过或驳回已勾选申请</p>}
        />
      ) : null}

      <div className="min-h-0 flex-1 overflow-x-auto">
        {tab === "uploads" ? (
          <UploadApprovalTable
            items={pagedItems as UploadApproval[]}
            onReview={(approvalId) =>
              navigate({
                to: "/knowledge/approval/$approvalId",
                params: { approvalId },
              })
            }
          />
        ) : (
          <PermissionApprovalTable
            items={pagedItems as PermissionRequest[]}
            selection={selection}
            allPageSelected={allPageSelected}
            somePageSelected={somePageSelected}
            pageIds={pageIds}
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
        description="处理文件移入、入库内容确认与权限申请；直传入库为单次审批，移入为两次审批。"
      />
      <div className="mb-4">{tabPanel}</div>
    </KbPageContent>
  );
}

type SelectionApi = ReturnType<typeof useFileSelection>;

function UploadApprovalTable({
  items,
  onReview,
}: {
  items: UploadApproval[];
  onReview: (id: string) => void;
}) {
  return (
    <KbDataTable
      variant="flat"
      minWidth={UPLOAD_GRID}
      header={
        <>
          <span>文件名</span>
          <span>归属知识库</span>
          <span>提交人</span>
          <span>上传类型</span>
          <span>解析状态</span>
          <span>审核状态</span>
          <span>提交时间</span>
          <span className="text-right">操作</span>
        </>
      }
      empty={<KbEmptyState title="暂无审批记录" description="解析完成后的文件上传申请会出现在这里。" />}
    >
      {items.map((item) => {
        const status = item.status ?? "pendingApproval";
        const uploadType = item.uploadType ?? "direct";
        return (
          <KbDataTableRow
            key={item.id}
            variant="flat"
            className={UPLOAD_GRID}
            onClick={() => onReview(item.id)}
          >
            <KbTableCellFile
              name={item.fileName}
              subtitle={[item.uploadNote, item.fileSize].filter(Boolean).join(" / ")}
              type={item.fileName.endsWith(".pdf") ? "pdf" : "docx"}
              size="sm"
              nameWeight="normal"
            />
            <KbTableCellBase name={item.knowledgeBaseName} />
            <KbTableCellUser name={item.submitterName} />
            <span>
              <KbStatusTag
                tone={uploadType === "move" || uploadType === "copy" ? "accent" : "neutral"}
                variant="outline"
              >
                {uploadSourceTypeLabel(uploadType)}
              </KbStatusTag>
            </span>
            <span>
              <KbStatusTag tone="success" variant="outline" dot>
                {parseApprovalStatusLabel()}
              </KbStatusTag>
            </span>
            <span>
              <KbStatusTag tone={uploadApprovalReviewTone(status)} variant="outline" dot>
                {uploadApprovalReviewLabel(status, uploadType)}
              </KbStatusTag>
            </span>
            <span className="text-kb-muted">{item.submittedAt}</span>
            <span className="flex items-center justify-end" onClick={(event) => event.stopPropagation()}>
              <KbIconTextButton
                icon={status === "pendingApproval" ? ClipboardCheck : FileText}
                label={status === "pendingApproval" ? "审批" : "查看"}
                variant={status === "pendingApproval" ? "primary-text" : "ghost"}
                onClick={() => onReview(item.id)}
              />
            </span>
          </KbDataTableRow>
        );
      })}
    </KbDataTable>
  );
}

const PERMISSION_STATUS_LABEL: Record<string, string> = {
  pendingApproval: "待审批",
  approved: "已通过",
  rejected: "已驳回",
};
const PERMISSION_STATUS_TONE: Record<string, "warning" | "success" | "danger" | "neutral"> = {
  pendingApproval: "warning",
  approved: "success",
  rejected: "danger",
};

function PermissionApprovalTable({
  items,
  selection,
  allPageSelected,
  somePageSelected,
  pageIds,
}: {
  items: PermissionRequest[];
  selection: SelectionApi;
  allPageSelected: boolean;
  somePageSelected: boolean;
  pageIds: string[];
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
          <span>申请时间</span>
          <span>状态</span>
          <span className="text-right">操作</span>
        </>
      }
    >
      {items.map((item) => {
        const selected = selection.isSelected(item.id);
        const isPending = item.status === "pendingApproval";
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
            <span className="truncate text-[12px] text-kb-muted">{item.submittedAt}</span>
            <span>
              <KbStatusTag
                tone={PERMISSION_STATUS_TONE[item.status] ?? "neutral"}
                variant="outline"
                dot
              >
                {PERMISSION_STATUS_LABEL[item.status] ?? item.status}
              </KbStatusTag>
            </span>
            <span className="flex justify-end gap-2">
              {isPending ? (
                <>
                  <KbIconTextButton
                    icon={Check}
                    label="通过"
                    variant="primary-text"
                    onClick={() => {
                      approveStorePermissionRequest(item.id);
                      toast.success(`已通过「${item.applicantName}」的权限申请`);
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
                      rejectStorePermissionRequest(item.id, reason);
                      toast.success("权限申请已驳回");
                    }}
                  />
                </>
              ) : item.status === "rejected" && item.rejectReason ? (
                <span
                  className="max-w-[200px] truncate text-[12px] text-danger"
                  title={item.rejectReason}
                >
                  {item.rejectReason}
                </span>
              ) : null}
            </span>
          </KbDataTableRow>
        );
      })}
    </KbDataTable>
  );
}

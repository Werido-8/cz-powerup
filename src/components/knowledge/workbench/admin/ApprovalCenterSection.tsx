import { Check, ClipboardCheck, FileText, FileUp, ShieldCheck, X } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { toast } from "sonner";
import { SearchBar, TABLE_PAGE_SIZE_DEFAULT, TableListPager } from "@/components/learning/ui";
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
import { PERMISSION_REQUESTS } from "@/lib/knowledge/data";
import {
  getKnowledgeStoreServerSnapshot,
  getKnowledgeStoreVersion,
  getStoreUploadApprovals,
  subscribeKnowledgeStore,
} from "@/lib/knowledge/store";
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
  "grid-cols-[minmax(240px,1.4fr)_minmax(150px,1fr)_100px_108px_108px_120px_96px] min-w-[980px]";

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
  const [permissionItems, setPermissionItems] = useState(() =>
    PERMISSION_REQUESTS.filter((request) => manageableIds.has(request.knowledgeBaseId)),
  );
  const [batchLoading, setBatchLoading] = useState<"approve" | "reject" | null>(null);
  const [fileQuery, setFileQuery] = useState("");
  const [submitterFilter, setSubmitterFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("pendingApproval");
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
    const names = Array.from(new Set(permissionItems.map((item) => item.applicantName)));
    return [{ value: "all", label: "全部申请人" }, ...names.map((n) => ({ value: n, label: n }))];
  }, [permissionItems]);

  const permissionBaseOptions = useMemo(() => {
    const bases = Array.from(new Set(permissionItems.map((item) => item.knowledgeBaseName)));
    return [{ value: "all", label: "全部知识库" }, ...bases.map((n) => ({ value: n, label: n }))];
  }, [permissionItems]);

  const filteredUploadItems = useMemo(() => {
    const q = fileQuery.trim().toLowerCase();
    return uploadItems
      .filter((item) => {
        if (submitterFilter !== "all" && item.submitterName !== submitterFilter) return false;
        const status = item.status ?? "pendingApproval";
        if (statusFilter !== "all" && status !== statusFilter) return false;
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
  }, [fileQuery, statusFilter, submitterFilter, uploadItems]);

  const filteredPermissionItems = useMemo(() => {
    const q = permissionQuery.trim().toLowerCase();
    return permissionItems.filter((item) => {
      if (applicantFilter !== "all" && item.applicantName !== applicantFilter) return false;
      if (permissionBaseFilter !== "all" && item.knowledgeBaseName !== permissionBaseFilter) return false;
      if (!q) return true;
      return (
        item.applicantName.toLowerCase().includes(q) ||
        item.knowledgeBaseName.toLowerCase().includes(q) ||
        item.reason.toLowerCase().includes(q)
      );
    });
  }, [applicantFilter, permissionBaseFilter, permissionItems, permissionQuery]);

  const currentItems = tab === "uploads" ? filteredUploadItems : filteredPermissionItems;
  const filteredIds = useMemo(() => currentItems.map((item) => item.id), [currentItems]);

  useEffect(() => {
    setPage(1);
  }, [tab, fileQuery, submitterFilter, statusFilter, permissionQuery, applicantFilter, permissionBaseFilter, pageSize]);

  useEffect(() => {
    selection.clear();
  }, [tab, fileQuery, submitterFilter, statusFilter, permissionQuery, applicantFilter, permissionBaseFilter]);

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
      setPermissionItems((previous) => previous.filter((item) => !idSet.has(item.id)));
      selection.clear();
    },
    [selection],
  );

  const handleBatchApprove = useCallback(async () => {
    const ids = selection.selectedArray;
    if (ids.length === 0) return;
    const confirmed =
      typeof window === "undefined" ||
      window.confirm(`确认通过选中的 ${ids.length} 条权限申请？`);
    if (!confirmed) return;
    setBatchLoading("approve");
    try {
      removeSelected(ids);
      toast.success(`已通过 ${ids.length} 条权限申请`);
    } finally {
      setBatchLoading(null);
    }
  }, [removeSelected, selection.selectedArray]);

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
      toast.success(`已驳回 ${ids.length} 条权限申请`);
    } finally {
      setBatchLoading(null);
    }
  }, [removeSelected, selection.selectedArray]);

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
            { value: "pendingApproval", label: "待审批" },
            { value: "approved", label: "已通过" },
            { value: "rejected", label: "已驳回" },
          ]}
        />
      </div>
    ) : (
      <div className="flex flex-wrap items-center gap-2 border-b border-[#E8F0F2] px-4 py-3">
        <SearchBar
          value={permissionQuery}
          onChange={setPermissionQuery}
          onSearch={() => undefined}
          placeholder="搜索申请人 / 目标知识库"
          className="min-w-[200px] max-w-[280px]"
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

      <div
        className="border-y border-[#E8F0F2]"
        style={{ borderTop: "none", paddingTop: "0px" }}
      />

      {filterBar}


      {tab === "uploads" ? (
        <div className="flex min-h-[52px] items-center border-b border-divider px-4 py-2.5">
          <p className="text-[13px] text-muted-foreground">
            文件已完成解析。点击“审批”进入工作台，核对并修改 AI 生成内容后再提交结果。
          </p>
        </div>
      ) : (
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
          left={<p className="text-[13px] text-muted-foreground">勾选申请后可批量通过或驳回</p>}
        />
      )}

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
        return (
          <KbDataTableRow key={item.id} variant="flat" className={UPLOAD_GRID}>
            <KbTableCellFile
              name={item.fileName}
              subtitle={[item.uploadNote, item.fileSize].filter(Boolean).join(" / ")}
              type={item.fileName.endsWith(".pdf") ? "pdf" : "docx"}
            />
            <KbTableCellBase name={item.knowledgeBaseName} />
            <KbTableCellUser name={item.submitterName} />
            <span>
              <KbStatusTag tone="success" variant="outline" dot>
                {parseApprovalStatusLabel()}
              </KbStatusTag>
            </span>
            <span>
              <KbStatusTag tone={approvalStatusTone(status)} variant="outline" dot>
                {approvalStatusLabel(status)}
              </KbStatusTag>
            </span>
            <span className="text-kb-muted">{item.submittedAt}</span>
            <span className="flex items-center justify-end">
              <KbIconTextButton
                icon={status === "pendingApproval" ? ClipboardCheck : FileText}
                label={status === "pendingApproval" ? "审批" : "查看"}
                variant={status === "pendingApproval" ? "primary-text" : "default"}
                onClick={() => onReview(item.id)}
              />
            </span>
          </KbDataTableRow>
        );
      })}
    </KbDataTable>
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

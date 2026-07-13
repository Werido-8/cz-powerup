import { Check, FileUp, Info, ShieldCheck, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ModulePanel, ModuleTabs } from "@/components/learning/ui";
import {
  KbDataTable,
  KbDataTableRow,
  KbDrawer,
  KbEmptyState,
  KbIconTextButton,
  KbPageContent,
  KbPageHeader,
  KbStatusTag,
  KbTableCellBase,
  KbTableCellFile,
  KbTableCellUser,
} from "@/components/knowledge/ui";
import { PERMISSION_REQUESTS, UPLOAD_APPROVALS } from "@/lib/knowledge/data";
import { permissionGroupLabel } from "@/lib/knowledge/model";
import type { KnowledgeBase, PermissionRequest, UploadApproval } from "@/lib/knowledge/types";
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
    desc: "审核用户上传至知识库的文件",
    icon: FileUp,
  },
  {
    key: "permissions",
    label: "权限申请",
    desc: "处理浏览、上传与管理权限申请",
    icon: ShieldCheck,
  },
];

const UPLOAD_GRID =
  "grid-cols-[36px_minmax(240px,1.4fr)_minmax(160px,1fr)_120px_130px_minmax(200px,auto)] min-w-[900px]";

const PERMISSION_GRID =
  "grid-cols-[36px_120px_minmax(200px,1.2fr)_100px_minmax(200px,1fr)_100px_minmax(180px,auto)] min-w-[960px]";

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

  const selection = useFileSelection();

  const currentItems = tab === "uploads" ? uploadItems : permissionItems;
  const pageIds = useMemo(() => currentItems.map((item) => item.id), [currentItems]);
  const allPageSelected = pageIds.length > 0 && pageIds.every((id) => selection.isSelected(id));
  const somePageSelected = pageIds.some((id) => selection.isSelected(id));

  useEffect(() => {
    selection.clear();
  }, [tab]);

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
        tab === "uploads"
          ? `已通过 ${ids.length} 个文件，进入解析`
          : `已通过 ${ids.length} 条权限申请`,
      );
    } finally {
      setBatchLoading(null);
    }
  }, [removeSelected, selection.selectedArray, tab]);

  const handleBatchReject = useCallback(async () => {
    const ids = selection.selectedArray;
    if (ids.length === 0) return;

    if (tab === "uploads") {
      const reason =
        typeof window !== "undefined"
          ? window.prompt(`请输入驳回原因（将应用于选中的 ${ids.length} 个文件）`)
          : "";
      if (!reason) return;
    } else {
      const confirmed =
        typeof window === "undefined" ||
        window.confirm(`确认驳回选中的 ${ids.length} 条权限申请？`);
      if (!confirmed) return;
    }

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

  const tabPanel = (
    <ModulePanel className={cn("flex min-h-0 flex-1 flex-col", embedded && "rounded-none border-0 shadow-none")}>
      <ModuleTabs
        compact
        className={embedded ? "!bg-transparent px-4" : undefined}
        tabs={APPROVAL_TABS.map((item) => ({
          key: item.key,
          label: item.label,
          desc: item.desc,
          icon: <item.icon className="h-4 w-4" />,
        }))}
        value={tab}
        onChange={handleTabChange}
      />

      <ApprovalListToolbar
        selectedCount={selection.selectedCount}
        totalCount={currentItems.length}
        pageItemCount={pageIds.length}
        isAllResultsSelected={selection.isAllResultsSelected}
        onSelectAllResults={() => selection.selectAllResults(pageIds)}
        onBatchApprove={handleBatchApprove}
        onBatchReject={handleBatchReject}
        onClearSelection={selection.clear}
        batchLoading={batchLoading}
        entityLabel={tab === "uploads" ? "个文件" : "条申请"}
        left={
          <p className="text-[13px] text-muted-foreground">
            {tab === "uploads"
              ? "勾选文件后可批量通过或驳回"
              : "勾选申请后可批量通过或驳回"}
          </p>
        }
      />

      <div className="min-h-0 flex-1 overflow-x-auto">
        {tab === "uploads" ? (
          <UploadApprovalTable
            items={uploadItems}
            selection={selection}
            allPageSelected={allPageSelected}
            somePageSelected={somePageSelected}
            pageIds={pageIds}
            onRemove={(id) => removeSelected([id])}
          />
        ) : (
          <PermissionApprovalTable
            items={permissionItems}
            selection={selection}
            allPageSelected={allPageSelected}
            somePageSelected={somePageSelected}
            pageIds={pageIds}
            onRemove={(id) => removeSelected([id])}
          />
        )}
      </div>
    </ModulePanel>
  );

  if (embedded) {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        {tabPanel}
      </div>
    );
  }

  return (
    <KbPageContent>
      <KbPageHeader
        label="状态流转"
        title="审批台"
        description="集中处理文件上传审批与权限申请，审批通过后进入解析或授权生效。"
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
            <span>提交时间</span>
            <span className="text-right">操作</span>
          </>
        }
        empty={
          <KbEmptyState title="暂无待审批上传" description="新的文件上传申请会出现在这里。" />
        }
      >
        {items.map((item) => {
          const selected = selection.isSelected(item.id);
          return (
            <KbDataTableRow key={item.id} variant="flat" className={UPLOAD_GRID} selected={selected}>
              <span
                className="flex items-center justify-center"
                onClick={(event) => event.stopPropagation()}
              >
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
              <span className="text-kb-muted">{item.submittedAt}</span>
              <span className="flex items-center justify-end gap-2">
                <KbIconTextButton
                  icon={Check}
                  label="通过"
                  variant="primary-light"
                  onClick={() => {
                    onRemove(item.id);
                    toast.success("已通过，文件进入解析");
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
                    toast.success("已驳回并记录原因");
                  }}
                />
                <KbIconTextButton
                  icon={Info}
                  label="详情"
                  onClick={() => setDetailItem(item)}
                />
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
            <DetailRow label="文件大小" value={detailItem.fileSize ?? "-"} />
            <DetailRow label="上传说明" value={detailItem.uploadNote ?? "-"} />
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
        description="用户申请浏览、上传或管理权限后会出现在这里。"
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
          <span>权限组</span>
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
            <span
              className="flex items-center justify-center"
              onClick={(event) => event.stopPropagation()}
            >
              <FileListCheckbox
                checked={selected}
                onCheckedChange={() => selection.toggle(item.id)}
                aria-label={`选择 ${item.applicantName}`}
              />
            </span>
            <KbTableCellUser name={item.applicantName} />
            <span className="truncate text-kb-body">{item.knowledgeBaseName}</span>
            <span>
              <KbStatusTag tone="accent">{permissionGroupLabel(item.group)}</KbStatusTag>
            </span>
            <span className="truncate text-kb-muted">{item.reason}</span>
            <span className="text-kb-muted">
              {item.notifyStatus === "sent" ? "已通知" : "待通知"}
            </span>
            <span className="flex justify-end gap-2">
              <KbIconTextButton
                icon={Check}
                label="通过"
                variant="primary-light"
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

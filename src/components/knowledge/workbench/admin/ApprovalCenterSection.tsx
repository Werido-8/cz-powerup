import { AlertTriangle, Check, Clock, FileUp, Info, ShieldCheck, X } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  KbButton,
  KbDataTable,
  KbDataTableRow,
  KbDrawer,
  KbEmptyState,
  KbIconButton,
  KbIconTextButton,
  KbPageContent,
  KbPageHeader,
  KbSegmentControl,
  KbStatStrip,
  KbStatusTag,
  KbTableCellBase,
  KbTableCellFile,
  KbTableCellUser,
} from "@/components/knowledge/ui";
import { PERMISSION_REQUESTS, UPLOAD_APPROVALS } from "@/lib/knowledge/data";
import { permissionGroupLabel } from "@/lib/knowledge/model";
import type { KnowledgeBase, PermissionRequest, UploadApproval } from "@/lib/knowledge/types";

const UPLOAD_GRID =
  "grid-cols-[minmax(240px,1.4fr)_minmax(160px,1fr)_120px_130px_100px_minmax(140px,1fr)_minmax(180px,auto)] min-w-[1100px]";

export function ApprovalCenterSection({
  manageableBases,
}: {
  manageableBases: KnowledgeBase[];
}) {
  const [tab, setTab] = useState("uploads");
  const manageableIds = new Set(manageableBases.map((base) => base.id));
  const permissionRequests = PERMISSION_REQUESTS.filter((request) =>
    manageableIds.has(request.knowledgeBaseId),
  );

  const stats = useMemo(
    () => ({
      pending: UPLOAD_APPROVALS.length + permissionRequests.length,
      today: UPLOAD_APPROVALS.length,
      uploads: UPLOAD_APPROVALS.length,
      permissions: permissionRequests.length,
    }),
    [permissionRequests.length],
  );

  return (
    <KbPageContent>
      <KbPageHeader
        label="状态流转"
        title="审批台"
        description="集中处理文件上传审批与权限申请，审批通过后进入解析或授权生效。"
      />

      <KbStatStrip
        items={[
          { label: "待审批", value: stats.pending, icon: Clock },
          { label: "今日新增", value: stats.today, icon: FileUp },
          { label: "文件上传", value: stats.uploads, icon: FileUp },
          { label: "权限申请", value: stats.permissions, icon: ShieldCheck },
        ]}
      />

      <div className="mb-4">
        <KbSegmentControl
          value={tab}
          onChange={setTab}
          options={[
            { value: "uploads", label: "文件上传" },
            { value: "permissions", label: "权限申请" },
          ]}
        />
      </div>

      {tab === "uploads" ? (
        <UploadApprovalTable items={UPLOAD_APPROVALS} />
      ) : (
        <PermissionApprovalTable items={permissionRequests} />
      )}
    </KbPageContent>
  );
}

function UploadApprovalTable({ items }: { items: UploadApproval[] }) {
  const [detailItem, setDetailItem] = useState<UploadApproval | null>(null);

  return (
    <>
      <KbDataTable
        minWidth={UPLOAD_GRID}
        header={
          <>
            <span>文件名</span>
            <span>目标知识库</span>
            <span>提交人</span>
            <span>提交时间</span>
            <span>审批类型</span>
            <span>风险提示</span>
            <span className="text-right">操作</span>
          </>
        }
        empty={
          <KbEmptyState title="暂无待审批上传" description="新的文件上传申请会出现在这里。" />
        }
      >
        {items.map((item) => (
          <KbDataTableRow key={item.id} className={UPLOAD_GRID}>
            <KbTableCellFile
              name={item.fileName}
              subtitle={[item.uploadNote, item.fileSize].filter(Boolean).join(" / ")}
              type={item.fileName.endsWith(".pdf") ? "pdf" : "docx"}
            />
            <KbTableCellBase
              name={item.knowledgeBaseName}
              department={item.departmentName}
            />
            <KbTableCellUser name={item.submitterName} />
            <span className="text-kb-muted">{item.submittedAt}</span>
            <span>
              <KbStatusTag tone="accent">文件上传</KbStatusTag>
            </span>
            <span className="flex min-w-0 items-center gap-1.5 text-[12px] text-warning-foreground">
              {item.riskHint ? (
                <>
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0 stroke-[1.8]" />
                  <span className="truncate">{item.riskHint}</span>
                </>
              ) : (
                <span className="text-kb-muted">-</span>
              )}
            </span>
            <span className="flex items-center justify-end gap-2">
              <KbIconTextButton
                icon={Check}
                label="通过"
                variant="primary-light"
                onClick={() => toast.success("已通过，文件进入解析")}
              />
              <KbIconTextButton
                icon={X}
                label="驳回"
                variant="danger-text"
                onClick={() => {
                  const reason =
                    typeof window !== "undefined" ? window.prompt("请输入驳回原因") : "";
                  if (reason) toast.success("已驳回并记录原因");
                }}
              />
              <KbIconButton
                icon={Info}
                label="详情"
                onClick={() => setDetailItem(item)}
              />
            </span>
          </KbDataTableRow>
        ))}
      </KbDataTable>

      <KbDrawer
        open={Boolean(detailItem)}
        title="审批详情"
        subtitle={detailItem?.fileName}
        onClose={() => setDetailItem(null)}
      >
        {detailItem && (
          <div className="space-y-4 text-[13px]">
            <DetailRow label="目标知识库" value={detailItem.knowledgeBaseName} />
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

function PermissionApprovalTable({ items }: { items: PermissionRequest[] }) {
  if (items.length === 0) {
    return (
      <KbEmptyState
        title="暂无权限申请"
        description="用户申请浏览、上传或管理权限后会出现在这里。"
      />
    );
  }

  const GRID =
    "grid-cols-[120px_minmax(200px,1.2fr)_100px_minmax(200px,1fr)_100px_minmax(160px,auto)] min-w-[900px]";

  return (
    <KbDataTable
      minWidth={GRID}
      header={
        <>
          <span>申请人</span>
          <span>目标知识库</span>
          <span>权限组</span>
          <span>申请理由</span>
          <span>通知</span>
          <span className="text-right">操作</span>
        </>
      }
    >
      {items.map((item) => (
        <KbDataTableRow key={item.id} className={GRID}>
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
              onClick={() => toast.success("权限申请已通过")}
            />
            <KbIconTextButton
              icon={X}
              label="驳回"
              variant="danger-text"
              onClick={() => toast.success("权限申请已驳回")}
            />
          </span>
        </KbDataTableRow>
      ))}
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

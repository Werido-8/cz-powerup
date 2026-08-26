import { RefreshCw } from "lucide-react";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { SearchInput, TABLE_PAGE_SIZE_DEFAULT, TableListPager } from "@/components/learning/ui";
import {
  KbDataTable,
  KbDataTableRow,
  KbEmptyState,
  KbFilterPills,
  KbStatusTag,
} from "@/components/knowledge/ui";
import { getCurrentKnowledgeUser } from "@/lib/knowledge/demoRole";
import {
  getKnowledgeStoreServerSnapshot,
  getKnowledgeStoreVersion,
  getStorePermissionRequests,
  subscribeKnowledgeStore,
} from "@/lib/knowledge/store";
import type { PermissionRequest, PermissionRequestStatus } from "@/lib/knowledge/types";

const PERMISSION_GROUP_LABEL: Record<string, string> = {
  view: "查看",
  upload: "上传",
  manage: "管理",
};

const STATUS_LABEL: Record<PermissionRequestStatus, string> = {
  pendingApproval: "审批中",
  approved: "已通过",
  rejected: "已驳回",
};

const STATUS_TONE: Record<PermissionRequestStatus, "warning" | "success" | "danger"> = {
  pendingApproval: "warning",
  approved: "success",
  rejected: "danger",
};

const STATUS_OPTIONS = [
  { value: "all", label: "全部状态" },
  { value: "pendingApproval", label: "审批中" },
  { value: "approved", label: "已通过" },
  { value: "rejected", label: "已驳回" },
] as const;

const REQUEST_GRID =
  "grid-cols-[minmax(160px,1.1fr)_80px_minmax(200px,1.5fr)_130px_130px_92px] min-w-[860px]";

export function MyPermissionRequestsPanel() {
  const storeVersion = useSyncExternalStore(
    subscribeKnowledgeStore,
    getKnowledgeStoreVersion,
    getKnowledgeStoreServerSnapshot,
  );
  const currentUser = getCurrentKnowledgeUser();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(TABLE_PAGE_SIZE_DEFAULT);
  const [refreshSeed, setRefreshSeed] = useState(0);

  const myRequests = useMemo(
    () =>
      getStorePermissionRequests()
        .filter((item) => item.applicantId === currentUser.id || item.applicantId === "u-current")
        .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt)),
    [currentUser.id, storeVersion],
  );

  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return myRequests.filter((item) => {
      if (statusFilter !== "all" && item.status !== statusFilter) return false;
      if (!keyword) return true;
      return (
        item.knowledgeBaseName.toLowerCase().includes(keyword) ||
        item.reason.toLowerCase().includes(keyword)
      );
    });
  }, [myRequests, query, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize) || 1);
  const safePage = Math.min(page, totalPages);
  const paged = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, pageSize, safePage]);

  useEffect(() => {
    setPage(1);
  }, [query, statusFilter, pageSize]);

  const empty = (
    <KbEmptyState
      title="暂无权限申请"
      description={
        query || statusFilter !== "all"
          ? "当前筛选下暂无记录，试试调整关键词或状态。"
          : "在知识库无权限时提交申请后，记录会显示在这里。"
      }
    />
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-white">
      <div className="min-h-0 flex-1 overflow-y-auto scrollbar-thin p-4">
        <section className="overflow-hidden rounded-[12px] border border-[#DCEBED] bg-white/95 shadow-[0_8px_24px_rgba(31,52,64,0.025)]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E8F0F2] px-5 py-4">
            <div>
              <h2 className="text-[16px] font-semibold text-[#102A33]">权限申请</h2>
              <p className="mt-0.5 text-[12px] text-[#6B7F88]">
                查看已提交的知识库权限申请及审批状态。
              </p>
            </div>
            <div className="text-[12px] text-[#6B7F88]">
              共 <span className="font-semibold tabular-nums text-[#102A33]">{filtered.length}</span> 条申请
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 border-b border-[#E8F0F2] bg-[#FAFCFD] px-4 py-3">
            <SearchInput
              value={query}
              onChange={setQuery}
              placeholder="请输入知识库名称或申请理由"
              className="h-9 max-w-[360px] flex-1 !rounded-[8px] py-0"
            />
            <KbFilterPills
              label="状态"
              value={statusFilter}
              onChange={setStatusFilter}
              options={STATUS_OPTIONS}
            />
            <div className="ml-auto">
              <button
                type="button"
                onClick={() => {
                  setPage(1);
                  setRefreshSeed((seed) => seed + 1);
                }}
                className="grid h-9 w-9 cursor-pointer place-items-center rounded-[8px] border border-[#DCEBED] text-[#6B7F88] transition-colors hover:border-primary/35 hover:text-primary"
                aria-label="刷新"
                title="刷新"
              >
                <RefreshCw className="size-4 stroke-[1.8]" />
              </button>
            </div>
          </div>

          <div key={refreshSeed} className="min-h-0 overflow-x-auto">
            {paged.length === 0 ? (
              empty
            ) : (
              <KbDataTable
                variant="flat"
                minWidth={REQUEST_GRID}
                className="border-0 shadow-none"
                header={
                  <>
                    <span>知识库</span>
                    <span>申请权限</span>
                    <span>申请理由</span>
                    <span>提交时间</span>
                    <span>处理时间</span>
                    <span>状态</span>
                  </>
                }
              >
                {paged.map((item) => (
                  <PermissionRequestRow key={item.id} item={item} />
                ))}
              </KbDataTable>
            )}
          </div>
        </section>
      </div>

      {filtered.length > 0 && (
        <TableListPager
          page={safePage}
          totalPages={totalPages}
          totalItems={filtered.length}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
      )}
    </div>
  );
}

function PermissionRequestRow({ item }: { item: PermissionRequest }) {
  return (
    <KbDataTableRow variant="flat" className={REQUEST_GRID}>
      <span className="truncate font-medium text-[#1A2E36]" title={item.knowledgeBaseName}>
        {item.knowledgeBaseName}
      </span>
      <span className="text-kb-muted">{PERMISSION_GROUP_LABEL[item.group] ?? item.group}</span>
      <div className="min-w-0">
        <p className="truncate text-kb-muted" title={item.reason}>
          {item.reason}
        </p>
        {item.status === "rejected" && item.rejectReason && (
          <p className="mt-0.5 truncate text-[12px] text-[#E44A4A]" title={item.rejectReason}>
            驳回：{item.rejectReason}
          </p>
        )}
      </div>
      <span className="truncate tabular-nums text-kb-muted">{item.submittedAt}</span>
      <span className="truncate tabular-nums text-kb-muted">{item.reviewedAt ?? "—"}</span>
      <KbStatusTag tone={STATUS_TONE[item.status]} variant="outline" dot className="w-fit">
        {STATUS_LABEL[item.status]}
      </KbStatusTag>
    </KbDataTableRow>
  );
}

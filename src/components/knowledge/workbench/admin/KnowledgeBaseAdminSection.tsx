import {
  CircleOff,
  FileText,
  FolderSearch,
  KeyRound,
  Library,
  Pencil,
  RefreshCw,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  PillSelect,
  TABLE_PAGE_SIZE_DEFAULT,
  TableListPager,
} from "@/components/learning/ui";
import kbStatsBackground from "@/assets/image.png";
import {
  KbDataTable,
  KbDataTableRow,
  KbEmptyState,
  KbFilterBar,
  KbFilterSelect,
  KbIconTextButton,
  KbPageContent,
  KbPageHeader,
  KbStatStrip,
  KbStatusTag,
} from "@/components/knowledge/ui";
import { KNOWLEDGE_CATEGORIES, KNOWLEDGE_DEPARTMENTS } from "@/lib/knowledge/data";
import { canConfigureBasePermission } from "@/lib/knowledge/model";
import { baseStatusLabel, baseStatusTone } from "@/lib/knowledge/status";
import type { KnowledgeBase } from "@/lib/knowledge/types";
import { cn } from "@/lib/utils";
import { FileListRefreshButton } from "../KnowledgeFileTable";

const GRID =
  "grid-cols-[minmax(280px,1.6fr)_minmax(180px,1fr)_minmax(130px,0.8fr)_minmax(200px,auto)] min-w-[920px]";

const adminPanelShadow = "shadow-[0_1px_4px_rgba(52,155,172,0.06)]";

function baseIconClass(scope: KnowledgeBase["scope"]) {
  if (scope === "personal") return "bg-primary-soft text-primary";
  if (scope === "public") return "bg-muted text-[#4E5969]";
  return "bg-[#F1F7FF] text-[#2F6FB0]";
}

export function KnowledgeBaseAdminSection({
  bases,
  onEdit,
  onToggleStatus,
  onPermission,
  embedded = false,
}: {
  bases: KnowledgeBase[];
  onCreate: () => void;
  onEdit: (base: KnowledgeBase) => void;
  onToggleStatus: (base: KnowledgeBase) => void;
  onPermission: (base: KnowledgeBase) => void;
  embedded?: boolean;
}) {
  const [departmentId, setDepartmentId] = useState("all");
  const [categoryId, setCategoryId] = useState("all");
  const [status, setStatus] = useState<string>("all");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(TABLE_PAGE_SIZE_DEFAULT);
  const [refreshSeed, setRefreshSeed] = useState(0);

  const filteredBases = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return bases.filter((base) => {
      if (departmentId !== "all" && base.departmentId !== departmentId) return false;
      if (categoryId !== "all" && base.categoryId !== categoryId) return false;
      if (status !== "all" && base.status !== status) return false;
      if (!normalizedQuery) return true;
      return (
        base.name.toLowerCase().includes(normalizedQuery) ||
        base.description?.toLowerCase().includes(normalizedQuery)
      );
    });
  }, [bases, categoryId, departmentId, query, status]);

  useEffect(() => {
    setPage(1);
  }, [categoryId, departmentId, query, status, pageSize]);

  const enabledCount = bases.filter((b) => b.status === "enabled").length;
  const disabledCount = bases.length - enabledCount;
  const totalFiles = bases.reduce((sum, b) => sum + (b.fileCount ?? 0), 0);
  const totalPages = Math.max(1, Math.ceil(filteredBases.length / pageSize) || 1);
  const safePage = Math.min(page, totalPages);
  const pagedBases = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filteredBases.slice(start, start + pageSize);
  }, [filteredBases, pageSize, safePage]);

  const handleRefresh = () => {
    setRefreshSeed((v) => v + 1);
    toast.message("列表已刷新");
  };

  const statsPanel = (
    <div
      className={cn(
        "relative overflow-hidden rounded-[12px] border border-[#E6F0F2] bg-white",
        adminPanelShadow,
      )}
    >
      <img
        src={kbStatsBackground}
        alt=""
        aria-hidden
        className="pointer-events-none absolute inset-0 h-full w-full object-cover object-[right_center] opacity-[0.22] select-none"
        draggable={false}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 w-[min(72%,580px)] bg-gradient-to-r from-white via-white/92 to-white/55"
      />
      <div className="relative z-[1]">
        <KbStatStrip
          variant="divided"
          className="mb-0"
          items={[
            { label: "知识库总数", value: bases.length, icon: Library, iconTone: "primary" },
            { label: "启用中", value: enabledCount, icon: RefreshCw, iconTone: "success" },
            { label: "停用", value: disabledCount, icon: CircleOff, iconTone: "warning" },
            { label: "文件总量", value: totalFiles, icon: FolderSearch, iconTone: "info" },
          ]}
        />
      </div>
    </div>
  );

  const filterPanel = (
    <div
      className={cn(
        "rounded-[12px] border border-[#E6F0F2] bg-white px-4 py-3",
        adminPanelShadow,
      )}
    >
      <KbFilterBar
        className="mb-0"
        searchValue={query}
        onSearchChange={setQuery}
        searchPlaceholder="搜索知识库名称 / 简介"
        searchClassName="max-w-[360px] !rounded-[8px]"
        trailing={<FileListRefreshButton onClick={handleRefresh} />}
      />

      <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2.5 border-t border-[#EEF2F4] pt-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="shrink-0 text-[12px] text-kb-muted">部门筛选</span>
          <PillSelect
            value={departmentId}
            onChange={setDepartmentId}
            className="rounded-[10px] border-[#E8F0F2] bg-[#F8FAFB] p-0.5"
            options={[
              { value: "all", label: "全部部门" },
              ...KNOWLEDGE_DEPARTMENTS.map((d) => ({ value: d.id, label: d.name })),
            ]}
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="shrink-0 text-[12px] text-kb-muted">分类</span>
          <KbFilterSelect
            value={categoryId}
            onChange={setCategoryId}
            placeholder="全部分类"
            className="min-w-[140px] border-[#E8F0F2] bg-[#F8FAFB]"
            options={[
              { value: "all", label: "全部分类" },
              ...KNOWLEDGE_CATEGORIES.map((c) => ({ value: c.id, label: c.name })),
            ]}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="shrink-0 text-[12px] text-kb-muted">状态</span>
          <PillSelect
            value={status}
            onChange={setStatus}
            className="rounded-[10px] border-[#E8F0F2] bg-[#F8FAFB] p-0.5"
            options={[
              { value: "all", label: "全部状态" },
              { value: "enabled", label: "启用" },
              { value: "disabled", label: "停用" },
            ]}
          />
        </div>
      </div>
    </div>
  );

  const table = (
    <KbDataTable
      key={refreshSeed}
      variant="flat"
      minWidth={GRID}
      header={
        <>
          <span>知识库名</span>
          <span>分类</span>
          <span className="text-right">文件数 / 状态</span>
          <span className="text-right">操作</span>
        </>
      }
      empty={
        <KbEmptyState title="暂无匹配知识库" description="调整筛选条件后重试。" />
      }
    >
      {pagedBases.map((base) => (
        <KbDataTableRow
          key={base.id}
          variant="flat"
          className={GRID}
          dimmed={base.status === "disabled"}
        >
          <div className="flex min-w-0 items-start gap-3 py-1">
            <span
              className={cn(
                "mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-[8px]",
                baseIconClass(base.scope),
              )}
            >
              <Library className="h-4 w-4 stroke-[1.8]" />
            </span>
            <div className="min-w-0">
              <div className="truncate text-[13.5px] font-semibold text-kb-heading">
                {base.name}
              </div>
              <div className="mt-0.5 line-clamp-1 text-[12px] leading-snug text-kb-muted">
                {base.description ?? "暂无简介"}
              </div>
            </div>
          </div>
          <span className="truncate text-[12.5px] text-kb-muted">
            {base.categoryPath?.join(" / ") ?? "-"}
          </span>
          <span className="flex items-center justify-end gap-2.5 tabular-nums">
            <span className="text-[13px] font-semibold text-kb-heading">
              {base.fileCount ?? 0}
            </span>
            <KbStatusTag tone={baseStatusTone(base.status)}>
              {baseStatusLabel(base.status)}
            </KbStatusTag>
          </span>
          <span className="flex justify-end gap-1">
            <KbIconTextButton icon={Pencil} label="编辑" onClick={() => onEdit(base)} />
            <KbIconTextButton
              icon={KeyRound}
              label="权限"
              disabled={!canConfigureBasePermission(base)}
              onClick={() => onPermission(base)}
            />
            <KbIconTextButton
              icon={base.status === "enabled" ? CircleOff : RefreshCw}
              label={base.status === "enabled" ? "停用" : "启用"}
              onClick={() => onToggleStatus(base)}
            />
          </span>
        </KbDataTableRow>
      ))}
    </KbDataTable>
  );

  const pager = filteredBases.length > 0 && (
    <TableListPager
      page={safePage}
      totalPages={totalPages}
      totalItems={filteredBases.length}
      pageSize={pageSize}
      onPageChange={setPage}
      onPageSizeChange={(size) => {
        setPageSize(size);
        setPage(1);
      }}
    />
  );

  if (embedded) {
    return (
      <div className="flex min-h-0 flex-1 flex-col bg-white">
        <div className="shrink-0 space-y-3 border-b border-[#E8F0F2] bg-[#F8FAFB] px-5 py-4">
          {statsPanel}
          {filterPanel}
        </div>
        <div className="min-h-0 flex-1 overflow-x-auto">{table}</div>
        {pager}
      </div>
    );
  }

  return (
    <KbPageContent>
      <KbPageHeader
        label="管理后台"
        title="库清单"
        description="管理知识库基础信息、使用状态、所属部门、权限范围与文件资产。"
        action={null}
      />
      <div className="space-y-3">
        {statsPanel}
        {filterPanel}
      </div>
      {table}
      {pager}
    </KbPageContent>
  );
}

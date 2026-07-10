import { CircleOff, KeyRound, Library, Pencil, Plus, RefreshCw } from "lucide-react";
import { useMemo, useState } from "react";
import {
  KbButton,
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

const GRID =
  "grid-cols-[minmax(240px,1.5fr)_minmax(150px,1fr)_110px_80px_88px_minmax(200px,auto)] min-w-[1000px]";

function scopeLabel(scope: KnowledgeBase["scope"]) {
  if (scope === "public") return "公共库";
  if (scope === "personal") return "个人库";
  return "部门库";
}

export function KnowledgeBaseAdminSection({
  bases,
  onCreate,
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

  const filteredBases = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return bases.filter((base) => {
      if (departmentId !== "all" && base.departmentId !== departmentId) return false;
      if (categoryId !== "all" && base.categoryId !== categoryId) return false;
      if (status !== "all" && base.status !== status) return false;
      if (!normalizedQuery) return true;
      return (
        base.name.toLowerCase().includes(normalizedQuery) ||
        base.description?.toLowerCase().includes(normalizedQuery) ||
        base.departmentName?.toLowerCase().includes(normalizedQuery)
      );
    });
  }, [bases, categoryId, departmentId, query, status]);

  const enabledCount = bases.filter((b) => b.status === "enabled").length;
  const totalFiles = bases.reduce((sum, b) => sum + (b.fileCount ?? 0), 0);

  const toolbar = (
    <>
      <KbStatStrip
        items={[
          { label: "知识库总数", value: bases.length, icon: Library },
          { label: "启用中", value: enabledCount, icon: RefreshCw },
          { label: "停用", value: bases.length - enabledCount, icon: CircleOff },
          { label: "文件总量", value: totalFiles, icon: Library },
        ]}
      />

      <KbFilterBar
        className={embedded ? "mb-0" : undefined}
        searchValue={query}
        onSearchChange={setQuery}
        searchPlaceholder="搜索知识库名称 / 简介 / 部门"
        searchClassName="max-w-[320px] !rounded-[8px]"
        filters={
          <>
            <KbFilterSelect
              value={departmentId}
              onChange={setDepartmentId}
              placeholder="全部部门"
              options={[
                { value: "all", label: "全部部门" },
                ...KNOWLEDGE_DEPARTMENTS.map((d) => ({ value: d.id, label: d.name })),
              ]}
            />
            <KbFilterSelect
              value={categoryId}
              onChange={setCategoryId}
              placeholder="全部分类"
              options={[
                { value: "all", label: "全部分类" },
                ...KNOWLEDGE_CATEGORIES.map((c) => ({ value: c.id, label: c.name })),
              ]}
            />
            <KbFilterSelect
              value={status}
              onChange={setStatus}
              placeholder="全部状态"
              options={[
                { value: "all", label: "全部状态" },
                { value: "enabled", label: "启用" },
                { value: "disabled", label: "停用" },
              ]}
            />
          </>
        }
      />
    </>
  );

  const table = (
    <KbDataTable
        minWidth={GRID}
        header={
          <>
            <span>知识库名</span>
            <span>分类</span>
            <span>部门</span>
            <span className="text-right">文件数</span>
            <span>状态</span>
            <span className="text-right">操作</span>
          </>
        }
        empty={
          <KbEmptyState title="暂无匹配知识库" description="调整筛选条件后重试。" />
        }
      >
        {filteredBases.map((base) => (
          <KbDataTableRow
            key={base.id}
            className={GRID}
            dimmed={base.status === "disabled"}
          >
            <div className="min-w-0 py-2">
              <div className="flex items-center gap-2">
                <span className="truncate font-semibold text-kb-heading">{base.name}</span>
                <KbStatusTag tone="accent">{scopeLabel(base.scope)}</KbStatusTag>
              </div>
              <div className="mt-0.5 truncate text-[11px] text-kb-muted">
                {base.description}
              </div>
            </div>
            <span className="truncate text-kb-muted">
              {base.categoryPath?.join(" / ") ?? "-"}
            </span>
            <span className="truncate text-kb-muted">{base.departmentName ?? "全厂"}</span>
            <span className="text-right tabular-nums text-kb-body">{base.fileCount ?? 0}</span>
            <span>
              <KbStatusTag tone={baseStatusTone(base.status)}>
                {baseStatusLabel(base.status)}
              </KbStatusTag>
            </span>
            <span className="flex justify-end gap-3">
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

  if (embedded) {
    return (
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="shrink-0 space-y-3 border-b border-divider bg-[#FAFCFD] px-4 py-2.5">
          {toolbar}
        </div>
        <div className="min-h-0 flex-1 overflow-x-auto">{table}</div>
      </div>
    );
  }

  return (
    <KbPageContent>
      <KbPageHeader
        label="管理后台"
        title="知识库"
        description="管理知识库基础信息、使用状态、所属部门、权限范围与文件资产。"
        action={
          <KbButton onClick={onCreate}>
            <Plus className="h-4 w-4 stroke-[1.8]" />
            新建库
          </KbButton>
        }
      />
      {toolbar}
      {table}
    </KbPageContent>
  );
}

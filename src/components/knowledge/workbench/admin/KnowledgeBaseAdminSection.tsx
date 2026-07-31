import { KeyRound, Library, Pencil } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  SearchInput,
  TABLE_PAGE_SIZE_DEFAULT,
  TableListPager,
} from "@/components/learning/ui";
import {
  KbDataTable,
  KbDataTableRow,
  KbEmptyState,
  KbFilterPills,
  KbIconTextButton,
  KbPageContent,
  KbPageHeader,
} from "@/components/knowledge/ui";
import { listCategoryPathOptions } from "@/lib/knowledge/model";
import type { KnowledgeBase } from "@/lib/knowledge/types";
import { cn } from "@/lib/utils";
import { FileListRefreshButton } from "../KnowledgeFileTable";
import { KnowledgeBaseListToolbar } from "./KnowledgeBaseListToolbar";

const GRID =
  "grid-cols-[minmax(260px,1.6fr)_minmax(180px,1fr)_80px_minmax(140px,auto)] gap-x-5 min-w-[760px]";

function baseIconClass(scope: KnowledgeBase["scope"]) {
  if (scope === "personal") return "bg-primary-soft text-primary";
  if (scope === "public") return "bg-muted text-[#4E5969]";
  return "bg-[#F1F7FF] text-[#2F6FB0]";
}

export function KnowledgeBaseAdminSection({
  bases,
  onEdit,
  onPermission,
  embedded = false,
}: {
  bases: KnowledgeBase[];
  onCreate: () => void;
  onEdit: (base: KnowledgeBase) => void;
  onPermission: (base: KnowledgeBase) => void;
  embedded?: boolean;
}) {
  const [categoryId, setCategoryId] = useState("all");
  const [sort, setSort] = useState<"recent" | "name" | "files">("recent");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(TABLE_PAGE_SIZE_DEFAULT);
  const [refreshSeed, setRefreshSeed] = useState(0);

  const categoryFilterOptions = useMemo(
    () => [{ value: "all", label: "全部分类" }, ...listCategoryPathOptions()],
    [],
  );

  const filteredBases = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const list = bases.filter((base) => {
      if (categoryId !== "all" && base.categoryId !== categoryId) return false;
      if (!normalizedQuery) return true;
      return (
        base.name.toLowerCase().includes(normalizedQuery) ||
        base.description?.toLowerCase().includes(normalizedQuery)
      );
    });

    return [...list].sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name, "zh-CN");
      if (sort === "files") return (b.fileCount ?? 0) - (a.fileCount ?? 0);
      return (b.updatedAt ?? "").localeCompare(a.updatedAt ?? "");
    });
  }, [bases, categoryId, query, sort]);

  useEffect(() => {
    setPage(1);
  }, [categoryId, query, sort, pageSize]);

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

  const toolbar = (
    <KnowledgeBaseListToolbar
      left={
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="搜索知识库名称 / 简介"
            className="h-9 min-w-[200px] max-w-[320px] shrink-0 !rounded-[8px] py-0"
          />
          <KbFilterPills
            label="分类"
            value={categoryId}
            onChange={setCategoryId}
            options={categoryFilterOptions}
          />
        </div>
      }
      right={
        <div className="flex items-center gap-2">
          <KbFilterPills
            label="排序"
            align="end"
            value={sort}
            onChange={setSort}
            options={[
              { value: "recent", label: "最近更新" },
              { value: "name", label: "名称" },
              { value: "files", label: "文件数" },
            ]}
          />
          <FileListRefreshButton onClick={handleRefresh} />
        </div>
      }
    />
  );

  const table = (
    <KbDataTable
      key={refreshSeed}
      variant="flat"
      minWidth={GRID}
      className={embedded ? "border-0 shadow-none" : undefined}
      header={
        <>
          <span>知识库名</span>
          <span>分类</span>
          <span className="text-right">文件数</span>
          <span className="text-right">操作</span>
        </>
      }
      empty={
        <KbEmptyState title="暂无匹配知识库" description="调整筛选条件后重试。" />
      }
    >
      {pagedBases.map((base) => (
        <KbDataTableRow key={base.id} variant="flat" className={GRID}>
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
              <div className="truncate text-[13.5px] text-kb-heading">{base.name}</div>
              <div className="mt-0.5 line-clamp-1 text-[12px] leading-snug text-kb-muted">
                {base.description ?? "暂无简介"}
              </div>
            </div>
          </div>
          <span className="truncate text-[12.5px] text-kb-muted">
            {base.categoryPath?.join(" / ") ?? "-"}
          </span>
          <span className="flex items-center justify-end text-[13px] tabular-nums text-kb-body">
            {base.fileCount ?? 0}
          </span>
          <span className="flex justify-end gap-1">
            <KbIconTextButton icon={Pencil} label="编辑" onClick={() => onEdit(base)} />
            <KbIconTextButton
              icon={KeyRound}
              label="权限"
              disabled={base.scope === "personal"}
              onClick={() => onPermission(base)}
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
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="shrink-0 border-b border-[#E8F0F2] px-4 py-3">{toolbar}</div>
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
        description="管理知识库基础信息、权限范围与文件资产。"
        action={null}
      />
      <div className="mb-4">{toolbar}</div>
      {table}
      {pager}
    </KbPageContent>
  );
}

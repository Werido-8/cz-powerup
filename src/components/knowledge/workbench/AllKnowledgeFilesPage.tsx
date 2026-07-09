import { useNavigate } from "@tanstack/react-router";
import { CheckCircle2, Database } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  CardBatchPager,
  StatIconFrame,
  TABLE_PAGE_SIZE_DEFAULT,
  TableListPager,
  Tag,
} from "@/components/learning/ui";
import { toast } from "sonner";
import {
  KbEmptyState,
  KbFilterBar,
  KbFilterCombo,
} from "@/components/knowledge/ui";
import { KNOWLEDGE_BASES, KNOWLEDGE_CATEGORIES } from "@/lib/knowledge/data";
import {
  filterFiles,
  getAllPublishedFiles,
  getAllTags,
  getProfessionalTypes,
  sortKnowledgeFiles,
} from "@/lib/knowledge/model";
import { kbMainPanel } from "@/lib/knowledge/tokens";
import type { KnowledgeFile, KnowledgeSortBy } from "@/lib/knowledge/types";
import { cn } from "@/lib/utils";
import {
  FileViewModeToggle,
  FileListSortButton,
  FileListRefreshButton,
  KnowledgeFileCardGrid,
  KnowledgeFileTable,
  type FileViewMode,
} from "./KnowledgeFileTable";

const CARD_PAGE_SIZE = 16;

export function AllKnowledgeFilesPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [categoryId, setCategoryId] = useState("all");
  const [baseId, setBaseId] = useState("all");
  const [professionalType, setProfessionalType] = useState("all");
  const [tag, setTag] = useState("all");
  const [sortBy, setSortBy] = useState<KnowledgeSortBy>("updated");
  const [viewMode, setViewMode] = useState<FileViewMode>("list");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(TABLE_PAGE_SIZE_DEFAULT);
  const [refreshSeed, setRefreshSeed] = useState(0);

  const allFiles = useMemo(() => getAllPublishedFiles(), []);
  const files = useMemo(
    () =>
      sortKnowledgeFiles(
        filterFiles(allFiles, {
          query,
          categoryId: categoryId === "all" ? undefined : categoryId,
          baseId: baseId === "all" ? undefined : baseId,
          professionalType: professionalType === "all" ? undefined : professionalType,
          tag: tag === "all" ? undefined : tag,
        }),
        sortBy,
      ),
    [allFiles, baseId, categoryId, professionalType, query, sortBy, tag],
  );

  useEffect(() => {
    setPage(1);
  }, [query, categoryId, baseId, professionalType, tag, sortBy, viewMode]);

  const effectivePageSize = viewMode === "card" ? CARD_PAGE_SIZE : pageSize;
  const totalPages = Math.max(1, Math.ceil(files.length / effectivePageSize) || 1);
  const safePage = Math.min(page, totalPages);
  const pagedFiles = useMemo(() => {
    const start = (safePage - 1) * effectivePageSize;
    return files.slice(start, start + effectivePageSize);
  }, [effectivePageSize, files, safePage]);

  const handleOpen = (file: KnowledgeFile) => {
    navigate({
      to: "/knowledge/file/$fileId",
      params: { fileId: file.id },
      search: { kbId: file.knowledgeBaseId },
    });
  };

  const handleRefresh = () => {
    setPage(1);
    setRefreshSeed((v) => v + 1);
    toast.message("列表已刷新");
  };

  const emptyState = (
    <KbEmptyState
      title="没有匹配的资料"
      description="全库资料只展示当前有权访问的已发布文档。可以调整筛选条件后再试。"
    />
  );

  return (
    <main className={cn("scrollbar-thin", kbMainPanel)}>
      <section className="shrink-0 border-b border-divider px-4 py-3">
        <div className="flex min-w-0 items-start gap-3">
          <StatIconFrame icon={<Database className="stroke-[1.8]" />} size="sm" />
          <div className="min-w-0">
            <h1 className="text-[20px] font-semibold tracking-tight text-foreground">全库资料</h1>
            <p className="mt-1 text-[12.5px] text-muted-foreground">
              当前展示有权限访问且已发布的文档，已停用知识库不参与汇总。
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Tag variant="primary" className="h-6 gap-1 rounded-[6px] px-2.5 text-[11px]">
                <CheckCircle2 className="h-3 w-3 stroke-[1.9]" />
                全部可访问资料
              </Tag>
              <Tag variant="outline" className="h-6 rounded-[6px] px-2.5 text-[11px]">
                共 {files.length} 篇
              </Tag>
            </div>
          </div>
        </div>
      </section>

      <div className="shrink-0 border-b border-divider px-4 py-2">
        <KbFilterBar
          className="mb-0"
          searchValue={query}
          onSearchChange={setQuery}
          searchPlaceholder="搜索文件名、摘要、标签"
          searchClassName="max-w-[280px] !rounded-[8px]"
          filters={
            <>
              <KbFilterCombo
                value={categoryId}
                onChange={setCategoryId}
                placeholder="全部分类"
                options={[
                  { value: "all", label: "全部分类" },
                  ...KNOWLEDGE_CATEGORIES.map((item) => ({
                    value: item.id,
                    label: item.name,
                  })),
                ]}
              />
              <KbFilterCombo
                value={baseId}
                onChange={setBaseId}
                placeholder="全部知识库"
                options={[
                  { value: "all", label: "全部知识库" },
                  ...KNOWLEDGE_BASES.filter(
                    (base) => base.status === "enabled" && base.permission.canView,
                  ).map((base) => ({ value: base.id, label: base.name })),
                ]}
              />
              <KbFilterCombo
                value={professionalType}
                onChange={setProfessionalType}
                placeholder="全部专业"
                options={[
                  { value: "all", label: "全部专业" },
                  ...getProfessionalTypes(allFiles).map((item) => ({
                    value: item,
                    label: item,
                  })),
                ]}
              />
              <KbFilterCombo
                value={tag}
                onChange={setTag}
                placeholder="全部标签"
                options={[
                  { value: "all", label: "全部标签" },
                  ...getAllTags(allFiles).map((item) => ({
                    value: item,
                    label: item,
                  })),
                ]}
              />
            </>
          }
          trailing={
            <>
              <span className="text-[12px] text-muted-foreground">共 {files.length} 篇</span>
              <FileViewModeToggle value={viewMode} onChange={setViewMode} />
              <FileListSortButton value={sortBy} onChange={setSortBy} />
              <FileListRefreshButton onClick={handleRefresh} />
            </>
          }
        />
      </div>

      <div key={refreshSeed} className="min-h-0 flex-1 overflow-y-auto">
        {viewMode === "list" ? (
          <KnowledgeFileTable
            files={pagedFiles}
            allLibraryMode
            onOpen={handleOpen}
            className="rounded-none border-0 shadow-none"
            empty={<div className="px-4 py-8">{emptyState}</div>}
          />
        ) : (
          <KnowledgeFileCardGrid
            files={pagedFiles}
            onOpen={handleOpen}
            columns={4}
            compact
            empty={<div className="px-4 py-8">{emptyState}</div>}
          />
        )}
      </div>

      {files.length > 0 &&
        (viewMode === "list" ? (
          <TableListPager
            page={safePage}
            totalPages={totalPages}
            totalItems={files.length}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setPage(1);
            }}
          />
        ) : (
          <div className="border-t border-divider px-4 py-2">
            <CardBatchPager
              page={safePage}
              totalPages={totalPages}
              totalItems={files.length}
              pageSize={CARD_PAGE_SIZE}
              unitLabel="篇资料"
              onPageChange={setPage}
              compact
            />
          </div>
        ))}
    </main>
  );
}

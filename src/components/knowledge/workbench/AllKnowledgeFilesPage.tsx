import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, CheckCircle2, Database } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  ModulePanel,
  StatIconFrame,
  TABLE_PAGE_SIZE_DEFAULT,
  TableListPager,
  Tag,
} from "@/components/learning/ui";
import { cn } from "@/lib/utils";
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
import type { KnowledgeFile, KnowledgeSortBy } from "@/lib/knowledge/types";
import { KnowledgeFileTable } from "./KnowledgeFileTable";

export function AllKnowledgeFilesPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [categoryId, setCategoryId] = useState("all");
  const [baseId, setBaseId] = useState("all");
  const [professionalType, setProfessionalType] = useState("all");
  const [tag, setTag] = useState("all");
  const [sortBy, setSortBy] = useState<KnowledgeSortBy>("updated");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(TABLE_PAGE_SIZE_DEFAULT);

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
  }, [query, categoryId, baseId, professionalType, tag, sortBy]);

  const totalPages = Math.max(1, Math.ceil(files.length / pageSize) || 1);
  const safePage = Math.min(page, totalPages);
  const pagedFiles = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return files.slice(start, start + pageSize);
  }, [files, pageSize, safePage]);

  const handleOpen = (file: KnowledgeFile) => {
    navigate({
      to: "/knowledge/file/$fileId",
      params: { fileId: file.id },
      search: { kbId: file.knowledgeBaseId },
    });
  };

  return (
    <main className="scrollbar-thin min-w-0 flex-1 overflow-y-auto bg-[#F5FAFB]">
      <div className="mx-auto w-full max-w-[1420px] space-y-4 px-5 py-5">
        <section className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3.5">
            <StatIconFrame icon={<Database className="stroke-[1.8]" />} />
            <div className="min-w-0 pt-0.5">
              <h1 className="text-[22px] font-semibold tracking-tight text-foreground">
                全库资料
              </h1>
              <p className="mt-1.5 max-w-[640px] text-[13px] leading-relaxed text-muted-foreground">
                当前展示有权限访问且已发布的文档，已停用知识库不参与汇总。
              </p>
              <div className="mt-2.5 flex flex-wrap items-center gap-2">
                <Tag
                  variant="primary"
                  className="h-6 gap-1 rounded-[6px] px-2.5 text-[11px]"
                >
                  <CheckCircle2 className="h-3 w-3 stroke-[1.9]" />
                  全部可访问资料
                </Tag>
                <Tag variant="outline" className="h-6 rounded-[6px] px-2.5 text-[11px]">
                  共 {files.length} 篇
                </Tag>
              </div>
            </div>
          </div>

          <Link
            to="/knowledge"
            className={cn(
              "inline-flex h-9 items-center gap-1.5 rounded-[8px] border border-border bg-background px-3.5",
              "text-[12.5px] font-medium text-foreground transition-colors",
              "hover:border-primary/30 hover:bg-muted",
            )}
          >
            <ArrowLeft className="h-3.5 w-3.5 stroke-[1.8]" />
            返回知识总览
          </Link>
        </section>

        <ModulePanel className="overflow-hidden">
          <div className="border-b border-divider bg-[#FAFCFD] px-4 py-3">
            <KbFilterBar
              className="mb-0"
              searchValue={query}
              onSearchChange={setQuery}
              searchPlaceholder="搜索文件名、摘要、标签"
              searchClassName="max-w-[300px] !rounded-[8px]"
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
                  <KbFilterCombo
                    value={sortBy}
                    onChange={(value) => setSortBy(value as KnowledgeSortBy)}
                    placeholder="排序"
                    className="min-w-[108px]"
                    options={[
                      { value: "updated", label: "最近更新" },
                      { value: "name", label: "文件名称" },
                      { value: "uploader", label: "上传人" },
                    ]}
                  />
                </>
              }
              trailing={
                <span className="text-[12px] text-muted-foreground">共 {files.length} 篇</span>
              }
            />
          </div>

          <div className="min-h-0">
            <KnowledgeFileTable
              files={pagedFiles}
              showLibrary
              onOpen={handleOpen}
              className="rounded-none border-0 shadow-none"
              empty={
                <div className="px-4 py-10">
                  <KbEmptyState
                    title="没有匹配的资料"
                    description="全库资料只展示当前有权访问的已发布文档。可以调整筛选条件后再试。"
                  />
                </div>
              }
            />
          </div>

          {files.length > 0 && (
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
          )}
        </ModulePanel>
      </div>
    </main>
  );
}

import { Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Database, Search } from "lucide-react";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { KNOWLEDGE_BASES, KNOWLEDGE_CATEGORIES } from "@/lib/knowledge/data";
import {
  filterFiles,
  getAllPublishedFiles,
  getAllTags,
  getProfessionalTypes,
  sortKnowledgeFiles,
} from "@/lib/knowledge/model";
import type { KnowledgeFile, KnowledgeSortBy } from "@/lib/knowledge/types";
import { KnowledgeEmptyState } from "./KnowledgeEmptyState";
import { KnowledgeFileTable } from "./KnowledgeFileTable";
import { KnowledgeSecondaryNav } from "./KnowledgeSecondaryNav";

export function AllKnowledgeFilesPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [categoryId, setCategoryId] = useState("all");
  const [baseId, setBaseId] = useState("all");
  const [professionalType, setProfessionalType] = useState("all");
  const [tag, setTag] = useState("all");
  const [sortBy, setSortBy] = useState<KnowledgeSortBy>("updated");

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

  const handleOpen = (file: KnowledgeFile) => {
    navigate({
      to: "/knowledge/file/$fileId",
      params: { fileId: file.id },
      search: { kbId: file.knowledgeBaseId },
    });
  };

  return (
    <main className="flex min-w-0 flex-1 overflow-hidden bg-kb-surface">
      <aside className="flex w-[220px] shrink-0 flex-col border-r border-kb-border bg-card">
        <div className="border-b border-divider p-2.5">
          <KnowledgeSecondaryNav />
        </div>
      </aside>
      <div className="scrollbar-thin min-w-0 flex-1 overflow-y-auto">
      <div className="mx-auto w-full max-w-[1420px] px-6 py-5">
        <section className="rounded-[12px] border border-[#DCE8EA] bg-white p-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="grid h-9 w-9 place-items-center rounded-[10px] bg-[#EAF7F9] text-[#349BAC] ring-1 ring-[#D7ECEF]">
                  <Database className="h-[18px] w-[18px] stroke-[1.8]" />
                </span>
                <div>
                  <h1 className="text-[22px] font-semibold leading-tight text-[#1F3440]">
                    全库资料
                  </h1>
                  <p className="mt-1 text-[12.5px] text-[#607681]">
                    当前展示有权限访问且已发布的文档，已停用知识库不参与汇总。
                  </p>
                </div>
              </div>
            </div>
            <Link
              to="/knowledge"
              className="inline-flex h-9 items-center gap-1.5 rounded-[9px] border border-[#DCE8EA] bg-white px-3.5 text-[12.5px] font-medium text-[#607681] transition-colors hover:bg-[#F7FAFB] hover:text-[#1F3440]"
            >
              <ArrowLeft className="h-4 w-4 stroke-[1.8]" />
              返回知识总览
            </Link>
          </div>
        </section>

        <section className="mt-4 rounded-[12px] border border-[#DCE8EA] bg-white p-4">
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex h-9 w-[300px] items-center gap-2 rounded-[9px] border border-[#DCE8EA] bg-[#F8FCFC] px-3 text-[12px] focus-within:border-[#B8D8DE]">
              <Search className="h-3.5 w-3.5 text-[#8EA1A8]" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="搜索文件名、摘要、标签"
                className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-[#91A3AA]"
              />
            </label>
            <FilterSelect value={categoryId} onChange={setCategoryId}>
              <option value="all">全部分类</option>
              {KNOWLEDGE_CATEGORIES.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </FilterSelect>
            <FilterSelect value={baseId} onChange={setBaseId}>
              <option value="all">全部知识库</option>
              {KNOWLEDGE_BASES.filter(
                (base) => base.status === "enabled" && base.permission.canView,
              ).map((base) => (
                <option key={base.id} value={base.id}>
                  {base.name}
                </option>
              ))}
            </FilterSelect>
            <FilterSelect value={professionalType} onChange={setProfessionalType}>
              <option value="all">全部专业</option>
              {getProfessionalTypes(allFiles).map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </FilterSelect>
            <FilterSelect value={tag} onChange={setTag}>
              <option value="all">全部标签</option>
              {getAllTags(allFiles).map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </FilterSelect>
            <FilterSelect value={sortBy} onChange={(value) => setSortBy(value as KnowledgeSortBy)}>
              <option value="updated">最近更新</option>
              <option value="name">文件名称</option>
              <option value="uploader">上传人</option>
            </FilterSelect>
            <span className="ml-auto text-[12px] text-[#8EA1A8]">共 {files.length} 篇</span>
          </div>
        </section>

        <div className="mt-4">
          <KnowledgeFileTable
            files={files}
            onOpen={handleOpen}
            empty={
              <KnowledgeEmptyState
                title="没有匹配的资料"
                description="全库资料只展示当前有权访问的已发布文档。可以调整筛选条件后再试。"
              />
            }
          />
        </div>
      </div>
      </div>
    </main>
  );
}

function FilterSelect({
  value,
  onChange,
  children,
}: {
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
}) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="h-9 rounded-[9px] border border-[#DCE8EA] bg-white px-3 text-[12px] text-[#1F3440] outline-none transition-colors focus:border-[#B8D8DE]"
    >
      {children}
    </select>
  );
}

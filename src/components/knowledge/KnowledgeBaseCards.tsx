import { Link } from "@tanstack/react-router";
import { BookOpenCheck, ChevronRight, MoreHorizontal, Plus } from "lucide-react";
import type { KnowledgeBase } from "@/lib/mock/knowledge-space";
import { getRecentFilesForKnowledgeBase } from "@/lib/mock/knowledge-utils";

type KnowledgeBaseCardsProps = {
  bases: KnowledgeBase[];
  showCreate?: boolean;
  onCreate?: () => void;
};

export function KnowledgeBaseCards({
  bases,
  showCreate,
  onCreate,
}: KnowledgeBaseCardsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {bases.map((base) => (
        <KnowledgeBaseCard key={base.id} base={base} />
      ))}
      {showCreate && <CreateKnowledgeBaseCard onClick={onCreate} />}
    </div>
  );
}

function KnowledgeBaseCard({ base }: { base: KnowledgeBase }) {
  const recentFiles = getRecentFilesForKnowledgeBase(base.id);

  return (
    <Link
      to="/knowledge/kb/$kbId"
      params={{ kbId: base.id }}
      className="group flex h-[182px] flex-col rounded-[12px] border border-[#DCE8EA] bg-white p-4 text-left shadow-[0_2px_8px_-4px_rgba(31,52,64,0.12)] transition-all hover:border-[#B8D8DE] hover:shadow-[0_4px_16px_-8px_rgba(52,155,172,0.2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9DD2DA]"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-1 items-center gap-2.5">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[10px] bg-[#EAF7F9] text-[#349BAC]">
            <BookOpenCheck className="h-[17px] w-[17px] stroke-[1.75]" />
          </span>
          <span
            className="min-w-0 flex-1 truncate text-[14px] font-semibold leading-5 text-[#1F3440]"
            title={base.name}
          >
            {base.name}
          </span>
        </div>
        <button
          type="button"
          onClick={(event) => event.preventDefault()}
          className="grid h-7 w-7 shrink-0 place-items-center rounded-[8px] text-[#91A3AA] opacity-0 transition-all group-hover:opacity-100 hover:bg-[#F5FAFB] hover:text-[#607681]"
          aria-label="更多操作"
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </div>

      <p
        className="mt-2 line-clamp-2 text-[12px] leading-[18px] text-[#607681]"
        title={base.description}
      >
        {base.description}
      </p>

      <KnowledgeBaseCardFileList
        files={recentFiles}
        fileCount={base.fileCount}
        parsedCount={base.parsedCount}
      />
    </Link>
  );
}

function KnowledgeBaseCardFileList({
  files,
  fileCount,
  parsedCount,
}: {
  files: Array<{ name: string; updatedAt: string }>;
  fileCount: number;
  parsedCount: number;
}) {
  const displayFiles = files.length > 0 ? files : [{ name: "暂无文件", updatedAt: "" }];

  return (
    <div className="relative mt-2 min-h-0 flex-1">
      <div className="card-file-list relative max-h-[72px] overflow-hidden">
        <div className="space-y-0">
          {displayFiles.slice(0, 3).map((file) => (
            <div
              key={file.name}
              className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-2 text-[12px] leading-[22px]"
            >
              <span className="flex min-w-0 items-center gap-1.5 text-[#354B56]">
                <span className="h-1 w-1 shrink-0 rounded-full bg-[#91A3AA]" />
                <span className="min-w-0 truncate" title={file.name}>
                  {file.name}
                </span>
              </span>
              {file.updatedAt && (
                <span className="shrink-0 text-[#91A3AA]" title={file.updatedAt}>
                  {file.updatedAt}
                </span>
              )}
            </div>
          ))}
        </div>
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-7"
          style={{
            background: "linear-gradient(to bottom, rgba(255,255,255,0), #fff 70%)",
          }}
        />
      </div>
      <div className="card-file-total absolute bottom-0 right-0 z-[2] flex items-center gap-0.5 text-[12px] text-[#168A99]">
        <span>共 {fileCount} 个文件</span>
        {parsedCount > 0 && (
          <span className="text-[#91A3AA]">· {parsedCount} 已解析</span>
        )}
        <ChevronRight className="h-3 w-3" />
      </div>
    </div>
  );
}

function CreateKnowledgeBaseCard({ onClick }: { onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-[182px] flex-col items-center justify-center rounded-[12px] border border-dashed border-[#DCE8EA] bg-[#F8FBFC] px-4 text-center transition-all hover:border-[#349BAC] hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9DD2DA]"
    >
      <span className="grid h-9 w-9 place-items-center rounded-[10px] bg-[#EAF7F9] text-[#349BAC]">
        <Plus className="h-[18px] w-[18px] stroke-[1.8]" />
      </span>
      <span className="mt-2.5 text-[14px] font-medium text-[#1F3440]">新建知识库</span>
      <span className="mt-1 max-w-[200px] text-[12px] leading-[18px] text-[#91A3AA]">
        创建新的知识库，沉淀团队知识资产
      </span>
    </button>
  );
}

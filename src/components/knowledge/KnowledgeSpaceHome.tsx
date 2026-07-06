import { Link } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import type { ReactNode } from "react";
import {
  Building2,
  FileText,
  Globe2,
  Plus,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import type {
  KnowledgeBase,
  KnowledgeDepartment,
  KnowledgeSpaceType,
} from "@/lib/mock/knowledge-space";
import {
  canCreateKnowledgeBaseInDepartment,
  filterKnowledgeBasesByQuery,
  getPersonalKnowledgeBases,
  getRecentKnowledgeBases,
  getRecentKnowledgeFiles,
  getUploadRecords,
  isKnowledgeAdmin,
  uploadStatusLabel,
} from "@/lib/mock/knowledge-utils";
import { FileStatusTag, uploadTone } from "./FileStatusTag";
import { FileTypeIcon } from "./FileTypeIcon";
import { KnowledgeBaseCards } from "./KnowledgeBaseCards";

type KnowledgeSpaceHomeProps = {
  type: KnowledgeSpaceType;
  title: string;
  subtitle: string;
  bases?: KnowledgeBase[];
  department?: KnowledgeDepartment;
  defaultTab?: "recent" | "personal" | "uploads";
};

export function KnowledgeSpaceHome(props: KnowledgeSpaceHomeProps) {
  if (props.type === "mine") return <KnowledgeMineHome defaultTab={props.defaultTab} />;
  if (props.type === "public") return <KnowledgePublicHome {...props} bases={props.bases ?? []} />;
  return <KnowledgeDepartmentHome {...props} bases={props.bases ?? []} />;
}

export function KnowledgePublicHome({
  title,
  subtitle,
  bases,
}: KnowledgeSpaceHomeProps & { bases: KnowledgeBase[] }) {
  return (
    <SpaceLibraryHome
      icon={<Globe2 className="h-7 w-7" />}
      title={title}
      subtitle={subtitle}
      sectionTitle="公共知识库"
      searchPlaceholder="搜索知识库"
      bases={bases}
      canCreate={isKnowledgeAdmin()}
    />
  );
}

export function KnowledgeDepartmentHome({
  title,
  subtitle,
  bases,
  department,
}: KnowledgeSpaceHomeProps & { bases: KnowledgeBase[] }) {
  const canCreate = department ? canCreateKnowledgeBaseInDepartment(department.id) : false;

  return (
    <SpaceLibraryHome
      icon={<Building2 className="h-5 w-5" />}
      title={title}
      subtitle={subtitle}
      sectionTitle="团队知识库"
      searchPlaceholder="搜索知识库"
      bases={bases}
      canCreate={canCreate}
      compactHeader
    />
  );
}

function SpaceLibraryHome({
  icon,
  title,
  subtitle,
  sectionTitle,
  searchPlaceholder,
  bases,
  canCreate,
  compactHeader = false,
}: {
  icon: ReactNode;
  title: string;
  subtitle: string;
  sectionTitle: string;
  searchPlaceholder: string;
  bases: KnowledgeBase[];
  canCreate: boolean;
  compactHeader?: boolean;
}) {
  const [query, setQuery] = useState("");
  const filteredBases = useMemo(() => filterKnowledgeBasesByQuery(bases, query), [bases, query]);

  if (compactHeader) {
    return (
      <main className="scrollbar-thin min-w-0 flex-1 overflow-y-auto bg-[#F5FAFB]">
        <div className="px-6 py-6 lg:px-8">
          <div className="rounded-[12px] border border-[#DCE8EA] bg-white px-5 py-5 lg:px-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex min-w-0 items-center gap-3.5">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[12px] bg-[#EAF7F9] text-[#349BAC]">
                  {icon}
                </span>
                <div className="min-w-0">
                  <h1 className="truncate text-[24px] font-semibold leading-tight text-[#1F3440]">
                    {title}
                  </h1>
                  <div className="mt-0.5 text-[13px] text-[#607681]">{bases.length} 个知识库</div>
                  <p className="mt-0.5 truncate text-[13px] text-[#91A3AA]">{subtitle}</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <label className="flex h-9 w-[200px] items-center gap-2 rounded-[10px] border border-[#DCE8EA] bg-[#F5FAFB] px-3 text-[12px] transition-colors focus-within:border-[#B8D8DE] focus-within:bg-white">
                  <Search className="h-3.5 w-3.5 text-[#91A3AA]" />
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder={searchPlaceholder}
                    className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-[#91A3AA]"
                  />
                </label>
                {canCreate && (
                  <button
                    type="button"
                    onClick={() => toast.message("新建知识库（演示占位）")}
                    className="inline-flex h-9 items-center gap-1.5 rounded-[10px] bg-[#349BAC] px-4 text-[13px] font-medium text-white transition-colors hover:bg-[#2F8D9D]"
                  >
                    <Plus className="h-4 w-4 stroke-[1.9]" />
                    新建知识库
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="mt-5 flex items-center gap-2">
            <h2 className="text-[17px] font-semibold text-[#1F3440]">{sectionTitle}</h2>
            <span className="rounded-[6px] bg-[#EAF7F9] px-1.5 py-0.5 text-[11px] font-medium text-[#168A99]">
              {bases.length}
            </span>
          </div>

          <div className="mt-4">
            {filteredBases.length === 0 ? (
              <div className="rounded-[12px] border border-dashed border-[#DCE8EA] bg-white py-16 text-center text-[13px] text-[#607681]">
                暂无匹配的知识库
              </div>
            ) : (
              <KnowledgeBaseCards
                bases={filteredBases}
                showCreate={canCreate}
                onCreate={() => toast.message("新建知识库（演示占位）")}
              />
            )}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="scrollbar-thin min-w-0 flex-1 overflow-y-auto bg-white">
      <div className="mx-auto w-full max-w-[1120px] px-9 py-9">
        <div className="flex min-h-[104px] items-center justify-between gap-6">
          <div className="flex min-w-0 items-center gap-4">
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-[18px] bg-[#EAF7F9] text-[#349BAC] shadow-[0_10px_24px_-18px_rgba(52,155,172,0.75)] ring-1 ring-[#D7ECEF]">
              {icon}
            </span>
            <div className="min-w-0">
              <h1 className="truncate text-[28px] font-semibold leading-tight text-[#1F3440]">
                {title}
              </h1>
              <div className="mt-1 text-[12px] font-medium text-[#607681]">{bases.length} 个知识库</div>
              <p className="mt-2 max-w-[520px] truncate text-[12px] text-[#8EA1A8]">{subtitle}</p>
            </div>
          </div>
          {canCreate && (
            <button
              type="button"
              onClick={() => toast.message("新建知识库（演示占位）")}
              className="inline-flex h-9 items-center gap-1.5 rounded-full border border-[#DCE8EA] bg-white px-4 text-[12.5px] font-medium text-[#1F3440] shadow-[0_8px_18px_-16px_rgba(31,52,64,0.5)] transition-all hover:border-[#CFE0E4] hover:bg-[#FBFDFD]"
            >
              <Plus className="h-4 w-4 stroke-[1.9]" />
              新建知识库
            </button>
          )}
        </div>

        <div className="mt-7 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <h2 className="text-[15px] font-semibold text-[#1F3440]">{sectionTitle}</h2>
            <span className="rounded-full bg-[#F3F8F9] px-2 py-0.5 text-[11px] font-medium text-[#8EA1A8]">
              {bases.length}
            </span>
          </div>
          <label className="flex h-9 w-[208px] items-center gap-2 rounded-full border border-[#E2ECEF] bg-[#F7FAFB] px-3 text-[12px] transition-colors focus-within:border-[#B8D8DE] focus-within:bg-white">
            <Search className="h-3.5 w-3.5 text-[#8EA1A8]" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={searchPlaceholder}
              className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-[#91A3AA]"
            />
          </label>
        </div>

        <div className="mt-5">
          {filteredBases.length === 0 ? (
            <div className="rounded-[14px] border border-dashed border-[#DCE8EA] bg-[#F7FAFB] py-16 text-center text-[13px] text-[#607681]">
              暂无匹配的知识库
            </div>
          ) : (
            <KnowledgeBaseCards
              bases={filteredBases}
              showCreate={canCreate}
              onCreate={() => toast.message("新建知识库（演示占位）")}
            />
          )}
        </div>
      </div>
    </main>
  );
}

export function KnowledgeMineHome({
  defaultTab,
}: {
  defaultTab?: "recent" | "personal" | "uploads";
}) {
  const personalBases = getPersonalKnowledgeBases();
  const recentBases = getRecentKnowledgeBases();
  const recentFiles = getRecentKnowledgeFiles();
  const uploads = getUploadRecords();
  const [tab, setTab] = useState<"recent" | "personal" | "uploads">(defaultTab ?? "recent");

  useEffect(() => {
    if (defaultTab) setTab(defaultTab);
  }, [defaultTab]);

  const rows =
    tab === "uploads"
      ? uploads.map((item) => ({
          id: `${item.fileId}-${item.submittedAt}`,
          name: item.file.name,
          baseName: item.target,
          owner: item.file.uploadedBy,
          time: item.submittedAt,
          type: item.file.type,
          status: uploadStatusLabel(item.status),
          statusTone: uploadTone(item.status),
        }))
      : tab === "personal"
        ? personalBases.map((base) => ({
            id: base.id,
            name: base.name,
            baseName: "我的资料",
            owner: base.ownerName,
            time: base.latestUpdateTime,
            type: "other" as const,
            status: `${base.fileCount} 文件`,
            statusTone: "default" as const,
          }))
        : recentFiles.map((item) => ({
            id: item.fileId,
            name: item.file.name,
            baseName: item.base.name,
            owner: item.file.uploadedBy,
            time: item.visitedAt,
            type: item.file.type,
            status: "最近访问",
            statusTone: "primary" as const,
          }));

  return (
    <main className="scrollbar-thin min-w-0 flex-1 overflow-y-auto bg-white">
      <div className="mx-auto w-full max-w-[1100px] px-9 py-9">
        <section>
          <h1 className="text-[16px] font-semibold text-[#1F3440]">最近知识库</h1>
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
            {recentBases.map((item) => (
              <RecentKnowledgeBaseCard key={item.kbId} base={item.base} time={item.visitedAt} />
            ))}
            <button className="flex h-[72px] items-center gap-3 rounded-[10px] border border-[#E2ECEF] bg-[#F7FAFB] px-4 text-left text-[13px] font-medium text-[#607681] transition-all hover:border-[#CFE0E4] hover:bg-white hover:text-[#349BAC] hover:shadow-[0_8px_18px_-18px_rgba(31,52,64,0.45)]">
              <Plus className="h-4 w-4 stroke-[1.9]" />
              去团队知识库逛逛
            </button>
          </div>
        </section>

        <section className="mt-9">
          <div className="flex h-10 items-center gap-6">
            <TabButton active={tab === "recent"} onClick={() => setTab("recent")}>
              最近访问
            </TabButton>
            <TabButton active={tab === "personal"} onClick={() => setTab("personal")}>
              我的资料
            </TabButton>
            <TabButton active={tab === "uploads"} onClick={() => setTab("uploads")}>
              我的上传记录
            </TabButton>
          </div>

          <div className="mt-3 overflow-hidden rounded-[12px] border border-[#E6F0F2] bg-white shadow-[0_12px_28px_-24px_rgba(31,52,64,0.4)]">
            <div className="grid h-11 grid-cols-[minmax(280px,1fr)_180px_120px_150px] items-center border-b border-[#EDF3F5] bg-[#FBFDFD] px-4 text-[12px] text-[#8EA1A8]">
              <span>名称</span>
              <span>知识库</span>
              <span>所有者</span>
              <span className="text-right">浏览时间 / 更新时间</span>
            </div>
            {rows.map((row) => (
              <div
                key={row.id}
                className="grid min-h-[54px] grid-cols-[minmax(280px,1fr)_180px_120px_150px] items-center border-b border-[#EDF3F5] px-4 text-[12.5px] transition-colors last:border-b-0 hover:bg-[#F8FCFC]"
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  <FileTypeIcon type={row.type} size="sm" />
                  <span className="truncate font-medium text-[#1F3440]">{row.name}</span>
                  <FileStatusTag tone={row.statusTone}>{row.status}</FileStatusTag>
                </div>
                <span className="truncate text-[#607681]">{row.baseName}</span>
                <span className="truncate text-[#607681]">{row.owner}</span>
                <span className="text-right text-[#8EA1A8]">{row.time}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

function RecentKnowledgeBaseCard({ base, time }: { base: KnowledgeBase; time: string }) {
  return (
    <Link
      to="/knowledge/kb/$kbId"
      params={{ kbId: base.id }}
      className="flex h-[72px] items-center gap-3 rounded-[10px] border border-[#E2ECEF] bg-white px-4 transition-all hover:border-[#CFE0E4] hover:bg-[#FBFDFD] hover:shadow-[0_8px_18px_-18px_rgba(31,52,64,0.45)]"
    >
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[9px] bg-[#EAF7F9] text-[#349BAC] ring-1 ring-[#D7ECEF]">
        <FileText className="h-[18px] w-[18px] stroke-[1.8]" />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-[13px] font-semibold text-[#1F3440]">{base.name}</span>
        <span className="mt-0.5 block text-[11px] text-[#8EA1A8]">{time} 更新</span>
      </span>
    </Link>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? "h-9 border-b-2 border-[#1F3440] text-[14px] font-semibold text-[#1F3440]"
          : "h-9 border-b-2 border-transparent text-[14px] text-[#91A3AA] hover:text-[#1F3440]"
      }
    >
      {children}
    </button>
  );
}

export function MineSection({
  title,
  icon,
  children,
}: {
  title: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <section>
      <div className="mb-4 flex items-center gap-2 text-[#349BAC]">
        {icon}
        <h2 className="text-[15px] font-bold text-[#1F3440]">{title}</h2>
      </div>
      {children}
    </section>
  );
}

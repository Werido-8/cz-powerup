import { Link, useNavigate } from "@tanstack/react-router";
import {
  Clock3,
  FolderPlus,
  Heart,
  Library,
  Plus,
  UploadCloud,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  KbButton,
  KbDataTable,
  KbDataTableRow,
  KbEmptyState,
  KbFilterBar,
  KbFilterSelect,
  KbInlineStats,
  KbPageContent,
  KbPageHeader,
  KbSegmentControl,
  KbSidebar,
  KbSidebarItem,
  KbSidebarSection,
  KbStatusTag,
  KbTableCellFile,
} from "@/components/knowledge/ui";
import { KNOWLEDGE_BASES, PERSONAL_DIRECTORIES, UPLOAD_RECORDS } from "@/lib/knowledge/data";
import {
  filterFiles,
  getAllTags,
  getFavoriteFiles,
  getFilesForBase,
  getPersonalBases,
  getProfessionalTypes,
  getRecentFiles,
  sortKnowledgeFiles,
} from "@/lib/knowledge/model";
import { publishStatusLabel, publishStatusTone } from "@/lib/knowledge/status";
import type {
  KnowledgeBase,
  KnowledgeFile,
  KnowledgeSortBy,
  UploadRecord,
} from "@/lib/knowledge/types";

import { KnowledgeFileTable } from "./KnowledgeFileTable";
import { KnowledgeSecondaryNav } from "./KnowledgeSecondaryNav";
import { KnowledgeUploadPanel } from "./KnowledgeUploadPanel";

type MySpaceSelection =
  | { kind: "recent" }
  | { kind: "uploads" }
  | { kind: "favorites" }
  | { kind: "personalBase"; baseId: string };

const uploadStatusOptions: Array<{ value: string; label: string }> = [
  { value: "all", label: "全部" },
  { value: "pendingApproval", label: publishStatusLabel("pendingApproval") },
  { value: "rejected", label: publishStatusLabel("rejected") },
  { value: "parsing", label: publishStatusLabel("parsing") },
  { value: "parseFailed", label: publishStatusLabel("parseFailed") },
  { value: "published", label: publishStatusLabel("published") },
  { value: "archived", label: publishStatusLabel("archived") },
];

const UPLOAD_GRID =
  "grid-cols-[minmax(240px,1.4fr)_minmax(160px,1fr)_100px_130px_minmax(180px,1fr)] min-w-[900px]";

export function MySpacePage() {
  const navigate = useNavigate({ from: "/knowledge/mine" });
  const personalBases = useMemo(() => getPersonalBases(), []);
  const [selection, setSelection] = useState<MySpaceSelection>({ kind: "recent" });
  const [query, setQuery] = useState("");
  const [professionalType, setProfessionalType] = useState("all");
  const [tag, setTag] = useState("all");
  const [sortBy, setSortBy] = useState<KnowledgeSortBy>("updated");
  const [uploadStatus, setUploadStatus] = useState<string>("all");

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.location.hash === "#personal" && personalBases[0]) {
      setSelection({ kind: "personalBase", baseId: personalBases[0].id });
    }
  }, [personalBases]);

  const openFile = (file: KnowledgeFile) => {
    navigate({
      to: "/knowledge/file/$fileId",
      params: { fileId: file.id },
      search: { kbId: file.knowledgeBaseId },
    });
  };

  const selectedBase =
    selection.kind === "personalBase"
      ? personalBases.find((base) => base.id === selection.baseId)
      : undefined;

  const personalFiles = useMemo(() => {
    if (!selectedBase) return [];
    return sortKnowledgeFiles(
      filterFiles(getFilesForBase(selectedBase.id), {
        query,
        professionalType: professionalType === "all" ? undefined : professionalType,
        tag: tag === "all" ? undefined : tag,
      }),
      sortBy,
    );
  }, [selectedBase, query, professionalType, tag, sortBy]);

  return (
    <main className="flex min-w-0 flex-1 overflow-hidden bg-kb-surface">
      <KbSidebar
        width="browse"
        header={
          <div className="border-b border-divider p-2.5">
            <KnowledgeSecondaryNav />
            <div className="mt-3 border-t border-divider pt-3">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-kb-muted">
                个人空间
              </p>
              <h1 className="mt-1 text-[15px] font-semibold text-kb-heading">我的空间</h1>
            </div>
          </div>
        }
      >
        <KbSidebarSection>
          <KbSidebarItem
            icon={UploadCloud}
            label="我的上传"
            active={selection.kind === "uploads"}
            onClick={() => setSelection({ kind: "uploads" })}
          />
          <KbSidebarItem
            icon={Heart}
            label="我的收藏"
            active={selection.kind === "favorites"}
            onClick={() => setSelection({ kind: "favorites" })}
          />
          <KbSidebarItem
            icon={Clock3}
            label="最近访问"
            active={selection.kind === "recent"}
            onClick={() => setSelection({ kind: "recent" })}
          />
        </KbSidebarSection>

        <KbSidebarSection title="个人目录与知识库">
          <div className="mb-2 flex items-center justify-end gap-1 px-1">
            <KbButton
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => toast.success("已预留新建个人目录入口")}
              aria-label="新建个人目录"
            >
              <FolderPlus className="h-3.5 w-3.5" />
            </KbButton>
            <KbButton
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => toast.success("已预留新建个人知识库入口")}
              aria-label="新建个人知识库"
            >
              <Plus className="h-3.5 w-3.5" />
            </KbButton>
          </div>
          {PERSONAL_DIRECTORIES.map((directory) => (
            <div key={directory.id} className="mb-2">
              <div className="flex h-8 items-center gap-2 px-3 text-[12px] font-medium text-kb-muted">
                <Library className="h-3.5 w-3.5 stroke-[1.8]" />
                {directory.name}
              </div>
              {personalBases.map((base) => (
                <KbSidebarItem
                  key={base.id}
                  label={base.name}
                  badge={base.fileCount ?? 0}
                  active={selection.kind === "personalBase" && selection.baseId === base.id}
                  onClick={() => setSelection({ kind: "personalBase", baseId: base.id })}
                  indent={1}
                />
              ))}
            </div>
          ))}
        </KbSidebarSection>
      </KbSidebar>

      <section className="scrollbar-thin min-w-0 flex-1 overflow-y-auto">
        {selection.kind === "recent" && <RecentVisitPanel onOpen={openFile} />}
        {selection.kind === "uploads" && (
          <MyUploadPanel status={uploadStatus} onStatusChange={setUploadStatus} />
        )}
        {selection.kind === "favorites" && <FavoritePanel onOpen={openFile} />}
        {selection.kind === "personalBase" && selectedBase && (
          <PersonalBasePanel
            base={selectedBase}
            files={personalFiles}
            query={query}
            professionalType={professionalType}
            tag={tag}
            sortBy={sortBy}
            onQueryChange={setQuery}
            onProfessionalTypeChange={setProfessionalType}
            onTagChange={setTag}
            onSortChange={setSortBy}
            onOpen={openFile}
          />
        )}
      </section>
    </main>
  );
}

function RecentVisitPanel({ onOpen }: { onOpen: (file: KnowledgeFile) => void }) {
  const files = getRecentFiles();
  return (
    <KbPageContent>
      <KbPageHeader
        label="默认视图"
        title="最近访问"
        description="按最近打开顺序展示资料，便于继续阅读和追踪版本。"
        action={
          <Link to="/knowledge">
            <KbButton variant="outline">返回知识总览</KbButton>
          </Link>
        }
      />
      <KnowledgeFileTableWrapper
        files={files}
        onOpen={onOpen}
        emptyTitle="暂无最近访问"
        emptyDescription="打开文件详情后会自动记录在这里。"
      />
    </KbPageContent>
  );
}

function FavoritePanel({ onOpen }: { onOpen: (file: KnowledgeFile) => void }) {
  const files = getFavoriteFiles();
  return (
    <KbPageContent>
      <KbPageHeader
        label="个人沉淀"
        title="我的收藏"
        description="收藏文件可跨知识库聚合查看，后续可同步到学习计划。"
        action={
          <KbButton variant="outline" onClick={() => toast.success("收藏状态已更新")}>
            取消选中收藏
          </KbButton>
        }
      />
      <KnowledgeFileTableWrapper
        files={files}
        onOpen={onOpen}
        emptyTitle="暂无收藏文件"
        emptyDescription="在文件详情页点击收藏后会出现在这里。"
      />
    </KbPageContent>
  );
}

function MyUploadPanel({
  status,
  onStatusChange,
}: {
  status: string;
  onStatusChange: (status: string) => void;
}) {
  const records = UPLOAD_RECORDS.filter(
    (record) => status === "all" || record.status === status,
  );
  return (
    <KbPageContent>
      <KbPageHeader
        label="流程跟踪"
        title="我的上传"
        description="跟踪上传后的审批、解析、驳回和发布状态。个人库上传免审批，公共和部门库按权限进入审批。"
      />
      <div className="mb-4">
        <KbSegmentControl
          value={status}
          onChange={onStatusChange}
          options={uploadStatusOptions}
        />
      </div>
      <KbDataTable
        minWidth={UPLOAD_GRID}
        header={
          <>
            <span>文件名</span>
            <span>目标知识库</span>
            <span>状态</span>
            <span>提交时间</span>
            <span>说明</span>
          </>
        }
        empty={
          <KbEmptyState
            title="暂无上传记录"
            description="上传文件后可在这里追踪审批与解析进度。"
          />
        }
      >
        {records.map((record) => (
          <UploadRecordRow key={record.id} record={record} />
        ))}
      </KbDataTable>
    </KbPageContent>
  );
}

function UploadRecordRow({ record }: { record: UploadRecord }) {
  return (
    <KbDataTableRow className={UPLOAD_GRID}>
      <KbTableCellFile name={record.fileName} type="pdf" />
      <span className="truncate text-kb-muted">{record.targetKnowledgeBaseName}</span>
      <span>
        <KbStatusTag tone={publishStatusTone(record.status)}>
          {publishStatusLabel(record.status)}
        </KbStatusTag>
      </span>
      <span className="text-kb-muted">{record.submittedAt}</span>
      <span className="truncate text-kb-muted">
        {record.rejectReason ??
          (record.status === "pendingApproval" ? "等待管理员处理" : "状态已同步")}
      </span>
    </KbDataTableRow>
  );
}

function PersonalBasePanel({
  base,
  files,
  query,
  professionalType,
  tag,
  sortBy,
  onQueryChange,
  onProfessionalTypeChange,
  onTagChange,
  onSortChange,
  onOpen,
}: {
  base: KnowledgeBase;
  files: KnowledgeFile[];
  query: string;
  professionalType: string;
  tag: string;
  sortBy: KnowledgeSortBy;
  onQueryChange: (value: string) => void;
  onProfessionalTypeChange: (value: string) => void;
  onTagChange: (value: string) => void;
  onSortChange: (value: KnowledgeSortBy) => void;
  onOpen: (file: KnowledgeFile) => void;
}) {
  const allFiles = getFilesForBase(base.id);
  const professionalTypes = getProfessionalTypes(allFiles);
  const tags = getAllTags(allFiles);
  const movableBases = KNOWLEDGE_BASES.filter(
    (item) => item.scope !== "personal" && item.status === "enabled" && item.permission.canUpload,
  );

  const stats = {
    total: allFiles.length,
    parsing: allFiles.filter((f) => f.status === "parsing").length,
    published: allFiles.filter((f) => f.status === "published").length,
  };

  return (
    <KbPageContent>
      <KbPageHeader
        label="个人知识库"
        title={base.name}
        description="个人知识库仅本人可见，文件可申请移动到公共或专业知识库。"
        action={
          <div className="flex gap-2">
            <KbButton onClick={() => toast.message("打开上传")}>
              <UploadCloud className="h-4 w-4 stroke-[1.8]" />
              上传文件
            </KbButton>
            <KbButton
              variant="outline"
              disabled={movableBases.length === 0}
              onClick={() => toast.success("已打开移动到公共库流程")}
            >
              移动到公共库
            </KbButton>
          </div>
        }
      />

      <KbInlineStats
        className="mb-4"
        items={[
          { label: "文件", value: stats.total },
          { label: "解析中", value: stats.parsing },
          { label: "已发布", value: stats.published },
        ]}
      />

      <div className="mb-4">
        <KnowledgeUploadPanel base={base} personal onUploaded={() => toast.success("文件已进入解析队列")} />
      </div>

      <KbFilterBar
        searchValue={query}
        onSearchChange={onQueryChange}
        searchPlaceholder="搜索个人库文件"
        filters={
          <>
            <KbFilterSelect
              value={professionalType}
              onChange={onProfessionalTypeChange}
              placeholder="全部专业"
              options={[
                { value: "all", label: "全部专业" },
                ...professionalTypes.map((item) => ({ value: item, label: item })),
              ]}
            />
            <KbFilterSelect
              value={tag}
              onChange={onTagChange}
              placeholder="全部标签"
              options={[
                { value: "all", label: "全部标签" },
                ...tags.map((item) => ({ value: item, label: item })),
              ]}
            />
            <KbFilterSelect
              value={sortBy}
              onChange={(v) => onSortChange(v as KnowledgeSortBy)}
              placeholder="更新时间"
              options={[
                { value: "updated", label: "更新时间" },
                { value: "name", label: "文件名" },
                { value: "uploader", label: "上传人" },
              ]}
            />
          </>
        }
      />

      <KnowledgeFileTableWrapper
        files={files}
        onOpen={onOpen}
        showLibrary={false}
        emptyTitle="个人库暂无文件"
        emptyDescription="可拖拽上传，上传后直接进入解析流程。"
      />
    </KbPageContent>
  );
}

function KnowledgeFileTableWrapper({
  files,
  onOpen,
  showLibrary = true,
  emptyTitle,
  emptyDescription,
}: {
  files: KnowledgeFile[];
  onOpen: (file: KnowledgeFile) => void;
  showLibrary?: boolean;
  emptyTitle: string;
  emptyDescription: string;
}) {
  return (
    <KnowledgeFileTable
      files={files}
      onOpen={onOpen}
      showLibrary={showLibrary}
      empty={<KbEmptyState title={emptyTitle} description={emptyDescription} />}
    />
  );
}

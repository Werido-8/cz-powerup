import { ChevronDown, ChevronRight, Download, Eye, LayoutGrid, List, MoreHorizontal } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import { Tag } from "@/components/learning/ui";
import {
  KbDataTable,
  KbDataTableRow,
  KbStatusTag,
  KbTableCellFile,
} from "@/components/knowledge/ui";
import {
  publishStatusLabel,
  publishStatusTone,
  type KnowledgeStatusTone,
} from "@/lib/knowledge/status";
import { kbFileTypeConfig } from "@/lib/knowledge/tokens";
import type { KnowledgeFile, KnowledgeFileVersion } from "@/lib/knowledge/types";
import { cn } from "@/lib/utils";

const GRID_OVERVIEW =
  "grid-cols-[28px_minmax(240px,1.5fr)_72px_88px_96px_minmax(120px,0.9fr)_92px_130px_88px_168px] min-w-[1160px]";
const GRID_WITH_LIB =
  "grid-cols-[minmax(240px,1.4fr)_72px_88px_minmax(140px,0.9fr)_96px_minmax(120px,0.9fr)_72px_92px_130px_88px_168px] min-w-[1280px]";
const GRID_NO_LIB =
  "grid-cols-[minmax(280px,1.5fr)_72px_88px_96px_minmax(120px,0.9fr)_72px_92px_130px_88px_168px] min-w-[1180px]";

export type FileViewMode = "list" | "card";

export function FileViewModeToggle({
  value,
  onChange,
}: {
  value: FileViewMode;
  onChange: (mode: FileViewMode) => void;
}) {
  return (
    <div className="flex h-9 items-center rounded-[8px] border border-kb-border bg-card p-0.5">
      <button
        type="button"
        aria-label="列表模式"
        onClick={() => onChange("list")}
        className={cn(
          "grid h-7 w-8 place-items-center rounded-[6px] transition-colors",
          value === "list" ? "bg-kb-primary/10 text-kb-primary" : "text-kb-muted hover:text-kb-body",
        )}
      >
        <List className="h-4 w-4" strokeWidth={1.75} />
      </button>
      <button
        type="button"
        aria-label="卡片模式"
        onClick={() => onChange("card")}
        className={cn(
          "grid h-7 w-8 place-items-center rounded-[6px] transition-colors",
          value === "card" ? "bg-kb-primary/10 text-kb-primary" : "text-kb-muted hover:text-kb-body",
        )}
      >
        <LayoutGrid className="h-4 w-4" strokeWidth={1.75} />
      </button>
    </div>
  );
}

export function KnowledgeFileTable({
  files,
  onOpen,
  showLibrary = true,
  overviewMode = false,
  empty,
  className,
}: {
  files: KnowledgeFile[];
  onOpen: (file: KnowledgeFile) => void;
  showLibrary?: boolean;
  overviewMode?: boolean;
  empty?: ReactNode;
  className?: string;
}) {
  if (files.length === 0) return <>{empty}</>;

  if (overviewMode) {
    return (
      <KbDataTable
        className={cn("border-0 shadow-none", className)}
        minWidth={GRID_OVERVIEW}
        header={
          <>
            <span />
            <span>文件名</span>
            <span>类型</span>
            <span>大小</span>
            <span>专业类型</span>
            <span>标签</span>
            <span>状态</span>
            <span>更新时间</span>
            <span>上传人</span>
            <span className="text-right">操作</span>
          </>
        }
      >
        {files.map((file) => (
          <OverviewFileGroup key={file.id} file={file} onOpen={onOpen} />
        ))}
      </KbDataTable>
    );
  }

  const grid = showLibrary ? GRID_WITH_LIB : GRID_NO_LIB;

  return (
    <KbDataTable
      className={className}
      minWidth={grid}
      header={
        <>
          <span>文件名</span>
          <span>类型</span>
          <span>大小</span>
          {showLibrary && <span>所属知识库</span>}
          <span>专业类型</span>
          <span>标签</span>
          <span>版本</span>
          <span>状态</span>
          <span>更新时间</span>
          <span>上传人</span>
          <span className="text-right">操作</span>
        </>
      }
    >
      {files.map((file) => (
        <StandardFileRow key={file.id} file={file} onOpen={onOpen} showLibrary={showLibrary} grid={grid} />
      ))}
    </KbDataTable>
  );
}

function OverviewFileGroup({
  file,
  onOpen,
}: {
  file: KnowledgeFile;
  onOpen: (file: KnowledgeFile) => void;
}) {
  const hasVersions = (file.versions?.length ?? 0) > 1;
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <OverviewFileRow
        file={file}
        onOpen={onOpen}
        hasVersions={hasVersions}
        expanded={expanded}
        onToggle={() => setExpanded((v) => !v)}
      />
      {hasVersions &&
        expanded &&
        file.versions!.map((version) => (
          <VersionSubRow key={version.id} file={file} version={version} onOpen={onOpen} />
        ))}
    </>
  );
}

function OverviewFileRow({
  file,
  onOpen,
  hasVersions,
  expanded,
  onToggle,
}: {
  file: KnowledgeFile;
  onOpen: (file: KnowledgeFile) => void;
  hasVersions: boolean;
  expanded: boolean;
  onToggle: () => void;
}) {
  const type = kbFileTypeConfig[file.type ?? "other"];

  return (
    <KbDataTableRow className={GRID_OVERVIEW} onClick={() => onOpen(file)}>
      <span className="flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
        {hasVersions ? (
          <button
            type="button"
            aria-label={expanded ? "收起版本" : "展开版本"}
            onClick={onToggle}
            className="grid h-6 w-6 place-items-center rounded-[6px] text-kb-muted hover:bg-kb-surface-hover hover:text-kb-body"
          >
            {expanded ? (
              <ChevronDown className="h-3.5 w-3.5" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" />
            )}
          </button>
        ) : null}
      </span>
      <KbTableCellFile
        name={file.name}
        type={file.type ?? "other"}
        size="sm"
        nameWeight="normal"
      />
      <span className="text-kb-muted">{type.label}</span>
      <span className="tabular-nums text-kb-muted">{file.size ?? "-"}</span>
      <span className="truncate text-kb-muted">{file.professionalType ?? "未分类"}</span>
      <FileTags tags={file.tags} />
      <FileStatusCell status={file.status} />
      <span className="truncate text-kb-muted">{file.updatedAt ?? "-"}</span>
      <span className="truncate text-kb-muted">{file.uploaderName ?? "-"}</span>
      <FileActions file={file} onOpen={onOpen} />
    </KbDataTableRow>
  );
}

function VersionSubRow({
  file,
  version,
  onOpen,
}: {
  file: KnowledgeFile;
  version: KnowledgeFileVersion;
  onOpen: (file: KnowledgeFile) => void;
}) {
  const type = kbFileTypeConfig[file.type ?? "other"];

  return (
    <KbDataTableRow
      className={cn(GRID_OVERVIEW, "bg-kb-surface/60")}
      onClick={() => onOpen({ ...file, id: version.id, version: version.version, name: version.name })}
    >
      <span />
      <div className="flex min-w-0 items-center gap-2 pl-6">
        <span className="truncate text-[12.5px] text-kb-body">{version.name}</span>
        <KbStatusTag tone={version.isCurrent ? "accent" : "neutral"} className="h-5 px-2 text-[10.5px]">
          {version.version}
          {version.isCurrent ? " · 当前" : ""}
        </KbStatusTag>
      </div>
      <span className="text-kb-muted">{type.label}</span>
      <span className="tabular-nums text-kb-muted">{file.size ?? "-"}</span>
      <span className="truncate text-kb-muted">{file.professionalType ?? "未分类"}</span>
      <FileTags tags={file.tags} max={1} />
      <FileStatusCell status={file.status} muted />
      <span className="truncate text-kb-muted">{version.uploadedAt}</span>
      <span className="truncate text-kb-muted">{version.uploaderName ?? "-"}</span>
      <FileActions
        file={file}
        onOpen={() => onOpen({ ...file, id: version.id, version: version.version, name: version.name })}
      />
    </KbDataTableRow>
  );
}

function StandardFileRow({
  file,
  onOpen,
  showLibrary,
  grid,
}: {
  file: KnowledgeFile;
  onOpen: (file: KnowledgeFile) => void;
  showLibrary: boolean;
  grid: string;
}) {
  const type = kbFileTypeConfig[file.type ?? "other"];

  return (
    <KbDataTableRow className={grid} onClick={() => onOpen(file)}>
      <KbTableCellFile
        name={file.name}
        type={file.type ?? "other"}
        size="sm"
        nameWeight="normal"
      />
      <span className="text-kb-muted">{type.label}</span>
      <span className="tabular-nums text-kb-muted">{file.size ?? "-"}</span>
      {showLibrary && <span className="truncate text-kb-muted">{file.knowledgeBaseName}</span>}
      <span className="truncate text-kb-muted">{file.professionalType ?? "未分类"}</span>
      <FileTags tags={file.tags} />
      <span className="font-medium text-kb-heading">{file.version ?? "v1"}</span>
      <FileStatusCell status={file.status} />
      <span className="truncate text-kb-muted">{file.updatedAt ?? "-"}</span>
      <span className="truncate text-kb-muted">{file.uploaderName ?? "-"}</span>
      <FileActions file={file} onOpen={onOpen} />
    </KbDataTableRow>
  );
}

function FileTags({ tags, max = 2 }: { tags?: string[]; max?: number }) {
  return (
    <span className="flex min-w-0 flex-wrap gap-1">
      {(tags ?? []).slice(0, max).map((tag) => (
        <Tag key={tag} variant="outline" className="h-5 px-2 text-[10.5px]">
          {tag}
        </Tag>
      ))}
    </span>
  );
}

function FileStatusCell({
  status,
  muted,
}: {
  status: import("@/lib/knowledge/types").FilePublishStatus;
  muted?: boolean;
}) {
  const tone = muted ? "neutral" : publishStatusTone(status);
  const label = muted ? "历史版本" : publishStatusLabel(status);

  return (
    <span className="inline-flex w-fit items-center gap-1.5 justify-self-start">
      <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", statusDotClass[tone])} />
      <span className={cn("text-[12px]", muted ? "text-muted-foreground" : "text-foreground")}>
        {label}
      </span>
    </span>
  );
}

const statusDotClass: Record<KnowledgeStatusTone, string> = {
  neutral: "bg-muted-foreground/50",
  accent: "bg-primary",
  success: "bg-[#19A974]",
  warning: "bg-[#C76A16]",
  danger: "bg-[#C94747]",
};

function FileLinkAction({
  icon: Icon,
  label,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap px-0.5 py-0.5 text-[12px] text-muted-foreground transition-colors hover:text-primary"
    >
      <Icon className="h-3.5 w-3.5 shrink-0 stroke-[1.8]" />
      <span className="whitespace-nowrap">{label}</span>
    </button>
  );
}

function FileActions({
  file,
  onOpen,
}: {
  file: KnowledgeFile;
  onOpen: (file: KnowledgeFile) => void;
}) {
  return (
    <span
      className="flex flex-nowrap items-center justify-end gap-2 whitespace-nowrap"
      onClick={(e) => e.stopPropagation()}
    >
      <FileLinkAction icon={Eye} label="预览" onClick={() => onOpen(file)} />
      {file.canDownload !== false && (
        <FileLinkAction icon={Download} label="下载" onClick={() => toast.message("开始下载文件")} />
      )}
      <FileLinkAction icon={MoreHorizontal} label="更多" onClick={() => toast.message("更多操作")} />
    </span>
  );
}


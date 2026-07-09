import type { ReactNode } from "react";
import {
  Clock3,
  Download,
  Eye,
  Pencil,
  Trash2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { toast } from "sonner";
import { Tag } from "@/components/learning/ui";
import { publishStatusLabel, publishStatusTone } from "@/lib/knowledge/status";
import { kbFileTypeConfig } from "@/lib/knowledge/tokens";
import type { KnowledgeFile } from "@/lib/knowledge/types";
import { cn } from "@/lib/utils";

export function KnowledgeOverviewFileCard({
  file,
  onOpen,
}: {
  file: KnowledgeFile;
  onOpen: (file: KnowledgeFile) => void;
}) {
  const type = kbFileTypeConfig[file.type ?? "other"];
  const TypeIcon = type.icon;
  const statusTone = publishStatusTone(file.status);

  return (
    <article
      className={cn(
        "group relative flex min-h-[172px] flex-col overflow-hidden rounded-[12px] border border-[#E6EEF0] bg-card",
        "shadow-[0_2px_10px_-6px_rgba(31,52,64,0.18)]",
        "will-change-transform",
        "transition-[transform,box-shadow,border-color] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
        "hover:-translate-y-1.5 hover:border-primary/30",
        "hover:shadow-[0_18px_34px_-18px_rgba(52,155,172,0.38)]",
        "active:translate-y-0 active:shadow-[0_8px_18px_-12px_rgba(31,52,64,0.22)]",
      )}
    >
      <button
        type="button"
        onClick={() => onOpen(file)}
        className="flex flex-1 flex-col p-4 pb-3 text-left transition-colors group-hover:bg-primary/[0.015]"
      >
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "grid h-11 w-11 shrink-0 place-items-center rounded-[10px] ring-1 ring-inset",
              type.color,
            )}
          >
            <TypeIcon className="h-5 w-5 stroke-[1.8]" />
          </div>
          <h3 className="line-clamp-2 min-w-0 flex-1 text-[13.5px] font-medium leading-snug text-foreground">
            {file.name}
          </h3>
        </div>

        <p className="mt-2.5 line-clamp-2 text-[12px] leading-relaxed text-muted-foreground">
          {file.summary ?? "暂无摘要"}
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <Tag
            variant="outline"
            className="h-5 border-transparent bg-muted/50 px-2 text-[10.5px] text-muted-foreground"
          >
            <span
              className={cn(
                "mr-1 inline-block h-1.5 w-1.5 rounded-full align-middle",
                statusDot[statusTone],
              )}
            />
            {publishStatusLabel(file.status)}
          </Tag>
          {(file.tags ?? []).slice(0, 2).map((tag) => (
            <Tag
              key={tag}
              variant="outline"
              className="h-5 border-primary/15 bg-primary-soft/40 px-2 text-[10.5px] text-[#1498A8]"
            >
              {tag}
            </Tag>
          ))}
        </div>

        <div className="mt-auto flex items-center justify-between border-t border-divider pt-2.5 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Clock3 className="h-3 w-3 stroke-[1.8]" />
            {file.updatedAt ?? "—"}
          </span>
          <span className="tabular-nums">{file.size ?? "—"}</span>
        </div>
      </button>

      <FileCardGlassActions
        file={file}
        onView={() => onOpen(file)}
        onEdit={() => toast.message("打开编辑")}
        onDownload={() => toast.message("开始下载文件")}
        onDelete={() => toast.message("确认删除文件？")}
      />
    </article>
  );
}

const statusDot = {
  neutral: "bg-muted-foreground/50",
  accent: "bg-primary",
  success: "bg-[#19A974]",
  warning: "bg-[#C76A16]",
  danger: "bg-[#C94747]",
} as const;

/**
 * 底部弧形毛玻璃：SVG 画上缘圆弧，底层实体可见，底层信息半透露出。
 * 图标放在弧面上，不做各自厚重白圆块。
 */
function FileCardGlassActions({
  file,
  onView,
  onEdit,
  onDownload,
  onDelete,
}: {
  file: KnowledgeFile;
  onView: () => void;
  onEdit: () => void;
  onDownload: () => void;
  onDelete: () => void;
}) {
  const fillId = `kb-card-glass-fill-${file.id}`;

  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-x-0 bottom-0 z-10 h-[68px]",
        "translate-y-4 opacity-0",
        "transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
        "group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100",
      )}
    >
      {/* 弧形蒙层本体：上缘凹陷弧线（SVG），可看见的毛玻璃 */}
      <div className="absolute inset-0 overflow-hidden">
        <svg
          className="absolute inset-0 h-full w-full"
          viewBox="0 0 400 68"
          preserveAspectRatio="none"
          aria-hidden
        >
          <defs>
            <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(255,255,255,0.08)" />
              <stop offset="35%" stopColor="rgba(234,247,249,0.55)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0.88)" />
            </linearGradient>
          </defs>
          {/* 上缘为二次贝塞尔弧：中间更高、两端更低 → 从底部“圆拱升起” */}
          <path
            d="M0 68 L0 34 Q200 2 400 34 L400 68 Z"
            fill={`url(#${fillId})`}
            stroke="rgba(52,155,172,0.10)"
            strokeWidth="1"
          />
        </svg>

        {/* 额外一层 CSS blur，强化毛玻璃观感 */}
        <div
          className="absolute inset-0 backdrop-blur-[12px]"
          style={{
            WebkitMaskImage:
              "radial-gradient(135% 110% at 50% 100%, #000 52%, transparent 100%)",
            maskImage:
              "radial-gradient(135% 110% at 50% 100%, #000 52%, transparent 100%)",
          }}
          aria-hidden
        />
      </div>

      {/* 操作区：贴弧面中下，纯图标、轻交互 */}
      <div className="relative z-[1] flex h-full items-end justify-center gap-5 pb-2.5">
        <CardAction icon={Eye} label="查看" onClick={onView} />
        {file.canEdit !== false && (
          <CardAction icon={Pencil} label="编辑" onClick={onEdit} />
        )}
        {file.canDownload !== false && (
          <CardAction icon={Download} label="下载" onClick={onDownload} />
        )}
        <CardAction icon={Trash2} label="删除" onClick={onDelete} danger />
      </div>
    </div>
  );
}

function CardAction({
  icon: Icon,
  label,
  onClick,
  danger,
}: {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={cn(
        "grid h-8 w-8 place-items-center rounded-full",
        "bg-white/55 text-foreground/70 shadow-[0_2px_8px_rgba(31,52,64,0.08)]",
        "ring-1 ring-white/70 backdrop-blur-[2px]",
        "transition-all duration-200",
        "hover:scale-105 hover:bg-white/90 hover:text-primary hover:shadow-md",
        danger && "hover:bg-danger-soft hover:text-destructive hover:ring-destructive/15",
      )}
    >
      <Icon className="h-3.5 w-3.5 stroke-[1.8]" />
    </button>
  );
}

export function KnowledgeFileCardGrid({
  files,
  onOpen,
  empty,
  compact,
  columns = "responsive",
}: {
  files: KnowledgeFile[];
  onOpen: (file: KnowledgeFile) => void;
  empty?: ReactNode;
  compact?: boolean;
  /** responsive：随屏宽 1→2→3→4 列；4：大屏固定 4 列 */
  columns?: "responsive" | 4;
}) {
  if (files.length === 0) return <>{empty}</>;

  const columnClass =
    columns === 4
      ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
      : "grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4";

  return (
    <div
      className={cn(
        "grid [&>*]:transition-transform",
        columnClass,
        compact ? "gap-3 p-3" : "gap-4 p-4",
      )}
    >
      {files.map((file) => (
        <KnowledgeOverviewFileCard key={file.id} file={file} onOpen={onOpen} />
      ))}
    </div>
  );
}

import { FileText, File } from "lucide-react";
import { cn } from "@/lib/utils";
import type { KbFile, KbParseStatus } from "@/lib/mock/knowledge-space";
import { parseStatusLabel } from "@/lib/mock/knowledge-utils";

function ParseStatusTag({ status }: { status: KbParseStatus }) {
  const styles: Record<KbParseStatus, string> = {
    done: "bg-primary-soft text-accent-foreground ring-primary/20",
    processing: "bg-warning-soft text-warning-foreground ring-warning/25",
    pending: "bg-muted text-muted-foreground ring-border",
    failed: "bg-destructive/8 text-destructive ring-destructive/20",
    disabled: "bg-muted text-muted-foreground/60 ring-border/50",
  };
  return (
    <span
      className={cn(
        "shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-medium ring-1",
        styles[status],
      )}
    >
      {parseStatusLabel(status)}
    </span>
  );
}

function ScopeTag({ scope }: { scope: string }) {
  return (
    <span className="shrink-0 rounded-md bg-accent px-1.5 py-0.5 text-[10px] font-medium text-accent-foreground ring-1 ring-primary/15">
      {scope}
    </span>
  );
}

function FileTypeThumb({ fileType }: { fileType: KbFile["fileType"] }) {
  if (fileType === "pdf") {
    return (
      <div className="relative h-11 w-9 shrink-0">
        {/* 纸张底色 */}
        <div className="absolute inset-0 rounded-[5px] bg-muted shadow-sm ring-1 ring-border/80" />
        {/* 折角 */}
        <div
          className="absolute right-0 top-0 h-3 w-3 rounded-bl-[3px] bg-border/90"
          style={{ clipPath: "polygon(100% 0, 0 0, 100% 100%)" }}
        />
        {/* 横线装饰 */}
        <div className="absolute left-1.5 top-4 right-1.5 space-y-1">
          <div className="h-px rounded-full bg-border/70" />
          <div className="h-px rounded-full bg-border/50" />
          <div className="h-px w-3/4 rounded-full bg-border/40" />
        </div>
        {/* PDF 标签 */}
        <div className="absolute bottom-1 left-1/2 -translate-x-1/2">
          <span className="rounded bg-destructive px-1 py-px text-[7px] font-extrabold leading-none tracking-tight text-white">
            PDF
          </span>
        </div>
      </div>
    );
  }
  return (
    <div className="relative h-11 w-9 shrink-0">
      <div className="absolute inset-0 rounded-[5px] bg-muted shadow-sm ring-1 ring-border/80" />
      <div
        className="absolute right-0 top-0 h-3 w-3 rounded-bl-[3px] bg-border/90"
        style={{ clipPath: "polygon(100% 0, 0 0, 100% 100%)" }}
      />
      <div className="absolute left-1.5 top-4 right-1.5 space-y-1">
        <div className="h-px rounded-full bg-border/70" />
        <div className="h-px rounded-full bg-border/50" />
        <div className="h-px w-3/4 rounded-full bg-border/40" />
      </div>
      <div className="absolute bottom-1 left-1/2 -translate-x-1/2">
        <FileText className="h-3 w-3 text-muted-foreground/60" />
      </div>
    </div>
  );
}

type KbFileListProps = {
  files: KbFile[];
  viewMode: "grid" | "list";
  onFileClick: (file: KbFile) => void;
};

export function KbFileList({ files, viewMode, onFileClick }: KbFileListProps) {
  if (files.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8">
        <File className="h-10 w-10 text-muted-foreground/30" />
        <p className="text-[13px] text-muted-foreground">暂无文件</p>
      </div>
    );
  }

  if (viewMode === "list") {
    return (
      <div className="flex flex-1 flex-col overflow-y-auto">
        <div className="flex flex-col gap-1.5 p-3">
          {files.map((file) => (
            <button
              key={file.id}
              type="button"
              onClick={() => onFileClick(file)}
              className="flex items-center gap-3.5 rounded-xl border border-border/80 bg-card px-3.5 py-2.5 text-left shadow-[var(--shadow-card)] transition-all hover:border-primary/20 hover:shadow-[var(--shadow-card-hover)]"
            >
              <FileTypeThumb fileType={file.fileType} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13px] font-semibold text-foreground">
                  {file.name}
                </div>
                <div className="mt-0.5 truncate text-[11.5px] text-muted-foreground">
                  {file.summary}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <ScopeTag scope={file.scope} />
                <ParseStatusTag status={file.parseStatus} />
              </div>
              <div className="w-[80px] shrink-0 text-right text-[11px] text-muted-foreground">
                <div className="tabular-nums">{file.updatedAt}</div>
                <div className="tabular-nums">{file.size}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="grid flex-1 auto-rows-min grid-cols-1 content-start items-start gap-2.5 overflow-y-auto p-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {files.map((file) => (
        <button
          key={file.id}
          type="button"
          onClick={() => onFileClick(file)}
          className="group flex w-full flex-col rounded-xl border border-border/80 bg-card p-3 text-left shadow-[var(--shadow-card)] transition-all hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-[var(--shadow-card-hover)]"
        >
          {/* 顶部标签行 */}
          <div className="mb-2.5 flex items-center justify-between gap-1.5">
            <ScopeTag scope={file.scope} />
            <ParseStatusTag status={file.parseStatus} />
          </div>

          {/* 文件图标 + 名称 */}
          <div className="flex gap-2.5">
            <FileTypeThumb fileType={file.fileType} />
            <div className="min-w-0 flex-1">
              <h3 className="line-clamp-2 text-[12.5px] font-semibold leading-snug text-foreground">
                {file.name}
              </h3>
              <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-muted-foreground">
                {file.summary}
              </p>
            </div>
          </div>

          {/* 底部元信息 */}
          <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-divider pt-2 text-[10.5px] text-muted-foreground">
            <span className="truncate tabular-nums">{file.updatedAt}</span>
            <span className="shrink-0 tabular-nums">{file.size}</span>
          </div>
        </button>
      ))}
    </div>
  );
}

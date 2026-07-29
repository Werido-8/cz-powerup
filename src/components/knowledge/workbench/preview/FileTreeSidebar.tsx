import { useEffect, useMemo, useRef, useState, type ReactNode, type Ref } from "react";
import { History, Library, RefreshCw, Search } from "lucide-react";
import { toast } from "sonner";
import { KbFileTypeIcon } from "@/components/knowledge/ui";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { getFileMatchChunks } from "@/lib/knowledge/fulltextSearch";
import type { KnowledgeFile } from "@/lib/knowledge/types";
import { parseStatusLabel, parseStatusTone } from "@/lib/knowledge/status";
import { kbToneDotClasses } from "@/lib/knowledge/tokens";
import { cn } from "@/lib/utils";

function getVersionCount(file: KnowledgeFile) {
  return file.versions?.length ?? 0;
}

function getVersionLabel(file: KnowledgeFile) {
  const count = getVersionCount(file);
  if (count > 1) return `v${count}`;
  return file.version && file.version !== "v1" ? file.version : null;
}

function FileTreeListItem({
  file,
  active,
  hitCount,
  onSelect,
  itemRef,
}: {
  file: KnowledgeFile;
  active: boolean;
  hitCount?: number;
  onSelect: () => void;
  itemRef?: Ref<HTMLButtonElement>;
}) {
  const versionLabel = getVersionLabel(file);
  const versionCount = getVersionCount(file);

  return (
    <button
      ref={itemRef}
      type="button"
      onClick={onSelect}
      aria-current={active ? "true" : undefined}
      className={cn(
        "relative mb-2 flex w-full items-center gap-3 rounded-[9px] border px-3 py-3 text-left transition-colors last:mb-0",
        active
          ? "border-[#D7E6E9] bg-[#F5FAFB] text-accent-foreground"
          : "border-[#E7EEF0] bg-white text-kb-body hover:border-primary/20 hover:bg-[#FCFEFE]",
      )}
    >
      {active ? (
        <span className="absolute bottom-3.5 left-0 top-3.5 w-[2px] rounded-r-full bg-primary/55" />
      ) : null}
      <KbFileTypeIcon type={file.type} fileName={file.name} size="sm" />
      <span className="min-w-0 flex-1">
        <span className="flex min-w-0 items-center gap-1.5">
          <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <span
                  className={cn(
                    "min-w-0 flex-1 truncate text-[13px] leading-5",
                    active ? "font-medium text-kb-heading" : "font-semibold",
                  )}
                >
                  {file.name}
                </span>
              </TooltipTrigger>
              <TooltipContent
                side="top"
                className="max-w-[280px] bg-[#2f424d] text-[12px] leading-relaxed text-white"
              >
                {file.name}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          {versionLabel ? (
            <span
              className="inline-flex h-5 shrink-0 items-center gap-0.5 rounded-[5px] bg-primary-soft/60 px-1.5 text-[10px] font-medium text-primary"
              title={versionCount > 1 ? `${versionCount} 个历史版本` : versionLabel}
              aria-label={versionCount > 1 ? `${versionCount} 个历史版本` : versionLabel}
            >
              <History className="h-3 w-3 stroke-[2]" />
              {versionLabel}
            </span>
          ) : null}
          {hitCount != null && hitCount > 0 && (
            <span className="inline-flex h-5 shrink-0 items-center rounded-[5px] bg-warning-soft px-1.5 text-[10px] font-medium text-warning-foreground">
              {hitCount} 处
            </span>
          )}
        </span>
        <span className="mt-1.5 flex min-w-0 items-center gap-2 text-[11px] leading-4 text-kb-muted">
          <span className="inline-flex min-w-0 items-center gap-1.5">
            <span
              className={cn(
                "h-1.5 w-1.5 shrink-0 rounded-full",
                kbToneDotClasses[parseStatusTone(file.parseStatus)],
              )}
              aria-hidden
            />
            <span className="truncate">{parseStatusLabel(file.parseStatus)}</span>
          </span>
          {file.size ? (
            <>
              <span className="shrink-0 text-[#D0D8DC]" aria-hidden>
                ·
              </span>
              <span className="shrink-0 tabular-nums">{file.size}</span>
            </>
          ) : null}
        </span>
      </span>
    </button>
  );
}

export function FileTreeSidebar({
  files,
  currentFileId,
  onSelect,
  title = "当前库文件",
  subtitle,
  hitQuery,
  onExitResults,
  exitResultsLabel = "回到库内",
  footer,
}: {
  files: KnowledgeFile[];
  currentFileId: string;
  onSelect: (file: KnowledgeFile) => void;
  title?: string;
  /** Search keyword hint shown below the title row when in search mode */
  subtitle?: ReactNode;
  /** When provided, shows a hit-count badge per file using getFileMatchChunks */
  hitQuery?: string;
  /** Callback for the "exit search results" quick link */
  onExitResults?: () => void;
  exitResultsLabel?: string;
  footer?: ReactNode;
}) {
  const isResultsMode = Boolean(onExitResults);
  const [query, setQuery] = useState("");
  const activeItemRef = useRef<HTMLButtonElement>(null);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return files;
    return files.filter((f) => f.name.toLowerCase().includes(q));
  }, [files, query]);

  useEffect(() => {
    if (!filtered.some((file) => file.id === currentFileId)) return;
    const frame = requestAnimationFrame(() => {
      activeItemRef.current?.scrollIntoView({
        block: "center",
        inline: "nearest",
        behavior: "smooth",
      });
    });
    return () => cancelAnimationFrame(frame);
  }, [currentFileId, filtered]);

  return (
    <aside className="flex w-[300px] shrink-0 flex-col border-r border-[#E0E9EB] bg-white">
      <div className="border-b border-[#E8EFF1] px-4 pb-3 pt-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-baseline gap-2">
            <h2 className="text-[14px] font-semibold text-kb-heading">{title}</h2>
            <span className="text-[11.5px] text-kb-muted">{files.length} 个文件</span>
          </div>
          {isResultsMode ? (
            <button
              type="button"
              onClick={onExitResults}
              className="inline-flex shrink-0 items-center gap-0.5 text-[11.5px] font-medium text-primary/80 transition-colors hover:text-primary"
            >
              <Library className="h-3.5 w-3.5 stroke-[2]" />
              {exitResultsLabel}
            </button>
          ) : (
            <button
              type="button"
              aria-label="刷新文件列表"
              title="刷新文件列表"
              onClick={() => toast.success("文件列表已刷新")}
              className="flex h-8 w-8 items-center justify-center rounded-[7px] text-kb-muted transition-colors hover:bg-primary-soft hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35"
            >
              <RefreshCw className="h-4 w-4 stroke-[1.8]" />
            </button>
          )}
        </div>

        {subtitle && (
          <div className="mt-2">
            <span className="text-[11.5px] leading-relaxed text-kb-muted">{subtitle}</span>
          </div>
        )}

        {!isResultsMode && (
          <label className="mt-3 flex h-10 items-center gap-2 rounded-[8px] border border-[#DCE8EA] bg-[#FBFDFD] px-3 text-[12px] transition-colors focus-within:border-primary/45 focus-within:bg-white focus-within:ring-2 focus-within:ring-primary/10">
            <Search className="h-4 w-4 text-kb-muted" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="搜索文件名称"
              className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-kb-muted"
            />
          </label>
        )}
      </div>
      <div className="scrollbar-neutral min-h-0 flex-1 overflow-y-auto bg-[#FBFCFD] p-3">
        {filtered.map((file) => (
          <FileTreeListItem
            key={file.id}
            file={file}
            active={file.id === currentFileId}
            itemRef={file.id === currentFileId ? activeItemRef : undefined}
            hitCount={hitQuery ? getFileMatchChunks(file, hitQuery).length : undefined}
            onSelect={() => onSelect(file)}
          />
        ))}
        {footer}
      </div>
    </aside>
  );
}

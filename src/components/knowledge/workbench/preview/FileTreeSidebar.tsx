import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { KbStatusTag } from "@/components/knowledge/ui";
import { kbFileTypeConfig } from "@/lib/knowledge/tokens";
import type { KnowledgeFile } from "@/lib/knowledge/types";
import { cn } from "@/lib/utils";
import {
  parseStatusLabel,
  parseStatusTone,
} from "@/lib/knowledge/status";

export function FileTreeSidebar({
  files,
  currentFileId,
  onSelect,
}: {
  files: KnowledgeFile[];
  currentFileId: string;
  onSelect: (file: KnowledgeFile) => void;
}) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return files;
    return files.filter((f) => f.name.toLowerCase().includes(q));
  }, [files, query]);

  return (
    <aside className="flex w-[260px] shrink-0 flex-col border-r border-kb-border bg-card">
      <div className="border-b border-divider p-3">
        <div className="text-[13px] font-semibold text-kb-heading">当前库文件</div>
        <label className="mt-2 flex h-8 items-center gap-2 rounded-[8px] border border-kb-border bg-kb-surface px-2 text-[12px]">
          <Search className="h-3.5 w-3.5 text-kb-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="筛选文件"
            className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-kb-muted"
          />
        </label>
      </div>
      <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto p-2">
        {filtered.map((file) => {
          const type = kbFileTypeConfig[file.type ?? "other"];
          const Icon = type.icon;
          const active = file.id === currentFileId;
          return (
            <button
              key={file.id}
              type="button"
              onClick={() => onSelect(file)}
              className={cn(
                "relative mb-1 flex w-full items-start gap-2 rounded-[8px] px-2 py-2 text-left transition-colors",
                active
                  ? "bg-primary-soft text-accent-foreground"
                  : "text-kb-body hover:bg-kb-surface-hover",
              )}
            >
              {active && (
                <span className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full bg-primary" />
              )}
              <span
                className={cn(
                  "mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-[6px] ring-1 ring-inset",
                  type.color,
                )}
              >
                <Icon className="h-3.5 w-3.5 stroke-[1.8]" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="line-clamp-2 text-[12.5px] font-medium leading-snug">
                  {file.name}
                </span>
                <span className="mt-1 flex items-center gap-1.5">
                  <span className="text-[11px] text-kb-muted">{file.version}</span>
                  <KbStatusTag tone={parseStatusTone(file.parseStatus)} className="h-5 text-[10px]">
                    {parseStatusLabel(file.parseStatus)}
                  </KbStatusTag>
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </aside>
  );
}

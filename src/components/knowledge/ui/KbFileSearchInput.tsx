import { X } from "lucide-react";
import type { FileSearchMode } from "@/lib/knowledge/types";
import { cn } from "@/lib/utils";

const SEARCH_MODES: { value: FileSearchMode; label: string }[] = [
  { value: "filename", label: "文件名" },
  { value: "fulltext", label: "全文" },
];

export function KbFileSearchInput({
  value,
  onChange,
  mode,
  onModeChange,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  mode: FileSearchMode;
  onModeChange: (mode: FileSearchMode) => void;
  className?: string;
}) {
  const placeholder =
    mode === "fulltext" ? "请输入全文关键词" : "请输入文件名关键词";

  return (
    <div
      className={cn(
        "flex h-9 min-w-[280px] max-w-[420px] flex-1 items-center gap-2 rounded-[8px] border border-primary/35 bg-card px-1.5",
        "transition-colors focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/15",
        className,
      )}
    >
      <div
        className="inline-flex shrink-0 rounded-[6px] bg-muted/60 p-0.5"
        role="tablist"
        aria-label="搜索范围"
      >
        {SEARCH_MODES.map((item) => {
          const active = item.value === mode;
          return (
            <button
              key={item.value}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onModeChange(item.value)}
              className={cn(
                "rounded-[5px] px-2.5 py-1 text-[11.5px] font-medium transition-colors",
                active
                  ? "bg-card text-primary shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="min-w-0 flex-1 border-0 bg-transparent py-1 text-[13px] outline-none placeholder:text-muted-foreground/70"
      />

      {value ? (
        <button
          type="button"
          aria-label="清空搜索"
          onClick={() => onChange("")}
          className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <X className="h-3.5 w-3.5 stroke-[2]" />
        </button>
      ) : (
        <span className="w-6 shrink-0" aria-hidden />
      )}
    </div>
  );
}

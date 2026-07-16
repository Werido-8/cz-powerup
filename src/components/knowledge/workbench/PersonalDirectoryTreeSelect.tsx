import { Check, ChevronDown, Folder, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  getPersonalDirectoryChildren,
  getPersonalDirectoryPathLabel,
  PERSONAL_DIRECTORY_ROOT_ID,
} from "@/lib/knowledge/model";
import {
  getKnowledgeStoreVersion,
  subscribeKnowledgeStore,
} from "@/lib/knowledge/store";
import { cn } from "@/lib/utils";

function useKnowledgeStoreVersion() {
  const [version, setVersion] = useState(getKnowledgeStoreVersion);
  useEffect(() => subscribeKnowledgeStore(() => setVersion(getKnowledgeStoreVersion())), []);
  return version;
}

export function PersonalDirectoryTreeSelect({
  value,
  onChange,
  placeholder = "请选择个人目录",
  includeRoot = false,
  disabled = false,
  variant = "form",
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  includeRoot?: boolean;
  disabled?: boolean;
  variant?: "default" | "form";
  className?: string;
}) {
  useKnowledgeStoreVersion();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const selectedLabel = useMemo(() => {
    if (!value) return "";
    if (value === PERSONAL_DIRECTORY_ROOT_ID) return "个人空间根目录";
    return getPersonalDirectoryPathLabel(value);
  }, [value]);

  const filteredItems = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const items: { id: string; label: string }[] = [];

    if (includeRoot) {
      items.push({ id: PERSONAL_DIRECTORY_ROOT_ID, label: "个人空间根目录" });
    }

    const walk = (parentId?: string) => {
      for (const directory of getPersonalDirectoryChildren(parentId)) {
        const label = getPersonalDirectoryPathLabel(directory.id);
        if (!normalized || label.toLowerCase().includes(normalized)) {
          items.push({ id: directory.id, label });
        }
        walk(directory.id);
      }
    };

    walk(PERSONAL_DIRECTORY_ROOT_ID);
    return items;
  }, [includeRoot, query]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            "flex h-9 w-full items-center justify-between gap-2 rounded-[8px] border px-3 text-left text-[13px] transition-colors",
            variant === "form"
              ? "border-[#D5E3E8] bg-white hover:border-primary/40"
              : "border-kb-border bg-kb-surface hover:bg-kb-surface-hover",
            !selectedLabel && "text-kb-muted",
            disabled && "cursor-not-allowed opacity-60",
            className,
          )}
        >
          <span className="min-w-0 flex-1 truncate">{selectedLabel || placeholder}</span>
          <ChevronDown className="h-4 w-4 shrink-0 text-kb-muted" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[var(--radix-popover-trigger-width)] p-0">
        <div className="border-b border-kb-border p-2">
          <div className="flex items-center gap-2 rounded-[6px] border border-kb-border bg-kb-surface px-2">
            <Search className="h-3.5 w-3.5 shrink-0 text-kb-muted" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="输入关键词筛选"
              className="h-8 min-w-0 flex-1 bg-transparent text-[12px] outline-none placeholder:text-kb-muted"
            />
          </div>
        </div>
        <div className="max-h-56 overflow-y-auto p-1">
          {filteredItems.length === 0 ? (
            <p className="py-4 text-center text-[12px] text-kb-muted">无匹配目录</p>
          ) : (
            filteredItems.map((item) => (
              <DirectoryOption
                key={item.id}
                item={item}
                selected={value === item.id}
                onSelect={() => {
                  onChange(item.id);
                  setOpen(false);
                  setQuery("");
                }}
              />
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function DirectoryOption({
  item,
  selected,
  onSelect,
}: {
  item: { id: string; label: string };
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex w-full items-center gap-2 rounded-[6px] px-2 py-1.5 text-left text-[12px] transition-colors",
        selected ? "bg-primary-soft text-accent-foreground" : "hover:bg-kb-surface-hover",
      )}
    >
      <Folder className="h-3.5 w-3.5 shrink-0 text-warning stroke-[1.8]" />
      <span className="min-w-0 flex-1 truncate">{item.label}</span>
      {selected && <Check className="h-3.5 w-3.5 shrink-0 text-primary" />}
    </button>
  );
}

import { Check, ChevronDown, Folder, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { getInternalDirectoryPathLabel } from "@/lib/knowledge/model";
import type { KnowledgeInternalDirectory } from "@/lib/knowledge/types";
import { cn } from "@/lib/utils";

export const INTERNAL_DIRECTORY_ROOT_VALUE = "__knowledge_internal_root__";

export function InternalDirectoryTreeSelect({
  directories,
  value,
  onChange,
  placeholder = "请选择目录",
  searchPlaceholder = "输入目录名称筛选",
  includeRoot = false,
  rootLabel = "根目录",
  disabled = false,
  className,
}: {
  directories: KnowledgeInternalDirectory[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  includeRoot?: boolean;
  rootLabel?: string;
  disabled?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const rootDirectories = useMemo(
    () => directories.filter((directory) => !directory.parentId),
    [directories],
  );

  const selectedLabel = useMemo(() => {
    if (!value) return "";
    if (value === INTERNAL_DIRECTORY_ROOT_VALUE) return rootLabel;
    return getInternalDirectoryPathLabel(value, rootLabel);
  }, [rootLabel, value]);

  const filteredItems = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const items: { id: string; label: string }[] = [];

    if (includeRoot) {
      items.push({ id: INTERNAL_DIRECTORY_ROOT_VALUE, label: rootLabel });
    }

    const walk = (parentId?: string) => {
      for (const directory of directories.filter((item) =>
        parentId ? item.parentId === parentId : !item.parentId,
      )) {
        items.push({
          id: directory.id,
          label: getInternalDirectoryPathLabel(directory.id, rootLabel),
        });
        walk(directory.id);
      }
    };
    walk();

    if (!normalized) return items;
    return items.filter((item) => item.label.toLowerCase().includes(normalized));
  }, [directories, includeRoot, query, rootLabel]);

  const handleSelect = (id: string) => {
    onChange(id);
    setOpen(false);
    setQuery("");
  };

  return (
    <Popover
      open={disabled ? false : open}
      onOpenChange={(next) => {
        if (disabled) return;
        setOpen(next);
        if (!next) setQuery("");
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            "flex h-9 w-full items-center gap-2 rounded-[8px] border border-kb-border bg-white px-3 text-left text-[13px] outline-none transition-colors",
            "hover:border-primary/30 focus:border-primary focus:ring-2 focus:ring-primary/10",
            selectedLabel ? "text-kb-heading" : "text-kb-muted",
            disabled && "cursor-not-allowed bg-[#F5F8F9] hover:border-kb-border",
            className,
          )}
        >
          <span className="min-w-0 flex-1 truncate">{selectedLabel || placeholder}</span>
          <ChevronDown
            className={cn(
              "h-3.5 w-3.5 shrink-0 text-kb-muted transition-transform",
              open && "rotate-180",
              disabled && "opacity-50",
            )}
          />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] min-w-[240px] p-0"
        align="start"
        sideOffset={4}
      >
        <div className="border-b border-divider px-2.5 py-2">
          <div className="flex h-8 items-center gap-2 rounded-[6px] border border-kb-border bg-card px-2.5">
            <Search className="h-3.5 w-3.5 shrink-0 text-kb-muted" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={searchPlaceholder}
              className="min-w-0 flex-1 bg-transparent text-[12.5px] text-kb-body outline-none placeholder:text-kb-muted"
            />
          </div>
        </div>
        <div className="scrollbar-thin max-h-[240px] overflow-y-auto p-1">
          {filteredItems.length === 0 ? (
            <p className="py-6 text-center text-[12px] text-kb-muted">无匹配目录</p>
          ) : query.trim() ? (
            filteredItems.map((item) => (
              <SelectRow
                key={item.id || INTERNAL_DIRECTORY_ROOT_VALUE}
                label={item.label}
                selected={value === item.id}
                onSelect={() => handleSelect(item.id)}
              />
            ))
          ) : (
            <>
              {includeRoot && (
                <SelectRow
                  label={rootLabel}
                  selected={value === INTERNAL_DIRECTORY_ROOT_VALUE}
                  onSelect={() => handleSelect(INTERNAL_DIRECTORY_ROOT_VALUE)}
                  depth={0}
                />
              )}
              {rootDirectories.map((directory) => (
                <DirectoryBranch
                  key={directory.id}
                  directory={directory}
                  directories={directories}
                  depth={0}
                  value={value}
                  onSelect={handleSelect}
                />
              ))}
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function DirectoryBranch({
  directory,
  directories,
  depth,
  value,
  onSelect,
}: {
  directory: KnowledgeInternalDirectory;
  directories: KnowledgeInternalDirectory[];
  depth: number;
  value: string;
  onSelect: (id: string) => void;
}) {
  const children = directories.filter((item) => item.parentId === directory.id);

  return (
    <div>
      <SelectRow
        label={directory.name}
        selected={value === directory.id}
        depth={depth}
        onSelect={() => onSelect(directory.id)}
      />
      {children.map((child) => (
        <DirectoryBranch
          key={child.id}
          directory={child}
          directories={directories}
          depth={depth + 1}
          value={value}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}

function SelectRow({
  label,
  selected,
  depth = 0,
  onSelect,
}: {
  label: string;
  selected: boolean;
  depth?: number;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex w-full items-center gap-1.5 rounded-[6px] py-1.5 pr-2 text-left text-[12.5px] transition-colors",
        selected ? "bg-primary-soft text-accent-foreground" : "text-kb-body hover:bg-kb-surface-hover",
      )}
      style={{ paddingLeft: 8 + depth * 14 }}
    >
      <Folder className="h-3.5 w-3.5 shrink-0 text-warning stroke-[1.8]" />
      <span className="min-w-0 flex-1 truncate">{label}</span>
      <Check
        className={cn("h-3.5 w-3.5 shrink-0 text-primary", selected ? "opacity-100" : "opacity-0")}
      />
    </button>
  );
}

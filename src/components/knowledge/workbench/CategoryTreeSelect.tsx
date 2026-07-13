import { Check, ChevronDown, Folder, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { getCategoryChildren, getCategoryPathLabel } from "@/lib/knowledge/model";
import {
  PROFESSIONAL_CATEGORY_ROOT_ID,
  getKnowledgeStoreVersion,
  subscribeKnowledgeStore,
} from "@/lib/knowledge/store";
import type { KnowledgeCategory } from "@/lib/knowledge/types";
import { cn } from "@/lib/utils";

function useKnowledgeStoreVersion() {
  const [version, setVersion] = useState(getKnowledgeStoreVersion);
  useEffect(() => subscribeKnowledgeStore(() => setVersion(getKnowledgeStoreVersion())), []);
  return version;
}

export function CategoryTreeSelect({
  value,
  onChange,
  placeholder = "请选择目录",
  searchPlaceholder = "输入关键词筛选",
  includeRoot = false,
  disabled = false,
  variant = "default",
  error = false,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  /** 新建目录时可选「专业知识库根目录」 */
  includeRoot?: boolean;
  disabled?: boolean;
  /** form：与系统表单弹窗统一高度与样式 */
  variant?: "default" | "form";
  error?: boolean;
  className?: string;
}) {
  const storeVersion = useKnowledgeStoreVersion();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const selectedLabel = useMemo(() => {
    if (!value) return "";
    if (value === PROFESSIONAL_CATEGORY_ROOT_ID) return "专业知识库根目录";
    return getCategoryPathLabel(value);
  }, [value, storeVersion]);

  const filteredItems = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const items: { id: string; label: string }[] = [];

    if (includeRoot) {
      items.push({ id: PROFESSIONAL_CATEGORY_ROOT_ID, label: "专业知识库根目录" });
    }

    const walk = (parentId?: string) => {
      for (const category of getCategoryChildren(parentId)) {
        items.push({
          id: category.id,
          label: getCategoryPathLabel(category.id),
        });
        walk(category.id);
      }
    };
    walk();

    if (!normalized) return items;

    return items.filter(
      (item) =>
        item.label.toLowerCase().includes(normalized) ||
        item.label.split(" / ").some((part) => part.toLowerCase().includes(normalized)),
    );
  }, [includeRoot, query, storeVersion]);

  const handleSelect = (id: string) => {
    onChange(id);
    setOpen(false);
    setQuery("");
  };

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setQuery("");
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            "flex w-full items-center gap-2 text-left transition-colors",
            variant === "form"
              ? cn(
                  "app-form-control gap-3 px-4",
                  error && "app-form-control--error",
                  value ? "text-[var(--form-control-text)]" : "text-[var(--form-control-disabled-text)]",
                )
              : cn(
                  "h-9 rounded-[8px] border border-kb-border bg-card px-3 text-[13px]",
                  "hover:border-primary/30 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20",
                  value ? "text-kb-body" : "text-kb-muted",
                ),
            disabled && "cursor-not-allowed opacity-60",
            className,
          )}
        >
          {variant === "form" && (
            <Folder
              className="h-4 w-4 shrink-0 text-[var(--form-label-icon)]"
              strokeWidth={1.8}
            />
          )}
          <span className="min-w-0 flex-1 truncate">{selectedLabel || placeholder}</span>
          <ChevronDown
            className={cn(
              "shrink-0 text-kb-muted transition-transform",
              variant === "form" ? "h-4 w-4" : "h-3.5 w-3.5",
              open && "rotate-180",
            )}
            strokeWidth={1.8}
          />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] min-w-[280px] p-0"
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
                key={item.id}
                label={item.label}
                selected={value === item.id}
                onSelect={() => handleSelect(item.id)}
              />
            ))
          ) : (
            <>
              {includeRoot && (
                <SelectRow
                  label="专业知识库根目录"
                  selected={value === PROFESSIONAL_CATEGORY_ROOT_ID}
                  onSelect={() => handleSelect(PROFESSIONAL_CATEGORY_ROOT_ID)}
                  depth={0}
                />
              )}
              {getCategoryChildren().map((category) => (
                <CategoryTreeBranch
                  key={category.id}
                  category={category}
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

function CategoryTreeBranch({
  category,
  depth,
  value,
  onSelect,
}: {
  category: KnowledgeCategory;
  depth: number;
  value: string;
  onSelect: (id: string) => void;
}) {
  const children = getCategoryChildren(category.id);

  return (
    <div>
      <SelectRow
        label={category.name}
        selected={value === category.id}
        depth={depth}
        onSelect={() => onSelect(category.id)}
      />
      {children.map((child) => (
        <CategoryTreeBranch
          key={child.id}
          category={child}
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

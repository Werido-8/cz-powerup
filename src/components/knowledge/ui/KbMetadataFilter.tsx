import { Filter, Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { KbFilterCombo } from "@/components/knowledge/ui/KbFilterCombo";
import {
  countActiveMetadataFilters,
  getMetadataFilterOptions,
} from "@/lib/knowledge/model";
import type { KnowledgeFile, KnowledgeMetadataField } from "@/lib/knowledge/types";
import { cn } from "@/lib/utils";
import { Tag } from "@/components/learning/ui";

export function KbMetadataFilter({
  fields,
  files,
  value,
  onChange,
  className,
}: {
  fields: KnowledgeMetadataField[];
  files: KnowledgeFile[];
  value: Record<string, string>;
  onChange: (value: Record<string, string>) => void;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const activeCount = countActiveMetadataFilters(value);

  const fieldOptions = useMemo(
    () =>
      fields.map((field) => ({
        field,
        options: [
          { value: "all", label: `全部${field.label}` },
          ...getMetadataFilterOptions(files, field).map((item) => ({
            value: item,
            label: item,
          })),
        ],
      })),
    [fields, files],
  );

  if (fields.length === 0) return null;

  const activeEntries = fieldOptions
    .map(({ field }) => {
      const selected = value[field.id]?.trim();
      if (!selected || selected === "all") return null;
      return { field, selected };
    })
    .filter(Boolean) as Array<{ field: KnowledgeMetadataField; selected: string }>;

  const reset = () => onChange({});

  return (
    <div className={cn("flex min-w-0 flex-wrap items-center gap-2", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className={cn(
              "inline-flex h-9 items-center gap-1.5 rounded-[8px] border border-border bg-card px-3 text-[12.5px] text-foreground transition-colors hover:bg-muted",
              activeCount > 0 && "border-primary/30 bg-primary-soft/20 text-primary",
            )}
          >
            <Filter className="h-3.5 w-3.5 stroke-[1.8]" />
            元数据筛选
            {activeCount > 0 && (
              <span className="grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] font-medium text-primary-foreground">
                {activeCount}
              </span>
            )}
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-[min(360px,calc(100vw-2rem))] p-0">
          <div className="border-b border-divider px-4 py-3">
            <div className="text-[13px] font-medium text-foreground">按元数据筛选</div>
            <p className="mt-0.5 text-[11.5px] text-muted-foreground">
              筛选项来自当前知识库配置，可组合多个条件。
            </p>
          </div>
          <div className="max-h-[min(320px,50vh)] space-y-3.5 overflow-y-auto px-4 py-3.5">
            {fieldOptions.map(({ field, options }) => (
              <label key={field.id} className="grid gap-1.5">
                <span className="text-[12px] font-medium text-foreground/80">{field.label}</span>
                {field.type === "text" ? (
                  <div className="flex h-9 w-full items-center gap-2 rounded-[8px] border border-border bg-card px-2.5 transition-colors focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/20">
                    <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    <input
                      value={value[field.id] && value[field.id] !== "all" ? value[field.id] : ""}
                      onChange={(event) =>
                        onChange({
                          ...value,
                          [field.id]: event.target.value,
                        })
                      }
                      placeholder={`输入${field.label}关键词`}
                      className="min-w-0 flex-1 bg-transparent text-[12.5px] text-foreground outline-none placeholder:text-muted-foreground"
                    />
                  </div>
                ) : (
                  <KbFilterCombo
                    value={value[field.id] ?? "all"}
                    onChange={(next) =>
                      onChange({
                        ...value,
                        [field.id]: next,
                      })
                    }
                    placeholder={`全部${field.label}`}
                    options={options}
                    className="w-full max-w-none"
                  />
                )}
              </label>
            ))}
          </div>
          <div className="flex items-center justify-between border-t border-divider px-4 py-2.5">
            <button
              type="button"
              onClick={reset}
              className="text-[12px] text-muted-foreground transition-colors hover:text-foreground"
            >
              重置全部
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-[6px] bg-primary px-3 py-1.5 text-[12px] font-medium text-primary-foreground transition-opacity hover:opacity-90"
            >
              完成
            </button>
          </div>
        </PopoverContent>
      </Popover>

      {activeEntries.map(({ field, selected }) => (
        <Tag
          key={field.id}
          variant="outline"
          className="h-7 gap-1 rounded-[6px] border-primary/20 bg-primary-soft/30 pl-2 pr-1 text-[11px] text-primary"
        >
          <span className="text-muted-foreground">{field.label}:</span>
          {selected}
          <button
            type="button"
            aria-label={`移除 ${field.label} 筛选`}
            onClick={() =>
              onChange({
                ...value,
                [field.id]: "all",
              })
            }
            className="grid h-4 w-4 place-items-center rounded-full hover:bg-primary/10"
          >
            <X className="h-3 w-3 stroke-[2]" />
          </button>
        </Tag>
      ))}

      {activeCount > 1 && (
        <button
          type="button"
          onClick={reset}
          className="text-[11.5px] text-muted-foreground transition-colors hover:text-primary"
        >
          清空筛选
        </button>
      )}
    </div>
  );
}

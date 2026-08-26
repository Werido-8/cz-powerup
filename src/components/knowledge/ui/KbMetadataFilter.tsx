import { Filter, Search, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { KbFormDialog, KbFormField } from "@/components/knowledge/ui/KbFormDialog";
import { Tag } from "@/components/learning/ui";
import { AppDialogButton } from "@/components/ui/app-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  countActiveMetadataFilters,
  getMetadataFilterOptions,
} from "@/lib/knowledge/model";
import type { KnowledgeFile, KnowledgeMetadataField } from "@/lib/knowledge/types";
import { cn } from "@/lib/utils";

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
  const [draft, setDraft] = useState<Record<string, string>>(value);
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

  useEffect(() => {
    if (open) setDraft(value);
  }, [open, value]);

  if (fields.length === 0) return null;

  const activeEntries = fieldOptions
    .map(({ field }) => {
      const selected = value[field.id]?.trim();
      if (!selected || selected === "all") return null;
      return { field, selected };
    })
    .filter(Boolean) as Array<{ field: KnowledgeMetadataField; selected: string }>;

  const patchDraft = (fieldId: string, next: string) => {
    setDraft((current) => ({ ...current, [fieldId]: next }));
  };

  const applyAndClose = () => {
    onChange(draft);
    setOpen(false);
  };

  const resetDraft = () => setDraft({});

  return (
    <div className={cn("flex min-w-0 flex-wrap items-center gap-2", className)}>
      <button
        type="button"
        onClick={() => setOpen(true)}
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

      <KbFormDialog
        open={open}
        onClose={() => setOpen(false)}
        title="按元数据筛选"
        titleIcon={Filter}
        size="large"
        footer={
          <>
            <button
              type="button"
              onClick={resetDraft}
              className="mr-auto text-[13px] text-muted-foreground transition-colors hover:text-foreground"
            >
              重置全部
            </button>
            <AppDialogButton variant="outline" onClick={() => setOpen(false)}>
              取消
            </AppDialogButton>
            <AppDialogButton variant="primary" onClick={applyAndClose}>
              完成
            </AppDialogButton>
          </>
        }
      >
        <p className="mb-5 text-[13px] leading-5 text-muted-foreground">
          筛选项来自当前知识库配置，可组合多个条件。确认后生效。
        </p>
        <div className="grid grid-cols-1 gap-x-8 sm:grid-cols-2">
          {fieldOptions.map(({ field, options }) => (
            <KbFormField key={field.id} label={field.label} className="mb-1">
              {field.type === "text" ? (
                <div className="flex h-10 w-full items-center gap-2 rounded-[8px] border border-[#D6E1E9] bg-white px-3 transition-colors focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/20">
                  <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <input
                    value={draft[field.id] && draft[field.id] !== "all" ? draft[field.id] : ""}
                    onChange={(event) => patchDraft(field.id, event.target.value)}
                    placeholder={`输入${field.label}关键词`}
                    className="min-w-0 flex-1 bg-transparent text-[13px] text-foreground outline-none placeholder:text-muted-foreground"
                  />
                </div>
              ) : (
                <Select
                  value={draft[field.id] ?? "all"}
                  onValueChange={(next) => patchDraft(field.id, next)}
                >
                  <SelectTrigger className="h-10 !rounded-[8px] border-[#D6E1E9] text-[13px]">
                    <SelectValue placeholder={`全部${field.label}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {options.map((option) => (
                      <SelectItem key={option.value} value={option.value} className="text-[13px]">
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </KbFormField>
          ))}
        </div>
      </KbFormDialog>

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
          onClick={() => onChange({})}
          className="text-[11.5px] text-muted-foreground transition-colors hover:text-primary"
        >
          清空筛选
        </button>
      )}
    </div>
  );
}

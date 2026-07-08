"use client";

import { Link } from "@tanstack/react-router";
import { Check, ChevronDown, Library, Search } from "lucide-react";
import { useMemo, useState } from "react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { KnowledgeBase } from "@/lib/knowledge/types";
import { cn } from "@/lib/utils";

export interface KbBaseSwitcherGroup {
  label: string;
  bases: KnowledgeBase[];
}

export function KbBaseSwitcher({
  value,
  groups,
  onChange,
  className,
}: {
  value: string;
  groups: KbBaseSwitcherGroup[];
  onChange: (baseId: string) => void;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const allBases = useMemo(() => groups.flatMap((g) => g.bases), [groups]);
  const current = allBases.find((b) => b.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="切换知识库"
          className={cn(
            "inline-flex h-9 w-[220px] items-center gap-2 rounded-[8px] border border-kb-border bg-card px-2.5 text-left text-[12.5px] font-medium text-kb-heading transition-colors duration-150 hover:border-primary focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20",
            className,
          )}
        >
          <Library className="h-4 w-4 shrink-0 text-primary stroke-[1.8]" />
          <span className="min-w-0 flex-1 truncate">{current?.name ?? "选择知识库"}</span>
          <ChevronDown
            className={cn(
              "h-4 w-4 shrink-0 text-kb-muted transition-transform",
              open && "rotate-180",
            )}
          />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[320px] p-0" align="start">
        <Command>
          <CommandInput placeholder="搜索知识库" className="h-9 text-[13px]" />
          <CommandList>
            <CommandEmpty className="py-6 text-center text-[12px] text-kb-muted">
              无匹配知识库
            </CommandEmpty>
            {groups.map((group) => (
              <CommandGroup key={group.label} heading={group.label}>
                {group.bases.map((base) => {
                  const selected = base.id === value;
                  return (
                    <CommandItem
                      key={base.id}
                      value={`${base.name} ${base.description ?? ""}`}
                      onSelect={() => {
                        onChange(base.id);
                        setOpen(false);
                      }}
                      className={cn(
                        "flex items-start gap-2 py-2.5",
                        selected && "bg-primary-soft/60",
                      )}
                    >
                      {selected && (
                        <span className="mt-1 h-4 w-[3px] shrink-0 rounded-full bg-primary" />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="text-[13px] font-medium text-kb-heading">{base.name}</div>
                        <div className="mt-0.5 text-[11px] text-kb-muted">
                          {base.description ?? `${base.fileCount ?? 0} 个文件`}
                        </div>
                      </div>
                      {selected && (
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary stroke-[1.8]" />
                      )}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
        <div className="border-t border-divider p-2">
          <Link
            to="/knowledge"
            className="flex h-8 items-center justify-center gap-1.5 rounded-[8px] text-[12px] font-medium text-primary hover:bg-kb-surface-hover"
            onClick={() => setOpen(false)}
          >
            <Search className="h-3.5 w-3.5 stroke-[1.8]" />
            查看全部知识库
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}
